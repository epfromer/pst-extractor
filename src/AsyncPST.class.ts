import { Readable } from 'node:stream'
import { setImmediate as yieldToEventLoop } from 'node:timers/promises'
import {
  AsyncRandomAccessReader,
  BufferRandomAccessReader,
  FileHandleRandomAccessReader,
  readAll
} from './AsyncRandomAccessReader'
import { PSTFile } from './PSTFile.class'
import { PSTActivity } from './PSTActivity.class'
import { PSTAppointment } from './PSTAppointment.class'
import { PSTAttachment } from './PSTAttachment.class'
import { PSTContact } from './PSTContact.class'
import { PSTFolder } from './PSTFolder.class'
import { PSTMessage } from './PSTMessage.class'
import { PSTMessageStore } from './PSTMessageStore.class'
import { PSTObject } from './PSTObject.class'
import { PSTRecipient } from './PSTRecipient.class'
import { PSTTask } from './PSTTask.class'
import { PSTError, asPSTError, throwIfAborted } from './PSTError'

async function yieldFor(signal?: AbortSignal): Promise<void> {
  try {
    await yieldToEventLoop(undefined, { signal })
  } catch (error) {
    if (signal?.aborted) {
      throwIfAborted(signal)
    }
    throw error
  }
}

export interface AsyncPSTLimits {
  /** Maximum bytes read into memory while opening a PST. Unlimited by default. */
  maxFileBytes?: number
  /** Default maximum accepted by APIs which materialize a value. */
  maxBufferedValueBytes?: number
  /** Maximum materialized size accepted from compressed parser values. */
  maxDecompressedBytes?: number
  /** Maximum rows returned or traversed from a table. */
  maxTableRows?: number
}

export interface AsyncPSTOpenOptions {
  signal?: AbortSignal
  ownsReader?: boolean
  limits?: AsyncPSTLimits
}

export interface AsyncOperationOptions {
  signal?: AbortSignal
}

function isReader(source: unknown): source is AsyncRandomAccessReader {
  return (
    typeof source === 'object' &&
    source !== null &&
    typeof (source as AsyncRandomAccessReader).read === 'function' &&
    typeof (source as AsyncRandomAccessReader).close === 'function'
  )
}

export class AsyncPSTFile {
  private closed = false

  private constructor(
    private readonly syncFile: PSTFile,
    private readonly reader: AsyncRandomAccessReader,
    private readonly ownsReader: boolean,
    public readonly limits: Readonly<AsyncPSTLimits>
  ) {}

  public static async open(
    source: string | Buffer | AsyncRandomAccessReader,
    options: AsyncPSTOpenOptions = {}
  ): Promise<AsyncPSTFile> {
    throwIfAborted(options.signal)
    let reader: AsyncRandomAccessReader
    let ownsReader: boolean

    if (typeof source === 'string') {
      try {
        reader = await FileHandleRandomAccessReader.open(source, options)
      } catch (error) {
        if (options.signal?.aborted) {
          throwIfAborted(options.signal)
        }
        throw new PSTError('NOT_FOUND', `Unable to open PST source: ${source}`, {
          cause: error
        })
      }
      ownsReader = true
    } else if (Buffer.isBuffer(source)) {
      reader = new BufferRandomAccessReader(source)
      ownsReader = true
    } else if (isReader(source)) {
      reader = source
      ownsReader = options.ownsReader ?? false
    } else {
      throw new TypeError(
        'source must be a path, Buffer, or AsyncRandomAccessReader'
      )
    }

    try {
      const data = await readAll(reader, {
        signal: options.signal,
        maxBytes: options.limits?.maxFileBytes
      })
      throwIfAborted(options.signal)
      await yieldFor(options.signal)
      const syncFile = new PSTFile(data)
      throwIfAborted(options.signal)
      return new AsyncPSTFile(
        syncFile,
        reader,
        ownsReader,
        Object.freeze({ ...(options.limits ?? {}) })
      )
    } catch (error) {
      if (ownsReader) {
        await reader.close().catch(() => undefined)
      }
      if (options.signal?.aborted) {
        throwIfAborted(options.signal)
      }
      throw asPSTError(error, 'CORRUPT_DATA')
    }
  }

  public async getMessageStore(
    options: AsyncOperationOptions = {}
  ): Promise<AsyncPSTMessageStore> {
    return this.execute(
      () => new AsyncPSTMessageStore(this, this.syncFile.getMessageStore()),
      options
    )
  }

