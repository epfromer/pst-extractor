import {
  AsyncRandomAccessReader,
  BufferRandomAccessReader,
  FileHandleRandomAccessReader,
  readAll
} from '../AsyncRandomAccessReader'
import { PSTEOFError, PSTError } from '../PSTError'
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
})
