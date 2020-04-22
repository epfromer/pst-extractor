import * as long from 'long'
import { NodeInfo } from './NodeInfo.class'
import { PSTNodeInputStream } from './PSTNodeInputStream.class'
import { PSTDescriptorItem } from './PSTDescriptorItem.class'

// The PST Table is the workhorse of the whole system.
// It allows for an item to be read and broken down into the individual properties that it consists of.
// For most PST Objects, it appears that only 7c and bc table types are used.
export abstract class PSTTable {
  protected tableType: string
  protected tableTypeByte: number
  protected hidUserRoot: number
  protected arrayBlocks: long[]

  // info from the b5 header
  protected sizeOfItemKey: number
  protected sizeOfItemValue: number
  protected hidRoot: number
  protected numberOfKeys = 0
  protected numberOfIndexLevels = 0
  private pstNodeInputStream: PSTNodeInputStream
  private subNodeDescriptorItems: Map<number, PSTDescriptorItem> = new Map()

  /**
   * Creates an instance of PSTTable.  The PST Table is the workhorse of the whole system.
   * It allows for an item to be read and broken down into the individual properties that it consists of.
   * For most PST Objects, it appears that only 7C and BC table types are used.
   * @param {PSTNodeInputStream} pstNodeInputStream
   * @param {Map<number, PSTDescriptorItem>} subNodeDescriptorItems
   * @memberof PSTTable
   */
  constructor(
    pstNodeInputStream: PSTNodeInputStream,
    subNodeDescriptorItems?: Map<number, PSTDescriptorItem>
  ) {
    if (subNodeDescriptorItems) {
      this.subNodeDescriptorItems = subNodeDescriptorItems
    }
    this.pstNodeInputStream = pstNodeInputStream
    this.arrayBlocks = pstNodeInputStream.getBlockOffsets()

    // the next two bytes should be the table type (bSig)
    // 0xEC is HN (Heap-on-Node)
    pstNodeInputStream.seek(long.ZERO)
    const headdata = Buffer.alloc(4)
    pstNodeInputStream.readCompletely(headdata)
    this.tableTypeByte = headdata[3]
    switch (
      this.tableTypeByte // bClientSig
    ) {
      case 0x7c: // Table Context (TC/HN)
        this.tableType = '7c'
        break
      case 188:
        this.tableType = 'bc' // Property Context (PC/BTH)
        break
      default:
        throw new Error(
          'PSTTable::constructor Unable to parse table, bad table type.  Unknown identifier: 0x' +
            headdata[3].toString(16)
        )
    }

    this.hidUserRoot = pstNodeInputStream
      .seekAndReadLong(long.fromValue(4), 4)
      .toNumber() // hidUserRoot

    // all tables should have a BTHHEADER at hnid == 0x20
    const headerNodeInfo = this.getNodeInfo(0x20)
    if (!headerNodeInfo) {
      throw new Error('PSTTable::constructor headerNodeInfo is null')
    }

    headerNodeInfo.pstNodeInputStream.seek(
      long.fromValue(headerNodeInfo.startOffset)
    )
    let headerByte = headerNodeInfo.pstNodeInputStream.read() & 0xff
    if (headerByte != 0xb5) {
      headerNodeInfo.pstNodeInputStream.seek(
        long.fromValue(headerNodeInfo.startOffset)
      )
      headerByte = headerNodeInfo.pstNodeInputStream.read() & 0xff
      headerNodeInfo.pstNodeInputStream.seek(
        long.fromValue(headerNodeInfo.startOffset)
      )
      const tmp = Buffer.alloc(1024)
      headerNodeInfo.pstNodeInputStream.readCompletely(tmp)
      throw new Error(
        "PSTTable::constructor Unable to parse table, can't find BTHHEADER header information: " +
          headerByte
      )
    }

    this.sizeOfItemKey = headerNodeInfo.pstNodeInputStream.read() & 0xff // Size of key in key table
    this.sizeOfItemValue = headerNodeInfo.pstNodeInputStream.read() & 0xff // Size of value in key table
    this.numberOfIndexLevels = headerNodeInfo.pstNodeInputStream.read() & 0xff
    this.hidRoot = headerNodeInfo
      .seekAndReadLong(long.fromValue(4), 4)
      .toNumber()
  }

