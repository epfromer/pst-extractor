import { PSTUtil } from '../PSTUtil.class.js'

describe('PSTUtil native offset decoders', () => {
  it('decodes one through eight little-endian bytes without changing Long bits', () => {
    const bytes = Buffer.from('0123456789abcdef', 'hex')

    for (let length = 1; length <= 8; length++) {
      const expected = BigInt(
        `0x${Buffer.from(bytes.subarray(0, length)).reverse().toString('hex')}`
      )
      const value = PSTUtil.convertLittleEndianBytesToLong(bytes, 0, length)
      expect(value.toUnsigned().toString()).toBe(expected.toString())
    }
  })

  it('decodes one through eight big-endian bytes and validates ranges', () => {
    const bytes = Buffer.from('fedcba9876543210', 'hex')

    for (let length = 1; length <= 8; length++) {
      const expected = BigInt(`0x${bytes.subarray(0, length).toString('hex')}`)
      const value = PSTUtil.convertBigEndianBytesToLong(bytes, 0, length)
      expect(value.toUnsigned().toString()).toBe(expected.toString())
    }
    expect(PSTUtil.convertLittleEndianBytesToLong(bytes, 0, 0)).toEqual(
      PSTUtil.convertBigEndianBytesToLong(bytes, 0, 0)
    )
    expect(() =>
      PSTUtil.convertLittleEndianBytesToLong(Buffer.alloc(9))
    ).toThrow(RangeError)
  })
})
