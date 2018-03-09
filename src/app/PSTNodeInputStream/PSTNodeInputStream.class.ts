/**
 * Copyright 2010-2018 Richard Johnson, Orin Eman & Ed Pfromer
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * ---
 *
 * This file is part of pst-extractor.
 *
 * pst-extractor is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * pst-extractor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with pst-extractor. If not, see <http://www.gnu.org/licenses/>.
 */
import { OffsetIndexItem } from './../OffsetIndexItem/OffsetIndexItem.class';
import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from './../PSTObject/PSTObject.class';
import { PSTFileContent } from '../PSTFileContent/PSTFileContent.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import * as long from 'long';
import * as zlib from 'zlib';
import { Log } from '../Log.class';

export class PSTNodeInputStream {
    private pstFileContent: PSTFileContent; // TODO:  remove this and use pstFile.pstFileContent?
    private skipPoints: long[] = [];
    private indexItems: OffsetIndexItem[] = [];
    private currentBlock = 0;
    private allData: Buffer = null;
    private isZlib = false;

    private _currentLocation: long = long.ZERO;
    private get currentLocation(): long {
        return this._currentLocation;
    }
    private set currentLocation(loc: long) {
        this._currentLocation = loc;
    }

    private _pstFile: PSTFile;
    public get pstFile() {
        return this._pstFile;
    }

    private _length: long = long.ZERO;
    public get length() {
        return this._length;
    }

    private _encrypted = false;
    public get encrypted() {
        return this._encrypted;
    }

    constructor(pstFile: PSTFile, attachmentData: Buffer, encrypted?:boolean);
    constructor(pstFile: PSTFile, descriptorItem: PSTDescriptorItem, encrypted?:boolean);
    constructor(pstFile: PSTFile, offsetItem: OffsetIndexItem, encrypted?:boolean);
    constructor(pstFile: PSTFile, arg: any, encrypted?:boolean) {
        if (arg instanceof OffsetIndexItem) {
            this._pstFile = pstFile;
            this.pstFileContent = pstFile.pstFileContent;
            this._encrypted = pstFile.encryptionType == PSTFile.ENCRYPTION_TYPE_COMPRESSIBLE;
            this.loadFromOffsetItem(arg);
            this.currentBlock = 0;
            this.currentLocation = long.ZERO;
            this.detectZlib();
        } else if (arg instanceof PSTDescriptorItem) {
            this._pstFile = pstFile;
            this.pstFileContent = pstFile.pstFileContent;
            this._encrypted = pstFile.encryptionType == PSTFile.ENCRYPTION_TYPE_COMPRESSIBLE;
            // we want to get the first block of data and see what we are dealing with
            this.loadFromOffsetItem(pstFile.getOffsetIndexNode(long.fromNumber(arg.offsetIndexIdentifier)));
            this.currentBlock = 0;
            this.currentLocation = long.ZERO;
            this.detectZlib();
        } else if (arg instanceof Buffer) {
            this.allData = arg;
            this._length = long.fromNumber(this.allData.length);
            if (encrypted != undefined) {
                this._encrypted = encrypted;
            } else {
                this._encrypted = pstFile.encryptionType == PSTFile.ENCRYPTION_TYPE_COMPRESSIBLE;
            }
            this.currentBlock = 0;
            this.currentLocation = long.ZERO;
            this.detectZlib();
        }
    }

    private detectZlib() {
        // not really sure how this is meant to work, kind of going by feel here.
        if (this.length.lt(4)) {
            return;
        }
        try {
            if (this.read() === 0x78 && this.read() === 0x9c) {
                let multiStreams = false;
                if (this.indexItems.length > 1) {
                    let i: OffsetIndexItem = this.indexItems[1];
                    this.pstFileContent.seek(i.fileOffset);
                    multiStreams = this.pstFileContent.read() === 0x78 && this.pstFileContent.read() === 0x9c;
                }
                // we are a compressed block, decompress the whole thing into a buffer
                // and replace our contents with that. firstly, if we have blocks, use that as the length
                let outputStream: Buffer;
                if (multiStreams) {

                    debugger;

                    // Log.debug1('list of all index items')
                    // for (let i of this.indexItems) {
                    //     Log.debug1(i.toJSONstring());
                    // }
                    // Log.debug1('----------------------')
                    // TODO - try this with different types of attachments, includin PDF
                    //  may be issue with zlib and PDF files. also, mutiple attachments.
                    for (let i of this.indexItems) {
                        Log.debug1(i.toJSONstring());
                        let inData: Buffer = new Buffer(i.size);
                        this.pstFileContent.seek(i.fileOffset);
                        this.pstFileContent.readCompletely(inData);
                        outputStream = zlib.unzipSync(inData);
                    }
                    this.indexItems = [];
                    this.skipPoints = [];
                } else {
                    let compressedLength: number = this.length.toNumber();
                    if (this.indexItems.length > 0) {
                        compressedLength = 0;
                        for (let i of this.indexItems) {
                            compressedLength += i.size;
                        }
                    }
                    let inData: Buffer = new Buffer(compressedLength);
                    this.seek(long.ZERO);
                    this.readCompletely(inData);
                    outputStream = zlib.unzipSync(inData);
                }
                let output: Buffer = outputStream;
                this.allData = output;
                this.currentLocation = long.ZERO;
                this.currentBlock = 0;
                this._length = long.fromNumber(this.allData.length);
            }
            this.seek(long.ZERO);
        } catch (err) {
            Log.error('PSTNodeInputStream::detectZlib Unable to decompress reportedly compressed block\n' + err);
            throw err;
        }
    }

