import { OffsetIndexItem } from './../OffsetIndexItem/OffsetIndexItem.class';
import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from './../PSTObject/PSTObject.class'
import { PSTFileContent } from '../PSTFileContent/PSTFileContent.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import * as long from 'long';

export class PSTNodeInputStream extends PSTObject {

    private pstFileContent: PSTFileContent; // TODO:  remove this and use pstFile.pstFileContent?
    private skipPoints: number[] = [];
    private indexItems: OffsetIndexItem[] = [];
    private currentBlock = 0;
    private allData: Buffer = null;
    private isZlib = false;

    private _currentLocation = 0;
    private get currentLocation() { return this._currentLocation }
    private set currentLocation(loc: number) {
        // console.log('currentLocation = ' + this._currentLocation);
        // debugger;
        this._currentLocation = loc;
    } 

    private _pstFile: PSTFile;
    public get pstFile() { return this._pstFile; }
    
    private _length = 0;
    public get length() { return this._length; }

    private _encrypted = false;
    public get encrypted() { return this._encrypted; }

    // PSTNodeInputStream(final PSTFile pstFile, final byte[] attachmentData) throws PSTException {
    //     this.allData = attachmentData;
    //     this.length = this.allData.length;
    //     this.encrypted = pstFile.getEncryptionType() == PSTFile.ENCRYPTION_TYPE_COMPRESSIBLE;
    //     this.currentBlock = 0;
    //     this.currentLocation = 0;
    //     this.detectZlib();
    // }

    // PSTNodeInputStream(final PSTFile pstFile, final byte[] attachmentData, final boolean encrypted)
    //     throws PSTException {
    //     this.allData = attachmentData;
    //     this.encrypted = encrypted;
    //     this.length = this.allData.length;
    //     this.currentBlock = 0;
    //     this.currentLocation = 0;
    //     this.detectZlib();
    // }

    constructor(pstFile: PSTFile, descriptorItem: PSTDescriptorItem)
    constructor(pstFile: PSTFile, offsetItem: OffsetIndexItem)
    constructor(pstFile: PSTFile, arg: any) {
        super();
        if (arg instanceof OffsetIndexItem) {
            this._pstFile = pstFile;
            this.pstFileContent = pstFile.pstFileContent;
            this._encrypted = pstFile.encryptionType == PSTFile.ENCRYPTION_TYPE_COMPRESSIBLE;
            this.loadFromOffsetItem(arg);
            this.currentBlock = 0;
            this.currentLocation = 0;
            this.detectZlib();
        } else if (arg instanceof PSTDescriptorItem) {
            this._pstFile = pstFile;
            this.pstFileContent = pstFile.pstFileContent;
            this._encrypted = pstFile.encryptionType == PSTFile.ENCRYPTION_TYPE_COMPRESSIBLE;
            // we want to get the first block of data and see what we are dealing with
            this.loadFromOffsetItem(pstFile.getOffsetIndexNode(arg.offsetIndexIdentifier));
            this.currentBlock = 0;
            this.currentLocation = 0;
            this.detectZlib();
        }
    }

    private detectZlib() {
        // not really sure how this is meant to work, kind of going by feel here.
        if (this.length < 4) {
            return;
        }
        try {
            if (this.read() === 0x78 && this.read() === 0x9c) {
                let multiStreams = false;
                if (this.indexItems.length > 1) {
                    let i: OffsetIndexItem = this.indexItems[1];
                    this.pstFileContent.seek(i.fileOffset);
                    multiStreams = (this.pstFileContent.read() == 0x78 && this.pstFileContent.read() == 0x9c);
                }
                debugger;
                throw new Error('not yet implemented');
                // we are a compressed block, decompress the whole thing into a
                // buffer
                // and replace our contents with that.
                // firstly, if we have blocks, use that as the length
                // final ByteArrayOutputStream outputStream = new ByteArrayOutputStream((int) this.length);
                // if (multiStreams) {
                //     int y = 0;
                //     for (final OffsetIndexItem i : this.indexItems) {
                //         final byte[] inData = new byte[i.size];
                //         this.in.seek(i.fileOffset);
                //         this.in.readCompletely(inData);
                //         final InflaterOutputStream inflaterStream = new InflaterOutputStream(outputStream);
                //         //try {
                //             inflaterStream.write(inData);
                //             inflaterStream.close();
                //         //} catch (Exception err) {
                //         //    System.out.println("Y: " + y);
                //         //    System.out.println(err);
                //         //    PSTObject.printHexFormatted(inData, true);
                //         //    System.exit(0);
                //         //}
                //         y++;
                //     }
                //     this.indexItems.clear();
                //     this.skipPoints.clear();
                // } else {
                //     int compressedLength = (int) this.length;
                //     if (this.indexItems.size() > 0) {
                //         compressedLength = 0;
                //         for (final OffsetIndexItem i : this.indexItems) {
                //             //System.out.println(i);
                //             compressedLength += i.size;
                //         }
                //     }
                //     final byte[] inData = new byte[compressedLength];
                //     this.seek(0);
                //     this.readCompletely(inData);

                //     final InflaterOutputStream inflaterStream = new InflaterOutputStream(outputStream);
                //     inflaterStream.write(inData);
                //     inflaterStream.close();
                // }
                // outputStream.close();
                // final byte[] output = outputStream.toByteArray();
                // this.allData = output;
                // this.currentLocation = 0;
                // this.currentBlock = 0;
                // this.length = this.allData.length;
            }
            this.seek(0);
        } catch (err) {
            throw new Error("Unable to decompress reportedly compressed block");
        }
    }