  public async getRootFolder(
    options: AsyncOperationOptions = {}
  ): Promise<AsyncPSTFolder> {
    return this.execute(
      () => new AsyncPSTFolder(this, this.syncFile.getRootFolder()),
      options
    )
  }

  public async close(): Promise<void> {
    if (this.closed) {
      return
    }
    this.closed = true
    this.syncFile.close()
    if (this.ownsReader) {
      await this.reader.close()
    }
  }

  public async [Symbol.asyncDispose](): Promise<void> {
    await this.close()
  }

  public assertOpen(): void {
    if (this.closed) {
      throw new PSTError('CLOSED', 'The PST file is closed')
    }
  }

  public enforceValueLimit(value: string | Buffer | null): void {
    if (value === null) {
      return
    }
    const length = Buffer.isBuffer(value)
      ? value.length
      : Buffer.byteLength(value)
    const limit = Math.min(
      this.limits.maxBufferedValueBytes ?? Number.POSITIVE_INFINITY,
      this.limits.maxDecompressedBytes ?? Number.POSITIVE_INFINITY
    )
    if (length > limit) {
      throw new PSTError(
        'LIMIT_EXCEEDED',
        `Materialized PST value size ${length} exceeds configured limit ${limit}`
      )
    }
  }

  public async execute<T>(
    operation: () => T,
    options: AsyncOperationOptions = {}
  ): Promise<T> {
    this.assertOpen()
    throwIfAborted(options.signal)
    await yieldFor(options.signal)
    this.assertOpen()
    throwIfAborted(options.signal)
    try {
      const result = operation()
      throwIfAborted(options.signal)
      return result
    } catch (error) {
      if (options.signal?.aborted) {
        throwIfAborted(options.signal)
      }
      throw asPSTError(error, 'CORRUPT_DATA')
    }
  }
}

export class AsyncPSTObject<T extends PSTObject = PSTObject> {
  private readonly promiseCache = new Map<string, Promise<unknown>>()

  public constructor(
    protected readonly owner: AsyncPSTFile,
    protected readonly value: T
  ) {
    return new Proxy(this, {
      get: (target, property, receiver) => {
        if (Reflect.has(target, property)) {
          return Reflect.get(target, property, receiver)
        }
        const inherited = Reflect.get(value as object, property)
        return typeof inherited === 'function'
          ? inherited.bind(value)
          : inherited
      },
      has: (target, property) =>
        Reflect.has(target, property) || Reflect.has(value as object, property)
    })
  }

  public get descriptorNodeId() {
    return this.value.descriptorNodeId
  }

  public async getBinaryProperty(
    propertyId: number,
    options: AsyncOperationOptions = {}
  ): Promise<Buffer | null> {
    return this.cached(`binary:${propertyId}`, options, () => {
      const result = (
        this.value as unknown as { getBinaryItem(id: number): Buffer | null }
      ).getBinaryItem(propertyId)
      this.owner.enforceValueLimit(result)
      return result
    })
  }

  protected cached<R>(
    key: string,
    options: AsyncOperationOptions,
    load: () => R
  ): Promise<R> {
    this.owner.assertOpen()
    throwIfAborted(options.signal)
    const existing = this.promiseCache.get(key) as Promise<R> | undefined
    if (existing) {
      return existing
    }
    const pending = this.owner.execute(load, options)
    this.promiseCache.set(key, pending)
    void pending.catch(() => {
      if (this.promiseCache.get(key) === pending) {
        this.promiseCache.delete(key)
      }
    })
    return pending
  }
}

export class AsyncPSTMessageStore extends AsyncPSTObject<PSTMessageStore> {}
export interface AsyncPSTMessageStore extends Readonly<PSTMessageStore> {}

export class AsyncPSTFolder extends AsyncPSTObject<PSTFolder> {
  public async getSubFolders(
    options: AsyncOperationOptions = {}
  ): Promise<AsyncPSTFolder[]> {
    return this.owner.execute(() => {
      const folders = this.value.getSubFolders()
      const limit = this.owner.limits.maxTableRows ?? Number.POSITIVE_INFINITY
      if (folders.length > limit) {
        throw new PSTError(
          'LIMIT_EXCEEDED',
          `Folder table exceeds configured row limit ${limit}`
        )
      }
      return folders.map((folder) => new AsyncPSTFolder(this.owner, folder))
    }, options)
  }

  public async getNextChild(
    options: AsyncOperationOptions = {}
  ): Promise<AsyncPSTObject | null> {
    return this.owner.execute(
      () => wrapObject(this.owner, this.value.getNextChild()),
      options
    )
  }