    private loadFromOffsetItem(offsetItem: OffsetIndexItem) {
        let bInternal = (offsetItem.indexIdentifier.toNumber() & 0x02) != 0;

        let data = new Buffer(offsetItem.size);
        this.pstFileContent.seek(offsetItem.fileOffset);
        this.pstFileContent.readCompletely(data);

        if (bInternal) {
            // All internal blocks are at least 8 bytes long...
            if (offsetItem.size < 8) {
                throw new Error('PSTNodeInputStream::loadFromOffsetItem Invalid internal block size');
            }

            if (data[0] == 0x1) {
                bInternal = false;
                // we are a xblock, or xxblock
                this._length = PSTUtil.convertLittleEndianBytesToLong(data, 4, 8);
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
        this._length = long.fromValue(this.allData.length);
    }

    private getBlockSkipPoints(data: Buffer) {

        if (data[0] != 0x1) {
            throw new Error('PSTNodeInputStream::loadFromOffsetItem Unable to process XBlock, incorrect identifier');
        }

        let numberOfEntries = PSTUtil.convertLittleEndianBytesToLong(data, 2, 4).toNumber();

        let arraySize = 8;
        if (this.pstFile.pstFileType == PSTFile.PST_TYPE_ANSI) {
            arraySize = 4;
        }
        if (data[1] == 0x2) {
            // XXBlock
            let offset = 8;
            for (let x = 0; x < numberOfEntries; x++) {
                let bid = PSTUtil.convertLittleEndianBytesToLong(data, offset, offset + arraySize);
                bid = bid.and(0xfffffffe);
                // get the details in this block and
                let offsetItem = this.pstFile.getOffsetIndexNode(bid);
                let blockData = new Buffer(offsetItem.size);
                this.pstFileContent.seek(offsetItem.fileOffset);
                this.pstFileContent.readCompletely(blockData);

                // recurse
                this.getBlockSkipPoints(blockData);
                offset += arraySize;
            }
        } else if (data[1] == 0x1) {
            // normal XBlock
            let offset = 8;
            for (let x = 0; x < numberOfEntries; x++) {
                let bid = PSTUtil.convertLittleEndianBytesToLong(data, offset, offset + arraySize);
                bid = bid.and(0xfffffffe);
                // get the details in this block and add it to the list
                let offsetItem = this.pstFile.getOffsetIndexNode(bid);
                this.indexItems.push(offsetItem);
                this.skipPoints.push(long.fromValue(this.currentLocation));
                this.currentLocation = this.currentLocation.add(offsetItem.size);
                offset += arraySize;
            }
        }
    }

    public read(output?: Buffer) {
        if (!output) {
            return this.readSingleByte();
        } else {
            return this.readBlock(output);
        }
    }

    // read a byte
    public readSingleByte(): number {
        // first deal with items < 8K and we have all the data already
        if (this.allData != null) {
            if (this.currentLocation == this.length) {
                // EOF
                return -1;
            }
            let value = this.allData[this.currentLocation.toNumber()] & 0xff;
            this.currentLocation = this.currentLocation.add(1);
            if (this.encrypted) {
                value = PSTUtil.compEnc[value];
            }
            return value;
        }
        let item: OffsetIndexItem = this.indexItems[this.currentBlock];
        let skipPoint = this.skipPoints[this.currentBlock];
        if (this.currentLocation.add(1).greaterThan(skipPoint.add(item.size))) {
            // got to move to the next block
            this.currentBlock++;

            if (this.currentBlock >= this.indexItems.length) {
                return -1;
            }

            item = this.indexItems[this.currentBlock];
            skipPoint = this.skipPoints[this.currentBlock];
        }

        // get the next byte.
        let pos = item.fileOffset.add(this.currentLocation).subtract(skipPoint);
        this.pstFileContent.seek(pos);
        let output = this.pstFileContent.read();
        if (output < 0) {
            return -1;
        }
        if (this.encrypted) {
            output = PSTUtil.compEnc[output];
        }

        this.currentLocation = this.currentLocation.add(1);

        return output;
    }

    private totalLoopCount = 0;

    // Read a block from the input stream, ensuring buffer is completely filled.
    // Recommended block size = 8176 (size used internally by PSTs)
    public readCompletely(target: Buffer) {
        let offset = 0;
        let numRead = 0;
        while (offset < target.length) {
            numRead = this.readFromOffset(target, offset, target.length - offset);
            if (numRead === -1) {
                throw new Error('PSTNodeInputStream::readCompletely unexpected EOF encountered attempting to read from PSTInputStream');
            }
            offset += numRead;
        }
    }

    // Read a block from the input stream.
    // Recommended block size = 8176 (size used internally by PSTs)
    public readBlock(output: Buffer): number {
        // this method is implemented in an attempt to make things a bit faster
        // than the byte-by-byte read() crap above.
        // it's tricky 'cause we have to copy blocks from a few different areas.

        if (this.currentLocation == this.length) {
            // EOF
            return -1;
        }

        // first deal with the small stuff
        if (this.allData != null) {
            let bytesRemaining = this.length.subtract(this.currentLocation).toNumber();
            if (output.length >= bytesRemaining) {
                PSTUtil.arraycopy(this.allData, this.currentLocation.toNumber(), output, 0, bytesRemaining);
                if (this.encrypted) {
                    PSTUtil.decode(output);
                }
                this.currentLocation = this.currentLocation.add(bytesRemaining); // should be = to this.length
                return bytesRemaining;
            } else {
                PSTUtil.arraycopy(this.allData, this.currentLocation.toNumber(), output, 0, output.length);
                if (this.encrypted) {
                    PSTUtil.decode(output);
                }
                this.currentLocation = this.currentLocation.add(output.length);
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
            let currentPosInBlock = this.currentLocation.subtract(skipPoint).toNumber();
            this.pstFileContent.seek(offset.fileOffset.add(currentPosInBlock));

            let nextSkipPoint = skipPoint.add(offset.size);
            let bytesRemaining = output.length - totalBytesFilled;
            // if the total bytes remaining if going to take us past our size
            if (bytesRemaining > this.length.subtract(this.currentLocation).toNumber()) {
                // we only have so much to give
                bytesRemaining = this.length.subtract(this.currentLocation).toNumber();
            }

            if (nextSkipPoint.greaterThanOrEqual(this.currentLocation.add(bytesRemaining))) {
                // we can fill the output with the rest of our current block!
                let chunk = new Buffer(bytesRemaining);
                this.pstFileContent.readCompletely(chunk);
                PSTUtil.arraycopy(chunk, 0, output, totalBytesFilled, bytesRemaining);
                totalBytesFilled += bytesRemaining;
                // we are done!
                filled = true;
                this.currentLocation = this.currentLocation.add(bytesRemaining);
            } else {
                // we need to read out a whole chunk and keep going
                let bytesToRead = offset.size - currentPosInBlock;
                let chunk = new Buffer(bytesToRead);
                this.pstFileContent.readCompletely(chunk);
                PSTUtil.arraycopy(chunk, 0, output, totalBytesFilled, bytesToRead);
                totalBytesFilled += bytesToRead;
                this.currentBlock++;
                this.currentLocation = this.currentLocation.add(bytesToRead);
            }
            this.totalLoopCount++;
        }

        // decode the array if required
        if (this.encrypted) {
            PSTUtil.decode(output);
        }

        // fill up our chunk
        // move to the next chunk
        return totalBytesFilled;
    }

    public readFromOffset(output: Buffer, offset: number, length: number): number {
        if (this.currentLocation == this.length) {
            // EOF
            return -1;
        }

        if (output.length < length) {
            length = output.length;
        }

        let buf = new Buffer(length);
        let lengthRead = this.readBlock(buf);

        PSTUtil.arraycopy(buf, 0, output, offset, lengthRead);

        return lengthRead;
    }

    public reset() {
        this.currentBlock = 0;
        this._currentLocation = long.ZERO;
    }

    // Get the offsets (block positions) used in the array
    public getBlockOffsets(): long[] {
        let output: long[] = [];
        if (this.skipPoints.length === 0) {
            let len = long.fromValue(this.length);
            output.push(len);
        } else {
            for (let x = 0; x < this.skipPoints.length; x++) {
                let size = long.fromValue(this.indexItems[x].size);
                output.push(this.skipPoints[x].add(size));
            }
        }
        return output;
    }

    // seek within item
    public seek(location: long) {
        // not past the end!
        if (location.greaterThan(this.length)) {
            throw new Error('PSTNodeInputStream::seek Attempt to seek past end of item! size = ' + this.length + ', seeking to:' + location);
        }

        // are we already there?
        if (this.currentLocation.equals(location)) {
            return;
        }

        // get us to the right block
        let skipPoint: long = long.ZERO;
        this.currentBlock = 0;
        if (this.allData == null) {
            skipPoint = this.skipPoints[this.currentBlock + 1];
            while (location.greaterThanOrEqual(skipPoint)) {
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
            let newFilePos: long = blockStart.add(location).subtract(skipPoint);
            this.pstFileContent.seek(newFilePos);
        }
    }

    public seekAndReadLong(location: long, bytes: number): long {
        this.seek(location);
        let buffer = new Buffer(bytes);
        this.readCompletely(buffer);
        return PSTUtil.convertLittleEndianBytesToLong(buffer);
    }

    public toJSONstring(): string {
        return (
            'PSTNodeInputStream:' +
            JSON.stringify(
                {
                    currentBlock: this.currentBlock,
                    isZlib: this.isZlib,
                    _currentLocation: this._currentLocation,
                    _length: this._length,
                    _encrypted: this._encrypted
                },
                null,
                2
            ));
    }
}
