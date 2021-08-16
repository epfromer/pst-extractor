/* eslint-disable @typescript-eslint/no-explicit-any */
import * as long from 'long'
import * as zlib from 'zlib'
import { PSTDescriptorItem } from './PSTDescriptorItem.class'
import { PSTUtil } from './PSTUtil.class'
import { OffsetIndexItem } from './OffsetIndexItem.class'
import { PSTFile } from './PSTFile.class'

export class PSTNodeInputStream {
  private skipPoints: long[] = []
  private indexItems: OffsetIndexItem[] = []
  private currentBlock = 0
  private allData: Buffer | null = null
  private isZlib = false

  private _currentLocation: long = long.ZERO
  private get currentLocation(): long {
    return this._currentLocation
  }
  private set currentLocation(loc: long) {
    this._currentLocation = loc
  }

  private _pstFile: PSTFile
  public get pstFile(): PSTFile {
    return this._pstFile
  }

  private _length: long = long.ZERO
  public get length(): long {
    return this._length
  }

  private _encrypted = false
  public get encrypted(): boolean {
    return this._encrypted
  }

  /**
   * Creates an instance of PSTNodeInputStream.
   * @param {PSTFile} pstFile
   * @param {Buffer} attachmentData
   * @param {boolean} [encrypted]
   * @memberof PSTNodeInputStream
   */
  constructor(pstFile: PSTFile, attachmentData: Buffer, encrypted?: boolean)
  constructor(
    pstFile: PSTFile,
    descriptorItem: PSTDescriptorItem | undefined,
    encrypted?: boolean
  )
  constructor(
    pstFile: PSTFile,
    offsetItem: OffsetIndexItem,
    encrypted?: boolean
  )
  constructor(pstFile: PSTFile, arg: any, encrypted?: boolean) {
    this._pstFile = pstFile
    if (arg instanceof OffsetIndexItem) {
      this._encrypted =
        pstFile.encryptionType == PSTFile.ENCRYPTION_TYPE_COMPRESSIBLE
      this.loadFromOffsetItem(arg)
    } else if (arg instanceof PSTDescriptorItem) {
      this._encrypted =
        pstFile.encryptionType == PSTFile.ENCRYPTION_TYPE_COMPRESSIBLE
      // we want to get the first block of data and see what we are dealing with
      this.loadFromOffsetItem(
        pstFile.getOffsetIndexNode(long.fromNumber(arg.offsetIndexIdentifier))
      )
    } else if (arg instanceof Buffer) {
      this.allData = arg
      this._length = long.fromNumber(this.allData.length)
      if (encrypted != undefined) {
        this._encrypted = encrypted
      } else {
        this._encrypted =
          pstFile.encryptionType == PSTFile.ENCRYPTION_TYPE_COMPRESSIBLE
      }
    }
    this.currentBlock = 0
    this.currentLocation = long.ZERO
    this.detectZlib()
  }

  /**
   * Checks if the node is ZL compressed and unzips if so.
   * @private
   * @returns
   * @memberof PSTNodeInputStream
   */
  private detectZlib(): void {
    // not really sure how this is meant to work, kind of going by feel here.
    if (this.length.lt(4)) {
      return
    }
    try {
      if (this.read() === 0x78 && this.read() === 0x9c) {
        let multiStreams = false
        if (this.indexItems.length > 1) {
          const i: OffsetIndexItem = this.indexItems[1]
          this.pstFile.seek(i.fileOffset)
          multiStreams =
            this.pstFile.read() === 0x78 && this.pstFile.read() === 0x9c
        }
        // we are a compressed block, decompress the whole thing into a buffer
        // and replace our contents with that. firstly, if we have blocks, use that as the length
        let outputStream: Buffer | null = null
        if (multiStreams) {
          // debugger

          // console.log('list of all index items')
          // for (let i of this.indexItems) {
          //   console.log(i.toJSON());
          // }
          // console.log('----------------------')

          for (const i of this.indexItems) {
            const inData: Buffer = Buffer.alloc(i.size)
            this.pstFile.seek(i.fileOffset)
            this.pstFile.readCompletely(inData)
            const buf = zlib.unzipSync(inData)
            outputStream = outputStream ? Buffer.concat([outputStream, buf]) : buf
          }
          this.indexItems = []
          this.skipPoints = []
        } else {
          let compressedLength: number = this.length.toNumber()
          if (this.indexItems.length > 0) {
            compressedLength = 0
            for (const i of this.indexItems) {
              compressedLength += i.size
            }
          }
          const inData: Buffer = Buffer.alloc(compressedLength)
          this.seek(long.ZERO)
          this.readCompletely(inData)
          outputStream = zlib.unzipSync(inData)
        }
        this.allData = outputStream
        this.currentLocation = long.ZERO
        this.currentBlock = 0
        this._length = this.allData
          ? long.fromNumber(this.allData.length)
          : long.ZERO
      }
      this.seek(long.ZERO)
    } catch (err) {
      console.error(
        'PSTNodeInputStream::detectZlib Unable to decompress reportedly compressed block\n' +
        err
      )
      throw err
    }
  }