    private loadFromOffsetItem(offsetItem: OffsetIndexItem) {
        let bInternal = (offsetItem.indexIdentifier & 0x02) != 0;

        let data = new Buffer(offsetItem.size);
        this.pstFile.seekAndRead(data, offsetItem.fileOffset);
        
        if (bInternal) {
            // All internal blocks are at least 8 bytes long...
            if (offsetItem.size < 8) {
                throw new Error("Invalid internal block size");
            }

            if (data[0] == 0x1) {
                bInternal = false;
                // we are a xblock, or xxblock
                this._length = PSTObject.convertLittleEndianBytesToLong(data, 4, 8).toNumber();
                // go through all of the blocks and create skip points.
                this.getBlockSkipPoints(data);
                return;
            }
        }

        // (Internal blocks aren't compressed)
        if (bInternal) {
            this._encrypted = false;
        }
        this.allData = data;
        this._length = this.allData.length;
    }

    private getBlockSkipPoints(data: Buffer) {
        if (data[0] != 0x1) {
            throw new Error("Unable to process XBlock, incorrect identifier");
        }

        let numberOfEntries = PSTObject.convertLittleEndianBytesToLong(data, 2, 4).toNumber();

        let arraySize = 8;
        if (this.pstFile.pstFileType == PSTFile.PST_TYPE_ANSI) {
            arraySize = 4;
        }
        if (data[1] == 0x2) {
            // XXBlock
            let offset = 8;
            for (let x = 0; x < numberOfEntries; x++) {
                let bid = PSTObject.convertLittleEndianBytesToLong(data, offset, offset + arraySize).toNumber();
                bid &= 0xfffffffe;
                // get the details in this block and
                let offsetItem = this.pstFile.getOffsetIndexNode(bid);
                let blockData = new Buffer(offsetItem.size);
                this.pstFile.seekAndRead(blockData, offsetItem.fileOffset);

                // recurse
                this.getBlockSkipPoints(blockData);
                offset += arraySize;
            }
        } else if (data[1] == 0x1) {
            // normal XBlock
            let offset = 8;
            for (let x = 0; x < numberOfEntries; x++) {
                let bid = PSTObject.convertLittleEndianBytesToLong(data, offset, offset + arraySize).toNumber();
                bid &= 0xfffffffe;
                // get the details in this block and add it to the list
                let offsetItem = this.pstFile.getOffsetIndexNode(bid);
                this.indexItems.push(offsetItem);
                this.skipPoints.push(this.currentLocation);
                this.currentLocation += offsetItem.size;
                offset += arraySize;
            }
        }
    }

    // read a byte
    public read(): number {

        // first deal with items < 8K and we have all the data already
        if (this.allData != null) {
            if (this.currentLocation == this.length) {
                // EOF
                return -1;
            }
            let value = this.allData[this.currentLocation] & 0xFF;
            this.currentLocation++;
            if (this.encrypted) {
                value = this.compEnc[value];
            }
            return value;
        }
        let item: OffsetIndexItem = this.indexItems[this.currentBlock];
        let skipPoint = this.skipPoints[this.currentBlock];
        if (this.currentLocation + 1 > skipPoint + item.size) {
            // got to move to the next block
            this.currentBlock++;

            if (this.currentBlock >= this.indexItems.length) {
                return -1;
            }

            item = this.indexItems[this.currentBlock];
            skipPoint = this.skipPoints[this.currentBlock];
        }

        // get the next byte.
        let pos = item.fileOffset + this.currentLocation - skipPoint;
        let output = this.pstFileContent.read(pos);
        if (output < 0) {
            return -1;
        }
        if (this.encrypted) {
            output = this.compEnc[output];
        }

        this.currentLocation++;

        return output;
    }

    private totalLoopCount = 0;

    // Read a block from the input stream, ensuring buffer is completely filled.
    // Recommended block size = 8176 (size used internally by PSTs)
    public readCompletely(target: Buffer) {
        let offset = 0;
        let numRead = 0;
        while (offset < target.length) {
            numRead = this.readB(target, offset, target.length - offset);
            if (numRead === -1) {
                throw new Error("unexpected EOF encountered attempting to read from PSTInputStream");
            }
            offset += numRead;
        }
    }

