import { open } from 'node:fs/promises'
import type { FileHandle } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { unzip } from 'node:zlib'
import { promisify } from 'node:util'
import { PSTEOFError, PSTError, throwIfAborted } from './PSTError.js'

export interface AsyncReadOptions {
  signal?: AbortSignal
}

export interface AsyncRandomAccessReader {
  readonly size?: number
  read(
    position: number,
    length: number,
    options?: AsyncReadOptions
  ): Promise<Buffer>
  close(): Promise<void>
}

export class AsyncCacheMissError extends Error {
  public constructor(
    public readonly position: number,
    public readonly length: number
  ) {
    super(`Random-access cache miss at ${position} for ${length} bytes`)
    this.name = 'AsyncCacheMissError'
  }
}

const unzipAsync = promisify(unzip)

export class AsyncDecompressionMissError extends Error {
  public constructor(
    public readonly key: string,
    public readonly data: Buffer
  ) {
    super('Asynchronous decompression is required')
    this.name = 'AsyncDecompressionMissError'
  }
}

/**
 * File-local LRU cache which bridges I/O-free parser reads to an asynchronous
 * random-access reader. Returned parser buffers never alias cached pages.
 */
export class AsyncBlockCache {
  private readonly pages = new Map<number, Buffer>()
  private readonly pending = new Map<number, Promise<void>>()
  private cachedBytes = 0
  private readonly decompressed = new Map<string, Buffer>()

  public constructor(
    private readonly reader: AsyncRandomAccessReader,
    private readonly maxBytes = 64 * 1024 * 1024,
    private readonly pageSize = 64 * 1024,
    private readonly maxDecompressedBytes = Number.POSITIVE_INFINITY
  ) {
    if (!(
      maxBytes === Number.POSITIVE_INFINITY ||
      (Number.isSafeInteger(maxBytes) && maxBytes >= 0)
    )) {
      throw new RangeError(
        'maxCacheBytes must be a non-negative safe integer or Infinity'
      )
    }
    if (!Number.isSafeInteger(pageSize) || pageSize <= 0) {
      throw new RangeError('pageSize must be a positive safe integer')
    }
  }

  public get size(): number | undefined {
    return this.reader.size
  }

  public get bytes(): number {
    return this.cachedBytes
  }

  public readSync(position: number, length: number): Buffer {
    const output = Buffer.allocUnsafe(length)
    this.readIntoSync(output, position, length)
    return output
  }

  public readIntoSync(
    output: Buffer,
    position: number,
    length: number
  ): number {
    if (this.reader instanceof BufferRandomAccessReader) {
      return this.reader.readIntoSync(output, position, length)
    }
    if (length === 0) return 0
    let copied = 0
    while (copied < length) {
      const absolute = position + copied
      const pageStart = Math.floor(absolute / this.pageSize) * this.pageSize
      const page = this.pages.get(pageStart)
      if (!page) throw new AsyncCacheMissError(position, length)
      this.touch(pageStart, page)
      const pageOffset = absolute - pageStart
      const available = Math.min(page.length - pageOffset, length - copied)
      if (available <= 0)
        throw new PSTEOFError(position, length, output.subarray(0, copied))
      page.copy(output, copied, pageOffset, pageOffset + available)
      copied += available
    }
    return copied
  }

  public async ensure(
    position: number,
    length: number,
    options: AsyncReadOptions = {}
  ): Promise<void> {
    const first = Math.floor(position / this.pageSize) * this.pageSize
    const last =
      Math.floor((position + Math.max(0, length - 1)) / this.pageSize) *
      this.pageSize
    const loads: Promise<void>[] = []
    for (let pageStart = first; pageStart <= last; pageStart += this.pageSize) {
      if (!this.pages.has(pageStart)) loads.push(this.load(pageStart, options))
    }
    await Promise.all(loads)
  }

  public clear(): void {
    this.pages.clear()
    this.decompressed.clear()
    this.cachedBytes = 0
  }

  public decompressSync(data: Buffer): Buffer {
    const key = createHash('sha256').update(data).digest('base64url')
    const result = this.decompressed.get(key)
    if (!result) throw new AsyncDecompressionMissError(key, Buffer.from(data))
    return Buffer.from(result)
  }

  public async ensureDecompressed(
    miss: AsyncDecompressionMissError,
    signal?: AbortSignal
  ): Promise<void> {
    throwIfAborted(signal)
    if (this.decompressed.has(miss.key)) return
    const result = await unzipAsync(miss.data)
    throwIfAborted(signal)
    if (result.length > this.maxDecompressedBytes) {
      throw new PSTError(
        'LIMIT_EXCEEDED',
        `Decompressed PST value size ${result.length} exceeds configured limit ${this.maxDecompressedBytes}`
      )
    }
    this.decompressed.set(miss.key, Buffer.from(result))
  }

  public releaseDecompressed(): void {
    this.decompressed.clear()
  }

  private load(pageStart: number, options: AsyncReadOptions): Promise<void> {
    const existing = this.pending.get(pageStart)
    if (existing) return existing
    const available =
      this.reader.size === undefined
        ? this.pageSize
        : Math.min(this.pageSize, Math.max(0, this.reader.size - pageStart))
    const pending = (async () => {
      let page: Buffer
      try {
        page = await this.reader.read(pageStart, available, options)
      } catch (error) {
        if (!(error instanceof PSTEOFError) || error.partial.length === 0)
          throw error
        page = Buffer.from(error.partial)
      }
      this.insert(pageStart, page)
    })().finally(() => this.pending.delete(pageStart))
    this.pending.set(pageStart, pending)
    return pending
  }