  /**
   * Load data from offset in file.
   * @private
   * @param {OffsetIndexItem} offsetItem
   * @returns
   * @memberof PSTNodeInputStream
   */
  private loadFromOffsetItem(offsetItem: OffsetIndexItem): void {
    let bInternal = (offsetItem.indexIdentifier.toNumber() & 0x02) != 0

    const data = Buffer.alloc(offsetItem.size)
    this.pstFile.seek(offsetItem.fileOffset)
    this.pstFile.readCompletely(data)

    if (bInternal) {
      // All internal blocks are at least 8 bytes long...
      if (offsetItem.size < 8) {
        throw new Error(
          'PSTNodeInputStream::loadFromOffsetItem Invalid internal block size'
        )
      }

      if (data[0] == 0x1) {
        bInternal = false
        // we are a xblock, or xxblock
        this._length = PSTUtil.convertLittleEndianBytesToLong(data, 4, 8)
        // go through all of the blocks and create skip points.
        this.getBlockSkipPoints(data)
        return
      }
    }

    // (Internal blocks aren't compressed)
    if (bInternal) {
      this._encrypted = false
    }
    this.allData = data
    this._length = long.fromValue(this.allData.length)
  }

  /**
   * Get block skip points in file.
   * @private
   * @param {Buffer} data
   * @memberof PSTNodeInputStream
   */
  private getBlockSkipPoints(data: Buffer): void {
    if (data[0] != 0x1) {
      throw new Error(
        'PSTNodeInputStream::loadFromOffsetItem Unable to process XBlock, incorrect identifier'
      )
    }

    const numberOfEntries = PSTUtil.convertLittleEndianBytesToLong(
      data,
      2,
      4
    ).toNumber()

    let arraySize = 8
    if (this.pstFile.pstFileType == PSTFile.PST_TYPE_ANSI) {
      arraySize = 4
    }
    if (data[1] == 0x2) {
      // XXBlock
      let offset = 8
      for (let x = 0; x < numberOfEntries; x++) {
        let bid = PSTUtil.convertLittleEndianBytesToLong(
          data,
          offset,
          offset + arraySize
        )
        bid = bid.and(0xfffffffe)
        // get the details in this block and
        const offsetItem = this.pstFile.getOffsetIndexNode(bid)
        const blockData = Buffer.alloc(offsetItem.size)
        this.pstFile.seek(offsetItem.fileOffset)
        this.pstFile.readCompletely(blockData)

        // recurse
        this.getBlockSkipPoints(blockData)
        offset += arraySize
      }
    } else if (data[1] == 0x1) {
      // normal XBlock
      let offset = 8
      for (let x = 0; x < numberOfEntries; x++) {
        let bid = PSTUtil.convertLittleEndianBytesToLong(
          data,
          offset,
          offset + arraySize
        )
        bid = bid.and(0xfffffffe)
        // get the details in this block and add it to the list
        const offsetItem = this.pstFile.getOffsetIndexNode(bid)
        this.indexItems.push(offsetItem)
        this.skipPoints.push(long.fromValue(this.currentLocation))
        this.currentLocation = this.currentLocation.add(offsetItem.size)
        offset += arraySize
      }
    }
  }

  /**
   * Read from the stream.
   * @param {Buffer} [output]
   * @returns
   * @memberof PSTNodeInputStream
   */
  public read(output?: Buffer): number {
    if (!output) {
      return this.readSingleByte()
    } else {
      return this.readBlock(output)
    }
  }