  public subFolders(
    options: AsyncOperationOptions = {}
  ): AsyncIterable<AsyncPSTFolder> {
    const folder = this
    return {
      async *[Symbol.asyncIterator]() {
        const children = await folder.getSubFolders(options)
        for (const child of children) {
          throwIfAborted(options.signal)
          yield child
          await yieldFor(options.signal)
        }
      }
    }
  }

  public children(
    options: AsyncOperationOptions = {}
  ): AsyncIterable<AsyncPSTObject> {
    const owner = this.owner
    const original = this.value
    return {
      async *[Symbol.asyncIterator]() {
        owner.assertOpen()
        throwIfAborted(options.signal)
        const descriptor = (
          original as unknown as { descriptorIndexNode: unknown }
        ).descriptorIndexNode
        const pstFile = (original as unknown as { pstFile: PSTFile }).pstFile
        if (!descriptor) {
          return
        }
        const cursor = new PSTFolder(
          pstFile,
          descriptor as ConstructorParameters<typeof PSTFolder>[1]
        )
        let row = 0
        const limit = owner.limits.maxTableRows ?? Number.POSITIVE_INFINITY
        while (true) {
          const next = await owner.execute(() => cursor.getNextChild(), options)
          if (next === null) {
            return
          }
          if (row >= limit) {
            throw new PSTError(
              'LIMIT_EXCEEDED',
              `Folder table exceeds configured row limit ${limit}`
            )
          }
          const wrapped = wrapObject(owner, next)
          if (wrapped) {
            yield wrapped
          }
          row++
          await yieldFor(options.signal)
        }
      }
    }
  }
}
export interface AsyncPSTFolder extends Readonly<
  Omit<PSTFolder, 'getSubFolders' | 'getNextChild' | 'moveChildCursorTo'>
> {}

export class AsyncPSTMessage<
  T extends PSTMessage = PSTMessage
> extends AsyncPSTObject<T> {
  public getBody(options: AsyncOperationOptions = {}): Promise<string> {
    return this.cached('body', options, () => {
      const result = this.value.body
      this.owner.enforceValueLimit(result)
      return result
    })
  }

  public getBodyHTML(options: AsyncOperationOptions = {}): Promise<string> {
    return this.cached('bodyHTML', options, () => {
      const result = this.value.bodyHTML
      this.owner.enforceValueLimit(result)
      return result
    })
  }

  public getBodyRTF(options: AsyncOperationOptions = {}): Promise<string> {
    return this.cached('bodyRTF', options, () => {
      const result = this.value.bodyRTF
      this.owner.enforceValueLimit(result)
      return result
    })
  }

  public async getRecipient(
    index: number,
    options: AsyncOperationOptions = {}
  ): Promise<AsyncPSTRecipient | null> {
    return this.owner.execute(() => {
      const recipient = this.value.getRecipient(index)
      return recipient ? new AsyncPSTRecipient(this.owner, recipient) : null
    }, options)
  }

  public async getAttachment(
    index: number,
    options: AsyncOperationOptions = {}
  ): Promise<AsyncPSTAttachment> {
    return this.owner.execute(
      () => new AsyncPSTAttachment(this.owner, this.value.getAttachment(index)),
      options
    )
  }
}
export interface AsyncPSTMessage extends Readonly<
  Omit<
    PSTMessage,
    'getRecipient' | 'getAttachment' | 'body' | 'bodyHTML' | 'bodyRTF'
  >
> {}

export class AsyncPSTAppointment extends AsyncPSTMessage<PSTAppointment> {}
export interface AsyncPSTAppointment extends Readonly<
  Omit<PSTAppointment, keyof PSTMessage>
> {}
export class AsyncPSTContact extends AsyncPSTMessage<PSTContact> {}
export interface AsyncPSTContact extends Readonly<
  Omit<PSTContact, keyof PSTMessage>
> {}
export class AsyncPSTTask extends AsyncPSTMessage<PSTTask> {}
export interface AsyncPSTTask extends Readonly<
  Omit<PSTTask, keyof PSTMessage>
> {}
export class AsyncPSTActivity extends AsyncPSTMessage<PSTActivity> {}
export interface AsyncPSTActivity extends Readonly<
  Omit<PSTActivity, keyof PSTMessage>
> {}
export class AsyncPSTRecipient extends AsyncPSTObject<PSTRecipient> {}
export interface AsyncPSTRecipient extends Readonly<PSTRecipient> {}

