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
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTTable } from '../PSTTable/PSTTable.class';
import { PSTTableItem } from '../PSTTableItem/PSTTableItem.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';

export class PSTTableBC extends PSTTable {
    private items: Map<number, PSTTableItem> = new Map();
    private isDescNotYetInitiated = false;

    /**
     * Creates an instance of PSTTableBC ("Property Context").
     * @param {PSTNodeInputStream} pstNodeInputStream 
     * @memberof PSTTableBC
     */
    constructor(pstNodeInputStream: PSTNodeInputStream) {
        super(pstNodeInputStream, new Map<number, PSTDescriptorItem>());

        if (this.tableTypeByte != 188) {
            throw new Error('PSTTableBC::constructor unable to create PSTTableBC, table does not appear to be a bc!');
        }

        // go through each of the entries
        let keyTableInfoNodeInfo = this.getNodeInfo(this.hidRoot);
        if (!keyTableInfoNodeInfo) {
            throw new Error('PSTTableBC::constructor keyTableInfoNodeInfo is null');
        }

        let keyTableInfo: Buffer = new Buffer(keyTableInfoNodeInfo.length());
        keyTableInfoNodeInfo.pstNodeInputStream.seek(long.fromValue(keyTableInfoNodeInfo.startOffset));
        keyTableInfoNodeInfo.pstNodeInputStream.readCompletely(keyTableInfo);
        this.numberOfKeys = Math.trunc(keyTableInfo.length / (this.sizeOfItemKey + this.sizeOfItemValue));
        if (this.numberOfKeys == 0) { debugger; }

        // Read the key table
        let offset = 0;
        for (let x = 0; x < this.numberOfKeys; x++) {
            let item = new PSTTableItem();
            item.itemIndex = x;
            item.entryType = PSTUtil.convertLittleEndianBytesToLong(keyTableInfo, offset + 0, offset + 2);
            item.entryValueType = PSTUtil.convertLittleEndianBytesToLong(keyTableInfo, offset + 2, offset + 4).toNumber();
            item.entryValueReference = PSTUtil.convertLittleEndianBytesToLong(keyTableInfo, offset + 4, offset + 8).toNumber();

            // Data is in entryValueReference for all types <= 4 bytes long
            switch (item.entryValueType) {
                case 0x0002: // 16bit integer
                    item.entryValueReference &= 0xffff;
                case 0x0003: // 32bit integer
                case 0x000a: // 32bit error code
                case 0x0001: // Place-holder
                case 0x0004: // 32bit floating
                    item.isExternalValueReference = true;
                    break;

                case 0x000b: // Boolean - a single byte
                    item.entryValueReference &= 0xff;
                    item.isExternalValueReference = true;
                    break;

                case 0x000d:
                default:
                    // Is it in the local heap?
                    item.isExternalValueReference = true; // Assume not
                    let nodeInfoNodeInfo = this.getNodeInfo(item.entryValueReference);
                    if (nodeInfoNodeInfo == null) {
                        // It's an external reference that we don't deal with here.
                    } else {
                        // Make a copy of the data
                        let nodeInfo = new Buffer(nodeInfoNodeInfo.length());
                        nodeInfoNodeInfo.pstNodeInputStream.seek(long.fromValue(nodeInfoNodeInfo.startOffset));
                        nodeInfoNodeInfo.pstNodeInputStream.readCompletely(nodeInfo);
                        item.data = nodeInfo; // should be new array, so just use it
                        item.isExternalValueReference = false;
                    }
                    break;
            }
            offset = offset + 8;
            this.items.set(item.entryType.toNumber(), item);
        }
        this.releaseRawData();
    }

    /**
     * Get the items parsed out of this table.
     * @returns {Map<number, PSTTableItem>} 
     * @memberof PSTTableBC
     */
    public getItems(): Map<number, PSTTableItem> {
        return this.items;
    }

    /**
     * JSON stringify the items list.
     * @returns {string} 
     * @memberof PSTTable7C
     */
    public itemsJSON(): string {
        let s = '';
        this.items.forEach(item => {
            s = s + JSON.stringify(item);
        });
        return s;
    }

    /**
     * JSON stringify the object properties.
     * @returns {string} 
     * @memberof PSTTable7C
     */
    public toJSON(): any {
        return this;
    }
}
