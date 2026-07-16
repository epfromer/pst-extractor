export type PSTErrorCode =
  | 'INVALID_HEADER'
  | 'UNSUPPORTED_VERSION'
  | 'CORRUPT_DATA'
  | 'NOT_FOUND'
  | 'LIMIT_EXCEEDED'
  | 'CLOSED'
  | 'ABORTED'

export class PSTError extends Error {
  public readonly code: PSTErrorCode

  public constructor(
    code: PSTErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'PSTError'
    this.code = code
  }
}

export class PSTEOFError extends PSTError {
  public readonly position: number
  public readonly expected: number
  public readonly actual: number
  public readonly partial: Buffer

  public constructor(
    position: number,
    expected: number,
    partial: Buffer = Buffer.alloc(0)
  ) {
    super(
      'CORRUPT_DATA',
      `Unexpected end of PST data at ${position}: expected ${expected} bytes, received ${partial.length}`
    )
    this.name = 'PSTEOFError'
    this.position = position
    this.expected = expected
    this.actual = partial.length
    this.partial = partial
  }
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) {
    return
  }

  const error = new PSTError('ABORTED', 'The PST operation was aborted', {
    cause: signal.reason
  })
  error.name = 'AbortError'
  throw error
}

export function asPSTError(error: unknown, fallback: PSTErrorCode): PSTError {
  if (error instanceof PSTError) {
    return error
  }
  const message = error instanceof Error ? error.message : String(error)
  return new PSTError(fallback, message, { cause: error })
}
