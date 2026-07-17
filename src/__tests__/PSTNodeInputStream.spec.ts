import Long from 'long'
import { OffsetIndexItem } from '../OffsetIndexItem.class'
import { PSTFile } from '../PSTFile.class'
import { PSTNodeInputStream } from '../PSTNodeInputStream.class'

function offsetItem(identifier: number, fileOffset: number, size: number) {
  const data = Buffer.alloc(24)
  data.writeUInt32LE(identifier, 0)
  data.writeUInt32LE(fileOffset, 8)
  data.writeUInt16LE(size, 16)
  return new OffsetIndexItem(data, PSTFile.PST_TYPE_UNICODE)
}

describe('PSTNodeInputStream XBlock boundaries', () => {
  it('seeks at block boundaries and does not read past the logical length', () => {
    const fileData = Buffer.alloc(202)
    fileData.set([0x01, 0x01, 0x02, 0x00, 0x03, 0, 0, 0], 0)
    fileData.writeUInt32LE(2, 8)
    fileData.writeUInt32LE(4, 16)
    fileData.write('AB', 100)
    fileData.write('CD', 200)

    const items = new Map([
      [2, offsetItem(2, 100, 2)],
      [4, offsetItem(4, 200, 2)]
    ])
    let position = 0
    const pstFile = {
      encryptionType: PSTFile.ENCRYPTION_TYPE_NONE,
      pstFileType: PSTFile.PST_TYPE_UNICODE,
      seek: (offset: Long) => {
        position = offset.toNumber()
      },
      read: () => fileData[position++],
      readCompletely: (target: Buffer) => {
        fileData.copy(target, 0, position, position + target.length)
        position += target.length
      },
      getOffsetIndexNode: (identifier: Long) => items.get(identifier.toNumber())
    } as unknown as PSTFile

    const stream = new PSTNodeInputStream(pstFile, offsetItem(6, 0, 24))
    stream.seek(Long.fromNumber(2))
    expect(stream.read()).toBe('C'.charCodeAt(0))
    expect(stream.read()).toBe(-1)
    expect(() => stream.seek(Long.fromNumber(4))).toThrow('past end of item')
  })
})
