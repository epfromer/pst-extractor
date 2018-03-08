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
import { PSTUtil } from './../PSTUtil/PSTUtil.class';
import { Log } from '../Log.class';

// An implementation of the LZFu algorithm to decompress RTF content
export class LZFu {
    public static LZFU_HEADER = '{\\rtf1\\ansi\\mac\\deff0\\deftab720{\\fonttbl;}{\\f0\\fnil \\froman \\fswiss \\fmodern \\fscript \\fdecor MS Sans SerifSymbolArialTimes New RomanCourier{\\colortbl\\red0\\green0\\blue0\n\r\\par \\pard\\plain\\f0\\fs20\\b\\i\\u\\tab\\tx';

    public static decode(data: Buffer): string {
        let compressedSize: number = PSTUtil.convertLittleEndianBytesToLong(data, 0, 4).toNumber();
        let uncompressedSize: number = PSTUtil.convertLittleEndianBytesToLong(data, 4, 8).toNumber();
        let compressionSig: number = PSTUtil.convertLittleEndianBytesToLong(data, 8, 12).toNumber();
        let compressedCRC: number = PSTUtil.convertLittleEndianBytesToLong(data, 12, 16).toNumber();

        if (compressionSig == 0x75465a4c) {
            // we are compressed...
            let output: Buffer = new Buffer(uncompressedSize);
            let outputPosition = 0;
            let lzBuffer: Buffer = new Buffer(4096);
            // preload our buffer.
            try {
                let bytes: Buffer = Buffer.from(LZFu.LZFU_HEADER); //getBytes("US-ASCII");
                PSTUtil.arraycopy(bytes, 0, lzBuffer, 0, LZFu.LZFU_HEADER.length);
            } catch (err) {
                Log.error('LZFu::decode cant preload buffer\n' + err)
                throw err;
            }
            let bufferPosition = LZFu.LZFU_HEADER.length;
            let currentDataPosition = 16;

            // next byte is the flags,
            while (currentDataPosition < data.length - 2 && outputPosition < output.length) {
                let flags = data[currentDataPosition++] & 0xff;
                for (let x = 0; x < 8 && outputPosition < output.length; x++) {
                    let isRef: boolean = (flags & 1) == 1;
                    flags >>= 1;
                    if (isRef) {
                        // get the starting point for the buffer and the length to read
                        let refOffsetOrig = data[currentDataPosition++] & 0xff;
                        let refSizeOrig = data[currentDataPosition++] & 0xff;
                        let refOffset = (refOffsetOrig << 4) | (refSizeOrig >>> 4);
                        let refSize = (refSizeOrig & 0xf) + 2;
                        try {
                            // copy the data from the buffer
                            let index = refOffset;
                            for (let y = 0; y < refSize && outputPosition < output.length; y++) {
                                output[outputPosition++] = lzBuffer[index];
                                lzBuffer[bufferPosition] = lzBuffer[index];
                                bufferPosition++;
                                bufferPosition %= 4096;
                                ++index;
                                index %= 4096;
                            }
                        } catch (err) {
                            Log.error('LZFu::decode copy the data from the buffer\n' + err)
                            throw err;
                        }
                    } else {
                        // copy the byte over
                        lzBuffer[bufferPosition] = data[currentDataPosition];
                        bufferPosition++;
                        bufferPosition %= 4096;
                        output[outputPosition++] = data[currentDataPosition++];
                    }
                }
            }

            if (outputPosition != uncompressedSize) {
                throw new Error('LZFu::constructor decode Error decompressing RTF');
            }
            return new String(output).trim();
        } else if (compressionSig == 0x414c454d) {
            // we are not compressed!
            // just return the rest of the contents as a string
            let output: Buffer = new Buffer(data.length - 16);
            PSTUtil.arraycopy(data, 16, output, 0, data.length - 16);
            return new String(output).trim();
        }

        return '';
    }
}
