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
import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from '../PSTObject/PSTObject.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import * as long from 'long';

export class PSTDescriptorItem {
    private dataBlockData: Buffer;
    private dataBlockOffsets: number[] = [];
    private _pstFile: PSTFile;

    private _subNodeOffsetIndexIdentifier: number;
    public get subNodeOffsetIndexIdentifier(): number {
        return this._subNodeOffsetIndexIdentifier;
    }

    private _descriptorIdentifier: number;
    public get descriptorIdentifier(): number {
        return this._descriptorIdentifier;
    }

    private _offsetIndexIdentifier: number;
    public get offsetIndexIdentifier(): number {
        return this._offsetIndexIdentifier;
    }

    constructor(data: Buffer, offset: number, pstFile: PSTFile) {
        this._pstFile = pstFile;

        if (pstFile.pstFileType == PSTFile.PST_TYPE_ANSI) {
            this._descriptorIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset, offset + 4).toNumber();
            this._offsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset + 4, offset + 8).toNumber() & 0xfffffffe;
            this._subNodeOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset + 8, offset + 12).toNumber() & 0xfffffffe;
        } else {
            this._descriptorIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset, offset + 4).toNumber();
            this._offsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset + 8, offset + 16).toNumber() & 0xfffffffe;
            this._subNodeOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset + 16, offset + 24).toNumber() & 0xfffffffe;
        }
    }

    public getData(): Buffer {
        if (this.dataBlockData != null) {
            return this.dataBlockData;
        }

        let pstNodeInputStream: PSTNodeInputStream = this._pstFile.readLeaf(long.fromValue(this.offsetIndexIdentifier));
        let out = new Buffer(pstNodeInputStream.length.toNumber());
        pstNodeInputStream.readCompletely(out);
        this.dataBlockData = out;
        return this.dataBlockData;
    }

    public getBlockOffsets(): number[] {
        if (this.dataBlockOffsets != null) {
            return this.dataBlockOffsets;
        }
        let offsets: long[] = this._pstFile.readLeaf(long.fromNumber(this.offsetIndexIdentifier)).getBlockOffsets();
        let offsetsOut: number[] = [];
        for (let x = 0; x < offsets.length; x++) {
            offsetsOut[x] = offsets[x].toNumber();
        }
        return offsetsOut;
    }

    public get dataSize(): number {
        return this._pstFile.getLeafSize(long.fromNumber(this.offsetIndexIdentifier));
    }

    public toJSONstring(): string {
        return (
            'PSTDescriptorItem: ' +
            JSON.stringify(
                {
                    _subNodeOffsetIndexIdentifier: this._subNodeOffsetIndexIdentifier,
                    _descriptorIdentifier: this._descriptorIdentifier,
                    _offsetIndexIdentifier: this._offsetIndexIdentifier,
                    dataSize: this.dataSize
                },
                null,
                2
            ) 
        );
    }
}