export interface AttachmentChunkOptions extends AsyncOperationOptions {
  chunkSize?: number
}

export interface AttachmentReadOptions extends AsyncOperationOptions {
  maxBytes?: number
}

export class AsyncPSTAttachment extends AsyncPSTObject<PSTAttachment> {
  public chunks(options: AttachmentChunkOptions = {}): AsyncIterable<Buffer> {
    const attachment = this
    const chunkSize = options.chunkSize ?? 64 * 1024
    if (!Number.isSafeInteger(chunkSize) || chunkSize <= 0) {
      throw new RangeError('chunkSize must be a positive safe integer')
    }
    return {
      async *[Symbol.asyncIterator]() {
        attachment.owner.assertOpen()
        throwIfAborted(options.signal)
        const input = await attachment.owner.execute(
          () => attachment.value.fileInputStream,
          options
        )
        if (!input) {
          return
        }
        const decompressedLimit =
          attachment.owner.limits.maxDecompressedBytes ??
          Number.POSITIVE_INFINITY
        if (input.length.toNumber() > decompressedLimit) {
          throw new PSTError(
            'LIMIT_EXCEEDED',
            `Attachment size ${input.length.toString()} exceeds configured decompression limit ${decompressedLimit}`
          )
        }
        while (true) {
          throwIfAborted(options.signal)
          const output = Buffer.alloc(chunkSize)
          const bytesRead = input.read(output)
          if (bytesRead <= 0) {
            return
          }
          yield bytesRead === output.length
            ? output
            : output.subarray(0, bytesRead)
          await yieldFor(options.signal)
        }
      }
    }
  }

  public createReadStream(options: AttachmentChunkOptions = {}): Readable {
    return Readable.from(this.chunks(options), { objectMode: false })
  }

  public async readBuffer(
    options: AttachmentReadOptions = {}
  ): Promise<Buffer> {
    this.owner.assertOpen()
    throwIfAborted(options.signal)
    const maxBytes =
      options.maxBytes ??
      this.owner.limits.maxBufferedValueBytes ??
      Number.POSITIVE_INFINITY
    if (this.value.filesize > maxBytes) {
      throw new PSTError(
        'LIMIT_EXCEEDED',
        `Attachment size ${this.value.filesize} exceeds configured limit ${maxBytes}`
      )
    }
    const chunks: Buffer[] = []
    let length = 0
    for await (const chunk of this.chunks(options)) {
      length += chunk.length
      if (length > maxBytes) {
        throw new PSTError(
          'LIMIT_EXCEEDED',
          `Attachment exceeds configured limit ${maxBytes}`
        )
      }
      chunks.push(chunk)
    }
    return Buffer.concat(chunks, length)
  }

  public async getEmbeddedMessage(
    options: AsyncOperationOptions = {}
  ): Promise<AsyncPSTMessage | null> {
    return this.owner.execute(() => {
      const message = this.value.embeddedPSTMessage
      const wrapped = message ? wrapObject(this.owner, message) : null
      return wrapped instanceof AsyncPSTMessage ? wrapped : null
    }, options)
  }
}
export interface AsyncPSTAttachment extends Readonly<
  Omit<PSTAttachment, 'fileInputStream' | 'embeddedPSTMessage'>
> {}

function wrapObject(
  owner: AsyncPSTFile,
  value: unknown
): AsyncPSTObject | null {
  if (value === null || value === undefined) return null
  if (value instanceof PSTFolder) return new AsyncPSTFolder(owner, value)
  if (value instanceof PSTAppointment)
    return new AsyncPSTAppointment(owner, value)
  if (value instanceof PSTContact) return new AsyncPSTContact(owner, value)
  if (value instanceof PSTTask) return new AsyncPSTTask(owner, value)
  if (value instanceof PSTActivity) return new AsyncPSTActivity(owner, value)
  if (value instanceof PSTMessage) return new AsyncPSTMessage(owner, value)
  if (value instanceof PSTAttachment)
    return new AsyncPSTAttachment(owner, value)
  if (value instanceof PSTRecipient) return new AsyncPSTRecipient(owner, value)
  if (value instanceof PSTMessageStore)
    return new AsyncPSTMessageStore(owner, value)
  if (value instanceof PSTObject) return new AsyncPSTObject(owner, value)
  throw new PSTError(
    'CORRUPT_DATA',
    'Parser returned an unsupported PST object'
  )
}
