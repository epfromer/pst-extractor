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
import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from './../PSTObject/PSTObject.class';
import * as long from 'long';

// DescriptorIndexNode is a leaf item from the Descriptor index b-tree
// It is like a pointer to an element in the PST file, everything has one...
export class DescriptorIndexNode {
    private parentDescriptorIndexIdentifier: number;
    private itemType: number;

    private _descriptorIdentifier: number;
    public get descriptorIdentifier(): number {
        return this._descriptorIdentifier;
    }

    private _localDescriptorsOffsetIndexIdentifier: long;
    public get localDescriptorsOffsetIndexIdentifier(): long {
        return this._localDescriptorsOffsetIndexIdentifier;
    }

    private _dataOffsetIndexIdentifier: long;
    public get dataOffsetIndexIdentifier(): long {
        return this._dataOffsetIndexIdentifier;
    }

    /**
     * Creates an instance of DescriptorIndexNode, a component of the internal descriptor b-tree.
     * @param {Buffer} buffer 
     * @param {number} pstFileType 
     * @memberof DescriptorIndexNode
     */
    constructor(buffer: Buffer, pstFileType: number) {
        if (pstFileType == PSTFile.PST_TYPE_ANSI) {
            this._descriptorIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 0, 4).toNumber();
            this._dataOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 4, 8);
            this._localDescriptorsOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 8, 12);
            this.parentDescriptorIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 12, 16).toNumber();
        } else {
            this._descriptorIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 0, 4).toNumber();
            this._dataOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 8, 16);
            this._localDescriptorsOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 16, 24);
            this.parentDescriptorIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 24, 28).toNumber();
            this.itemType = PSTUtil.convertLittleEndianBytesToLong(buffer, 28, 32).toNumber();
        }
    }

    /**
     * JSON stringify the object properties.  
     * @returns {string} 
     * @memberof DescriptorIndexNode
     */
    public toJSON(): string {
        return (
            'DescriptorIndexNode: ' +
            JSON.stringify(
                {
                    parentDescriptorIndexIdentifier: this.parentDescriptorIndexIdentifier,
                    _descriptorIdentifier: this._descriptorIdentifier,
                    _localDescriptorsOffsetIndexIdentifier: this._localDescriptorsOffsetIndexIdentifier.toString(),
                    _dataOffsetIndexIdentifier: this._dataOffsetIndexIdentifier.toString()
                },
                null,
                2
            )
        );
    }
}