    // Read a block from the input stream.
    // Recommended block size = 8176 (size used internally by PSTs)
    public readA(output: Buffer): number {
        // this method is implemented in an attempt to make things a bit faster
        // than the byte-by-byte read() crap above.
        // it's tricky 'cause we have to copy blocks from a few different areas.

        if (this.currentLocation == this.length) {
            // EOF
            return -1;
        }

        // first deal with the small stuff
        if (this.allData != null) {
            let bytesRemaining = this.length - this.currentLocation;
            if (output.length >= bytesRemaining) {
                this.arraycopy(this.allData, this.currentLocation, output, 0, bytesRemaining);
                if (this.encrypted) {
                    this.decode(output);
                }
                this.currentLocation += bytesRemaining; // should be = to this.length
                return bytesRemaining;
            } else {
                this.arraycopy(this.allData, this.currentLocation, output, 0, output.length);
                if (this.encrypted) {
                    this.decode(output);
                }
                this.currentLocation += output.length;
                return output.length;
            }
        }

        let filled = false;
        let totalBytesFilled = 0;
        // while we still need to fill the array
        while (!filled) {

            // fill up the output from where we are
            // get the current block, either to the end, or until the length of
            // the output
            let offset: OffsetIndexItem = this.indexItems[this.currentBlock];
            let skipPoint = this.skipPoints[this.currentBlock];
            let currentPosInBlock = this.currentLocation - skipPoint;
            this.pstFileContent.seek(offset.fileOffset + currentPosInBlock);

            let nextSkipPoint = skipPoint + offset.size;
            let bytesRemaining = output.length - totalBytesFilled;
            // if the total bytes remaining if going to take us past our size
            if (bytesRemaining > (this.length - this.currentLocation)) {
                // we only have so much to give
                bytesRemaining = this.length - this.currentLocation;
            }

            if (nextSkipPoint >= this.currentLocation + bytesRemaining) {
                // we can fill the output with the rest of our current block!
                let chunk = new Buffer(bytesRemaining);
                this.pstFileContent.readCompletely(chunk);

                this.arraycopy(chunk, 0, output, totalBytesFilled, bytesRemaining);
                totalBytesFilled += bytesRemaining;
                // we are done!
                filled = true;
                this.currentLocation += bytesRemaining;
            } else {
                // we need to read out a whole chunk and keep going
                let bytesToRead = offset.size - currentPosInBlock;
                let chunk = new Buffer(bytesToRead);
                this.pstFileContent.readCompletely(chunk);
                this.arraycopy(chunk, 0, output, totalBytesFilled, bytesToRead);
                totalBytesFilled += bytesToRead;
                this.currentBlock++;
                this.currentLocation += bytesToRead;
            }
            this.totalLoopCount++;
        }

        // decode the array if required
        if (this.encrypted) {
            this.decode(output);
        }

        // fill up our chunk
        // move to the next chunk
        return totalBytesFilled;
    }

    public readB(output: Buffer, offset: number, length: number): number {
        if (this.currentLocation == this.length) {
            // EOF
            return -1;
        }

        if (output.length < length) {
            length = output.length;
        }

        let buf = new Buffer(length);
        let lengthRead = this.readA(buf);

        this.arraycopy(buf, 0, output, offset, lengthRead);
        //System.arraycopy(buf, 0, output, offset, lengthRead);

        return lengthRead;
    }

    // @Override
    // public void reset() {
    //     this.currentBlock = 0;
    //     this.currentLocation = 0;
    // }

    // @Override
    // public boolean markSupported() {
    //     return false;
    // }

     // Get the offsets (block positions) used in the array
    public getBlockOffsets(): number[] {
        if (this.skipPoints.length === 0) {
            let output: number[] = [this.length];
            return output;
        } else {
            let output: number[] = [];
            for (let x = 0; x < this.skipPoints.length; x++) {
                output.push(this.skipPoints[x] + this.indexItems[x].size);
            }
            return output;
        }
    }

    // seek within item
    public seek(location: number) {
        // not past the end!
        if (location > this.length) {
            throw new Error("Attempt to seek past end of item! size = " + this.length + ", seeking to:" + location);
        }

        // are we already there?
        if (this.currentLocation === location) {
            return;
        }

        // get us to the right block
        let skipPoint = 0;
        this.currentBlock = 0;
        if (this.allData == null) {
            skipPoint = this.skipPoints[this.currentBlock + 1];
            while (location >= skipPoint) {
                this.currentBlock++;
                // is this the last block?
                if (this.currentBlock == this.skipPoints.length - 1) {
                    // that's all folks
                    break;
                } else {
                    skipPoint = this.skipPoints[this.currentBlock + 1];
                }
            }
        }

        // now move us to the right position in there
        this.currentLocation = location;

        if (this.allData == null) {
            let blockStart = this.indexItems[this.currentBlock].fileOffset;
            let newFilePos = blockStart + (location - skipPoint);
            this.pstFileContent.seek(newFilePos);
        }

    }

    public seekAndReadLong(location: number, bytes: number): long {
        this.seek(location);
        let buffer = new Buffer(bytes);
        this.readCompletely(buffer);
        return PSTObject.convertLittleEndianBytesToLong(buffer);
    }

}
