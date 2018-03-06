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
import { PSTTableBCItem } from '../PSTTableBCItem/PSTTableBCItem.class';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import { OffsetIndexItem } from '../OffsetIndexItem/OffsetIndexItem.class';
import { PSTFolder } from '../PSTFolder/PSTFolder.class';
import { PSTMessage } from '../PSTMessage/PSTMessage.class';
import { Log } from '../Log.class';
import * as long from 'long';
import { PSTTimeZone } from '../PSTTimeZone/PSTTimeZone.class';
var fromBits = require('math-float64-from-bits');

// PST Object is the root class of most PST Items.
export class PSTObject {
    protected pstFile: PSTFile;
    protected descriptorIndexNode: DescriptorIndexNode;
    protected localDescriptorItems: Map<number, PSTDescriptorItem> = null;
    private pstTableBC: PSTTableBC;
    protected pstTableItems: Map<number, PSTTableBCItem>; // make this a JSON object?
    protected table: PSTTableBC;

    constructor() {}

    protected loadDescriptor(pstFile: PSTFile, descriptorIndexNode: DescriptorIndexNode) {
        this.pstFile = pstFile;
        this.descriptorIndexNode = descriptorIndexNode;

        // get the table items for this descriptor
        let offsetIndexItem: OffsetIndexItem = this.pstFile.getOffsetIndexNode(descriptorIndexNode.dataOffsetIndexIdentifier);
        let pstNodeInputStream: PSTNodeInputStream = new PSTNodeInputStream(this.pstFile, offsetIndexItem);
        this.pstTableBC = new PSTTableBC(pstNodeInputStream);
        this.pstTableItems = this.pstTableBC.getItems();

        if (descriptorIndexNode.localDescriptorsOffsetIndexIdentifier.notEquals(long.ZERO)) {
            this.localDescriptorItems = pstFile.getPSTDescriptorItems(descriptorIndexNode.localDescriptorsOffsetIndexIdentifier);
        }
    }

    protected prePopulate(
        theFile: PSTFile,
        folderIndexNode: DescriptorIndexNode,
        table: PSTTableBC,
        localDescriptorItems: Map<number, PSTDescriptorItem>
    ) {
        this.pstFile = theFile;
        this.descriptorIndexNode = folderIndexNode;
        this.pstTableItems = table.getItems();
        this.table = table;
        this.localDescriptorItems = localDescriptorItems;
    }

    // get the descriptor identifier for this item which can be used for loading objects
    // through detectAndLoadPSTObject(PSTFile theFile, long descriptorIndex)
    public get descriptorNodeId(): long {
        // Prevent null pointer exceptions for embedded messages
        if (this.descriptorIndexNode != null) {
            return long.fromNumber(this.descriptorIndexNode.descriptorIdentifier);
        }
        return long.ZERO;
    }

    public getNodeType(descriptorIdentifier?: number): number {
        if (descriptorIdentifier) {
            return descriptorIdentifier & 0x1f;
        } else {
            return this.descriptorIndexNode.descriptorIdentifier & 0x1f;
        }
    }

