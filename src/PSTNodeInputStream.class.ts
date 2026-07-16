import Long from 'long'
import { PSTDescriptorItem } from './PSTDescriptorItem.class.js'
import { PSTUtil } from './PSTUtil.class.js'
import { OffsetIndexItem } from './OffsetIndexItem.class.js'
import { PSTFile } from './PSTFile.class.js'
import { PSTError } from './PSTError.js'

function hasZlibHeader(first: number, second: number): boolean {
  return (
    (first & 0x0f) === 8 &&
    first >> 4 <= 7 &&
    (second & 0x20) === 0 &&
    ((first << 8) | second) % 31 === 0
  )
}

export class PSTNodeInputStream {
  private skipPoints: Long[] = []
  private indexItems: OffsetIndexItem[] = []
  private currentBlock = 0
  private allData: Buffer | null = null
  private isZlib = false
  private readonly scalarScratch = Buffer.allocUnsafe(8)

  private _currentLocation: Long = Long.ZERO
  private get currentLocation(): Long {
    return this._currentLocation
  }
  private set currentLocation(loc: Long) {
    this._currentLocation = loc
  }

  private _pstFile: PSTFile
  public get pstFile(): PSTFile {
    return this._pstFile
  }

  private _length: Long = Long.ZERO
  public get length(): Long {
    return this._length
  }

  /** Current logical stream position, used to resume retryable async reads. */
  public tell(): Long {
    return Long.fromValue(this.currentLocation)
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
        pstFile.getOffsetIndexNode(arg.offsetIndexIdentifierLong)
      )
    } else if (arg instanceof Buffer) {
      this.allData = arg
      this._length = Long.fromNumber(this.allData.length)
      if (encrypted != undefined) {
        this._encrypted = encrypted
      } else {
        this._encrypted =
          pstFile.encryptionType == PSTFile.ENCRYPTION_TYPE_COMPRESSIBLE
      }
    }
    this.currentBlock = 0
    this.currentLocation = Long.ZERO
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
      const firstLeafIsCompressed = hasZlibHeader(this.read(), this.read())
      const physicalTreeLength = this.indexItems.reduce(
        (length, item) => length + item.size,
        0
      )
      const dataTreeHasCompression =
        this.indexItems.length > 1 &&
        this.length.greaterThan(physicalTreeLength)
      if (firstLeafIsCompressed || dataTreeHasCompression) {
        // Compression belongs to individual data-tree leaves. Large nodes can
        // legitimately mix compressed and raw leaves.
        const multiStreams = this.indexItems.length > 1
        // we are a compressed block, decompress the whole thing into a buffer
        // and replace our contents with that. firstly, if we have blocks, use that as the length
        let outputStream: Buffer | null = null
        if (multiStreams) {
          let decompressedLeaf = false
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
            if (this.encrypted) PSTUtil.decode(inData)
            let buf = inData
            if (hasZlibHeader(inData[0], inData[1])) {
              try {
                buf = this.pstFile.decompress(inData)
                decompressedLeaf = true
              } catch (error) {
                if (
                  typeof error !== 'object' ||
                  error === null ||
                  !('code' in error) ||
                  (error.code !== 'Z_DATA_ERROR' &&
                    error.code !== 'Z_BUF_ERROR')
                ) {
                  throw error
                }
              }
            }
            outputStream = outputStream
              ? Buffer.concat([outputStream, buf])
              : buf
          }
          if (dataTreeHasCompression && !decompressedLeaf) {
            throw new PSTError(
              'CORRUPT_DATA',
              'PST data tree length exceeds its raw leaves without compressed data'
            )
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
          this.seek(Long.ZERO)
          this.readCompletely(inData)
          outputStream = this.pstFile.decompress(inData)
        }
        this.allData = outputStream
        this.currentLocation = Long.ZERO
        this.currentBlock = 0
        this._length = this.allData
          ? Long.fromNumber(this.allData.length)
          : Long.ZERO
      }
      this.seek(Long.ZERO)
    } catch (err) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err.code === 'Z_DATA_ERROR' || err.code === 'Z_BUF_ERROR')
      ) {
        // Raw payloads can coincidentally have a valid zlib header. Since PST
        // compression is identified heuristically, a rejected stream remains
        // raw; downstream table validation still exposes structural damage.
        this.reset()
        return
      }
      throw new PSTError('CORRUPT_DATA', 'Unable to decompress PST block', {
        cause: err
      })
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
    this._length = Long.fromValue(this.allData.length)
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
        bid = bid.and(Long.NEG_ONE.subtract(1))
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
        bid = bid.and(Long.NEG_ONE.subtract(1))
        // get the details in this block and add it to the list
        const offsetItem = this.pstFile.getOffsetIndexNode(bid)
        this.indexItems.push(offsetItem)
        this.skipPoints.push(Long.fromValue(this.currentLocation))
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
      if (!offset || !skipPoint) {
        throw new PSTError(
          'CORRUPT_DATA',
          'PST data tree ended before its declared logical length'
        )
      }
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
    this._currentLocation = Long.ZERO
  }

  /**
   * Get the offsets (block positions) used in the array
   * @returns {long[]}
   * @memberof PSTNodeInputStream
   */
  public getBlockOffsets(): Long[] {
    const output: Long[] = []
    if (this.skipPoints.length === 0) {
      const len = Long.fromValue(this.length)
      output.push(len)
    } else {
      for (let x = 0; x < this.skipPoints.length; x++) {
        const size = Long.fromValue(this.indexItems[x].size)
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
  public seek(location: Long): void {
    // not past the end!
    if (location.isNegative() || location.greaterThan(this.length)) {
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
    let skipPoint: Long = Long.ZERO
    this.currentBlock = 0
    if (this.allData == null) {
      let nextSkipPoint = this.skipPoints[this.currentBlock + 1]
      while (
        nextSkipPoint !== undefined &&
        location.greaterThanOrEqual(nextSkipPoint)
      ) {
        this.currentBlock++
        nextSkipPoint = this.skipPoints[this.currentBlock + 1]
      }
      skipPoint = this.skipPoints[this.currentBlock]
    }

    // now move us to the right position in there
    this.currentLocation = location

    if (this.allData == null) {
      const blockStart = this.indexItems[this.currentBlock].fileOffset
      const newFilePos: Long = blockStart.add(location).subtract(skipPoint)
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
  public seekAndReadLong(location: Long, bytes: number): Long {
    if (bytes < 1 || bytes > this.scalarScratch.length) {
      throw new RangeError('Scalar reads must contain between 1 and 8 bytes')
    }
    this.seek(location)
    const target = this.scalarScratch.subarray(0, bytes)
    if (this.allData !== null) {
      const position = this.currentLocation.toNumber()
      this.allData.copy(target, 0, position, position + bytes)
      if (this.encrypted) PSTUtil.decode(target)
      this.currentLocation = this.currentLocation.add(bytes)
    } else {
      this.readCompletely(target)
    }
    return PSTUtil.convertLittleEndianBytesToLong(this.scalarScratch, 0, bytes)
  }

  /**
   * JSON the object, large buffers excluded.
   * @returns {*}
   * @memberof PSTNodeInputStream
   */
  public toJSON(): any {
    return {
      currentBlock: this.currentBlock,
      isZlib: this.isZlib
    }
  }
}
