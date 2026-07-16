import Long from 'long'
import { jest } from '@jest/globals'
import { DescriptorIndexNode } from '../DescriptorIndexNode.class.js'
import { PSTDescriptorItem } from '../PSTDescriptorItem.class.js'
import { PSTFile } from '../PSTFile.class.js'
import { PSTNodeInputStream } from '../PSTNodeInputStream.class.js'
import { PSTTable } from '../PSTTable.class.js'

const UNICODE = PSTFile.PST_TYPE_UNICODE

function fakePst(type = UNICODE): PSTFile {
  const pst = Object.create(PSTFile.prototype) as PSTFile
  Object.assign(pst as object, {
    _pstFileType: type,
    _encryptionType: PSTFile.ENCRYPTION_TYPE_NONE,
    pstFD: -1,
    closed: false,
    pstBuffer: Buffer.alloc(0),
    pstSource: null,
    position: 0,
    scalarScratch: Buffer.allocUnsafe(8)
  })
  return pst
}

function descriptorBlock(
  type: number,
  entries: Array<{ nid: number; bid: bigint; subBid?: bigint }>,
  fileType = UNICODE
): Buffer {
  const ansi = fileType === PSTFile.PST_TYPE_ANSI
  const headerSize = ansi ? 4 : 8
  const entrySize = ansi
    ? type === PSTFile.SLBLOCK_ENTRY
      ? 12
      : 8
    : type === PSTFile.SLBLOCK_ENTRY
      ? 24
      : 16
  const data = Buffer.alloc(headerSize + entries.length * entrySize)
  data[0] = 0x02
  data[1] = type
  data.writeUInt16LE(entries.length, 2)
  entries.forEach((entry, index) => {
    const offset = headerSize + index * entrySize
    data.writeUInt32LE(entry.nid, offset)
    if (ansi) {
      data.writeUInt32LE(Number(entry.bid), offset + 4)
      if (type === PSTFile.SLBLOCK_ENTRY) {
        data.writeUInt32LE(Number(entry.subBid ?? 0n), offset + 8)
      }
    } else {
      data.writeBigUInt64LE(entry.bid, offset + 8)
      if (type === PSTFile.SLBLOCK_ENTRY) {
        data.writeBigUInt64LE(entry.subBid ?? 0n, offset + 16)
      }
    }
  })
  return data
}

function stream(pst: PSTFile, data: Buffer): PSTNodeInputStream {
  return new PSTNodeInputStream(pst, data, false)
}

