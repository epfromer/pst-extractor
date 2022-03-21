/* eslint-disable @typescript-eslint/no-explicit-any */
import Long from 'long'
import { PSTUtil } from './PSTUtil.class'

// Generic table item
// Provides some basic string functions
export class PSTTableItem {
  public static VALUE_TYPE_PT_UNICODE = 0x1f
  public static VALUE_TYPE_PT_STRING8 = 0x1e
  public static VALUE_TYPE_PT_BIN = 0x102

  private _itemIndex = 0
  public set itemIndex(val) {
    this._itemIndex = val
  }
  public get itemIndex(): number {
    return this._itemIndex
  }

  private _entryType: Long = Long.ZERO
  public set entryType(val) {
    this._entryType = val
  }
  public get entryType(): Long {
    return this._entryType
  }

  private _isExternalValueReference = false
  public set isExternalValueReference(val) {
    this._isExternalValueReference = val
  }
  public get isExternalValueReference(): boolean {
    return this._isExternalValueReference
  }

  private _entryValueReference = 0
  public set entryValueReference(val) {
    this._entryValueReference = val
  }
  public get entryValueReference(): number {
    return this._entryValueReference
  }

  private _entryValueType = 0
  public set entryValueType(val) {
    this._entryValueType = val
  }
  public get entryValueType(): number {
    return this._entryValueType
  }

  private _data: Buffer = Buffer.alloc(0)
  public set data(val) {
    this._data = val
  }
  public get data(): Buffer {
    return this._data
  }

  /**
   * Creates an instance of PSTTableItem.
   * @memberof PSTTableItem
   */

  /**
   * Get long value from table item.
   * @returns
   * @memberof PSTTableItem
   */
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  public getLongValue() {
    if (this.data.length > 0) {
      return PSTUtil.convertLittleEndianBytesToLong(this.data)
    }
    return -1
  }

  /**
   * Get string value of data.
   * @param {number} [stringType]
   * @returns {string}
   * @memberof PSTTableItem
   */
  public getStringValue(stringType?: number): string {
    if (!stringType) {
      stringType = this.entryValueType
    }

    if (stringType === PSTTableItem.VALUE_TYPE_PT_UNICODE) {
      // little-endian unicode string
      try {
        if (this.isExternalValueReference) {
          return 'External string reference!'
        }
        return this.data.toString('utf16le').replace(/\0/g, '')
      } catch (err) {
        console.error(
          'Error decoding string: ' +
            this.data.toString('utf16le').replace(/\0/g, '') +
            '\n' +
            err
        )
        return ''
      }
    }

    if (stringType == PSTTableItem.VALUE_TYPE_PT_STRING8) {
      return this.data.toString()
    }

    return 'hex string'
  }

  /**
   * JSON stringify the object properties.
   * @returns {string}
   * @memberof PSTTableItem
   */
  public toJSON(): any {
    const clone = Object.assign(
      {
        itemIndex: this.itemIndex,
        entryType: this.entryType,
        isExternalValueReference: this.isExternalValueReference,
        entryValueReference: this.entryValueReference,
        entryValueType: this.entryValueType,
        data: this.data,
      },
      this
    )
    return clone
  }
}
