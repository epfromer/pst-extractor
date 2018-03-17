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
import { PSTFile } from '../PSTFile/PSTFile.class';
import { PSTObject } from '../PSTObject/PSTObject.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import * as long from 'long';

export class OffsetIndexItem {
    private _indexIdentifier: long;
    public get indexIdentifier(): long {
        return this._indexIdentifier;
    }

    private _fileOffset: long;
    public get fileOffset(): long {
        return this._fileOffset;
    }

    private _size: number;
    public get size(): number {
        return this._size;
    }

    private cRef: long;

    /**
     * Creates an instance of OffsetIndexItem, part of the node table.
     * @param {Buffer} data 
     * @param {number} pstFileType 
     * @memberof OffsetIndexItem
     */
    constructor(data: Buffer, pstFileType: number) {
        if (pstFileType == PSTFile.PST_TYPE_ANSI) {
            this._indexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, 0, 4);
            this._fileOffset = PSTUtil.convertLittleEndianBytesToLong(data, 4, 8);
            this._size = PSTUtil.convertLittleEndianBytesToLong(data, 8, 10).toNumber();
            this.cRef = PSTUtil.convertLittleEndianBytesToLong(data, 10, 12);
        } else {
            this._indexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, 0, 8);
            this._fileOffset = PSTUtil.convertLittleEndianBytesToLong(data, 8, 16);
            this._size = PSTUtil.convertLittleEndianBytesToLong(data, 16, 18).toNumber();
            this.cRef = PSTUtil.convertLittleEndianBytesToLong(data, 16, 18);
        }
    }

    /**
     * JSON stringify the object properties.  
     * @returns {string} 
     * @memberof OffsetIndexItem
     */
    public toJSON(): any {
        return this;
    }
}
