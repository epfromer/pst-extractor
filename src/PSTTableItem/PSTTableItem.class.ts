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
import * as long from 'long';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';

// Generic table item
// Provides some basic string functions
export class PSTTableItem {
    public static VALUE_TYPE_PT_UNICODE = 0x1f;
    public static VALUE_TYPE_PT_STRING8 = 0x1e;
    public static VALUE_TYPE_PT_BIN = 0x102;

    private _itemIndex = 0;
    public set itemIndex(val) {
        this._itemIndex = val;
    }
    public get itemIndex(): number {
        return this._itemIndex;
    }

    private _entryType: long = long.ZERO;
    public set entryType(val) {
        this._entryType = val;
    }
    public get entryType(): long {
        return this._entryType;
    }

    private _isExternalValueReference = false;
    public set isExternalValueReference(val) {
        this._isExternalValueReference = val;
    }
    public get isExternalValueReference(): boolean {
        return this._isExternalValueReference;
    }

    private _entryValueReference = 0;
    public set entryValueReference(val) {
        this._entryValueReference = val;
    }
    public get entryValueReference(): number {
        return this._entryValueReference;
    }

    private _entryValueType = 0;
    public set entryValueType(val) {
        this._entryValueType = val;
    }
    public get entryValueType(): number {
        return this._entryValueType;
    }

    private _data: Buffer = Buffer.alloc(0);
    public set data(val) {
        this._data = val;
    }
    public get data(): Buffer {
        return this._data;
    }

    /**
     * Creates an instance of PSTTableItem.
     * @memberof PSTTableItem
     */
    constructor() {}

    /**
     * Get long value from table item.
     * @returns
     * @memberof PSTTableItem
     */
    public getLongValue() {
        if (this.data.length > 0) {
            return PSTUtil.convertLittleEndianBytesToLong(this.data);
        }
        return -1;
    }

    /**
     * Get string value of data.
     * @param {number} [stringType]
     * @returns {string}
     * @memberof PSTTableItem
     */
    public getStringValue(stringType?: number): string {
        if (!stringType) {
            stringType = this.entryValueType;
        }

        if (stringType === PSTTableItem.VALUE_TYPE_PT_UNICODE) {
            // little-endian unicode string
            try {
                if (this.isExternalValueReference) {
                    return 'External string reference!';
                }
                return this.data.toString('utf16le').replace(/\0/g, '');
            } catch (err) {
                console.error('Error decoding string: ' + this.data.toString('utf16le').replace(/\0/g, '') + '\n' + err);
                return '';
            }
        }

        if (stringType == PSTTableItem.VALUE_TYPE_PT_STRING8) {
            return this.data.toString();
        }

        return 'hex string';
    }

    /**
     * JSON stringify the object properties.
     * @returns {string}
     * @memberof PSTTableItem
     */
    public toJSON(): any {
        let clone = Object.assign(
            {
                itemIndex: this.itemIndex,
                entryType: this.entryType,
                isExternalValueReference: this.isExternalValueReference,
                entryValueReference: this.entryValueReference,
                entryValueType: this.entryValueType,
                data: this.data
            },
            this
        );
        return clone;
    }
}