  /**
   * Read a single byte from the input stream.
   * @returns {number}
   * @memberof PSTNodeInputStream
   */
  public readSingleByte(): number {
    // first deal with items < 8K and we have all the data already
    if (this.allData != null) {
      if (this.currentLocation == this.length) {
        // EOF
        return -1
      }
      let value = this.allData[this.currentLocation.toNumber()] & 0xff
      this.currentLocation = this.currentLocation.add(1)
      if (this.encrypted) {
        value = PSTUtil.compEnc[value]
      }
      return value
    }
    let item: OffsetIndexItem = this.indexItems[this.currentBlock]
    let skipPoint = this.skipPoints[this.currentBlock]
    if (this.currentLocation.add(1).greaterThan(skipPoint.add(item.size))) {
      // got to move to the next block
      this.currentBlock++

      if (this.currentBlock >= this.indexItems.length) {
        return -1
      }

      item = this.indexItems[this.currentBlock]
      skipPoint = this.skipPoints[this.currentBlock]
    }

    // get the next byte.
    const pos = item.fileOffset.add(this.currentLocation).subtract(skipPoint)
    this.pstFile.seek(pos)
    let output = this.pstFile.read()
    if (output < 0) {
      return -1
    }
    if (this.encrypted) {
      output = PSTUtil.compEnc[output]
    }

    this.currentLocation = this.currentLocation.add(1)

    return output
  }

  private totalLoopCount = 0

  /**
   * Read a block from the input stream, ensuring buffer is completely filled.
   * Recommended block size = 8176 (size used internally by PSTs)
   * @param {Buffer} target
   * @memberof PSTNodeInputStream
   */
  public readCompletely(target: Buffer): void {
    let offset = 0
    let numRead = 0
    while (offset < target.length) {
      numRead = this.readFromOffset(target, offset, target.length - offset)
      if (numRead === -1) {
        throw new Error(
          'PSTNodeInputStream::readCompletely unexpected EOF encountered attempting to read from PSTInputStream'
        )
      }
      offset += numRead
    }
  }

  /**
   * Read a block from the input stream.
   * Recommended block size = 8176 (size used internally by PSTs)
   * @param {Buffer} output
   * @returns {number}
   * @memberof PSTNodeInputStream
   */
  public readBlock(output: Buffer): number {
    // this method is implemented in an attempt to make things a bit faster
    // than the byte-by-byte read() crap above.
    // it's tricky 'cause we have to copy blocks from a few different areas.

    if (this.currentLocation == this.length) {
      // EOF
      return -1
    }

    // first deal with the small stuff
    if (this.allData != null) {
      const bytesRemaining = this.length
        .subtract(this.currentLocation)
        .toNumber()
      if (output.length >= bytesRemaining) {
        PSTUtil.arraycopy(
          this.allData,
          this.currentLocation.toNumber(),
          output,
          0,
          bytesRemaining
        )
        if (this.encrypted) {
          PSTUtil.decode(output)
        }
        this.currentLocation = this.currentLocation.add(bytesRemaining) // should be = to this.length
        return bytesRemaining
      } else {
        PSTUtil.arraycopy(
          this.allData,
          this.currentLocation.toNumber(),
          output,
          0,
          output.length
        )
        if (this.encrypted) {
          PSTUtil.decode(output)
        }
        this.currentLocation = this.currentLocation.add(output.length)
        return output.length
      }
    }

    let filled = false
    let totalBytesFilled = 0
    // while we still need to fill the array
    while (!filled) {
      // fill up the output from where we are
      // get the current block, either to the end, or until the length of
      // the output
      const offset: OffsetIndexItem = this.indexItems[this.currentBlock]
      const skipPoint = this.skipPoints[this.currentBlock]
      const currentPosInBlock = this.currentLocation
        .subtract(skipPoint)
        .toNumber()
      this.pstFile.seek(offset.fileOffset.add(currentPosInBlock))

      const nextSkipPoint = skipPoint.add(offset.size)
      let bytesRemaining = output.length - totalBytesFilled
      // if the total bytes remaining if going to take us past our size
      if (
        bytesRemaining > this.length.subtract(this.currentLocation).toNumber()
      ) {
        // we only have so much to give
        bytesRemaining = this.length.subtract(this.currentLocation).toNumber()
      }

      if (
        nextSkipPoint.greaterThanOrEqual(
          this.currentLocation.add(bytesRemaining)
        )
      ) {
        // we can fill the output with the rest of our current block!
        const chunk = Buffer.alloc(bytesRemaining)
        this.pstFile.readCompletely(chunk)
        PSTUtil.arraycopy(chunk, 0, output, totalBytesFilled, bytesRemaining)
        totalBytesFilled += bytesRemaining
        // we are done!
        filled = true
        this.currentLocation = this.currentLocation.add(bytesRemaining)
      } else {
        // we need to read out a whole chunk and keep going
        const bytesToRead = offset.size - currentPosInBlock
        const chunk = Buffer.alloc(bytesToRead)
        this.pstFile.readCompletely(chunk)
        PSTUtil.arraycopy(chunk, 0, output, totalBytesFilled, bytesToRead)
        totalBytesFilled += bytesToRead
        this.currentBlock++
        this.currentLocation = this.currentLocation.add(bytesToRead)
      }
      this.totalLoopCount++
    }

    // decode the array if required
    if (this.encrypted) {
      PSTUtil.decode(output)
    }

    // fill up our chunk
    // move to the next chunk
    return totalBytesFilled
  }

