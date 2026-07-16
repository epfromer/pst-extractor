import {
  AsyncBlockCache,
  BufferRandomAccessReader,
  FileHandleRandomAccessReader,
  readAll
} from '../AsyncRandomAccessReader.js'
import type { AsyncRandomAccessReader } from '../AsyncRandomAccessReader.js'
import { PSTEOFError, PSTError } from '../PSTError.js'
import { resolve } from 'node:path'

describe('AsyncRandomAccessReader', () => {
  it('reads exact ranges from buffers', async () => {
    const reader = new BufferRandomAccessReader(Buffer.from('abcdef'))
    await expect(reader.read(2, 3)).resolves.toEqual(Buffer.from('cde'))
    await expect(reader.read(5, 2)).rejects.toMatchObject({
      code: 'CORRUPT_DATA',
      actual: 1
    })
    await reader.close()
    await expect(reader.read(0, 1)).rejects.toMatchObject({ code: 'CLOSED' })
  })

  it('reads exact ranges from file handles and closes idempotently', async () => {
    const reader = await FileHandleRandomAccessReader.open(
      resolve('./src/__tests__/testdata/enron.pst')
    )
    await expect(reader.read(0, 4)).resolves.toEqual(Buffer.from('!BDN'))
    await reader.close()
    await reader.close()
  })

  it('supports readers without a declared size', async () => {
    const data = Buffer.from('custom reader')
    const reader: AsyncRandomAccessReader = {
      async read(position, length) {
        const partial = data.subarray(position, position + length)
        if (partial.length !== length) {
          throw new PSTEOFError(position, length, Buffer.from(partial))
        }
        return Buffer.from(partial)
      },
      async close() {}
    }
    await expect(readAll(reader)).resolves.toEqual(data)
  })

  it('uses a standard, distinguishable abort error', async () => {
    const controller = new AbortController()
    controller.abort('test')
    const reader = new BufferRandomAccessReader(Buffer.from('abc'))
    await expect(
      reader.read(0, 1, { signal: controller.signal })
    ).rejects.toEqual(
      expect.objectContaining<PSTError>({ name: 'AbortError', code: 'ABORTED' })
    )
  })

  it('deduplicates page loads and evicts least-recently-used pages', async () => {
    const data = Buffer.from('abcdefghijkl')
    let reads = 0
    const reader: AsyncRandomAccessReader = {
      size: data.length,
      async read(position, length) {
        reads++
        return Buffer.from(data.subarray(position, position + length))
      },
      async close() {}
    }
    const cache = new AsyncBlockCache(reader, 8, 4, Number.POSITIVE_INFINITY, 4)
    await cache.ensure(0, 1)
    await Promise.all([cache.ensure(4, 1), cache.ensure(4, 1)])
    expect(reads).toBe(2)
    expect(cache.readSync(0, 4)).toEqual(Buffer.from('abcd'))
    await cache.ensure(8, 1)
    expect(cache.bytes).toBeLessThanOrEqual(8)
    expect(() => cache.readSync(4, 1)).toThrow('cache miss')
    expect(cache.readSync(0, 1)).toEqual(Buffer.from('a'))
  })

  it('coalesces adjacent pages while deduplicating concurrent reads', async () => {
    const data = Buffer.from('abcdefghijkl')
    const ranges: Array<[number, number]> = []
    const reader: AsyncRandomAccessReader = {
      size: data.length,
      async read(position, length) {
        ranges.push([position, length])
        await Promise.resolve()
        return data.subarray(position, position + length)
      },
      async close() {}
    }
    const cache = new AsyncBlockCache(
      reader,
      Number.POSITIVE_INFINITY,
      4,
      Number.POSITIVE_INFINITY,
      8
    )

    await Promise.all([cache.ensure(0, 1), cache.ensure(4, 1)])

    expect(ranges).toEqual([[0, 8]])
    expect(cache.readSync(0, 8)).toEqual(Buffer.from('abcdefgh'))
  })
})
