import { FileHandle, open } from 'node:fs/promises'
import { PSTEOFError, PSTError, throwIfAborted } from './PSTError'

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
