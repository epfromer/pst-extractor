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
import { PSTTableItem } from '../PSTTableItem/PSTTableItem.class';
import { OutlookProperties } from '../OutlookProperties';
var fromBits = require('math-float64-from-bits');

export abstract class PSTObject {
    protected pstFile: PSTFile;
    protected descriptorIndexNode: DescriptorIndexNode;
    protected localDescriptorItems: Map<number, PSTDescriptorItem> = null;
    private pstTableBC: PSTTableBC;
    protected pstTableItems: Map<number, PSTTableItem>; // make this a JSON object?

    /**
     * Creates an instance of PSTObject, the root class of most PST Items.
     * @memberof PSTObject
     */
    constructor(pstTableItems?: Map<number, PSTTableItem>) {
        // if table items already loaded, set them
        this.pstTableItems = pstTableItems;
    }

    /**
     * Load a descriptor from the PST.
     * @protected
     * @param {PSTFile} pstFile 
     * @param {DescriptorIndexNode} descriptorIndexNode 
     * @memberof PSTObject
     */
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

    /**
     * Get table items.
     * @protected
     * @param {PSTFile} theFile 
     * @param {DescriptorIndexNode} folderIndexNode 
     * @param {PSTTableBC} pstTableBC 
     * @param {Map<number, PSTDescriptorItem>} localDescriptorItems 
     * @memberof PSTObject
     */
    protected prePopulate(
        theFile: PSTFile,
        folderIndexNode: DescriptorIndexNode,
        pstTableBC: PSTTableBC,
        localDescriptorItems: Map<number, PSTDescriptorItem>
    ) {
        this.pstFile = theFile;
        this.descriptorIndexNode = folderIndexNode;
        this.pstTableItems = pstTableBC.getItems();
        this.pstTableBC = pstTableBC;
        this.localDescriptorItems = localDescriptorItems;
    }

    /**
     * Get the descriptor identifier for this item which can be used for loading objects
     * through detectAndLoadPSTObject(PSTFile theFile, long descriptorIndex)
     * @readonly
     * @type {long}
     * @memberof PSTObject
     */
    public get descriptorNodeId(): long {
        // Prevent null pointer exceptions for embedded messages
        if (this.descriptorIndexNode != null) {
            return long.fromNumber(this.descriptorIndexNode.descriptorIdentifier);
        }
        return long.ZERO;
    }

    /**
     * Get the node type for the descriptor id.
     * @param {number} [descriptorIdentifier] 
     * @returns {number} 
     * @memberof PSTObject
     */
    public getNodeType(descriptorIdentifier?: number): number {
        if (descriptorIdentifier) {
            return descriptorIdentifier & 0x1f;
        } else {
            return this.descriptorIndexNode.descriptorIdentifier & 0x1f;
        }
    }