describe('large PST structural regressions', () => {
  describe('SLBLOCK and SIBLOCK decoding', () => {
    it.each([PSTFile.PST_TYPE_ANSI, UNICODE])(
      'decodes leaf descriptor entries for file type %i',
      (fileType) => {
        const pst = fakePst(fileType)
        const data = descriptorBlock(
          PSTFile.SLBLOCK_ENTRY,
          [{ nid: 0x122, bid: 0x102n, subBid: 0x202n }],
          fileType
        )
        const items = pst.getPSTDescriptorItems(stream(pst, data))
        expect(items.get(0x122)?.offsetIndexIdentifierLong.equals(0x102)).toBe(
          true
        )
      }
    )

    it('preserves Unicode BIDs above 32 bits through nested SIBLOCKs', () => {
      const pst = fakePst()
      const rootBid = 0x100000002n
      const middleBid = 0x200000002n
      const leafBid = 0x300000002n
      const blocks = new Map<string, Buffer>([
        [
          rootBid.toString(),
          descriptorBlock(PSTFile.SIBLOCK_ENTRY, [{ nid: 0, bid: middleBid }])
        ],
        [
          middleBid.toString(),
          descriptorBlock(PSTFile.SIBLOCK_ENTRY, [{ nid: 0, bid: leafBid }])
        ],
        [
          leafBid.toString(),
          descriptorBlock(PSTFile.SLBLOCK_ENTRY, [
            { nid: 0x124, bid: 0x400000002n }
          ])
        ]
      ])
      jest.spyOn(pst, 'readLeaf').mockImplementation((bid) => {
        const data = blocks.get(bid.toUnsigned().toString())
        if (!data) throw new Error('missing fixture block')
        return stream(pst, data)
      })

      const item = pst
        .getPSTDescriptorItems(Long.fromString(rootBid.toString(), true))
        .get(0x124)
      expect(item?.offsetIndexIdentifierLong.toUnsigned().toString()).toBe(
        '17179869186'
      )
    })

    it('deduplicates repeated child blocks and descriptor rows stably', () => {
      const pst = fakePst()
      const root = 0x102n
      const leaf = 0x202n
      const blocks = new Map<string, Buffer>([
        [
          root.toString(),
          descriptorBlock(PSTFile.SIBLOCK_ENTRY, [
            { nid: 0, bid: leaf },
            { nid: 0, bid: leaf }
          ])
        ],
        [
          leaf.toString(),
          descriptorBlock(PSTFile.SLBLOCK_ENTRY, [
            { nid: 0x124, bid: 0x302n },
            { nid: 0x124, bid: 0x402n }
          ])
        ]
      ])
      jest
        .spyOn(pst, 'readLeaf')
        .mockImplementation((bid) =>
          stream(pst, blocks.get(bid.toUnsigned().toString())!)
        )

      const items = pst.getPSTDescriptorItems(Long.fromNumber(Number(root)))
      expect(items.size).toBe(1)
      expect(items.get(0x124)?.offsetIndexIdentifierLong.toNumber()).toBe(0x302)
    })

    it('rejects cycles, invalid block types, and missing target blocks', () => {
      const pst = fakePst()
      const a = 0x102n
      const b = 0x202n
      const blocks = new Map<string, Buffer>([
        [
          a.toString(),
          descriptorBlock(PSTFile.SIBLOCK_ENTRY, [{ nid: 0, bid: b }])
        ],
        [
          b.toString(),
          descriptorBlock(PSTFile.SIBLOCK_ENTRY, [{ nid: 0, bid: a }])
        ]
      ])
      jest.spyOn(pst, 'readLeaf').mockImplementation((bid) => {
        const data = blocks.get(bid.toUnsigned().toString())
        if (!data) throw new Error('missing fixture block')
        return stream(pst, data)
      })
      expect(() =>
        pst.getPSTDescriptorItems(Long.fromNumber(Number(a)))
      ).toThrow(expect.objectContaining({ code: 'CORRUPT_DATA' }))

      const invalid = Buffer.from([0x02, 0x7f, 0, 0])
      expect(() => pst.getPSTDescriptorItems(stream(pst, invalid))).toThrow(
        expect.objectContaining({ code: 'CORRUPT_DATA' })
      )
      expect(() => pst.getPSTDescriptorItems(Long.fromNumber(0x902))).toThrow(
        expect.objectContaining({ code: 'CORRUPT_DATA' })
      )
    })
  })

  describe('B-tree lower-bound navigation', () => {
    function btreeFixture(): PSTFile {
      const pst = fakePst()
      const data = Buffer.alloc(8192)
      const root = 1024
      const children = [2048, 3072, 4096]
      data.writeBigUInt64LE(BigInt(root), 224)
      const keys = [0x80000000, 0x90000000, 0xa0000000]
      keys.forEach((key, index) => {
        const offset = root + index * 24
        data.writeBigUInt64LE(BigInt(key), offset)
        data.writeBigUInt64LE(BigInt(children[index]), offset + 16)
      })
      data[root + 488] = keys.length
      data[root + 489] = keys.length
      data[root + 490] = 24
      data[root + 491] = 1
      data[root + 496] = 0x81
      data[root + 497] = 0x81
      children.forEach((offset, index) => {
        data.writeUInt32LE(keys[index] + 2, offset)
        data[offset + 488] = 1
        data[offset + 489] = 1
        data[offset + 490] = 32
        data[offset + 491] = 0
        data[offset + 496] = 0x81
        data[offset + 497] = 0x81
      })
      Object.assign(pst as object, { pstBuffer: data })
      return pst
    }

    it.each([0x80000002, 0x90000002, 0xa0000002])(
      'finds first, middle, and last descriptor key %i',
      (key) => {
        const node = btreeFixture().getDescriptorIndexNode(Long.fromNumber(key))
        expect(node).toBeInstanceOf(DescriptorIndexNode)
        expect(node.descriptorIdentifier).toBe(key)
      }
    )

    it('returns NOT_FOUND for absent keys, including below the first branch', () => {
      const pst = btreeFixture()
      for (const key of [0x7fffffff, 0x90000003]) {
        expect(() => pst.getDescriptorIndexNode(Long.fromNumber(key))).toThrow(
          expect.objectContaining({ code: 'NOT_FOUND' })
        )
      }
    })
  })

  it('addresses HNID 0x10000 at the second logical heap page', () => {
    const pst = fakePst()
    const data = Buffer.alloc(16_140)
    const secondPage = 8176
    data.writeUInt16LE(20, secondPage)
    data.writeUInt16LE(1, secondPage + 20)
    data.writeUInt16LE(32, secondPage + 22)
    data.writeUInt16LE(40, secondPage + 24)
    data.writeUInt16LE(48, secondPage + 26)
    const input = stream(pst, data)
    const table = Object.create(PSTTable.prototype) as PSTTable
    Object.assign(table as object, {
      pstNodeInputStream: input,
      heapPageOffsets: new Map<number, number[]>(),
      arrayBlocks: [Long.fromNumber(secondPage), Long.fromNumber(data.length)]
    })

    const node = table.getNodeInfo(0x10000)
    expect(node?.startOffset).toBe(secondPage + 32)
    expect(node?.endOffset).toBe(secondPage + 40)
    expect(() => input.seek(Long.fromNumber(data.length))).not.toThrow()
    expect(() => input.seek(Long.fromNumber(data.length + 1))).toThrow(
      /seek past end/
    )
    expect(() => table.getNodeInfo(0x20000)).toThrow(
      expect.objectContaining({ code: 'NOT_FOUND' })
    )
  })

  it('classifies an empty table block as missing', () => {
    class ConcreteTable extends PSTTable {}
    expect(
      () => new ConcreteTable(stream(fakePst(), Buffer.alloc(32)))
    ).toThrow(expect.objectContaining({ code: 'NOT_FOUND' }))
  })

  it('classifies an internal block referenced as a table as missing', () => {
    class ConcreteTable extends PSTTable {}
    const data = Buffer.alloc(32)
    data[3] = 1
    expect(() => new ConcreteTable(stream(fakePst(), data))).toThrow(
      expect.objectContaining({ code: 'NOT_FOUND' })
    )
  })

  it('recovers from a false-positive zlib header heuristic', () => {
    const pst = fakePst()
    jest.spyOn(pst, 'decompress').mockImplementation(() => {
      const error = new Error('incorrect header check') as Error & {
        code: string
      }
      error.code = 'Z_DATA_ERROR'
      throw error
    })
    const input = stream(pst, Buffer.from([0x78, 0x9c, 1, 2, 3, 4]))
    expect(input.read()).toBe(0x78)
    expect(input.length.toNumber()).toBe(6)
  })

  it.each([0x01, 0x5e, 0x9c, 0xda])(
    'recognizes the valid zlib header 78 %s',
    (flag) => {
      const pst = fakePst()
      const decompress = jest
        .spyOn(pst, 'decompress')
        .mockReturnValue(Buffer.from([0x42]))
      const input = stream(pst, Buffer.from([0x78, flag, 1, 2]))
      expect(decompress).toHaveBeenCalled()
      expect(input.length.toNumber()).toBe(1)
    }
  )

  it('rejects zlib headers that require an external dictionary', () => {
    const pst = fakePst()
    const decompress = jest.spyOn(pst, 'decompress')
    const input = stream(pst, Buffer.from([0x78, 0x20, 1, 2]))
    expect(decompress).not.toHaveBeenCalled()
    expect(input.read()).toBe(0x78)
  })
})
