import { open } from 'node:fs/promises'
import type { FileHandle } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { unzip } from 'node:zlib'
import { promisify } from 'node:util'
import { PSTEOFError, PSTError, throwIfAborted } from './PSTError.js'
import { recordDiagnostic } from './PerformanceDiagnostics.js'

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

interface CachePage {
  readonly start: number
  readonly data: Buffer
  newer?: CachePage
  older?: CachePage
  hits: number
}

/**
 * File-local LRU cache which bridges I/O-free parser reads to an asynchronous
 * random-access reader. Returned parser buffers never alias cached pages.
 */
export class AsyncBlockCache {
  private readonly pages = new Map<number, CachePage>()
  private readonly pending = new Map<number, Promise<void>>()
  private cachedBytes = 0
  private readonly decompressed = new Map<string, Buffer>()
  private newest?: CachePage
  private oldest?: CachePage
  private diagnosticCacheHits = 0
  private diagnosticCopies = 0

  public constructor(
    private readonly reader: AsyncRandomAccessReader,
    private readonly maxBytes = 64 * 1024 * 1024,
    private readonly pageSize = 64 * 1024,
    private readonly maxDecompressedBytes = Number.POSITIVE_INFINITY,
    private readonly readSize = 256 * 1024
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
    if (
      !Number.isSafeInteger(readSize) ||
      readSize < pageSize ||
      readSize % pageSize !== 0
    ) {
      throw new RangeError('readSize must be a positive multiple of pageSize')
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
      if (!page) {
        recordDiagnostic('cacheMisses')
        throw new AsyncCacheMissError(position, length)
      }
      this.diagnosticCacheHits++
      this.touch(page)
      const pageOffset = absolute - pageStart
      const available = Math.min(page.data.length - pageOffset, length - copied)
      if (available <= 0)
        throw new PSTEOFError(position, length, output.subarray(0, copied))
      page.data.copy(output, copied, pageOffset, pageOffset + available)
      this.diagnosticCopies += available
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
    const loads = new Set<Promise<void>>()
    for (let pageStart = first; pageStart <= last; pageStart += this.pageSize) {
      if (!this.pages.has(pageStart)) loads.add(this.load(pageStart, options))
    }
    await Promise.all(loads)
  }

  public clear(): void {
    recordDiagnostic('cacheHits', this.diagnosticCacheHits)
    recordDiagnostic('copies', this.diagnosticCopies)
    this.diagnosticCacheHits = 0
    this.diagnosticCopies = 0
    this.pages.clear()
    this.decompressed.clear()
    this.cachedBytes = 0
    this.newest = undefined
    this.oldest = undefined
  }

  public decompressSync(data: Buffer): Buffer {
    const key = createHash('sha256').update(data).digest('base64url')
    const result = this.decompressed.get(key)
    if (!result) throw new AsyncDecompressionMissError(key, data)
    return result
  }

  public async ensureDecompressed(
    miss: AsyncDecompressionMissError,
    signal?: AbortSignal
  ): Promise<void> {
    throwIfAborted(signal)
    if (this.decompressed.has(miss.key)) return
    let result: Buffer
    try {
      result = await unzipAsync(miss.data)
    } catch (error) {
      if (
        typeof error !== 'object' ||
        error === null ||
        !('code' in error) ||
        (error.code !== 'Z_DATA_ERROR' && error.code !== 'Z_BUF_ERROR')
      ) {
        throw error
      }
      result = miss.data
    }
    recordDiagnostic('decompressions')
    throwIfAborted(signal)
    if (result.length > this.maxDecompressedBytes) {
      throw new PSTError(
        'LIMIT_EXCEEDED',
        `Decompressed PST value size ${result.length} exceeds configured limit ${this.maxDecompressedBytes}`
      )
    }
    this.decompressed.set(miss.key, result)
  }

  public releaseDecompressed(): void {
    this.decompressed.clear()
  }

  private load(pageStart: number, options: AsyncReadOptions): Promise<void> {
    const existing = this.pending.get(pageStart)
    if (existing) return existing

    const readStart = Math.floor(pageStart / this.readSize) * this.readSize
    const available =
      this.reader.size === undefined
        ? this.readSize
        : Math.min(this.readSize, Math.max(0, this.reader.size - readStart))
    const pending = (async () => {
      let data: Buffer
      try {
        recordDiagnostic('readCalls')
        data = await this.reader.read(readStart, available, options)
        recordDiagnostic('bytesRead', data.length)
      } catch (error) {
        if (!(error instanceof PSTEOFError) || error.partial.length === 0)
          throw error
        data = error.partial
      }
      for (let offset = 0; offset < data.length; offset += this.pageSize) {
        const start = readStart + offset
        this.insert(start, data.subarray(offset, offset + this.pageSize))
      }
    })().finally(() => {
      for (
        let start = readStart;
        start < readStart + available;
        start += this.pageSize
      ) {
        if (this.pending.get(start) === pending) this.pending.delete(start)
      }
    })
    for (
      let start = readStart;
      start < readStart + available;
      start += this.pageSize
    ) {
      if (!this.pages.has(start) && !this.pending.has(start)) {
        this.pending.set(start, pending)
      }
    }
    return pending
  }

  private insert(pageStart: number, page: Buffer): void {
    if (this.pages.has(pageStart)) return
    const entry: CachePage = { start: pageStart, data: page, hits: 0 }
    this.pages.set(pageStart, entry)
    this.cachedBytes += page.length
    this.append(entry)
    while (
      this.cachedBytes > this.maxBytes &&
      this.oldest &&
      this.pages.size > 1
    ) {
      this.remove(this.oldest)
    }
  }

  private touch(page: CachePage): void {
    page.hits++
    // Updating list pointers for every scalar parser read dominates hot
    // metadata pages. The first hit preserves exact recency semantics for
    // short-lived pages; periodic refreshes keep long-lived hot pages young.
    if (page.hits !== 1 && page.hits % 64 !== 0) return
    if (page === this.newest) return
    this.unlink(page)
    this.append(page)
  }

  private append(page: CachePage): void {
    page.newer = undefined
    page.older = this.newest
    if (this.newest) this.newest.newer = page
    else this.oldest = page
    this.newest = page
  }

  private unlink(page: CachePage): void {
    if (page.older) page.older.newer = page.newer
    else this.oldest = page.newer
    if (page.newer) page.newer.older = page.older
    else this.newest = page.older
    page.older = undefined
    page.newer = undefined
  }

  private remove(page: CachePage): void {
    this.unlink(page)
    this.pages.delete(page.start)
    this.cachedBytes -= page.data.length
    recordDiagnostic('evictions')
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