  private insert(pageStart: number, page: Buffer): void {
    if (this.pages.has(pageStart)) return
    const stored = page
    this.pages.set(pageStart, stored)
    this.cachedBytes += stored.length
    while (this.cachedBytes > this.maxBytes && this.pages.size > 1) {
      const oldest = this.pages.entries().next().value as
        [number, Buffer] | undefined
      if (!oldest) break
      this.pages.delete(oldest[0])
      this.cachedBytes -= oldest[1].length
    }
  }

  private touch(pageStart: number, page: Buffer): void {
    this.pages.delete(pageStart)
    this.pages.set(pageStart, page)
  }
}

abstract class BaseReader implements AsyncRandomAccessReader {
  protected closed = false
  public abstract readonly size?: number

  public abstract read(
    position: number,
    length: number,
    options?: AsyncReadOptions
  ): Promise<Buffer>

  public async close(): Promise<void> {
    this.closed = true
  }

  protected validate(position: number, length: number, signal?: AbortSignal) {
    throwIfAborted(signal)
    if (this.closed) {
      throw new PSTError('CLOSED', 'The random-access reader is closed')
    }
    if (!Number.isSafeInteger(position) || position < 0) {
      throw new RangeError('position must be a non-negative safe integer')
    }
    if (!Number.isSafeInteger(length) || length < 0) {
      throw new RangeError('length must be a non-negative safe integer')
    }
  }
}

export class BufferRandomAccessReader extends BaseReader {
  public readonly size: number

  public constructor(private readonly data: Buffer) {
    super()
    this.size = data.length
  }

  public async read(
    position: number,
    length: number,
    options: AsyncReadOptions = {}
  ): Promise<Buffer> {
    this.validate(position, length, options.signal)
    const end = position + length
    if (end > this.data.length) {
      throw new PSTEOFError(
        position,
        length,
        Buffer.from(this.data.subarray(position, this.data.length))
      )
    }
    await Promise.resolve()
    throwIfAborted(options.signal)
    return Buffer.from(this.data.subarray(position, end))
  }

  public readSync(position: number, length: number): Buffer {
    this.validate(position, length)
    const end = position + length
    if (end > this.data.length) {
      throw new PSTEOFError(
        position,
        length,
        Buffer.from(this.data.subarray(position, this.data.length))
      )
    }
    return Buffer.from(this.data.subarray(position, end))
  }

  public readIntoSync(
    target: Buffer,
    position: number,
    length: number
  ): number {
    this.validate(position, length)
    const end = position + length
    if (end > this.data.length) {
      throw new PSTEOFError(
        position,
        length,
        Buffer.from(this.data.subarray(position, this.data.length))
      )
    }
    return this.data.copy(target, 0, position, end)
  }
}

export class FileHandleRandomAccessReader extends BaseReader {
  public readonly size: number

  public constructor(
    private readonly handle: FileHandle,
    size: number
  ) {
    super()
    this.size = size
  }

  public static async open(
    path: string,
    options: AsyncReadOptions = {}
  ): Promise<FileHandleRandomAccessReader> {
    throwIfAborted(options.signal)
    const handle = await open(path, 'r')
    try {
      const stat = await handle.stat()
      throwIfAborted(options.signal)
      return new FileHandleRandomAccessReader(handle, stat.size)
    } catch (error) {
      await handle.close()
      throw error
    }
  }

  public async read(
    position: number,
    length: number,
    options: AsyncReadOptions = {}
  ): Promise<Buffer> {
    this.validate(position, length, options.signal)
    const output = Buffer.allocUnsafe(length)
    let offset = 0
    while (offset < length) {
      throwIfAborted(options.signal)
      const result = await this.handle.read(
        output,
        offset,
        length - offset,
        position + offset
      )
      if (result.bytesRead === 0) {
        throw new PSTEOFError(position, length, output.subarray(0, offset))
      }
      offset += result.bytesRead
    }
    throwIfAborted(options.signal)
    return output
  }

  public override async close(): Promise<void> {
    if (this.closed) {
      return
    }
    this.closed = true
    await this.handle.close()
  }
}

export async function readAll(
  reader: AsyncRandomAccessReader,
  options: AsyncReadOptions & { maxBytes?: number } = {}
): Promise<Buffer> {
  const maxBytes = options.maxBytes ?? Number.POSITIVE_INFINITY
  if (reader.size !== undefined) {
    if (reader.size > maxBytes) {
      throw new PSTError(
        'LIMIT_EXCEEDED',
        `PST size ${reader.size} exceeds configured limit ${maxBytes}`
      )
    }
    const result = await reader.read(0, reader.size, options)
    if (result.length !== reader.size) {
      throw new PSTEOFError(0, reader.size, result)
    }
    return result
  }

  const chunks: Buffer[] = []
  const chunkSize = 1024 * 1024
  let position = 0
  while (true) {
    throwIfAborted(options.signal)
    try {
      const chunk = await reader.read(position, chunkSize, options)
      if (chunk.length === 0) {
        break
      }
      chunks.push(chunk)
      position += chunk.length
    } catch (error) {
      if (!(error instanceof PSTEOFError)) {
        throw error
      }
      if (error.partial.length > 0) {
        chunks.push(error.partial)
        position += error.partial.length
      }
      break
    }
    if (position > maxBytes) {
      throw new PSTError(
        'LIMIT_EXCEEDED',
        `PST data exceeds configured limit ${maxBytes}`
      )
    }
  }
  if (position > maxBytes) {
    throw new PSTError(
      'LIMIT_EXCEEDED',
      `PST data exceeds configured limit ${maxBytes}`
    )
  }
  return Buffer.concat(chunks, position)
}
