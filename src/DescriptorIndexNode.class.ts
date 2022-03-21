import Long from 'long'
import { PSTFile } from './PSTFile.class'
import { PSTUtil } from './PSTUtil.class'

// DescriptorIndexNode is a leaf item from the Descriptor index b-tree
// It is like a pointer to an element in the PST file, everything has one...
export class DescriptorIndexNode {
  private _descriptorIdentifier: number
  itemType = 0
  public get descriptorIdentifier(): number {
    return this._descriptorIdentifier
  }

  private _parentDescriptorIndexIdentifier: number
  public get parentDescriptorIndexIdentifier(): number {
    return this._parentDescriptorIndexIdentifier
  }

  private _localDescriptorsOffsetIndexIdentifier: Long
  public get localDescriptorsOffsetIndexIdentifier(): Long {
    return this._localDescriptorsOffsetIndexIdentifier
  }

  private _dataOffsetIndexIdentifier: Long
  public get dataOffsetIndexIdentifier(): Long {
    return this._dataOffsetIndexIdentifier
  }

  /**
   * Creates an instance of DescriptorIndexNode, a component of the internal descriptor b-tree.
   * @param {Buffer} buffer
   * @param {number} pstFileType
   * @memberof DescriptorIndexNode
   */
  constructor(buffer: Buffer, pstFileType: number) {
    if (pstFileType == PSTFile.PST_TYPE_ANSI) {
      this._descriptorIdentifier = PSTUtil.convertLittleEndianBytesToLong(
        buffer,
        0,
        4
      ).toNumber()
      this._dataOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(
        buffer,
        4,
        8
      )
      this._localDescriptorsOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(
        buffer,
        8,
        12
      )
      this._parentDescriptorIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(
        buffer,
        12,
        16
      ).toNumber()
    } else {
      this._descriptorIdentifier = PSTUtil.convertLittleEndianBytesToLong(
        buffer,
        0,
        4
      ).toNumber()
      this._dataOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(
        buffer,
        8,
        16
      )
      this._localDescriptorsOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(
        buffer,
        16,
        24
      )
      this._parentDescriptorIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(
        buffer,
        24,
        28
      ).toNumber()
      this.itemType = PSTUtil.convertLittleEndianBytesToLong(
        buffer,
        28,
        32
      ).toNumber()
    }
  }

  /**
   * JSON stringify the object properties.
   * @returns {string}
   * @memberof DescriptorIndexNode
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return this
  }
}
