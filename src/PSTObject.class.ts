import Long from 'long'
import { DescriptorIndexNode } from './DescriptorIndexNode.class.js'
import { OffsetIndexItem } from './OffsetIndexItem.class.js'
import { OutlookProperties } from './OutlookProperties.js'
import { PSTDescriptorItem } from './PSTDescriptorItem.class.js'
import { PSTFile } from './PSTFile.class.js'
import { PSTNodeInputStream } from './PSTNodeInputStream.class.js'
import { PSTTableBC } from './PSTTableBC.class.js'
import { PSTTableItem } from './PSTTableItem.class.js'
import { PSTUtil } from './PSTUtil.class.js'
import { rethrowAsyncCacheMiss } from './PSTError.js'

export abstract class PSTObject {
  protected pstFile: PSTFile
  protected descriptorIndexNode: DescriptorIndexNode | null = null
  protected localDescriptorItems: Map<number, PSTDescriptorItem> | null = null
  private pstTableBC: PSTTableBC | null = null
  protected pstTableItems: Map<number, PSTTableItem> | null = null

  /**
   * Creates an instance of PSTObject, the root class of most PST Items.
   * @memberof PSTObject
   */
  constructor(
    pstFile: PSTFile,
    descriptorIndexNode?: DescriptorIndexNode,
    pstTableItems?: Map<number, PSTTableItem>
  ) {
    this.pstFile = pstFile

    if (descriptorIndexNode) {
      this.loadDescriptor(descriptorIndexNode)
    }
    if (pstTableItems) {
      this.pstTableItems = pstTableItems
    }
  }

  /**
   * Load a descriptor from the PST.
   * @protected
   * @param {PSTFile} pstFile
   * @param {DescriptorIndexNode} descriptorIndexNode
   * @memberof PSTObject
   */
  private loadDescriptor(descriptorIndexNode: DescriptorIndexNode): void {
    this.descriptorIndexNode = descriptorIndexNode

    // get the table items for this descriptor
    const offsetIndexItem: OffsetIndexItem = this.pstFile.getOffsetIndexNode(
      descriptorIndexNode.dataOffsetIndexIdentifier
    )
    const pstNodeInputStream: PSTNodeInputStream = new PSTNodeInputStream(
      this.pstFile,
      offsetIndexItem
    )
    this.pstTableBC = new PSTTableBC(pstNodeInputStream)
    this.pstTableItems = this.pstTableBC.getItems()

    if (
      descriptorIndexNode.localDescriptorsOffsetIndexIdentifier.notEquals(
        Long.ZERO
      )
    ) {
      this.localDescriptorItems = this.pstFile.getPSTDescriptorItems(
        descriptorIndexNode.localDescriptorsOffsetIndexIdentifier
      )
    }
  }

  /**
   * Get table items.
   * @protected
   * @param {PSTFile} theFile
   * @param {DescriptorIndexNode} folderIndexNode
   * @param {PSTTableBC} pstTableBC
   * @param {Map<number, PSTDescriptorItem>} localDescriptorItems
   * @memberof PSTObject
   */
  protected prePopulate(
    folderIndexNode: DescriptorIndexNode | null,
    pstTableBC: PSTTableBC,
    localDescriptorItems?: Map<number, PSTDescriptorItem>
  ): void {
    this.descriptorIndexNode = folderIndexNode
    this.pstTableItems = pstTableBC.getItems()
    this.pstTableBC = pstTableBC
    this.localDescriptorItems = localDescriptorItems
      ? localDescriptorItems
      : null
  }

  /**
   * Get the descriptor identifier for this item which can be used for loading objects
   * through detectAndLoadPSTObject(PSTFile theFile, long descriptorIndex)
   * @readonly
   * @type {long}
   * @memberof PSTObject
   */
  public get descriptorNodeId(): Long {
    // Prevent null pointer exceptions for embedded messages
    if (this.descriptorIndexNode != null) {
      return Long.fromNumber(this.descriptorIndexNode.descriptorIdentifier)
    } else {
      return Long.ZERO
    }
  }

  /**
   * Get the node type for the descriptor id.
   * @param {number} [descriptorIdentifier]
   * @returns {number}
   * @memberof PSTObject
   */
  public getNodeType(descriptorIdentifier?: number): number {
    if (descriptorIdentifier) {
      return descriptorIdentifier & 0x1f
    } else if (this.descriptorIndexNode) {
      return this.descriptorIndexNode.descriptorIdentifier & 0x1f
    } else {
      return -1
    }
  }

  /**
   * Get a number.
   * @protected
   * @param {number} identifier
   * @param {number} [defaultValue]
   * @returns {number}
   * @memberof PSTObject
   */
  protected getIntItem(identifier: number, defaultValue?: number): number {
    if (!defaultValue) {
      defaultValue = 0
    }
    if (this.pstTableItems && this.pstTableItems.has(identifier)) {
      const item = this.pstTableItems.get(identifier)
      if (item) {
        return item.entryValueReference
      }
    }
    return defaultValue
  }

  /**
   * Get a boolean.
   * @protected
   * @param {number} identifier
   * @param {boolean} [defaultValue]
   * @returns {boolean}
   * @memberof PSTObject
   */
  protected getBooleanItem(
    identifier: number,
    defaultValue?: boolean
  ): boolean {
    if (defaultValue === undefined) {
      defaultValue = false
    }
    if (this.pstTableItems && this.pstTableItems.has(identifier)) {
      const item = this.pstTableItems.get(identifier)
      if (item) {
        return item.entryValueReference != 0
      }
    }
    return defaultValue
  }