  /**
   * Release data.
   * @protected
   * @memberof PSTTable
   */
  protected releaseRawData() {
    this.subNodeDescriptorItems.clear()
  }

  /**
   * Number of items in table.
   * @readonly
   * @type {number}
   * @memberof PSTTable
   */
  public get rowCount(): number {
    return this.numberOfKeys
  }

  /**
   * Get information for the node in the b-tree.
   * @param {number} hnid
   * @returns {NodeInfo}
   * @memberof PSTTable
   */
  public getNodeInfo(hnid: number): NodeInfo | null {
    // Zero-length node?
    if (hnid == 0) {
      return new NodeInfo(0, 0, this.pstNodeInputStream)
    }

    // Is it a subnode ID?
    if (this.subNodeDescriptorItems && this.subNodeDescriptorItems.has(hnid)) {
      const item = this.subNodeDescriptorItems.get(hnid)
      let subNodeInfo = null

      try {
        const subNodeIn: PSTNodeInputStream = new PSTNodeInputStream(
          this.pstNodeInputStream.pstFile,
          item
        )
        subNodeInfo = new NodeInfo(0, subNodeIn.length.toNumber(), subNodeIn)
      } catch (err) {
        throw new Error(
          'PSTTable::getNodeInfo: IOException reading subNode:\n' + err
        )
      }

      // return new NodeInfo(0, data.length, data);
      return subNodeInfo
    }

    if ((hnid & 0x1f) != 0) {
      // Some kind of external node
      return null
    }

    const whichBlock: number = hnid >>> 16
    if (whichBlock > this.arrayBlocks.length) {
      throw new Error(
        "PSTTable::getNodeInfo: block doesn't exist: " +
          hnid +
          ', ' +
          whichBlock +
          ', ' +
          this.arrayBlocks.length
      )
    }

    // A normal node in a local heap
    const index = (hnid & 0xffff) >> 5
    let blockOffset = 0
    if (whichBlock > 0) {
      blockOffset = this.arrayBlocks[whichBlock - 1].toNumber()
    }
    // Get offset of HN page map
    let iHeapNodePageMap =
      this.pstNodeInputStream
        .seekAndReadLong(long.fromValue(blockOffset), 2)
        .toNumber() + blockOffset
    const cAlloc = this.pstNodeInputStream
      .seekAndReadLong(long.fromValue(iHeapNodePageMap), 2)
      .toNumber()
    if (index >= cAlloc + 1) {
      throw new Error(
        "PSTTable::getNodeInfo: node index doesn't exist! nid = " + hnid
      )
    }
    iHeapNodePageMap += 2 * index + 2
    const start =
      this.pstNodeInputStream
        .seekAndReadLong(long.fromValue(iHeapNodePageMap), 2)
        .toNumber() + blockOffset
    const end =
      this.pstNodeInputStream
        .seekAndReadLong(long.fromValue(iHeapNodePageMap + 2), 2)
        .toNumber() + blockOffset

    return new NodeInfo(start, end, this.pstNodeInputStream)
  }

  /**
   * JSON stringify the object properties.
   * @returns {string}
   * @memberof PSTTable
   */
  public toJSON(): any {
    const clone = Object.assign(
      {
        tableType: this.tableType,
        tableTypeByte: this.tableTypeByte,
        hidUserRoot: this.hidUserRoot,
        sizeOfItemKey: this.sizeOfItemKey,
        sizeOfItemValue: this.sizeOfItemValue,
        hidRoot: this.hidRoot,
        numberOfKeys: this.numberOfKeys,
        numberOfIndexLevels: this.numberOfIndexLevels,
      },
      this
    )
    return clone
  }
}