  /**
   * Read from the offset.
   * @param {Buffer} output
   * @param {number} offset
   * @param {number} length
   * @returns {number}
   * @memberof PSTNodeInputStream
   */
  public readFromOffset(
    output: Buffer,
    offset: number,
    length: number
  ): number {
    if (this.currentLocation == this.length) {
      // EOF
      return -1
    }

    if (output.length < length) {
      length = output.length
    }

    const buf = Buffer.alloc(length)
    const lengthRead = this.readBlock(buf)

    PSTUtil.arraycopy(buf, 0, output, offset, lengthRead)

    return lengthRead
  }

  /**
   * Reset the file pointer (internally).
   * @memberof PSTNodeInputStream
   */
  public reset(): void {
    this.currentBlock = 0
    this._currentLocation = long.ZERO
  }

  /**
   * Get the offsets (block positions) used in the array
   * @returns {long[]}
   * @memberof PSTNodeInputStream
   */
  public getBlockOffsets(): long[] {
    const output: long[] = []
    if (this.skipPoints.length === 0) {
      const len = long.fromValue(this.length)
      output.push(len)
    } else {
      for (let x = 0; x < this.skipPoints.length; x++) {
        const size = long.fromValue(this.indexItems[x].size)
        output.push(this.skipPoints[x].add(size))
      }
    }
    return output
  }

  /**
   * Seek within item.
   * @param {long} location
   * @returns
   * @memberof PSTNodeInputStream
   */
  public seek(location: long): void {
    // not past the end!
    if (location.greaterThan(this.length)) {
      throw new Error(
        'PSTNodeInputStream::seek Attempt to seek past end of item! size = ' +
        this.length +
        ', seeking to:' +
        location
      )
    }

    // are we already there?
    if (this.currentLocation.equals(location)) {
      return
    }

    // get us to the right block
    let skipPoint: long = long.ZERO
    this.currentBlock = 0
    if (this.allData == null) {
      skipPoint = this.skipPoints[this.currentBlock + 1]
      while (location.greaterThanOrEqual(skipPoint)) {
        this.currentBlock++
        // is this the last block?
        if (this.currentBlock == this.skipPoints.length - 1) {
          // that's all folks
          break
        } else {
          skipPoint = this.skipPoints[this.currentBlock + 1]
        }
      }
    }

    // now move us to the right position in there
    this.currentLocation = location

    if (this.allData == null) {
      const blockStart = this.indexItems[this.currentBlock].fileOffset
      const newFilePos: long = blockStart.add(location).subtract(skipPoint)
      this.pstFile.seek(newFilePos)
    }
  }

  /**
   * Seek within stream and read a long.
   * @param {long} location
   * @param {number} bytes
   * @returns {long}
   * @memberof PSTNodeInputStream
   */
  public seekAndReadLong(location: long, bytes: number): long {
    this.seek(location)
    const buffer = Buffer.alloc(bytes)
    this.readCompletely(buffer)
    return PSTUtil.convertLittleEndianBytesToLong(buffer)
  }

  /**
   * JSON the object, large buffers excluded.
   * @returns {*}
   * @memberof PSTNodeInputStream
   */
  public toJSON(): any {
    return {
      currentBlock: this.currentBlock,
      isZlib: this.isZlib,
    }
  }
}
