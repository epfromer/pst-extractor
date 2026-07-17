import Long from 'long'
import { PSTDescriptorItem } from '../PSTDescriptorItem.class'
import { PSTFile } from '../PSTFile.class'

describe('PSTDescriptorItem Unicode identifiers', () => {
  it('keeps Unicode block identifiers as Long values', () => {
    const data = Buffer.alloc(24)
    data.writeUInt32LE(42, 0)
    const identifier = Long.fromString('81985529216486894')
    Buffer.from(identifier.toBytesLE()).copy(data, 8)
    const subnodeIdentifier = Long.fromString('81985529216486910')
    Buffer.from(subnodeIdentifier.toBytesLE()).copy(data, 16)

    const pstFile = { pstFileType: PSTFile.PST_TYPE_UNICODE } as PSTFile
    const item = new PSTDescriptorItem(data, 0, pstFile, PSTFile.SLBLOCK_ENTRY)

    expect(item.offsetIndexIdentifierLong.toString()).toBe(
      identifier.and(Long.fromInt(-2)).toString()
    )
    expect(item.subNodeOffsetIndexIdentifierLong.toString()).toBe(
      subnodeIdentifier.and(Long.fromInt(-2)).toString()
    )
  })
})