  /**
   * Get a double.
   * @protected
   * @param {number} identifier
   * @param {number} [defaultValue]
   * @returns {number}
   * @memberof PSTObject
   */
  protected getDoubleItem(identifier: number, defaultValue?: number): number {
    if (defaultValue === undefined) {
      defaultValue = 0
    }
    if (this.pstTableItems && this.pstTableItems.has(identifier)) {
      const item = this.pstTableItems.get(identifier)
      if (item) {
        const longVersion: Long = PSTUtil.convertLittleEndianBytesToLong(
          item.data
        )

        // interpret {low, high} signed 32 bit integers as double
        return new Float64Array(
          new Int32Array([longVersion.low, longVersion.high]).buffer
        )[0]
      }
    }
    return defaultValue
  }

  /**
   * Get a long.
   * @protected
   * @param {number} identifier
   * @param {long} [defaultValue]
   * @returns {long}
   * @memberof PSTObject
   */
  protected getLongItem(identifier: number, defaultValue?: Long): Long {
    if (defaultValue === undefined) {
      defaultValue = Long.ZERO
    }
    if (this.pstTableItems && this.pstTableItems.has(identifier)) {
      const item = this.pstTableItems.get(identifier)
      if (item && item.entryValueType == 0x0003) {
        // we are really just an int
        return Long.fromNumber(item.entryValueReference)
      } else if (item && item.entryValueType == 0x0014) {
        // we are a long
        if (item.data != null && item.data.length == 8) {
          return PSTUtil.convertLittleEndianBytesToLong(item.data, 0, 8)
        }
      }
    }
    return defaultValue
  }

  /**
   * Get a string.
   * @protected
   * @param {number} identifier
   * @param {number} [stringType]
   * @param {string} [codepage]
   * @returns {string}
   * @memberof PSTObject
   */
  protected getStringItem(
    identifier: number,
    stringType?: number,
    codepage?: string
  ): string {
    if (!stringType) {
      stringType = 0
    }
    const item = this.pstTableItems
      ? this.pstTableItems.get(identifier)
      : undefined
    if (item) {
      if (!codepage) {
        codepage = this.stringCodepage
      }

      // get the string type from the item if not explicitly set
      if (!stringType) {
        stringType = item.entryValueType
      }

      // see if there is a descriptor entry
      if (!item.isExternalValueReference) {
        return PSTUtil.createJavascriptString(item.data, stringType, codepage)
      }

      if (
        this.localDescriptorItems != null &&
        this.localDescriptorItems.has(item.entryValueReference)
      ) {
        // we have a hit!
        const descItem = this.localDescriptorItems.get(item.entryValueReference)

        try {
          const data = descItem ? descItem.getData() : null
          if (data == null) {
            return ''
          }

          return PSTUtil.createJavascriptString(data, stringType, codepage)
        } catch (_err) {
          rethrowAsyncCacheMiss(_err)
          return ''
        }
      }
    }
    return ''
  }

  /**
   * Get a codepage.
   * @readonly
   * @type {string}
   * @memberof PSTObject
   */
  public get stringCodepage(): string | undefined {
    // try and get the codepage
    let cpItem = this.pstTableItems ? this.pstTableItems.get(0x3ffd) : null // PidTagMessageCodepage
    if (cpItem == null) {
      cpItem = this.pstTableItems ? this.pstTableItems.get(0x3fde) : null // PidTagInternetCodepage
    }
    if (cpItem != null) {
      return PSTUtil.getInternetCodePageCharset(cpItem.entryValueReference)
    }
    return ''
  }

  /**
   * Get a date.
   * @param {number} identifier
   * @returns {Date}
   * @memberof PSTObject
   */
  public getDateItem(identifier: number): Date | null {
    if (this.pstTableItems && this.pstTableItems.has(identifier)) {
      const item = this.pstTableItems.get(identifier)
      if (item && item.data.length == 0) {
        return new Date(0)
      }
      if (item) {
        const hi = PSTUtil.convertLittleEndianBytesToLong(item.data, 4, 8)
        const low = PSTUtil.convertLittleEndianBytesToLong(item.data, 0, 4)
        return PSTUtil.filetimeToDate(hi, low)
      }
    }
    return null
  }

  /**
   * Get a blob.
   * @protected
   * @param {number} identifier
   * @returns {Buffer}
   * @memberof PSTObject
   */
  protected getBinaryItem(identifier: number): Buffer | null {
    if (this.pstTableItems && this.pstTableItems.has(identifier)) {
      const item = this.pstTableItems.get(identifier)
      if (item && item.entryValueType == 0x0102) {
        if (!item.isExternalValueReference) {
          return item.data
        }
        if (
          this.localDescriptorItems != null &&
          this.localDescriptorItems.has(item.entryValueReference)
        ) {
          // we have a hit!
          const descItem = this.localDescriptorItems.get(
            item.entryValueReference
          )
          try {
            return descItem ? descItem.getData() : null
          } catch (err) {
            throw new Error('Unable to read binary PST property', {
              cause: err
            })
          }
        }
      }
    }
    return null
  }

  /**
   * Get the display name of this object.
   * https://msdn.microsoft.com/en-us/library/office/cc842383.aspx
   * @readonly
   * @type {string}
   * @memberof PSTObject
   */
  public get displayName(): string {
    return this.getStringItem(OutlookProperties.PR_DISPLAY_NAME)
  }

  /**
   * JSON the object.
   * @returns {string}
   * @memberof PSTObject
   */
  public toJSON(): any {
    return this
  }
}