    protected getIntItem(identifier: number, defaultValue?: number): number {
        if (!defaultValue) {
            defaultValue = 0;
        }

        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableBCItem = this.pstTableItems.get(identifier);
            return item.entryValueReference;
        }
        return defaultValue;
    }

    protected getBooleanItem(identifier: number, defaultValue?: boolean): boolean {
        if (defaultValue === undefined) {
            defaultValue = false;
        }

        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableBCItem = this.pstTableItems.get(identifier);
            return item.entryValueReference != 0;
        }
        return defaultValue;
    }

    protected getDoubleItem(identifier: number, defaultValue?: number): number {
        if (defaultValue === undefined) {
            defaultValue = 0;
        }

        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableBCItem = this.pstTableItems.get(identifier);
            let longVersion: long = PSTUtil.convertLittleEndianBytesToLong(item.data);

            // convert double precision float to binary, then back to JS number
            return fromBits('00' + longVersion.toString(2));
        }
        return defaultValue;
    }

    protected getLongItem(identifier: number, defaultValue?: long): long {
        if (defaultValue === undefined) {
            defaultValue = long.ZERO;
        }

        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableBCItem = this.pstTableItems.get(identifier);
            if (item.entryValueType == 0x0003) {
                // we are really just an int
                return long.fromNumber(item.entryValueReference);
            } else if (item.entryValueType == 0x0014) {
                // we are a long
                if (item.data != null && item.data.length == 8) {
                    return PSTUtil.convertLittleEndianBytesToLong(item.data, 0, 8);
                } else {
                    Log.error('PSTObject::getLongItem Invalid data length for long id ' + identifier);
                    // Return the default value for now...
                }
            }
        }
        return defaultValue;
    }

    protected getStringItem(identifier: number, stringType?: number, codepage?: string): string {
        if (!stringType) {
            stringType = 0;
        }

        let item: PSTTableBCItem = this.pstTableItems.get(identifier);
        if (item) {
            if (!codepage) {
                codepage = this.stringCodepage;
            }

            // get the string type from the item if not explicitly set
            if (!stringType) {
                stringType = item.entryValueType;
            }

            // see if there is a descriptor entry
            if (!item.isExternalValueReference) {
                return PSTUtil.createJavascriptString(item.data, stringType, codepage);
            }

            if (this.localDescriptorItems != null && this.localDescriptorItems.has(item.entryValueReference)) {
                // we have a hit!
                let descItem: PSTDescriptorItem = this.localDescriptorItems.get(item.entryValueReference);

                try {
                    let data: Buffer = descItem.getData();
                    if (data == null) {
                        return '';
                    }

                    return PSTUtil.createJavascriptString(data, stringType, codepage);
                } catch (err) {
                    Log.error('PSTObject::getStringItem error decoding string');
                    return '';
                }
            }
        }
        return '';
    }

    public get stringCodepage(): string {
        // try and get the codepage
        let cpItem: PSTTableBCItem = this.pstTableItems.get(0x3ffd); // PidTagMessageCodepage
        if (cpItem == null) {
            cpItem = this.pstTableItems.get(0x3fde); // PidTagInternetCodepage
        }
        if (cpItem != null) {
            return PSTUtil.getInternetCodePageCharset(cpItem.entryValueReference);
        }
        return null;
    }

    public getDateItem(identifier: number): Date {
        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableBCItem = this.pstTableItems.get(identifier);
            if (item.data.length == 0) {
                return new Date(0);
            }
            let hi = PSTUtil.convertLittleEndianBytesToLong(item.data, 4, 8);
            let low = PSTUtil.convertLittleEndianBytesToLong(item.data, 0, 4);
            return PSTUtil.filetimeToDate(hi, low);
        }
        return null;
    }

    protected getBinaryItem(identifier: number): Buffer {
        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableBCItem = this.pstTableItems.get(identifier);
            if (item.entryValueType == 0x0102) {
                if (!item.isExternalValueReference) {
                    return item.data;
                }
                if (this.localDescriptorItems != null && this.localDescriptorItems.has(item.entryValueReference)) {
                    // we have a hit!
                    let descItem: PSTDescriptorItem = this.localDescriptorItems.get(item.entryValueReference);
                    try {
                        return descItem.getData();
                    } catch (e) {
                        Log.error('Exception reading binary item: reference ' + item.entryValueReference);
                        return null;
                    }
                }
                Log.error('PSTObject::getBinaryItem External reference?');
            }
        }
        return null;
    }

    protected getTimeZoneItem(identifier: number): PSTTimeZone {
        let tzData: Buffer = this.getBinaryItem(identifier);
        if (tzData != null && tzData.length != 0) {
            return new PSTTimeZone(tzData);
        }
        return null;
    }

    public get displayName(): string {
        return this.getStringItem(0x3001);
    }

    public toString() {
        return this.localDescriptorItems + '\n' + this.pstTableItems;
    }

    public toJSONstring(): string {
        return (
            'PSTObject:' +
            JSON.stringify(
                {
                    displayName: this.displayName,
                },
                null,
                2
            )
        );
    }

}