    /**
     * Get a number.
     * @protected
     * @param {number} identifier 
     * @param {number} [defaultValue] 
     * @returns {number} 
     * @memberof PSTObject
     */
    protected getIntItem(identifier: number, defaultValue?: number): number {
        if (!defaultValue) {
            defaultValue = 0;
        }

        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableItem = this.pstTableItems.get(identifier);
            return item.entryValueReference;
        }
        return defaultValue;
    }

    /**
     * Get a boolean.
     * @protected
     * @param {number} identifier 
     * @param {boolean} [defaultValue] 
     * @returns {boolean} 
     * @memberof PSTObject
     */
    protected getBooleanItem(identifier: number, defaultValue?: boolean): boolean {
        if (defaultValue === undefined) {
            defaultValue = false;
        }

        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableItem = this.pstTableItems.get(identifier);
            return item.entryValueReference != 0;
        }
        return defaultValue;
    }

    /**
     * Get a double.
     * @protected
     * @param {number} identifier 
     * @param {number} [defaultValue] 
     * @returns {number} 
     * @memberof PSTObject
     */
    protected getDoubleItem(identifier: number, defaultValue?: number): number {
        if (defaultValue === undefined) {
            defaultValue = 0;
        }

        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableItem = this.pstTableItems.get(identifier);
            let longVersion: long = PSTUtil.convertLittleEndianBytesToLong(item.data);

            // convert double precision float to binary, then back to JS number
            return fromBits('00' + longVersion.toString(2));
        }
        return defaultValue;
    }


    /**
     * Get a long.
     * @protected
     * @param {number} identifier 
     * @param {long} [defaultValue] 
     * @returns {long} 
     * @memberof PSTObject
     */
    protected getLongItem(identifier: number, defaultValue?: long): long {
        if (defaultValue === undefined) {
            defaultValue = long.ZERO;
        }

        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableItem = this.pstTableItems.get(identifier);
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

    /**
     * Get a string.
     * @protected
     * @param {number} identifier 
     * @param {number} [stringType] 
     * @param {string} [codepage] 
     * @returns {string} 
     * @memberof PSTObject
     */
    protected getStringItem(identifier: number, stringType?: number, codepage?: string): string {
        if (!stringType) {
            stringType = 0;
        }

        let item: PSTTableItem = this.pstTableItems.get(identifier);
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
                    Log.error('PSTObject::getStringItem error decoding string\n' + err);
                    return '';
                }
            }
        }
        return '';
    }

    /**
     * Get a codepage.
     * @readonly
     * @type {string}
     * @memberof PSTObject
     */
    public get stringCodepage(): string {
        // try and get the codepage
        let cpItem: PSTTableItem = this.pstTableItems.get(0x3ffd); // PidTagMessageCodepage
        if (cpItem == null) {
            cpItem = this.pstTableItems.get(0x3fde); // PidTagInternetCodepage
        }
        if (cpItem != null) {
            return PSTUtil.getInternetCodePageCharset(cpItem.entryValueReference);
        }
        return null;
    }

    /**
     * Get a date.
     * @param {number} identifier 
     * @returns {Date} 
     * @memberof PSTObject
     */
    public getDateItem(identifier: number): Date {
        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableItem = this.pstTableItems.get(identifier);
            if (item.data.length == 0) {
                return new Date(0);
            }
            let hi = PSTUtil.convertLittleEndianBytesToLong(item.data, 4, 8);
            let low = PSTUtil.convertLittleEndianBytesToLong(item.data, 0, 4);
            return PSTUtil.filetimeToDate(hi, low);
        }
        return null;
    }

    /**
     * Get a blob.
     * @protected
     * @param {number} identifier 
     * @returns {Buffer} 
     * @memberof PSTObject
     */
    protected getBinaryItem(identifier: number): Buffer {
        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableItem = this.pstTableItems.get(identifier);
            if (item.entryValueType == 0x0102) {
                if (!item.isExternalValueReference) {
                    return item.data;
                }
                if (this.localDescriptorItems != null && this.localDescriptorItems.has(item.entryValueReference)) {
                    // we have a hit!
                    let descItem: PSTDescriptorItem = this.localDescriptorItems.get(item.entryValueReference);
                    try {
                        return descItem.getData();
                    } catch (err) {
                        Log.error('PSTObject::Exception reading binary item\n' + err);
                        throw err;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Get the display name of this object.
     * https://msdn.microsoft.com/en-us/library/office/cc842383.aspx
     * @readonly
     * @type {string}
     * @memberof PSTObject
     */
    public get displayName(): string {
        return this.getStringItem(OutlookProperties.PR_DISPLAY_NAME);
    }

    /**
     * JSON the object, large buffers excluded.
     * @returns {string} 
     * @memberof PSTObject
     */
    public toJSON(): any {
        return this;
        // return (
        //     'PSTObject:' +
        //     JSON.stringify(
        //         {
        //             displayName: this.displayName,
        //             pstTableBC: this.pstTableBC,
        //         },
        //         null,
        //         2
        //     )
        // );
    }

}
