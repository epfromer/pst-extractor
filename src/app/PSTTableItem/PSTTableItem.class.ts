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
import { PSTObject } from '../PSTObject/PSTObject.class';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import * as long from 'long';

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

    private _entryType: long;
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

    private _data: Buffer = new Buffer(0);
    public set data(val) {
        this._data = val;
    }
    public get data(): Buffer {
        return this._data;
    }

    public getLongValue() {
        if (this.data.length > 0) {
            return PSTUtil.convertLittleEndianBytesToLong(this.data);
        }
        return -1;
    }

    // get a string value of the data
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
                console.log('Error decoding string: ' + this.data.toString('utf16le').replace(/\0/g, ''));
                return '';
            }
        }

        if (stringType == PSTTableItem.VALUE_TYPE_PT_STRING8) {
            return this.data.toString();
        }

        return 'hex string';

        // final StringBuffer outputBuffer = new StringBuffer();

        // // we are not a normal string, give a hexish sort of output
        // final StringBuffer hexOut = new StringBuffer();
        // for (final byte element : this.data) {
        //     final int valueChar = element & 0xff;
        //     if (Character.isLetterOrDigit((char) valueChar)) {
        //         outputBuffer.append((char) valueChar);
        //         outputBuffer.append(" ");
        //     } else {
        //         outputBuffer.append(". ");
        //     }
        //     final String hexValue = Long.toHexString(valueChar);
        //     hexOut.append(hexValue);
        //     hexOut.append(" ");
        //     if (hexValue.length() > 1) {
        //         outputBuffer.append(" ");
        //     }
        // }
        // outputBuffer.append("\n");
        // outputBuffer.append("	");
        // outputBuffer.append(hexOut);

        // return new String(outputBuffer);
    }

    public toString(): string {
        let ret = PSTFile.getPropertyDescription(this.entryType.toNumber(), this.entryValueType);

        if (this.entryValueType == 0x000b) {
            return ret + (this.entryValueReference == 0 ? 'false' : 'true');
        }

        if (this.isExternalValueReference) {
            // Either a true external reference, or entryValueReference contains the actual data
            return ret + this.entryValueReference.toString(16) + '(' + this.entryValueReference + ')';
        }

        if (this.entryValueType == 0x0005 || this.entryValueType == 0x0014) {
            // 64bit data
            if (this.data == null) {
                return ret + 'no data';
            }
            if (this.data.length == 8) {
                let l: long = PSTUtil.convertLittleEndianBytesToLong(this.data, 0, 8);
                return ret + l.toString(16) + '(' + l.toNumber() + ')';
            } else {
                return ret + 'invalid data length: ' + this.data.length;
            }
        }

        if (this.entryValueType == 0x0040) {
            // It's a date...  TODO
            debugger;
            let high: number = PSTUtil.convertLittleEndianBytesToLong(this.data, 4, 8).toNumber();
            let low: number = PSTUtil.convertLittleEndianBytesToLong(this.data, 0, 4).toNumber();
            // final Date d = PSTObject.filetimeToDate(high, low);
            // this.dateFormatter.setTimeZone(utcTimeZone);
            // return ret + this.dateFormatter.format(d);
        }

        if (this.entryValueType == 0x001f) {
            // Unicode string and trim any nulls
            return this.data.toString('utf16le').replace(/\0/g, '');
        }

        return ret + this.getStringValue(this.entryValueType);
    }

    // private final SimpleDateFormat dateFormatter = new SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'");
    // private static SimpleTimeZone utcTimeZone = new SimpleTimeZone(0, "UTC");

    public toJSONstring(): string {
        return (
            'PSTTableItem: ' +
            JSON.stringify(
                {
                    itemIndex: this.itemIndex,
                    entryType: this.entryType,
                    isExternalValueReference: this.isExternalValueReference,
                    entryValueReference: this.entryValueReference,
                    entryValueType: this.entryValueType,
                    data: this.data
                },
                null,
                2
            )
        );
    }
}
