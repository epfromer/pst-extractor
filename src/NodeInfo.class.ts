import Long from 'long'
import { PSTNodeInputStream } from './PSTNodeInputStream.class'

export class NodeInfo {
  private _startOffset: number
  get startOffset(): number {
    return this._startOffset
  }

  private _endOffset: number
  get endOffset(): number {
    return this._endOffset
  }

  public length(): number {
    return this.endOffset - this.startOffset
  }

  private _pstNodeInputStream: PSTNodeInputStream
  get pstNodeInputStream(): PSTNodeInputStream {
    return this._pstNodeInputStream
  }

  /**
   * Creates an instance of NodeInfo, part of the node table.
   * @param {number} start
   * @param {number} end
   * @param {PSTNodeInputStream} pstNodeInputStream
   * @memberof NodeInfo
   */
  constructor(
    start: number,
    end: number,
    pstNodeInputStream: PSTNodeInputStream
  ) {
    if (start > end) {
      throw new Error(
        `NodeInfo:: constructor Invalid NodeInfo parameters: start ${start} is greater than end ${end}`
      )
    }
    this._startOffset = start
    this._endOffset = end
    this._pstNodeInputStream = pstNodeInputStream
  }

  /**
   * Seek to position in node input stream and read a long
   * @param {long} offset
   * @param {number} length
   * @returns {long}
   * @memberof NodeInfo
   */
  public seekAndReadLong(offset: Long, length: number): Long {
    return this.pstNodeInputStream.seekAndReadLong(
      offset.add(this.startOffset),
      length
    )
  }

  /**
   * JSON stringify the object properties.
   * @returns {string}
   * @memberof NodeInfo
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public toJSON(): any {
    return this
  }
}
