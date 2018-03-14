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
import { ColumnDescriptor } from './ColumnDescriptor.class';
import { PSTObject } from './../PSTObject/PSTObject.class';
import { PSTTable } from '../PSTTable/PSTTable.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import { NodeInfo } from '../NodeInfo/NodeInfo.class';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { Log } from '../Log.class';
import * as long from 'long';
import { PSTTableItem } from '../PSTTableItem/PSTTableItem.class';

export class PSTTable7C extends PSTTable {
    private items: Map<number, PSTTableItem>[] = null;
    private numberOfDataSets = 0;
    private BLOCK_SIZE = 8176;
    private numColumns = 0;
    private TCI_bm = 0;
    private TCI_1b = 0;
    private columnDescriptors: ColumnDescriptor[] = [];
    private overrideCol = -1;
    private rowNodeInfo: NodeInfo = null;
    private keyMap: Map<number, number> = null;

    /**
     * Creates an instance of PSTTable7C ("Table Context").
     * @param {PSTNodeInputStream} pstNodeInputStream 
     * @param {Map<number, PSTDescriptorItem>} subNodeDescriptorItems 
     * @param {number} [entityToExtract] 
     * @memberof PSTTable7C
     */
    constructor(pstNodeInputStream: PSTNodeInputStream, subNodeDescriptorItems: Map<number, PSTDescriptorItem>, entityToExtract?: number) {
        super(pstNodeInputStream, subNodeDescriptorItems);

        if (this.tableTypeByte != 0x7c) {
            throw new Error('PSTTable7C::constructor unable to create PSTTable7C, table does not appear to be a 7c!');
        }

        // TCINFO header is in the hidUserRoot node
        let tcHeaderNode: NodeInfo = this.getNodeInfo(this.hidUserRoot);
        let offset = 0;

        // get the TCINFO header information
        this.numColumns = tcHeaderNode.seekAndReadLong(long.fromNumber(offset + 1), 1).toNumber();
        let TCI_4b: number = tcHeaderNode.seekAndReadLong(long.fromNumber(offset + 2), 2).toNumber();
        let TCI_2b: number = tcHeaderNode.seekAndReadLong(long.fromNumber(offset + 4), 2).toNumber();
        this.TCI_1b = tcHeaderNode.seekAndReadLong(long.fromNumber(offset + 6), 2).toNumber();
        this.TCI_bm = tcHeaderNode.seekAndReadLong(long.fromNumber(offset + 8), 2).toNumber();
        let hidRowIndex: number = tcHeaderNode.seekAndReadLong(long.fromNumber(offset + 10), 4).toNumber();
        let hnidRows: number = tcHeaderNode.seekAndReadLong(long.fromNumber(offset + 14), 4).toNumber();

        // 22... column descriptors
        offset += 22;
        if (this.numColumns != 0) {
            for (let col = 0; col < this.numColumns; ++col) {
                this.columnDescriptors[col] = new ColumnDescriptor(tcHeaderNode, offset);
                if (this.columnDescriptors[col].id === entityToExtract) {
                    this.overrideCol = col;
                }
                offset += 8;
            }
        }

        // if we are asking for a specific column, only get that!
        if (this.overrideCol > -1) {
            this.numColumns = this.overrideCol + 1;
        }

        // Read the key table
        this.keyMap = new Map();
        let keyTableInfo: NodeInfo = this.getNodeInfo(this.hidRoot);
        this.numberOfKeys = Math.trunc(keyTableInfo.length() / (this.sizeOfItemKey + this.sizeOfItemValue));
        offset = 0;
        for (let x = 0; x < this.numberOfKeys; x++) {
            let context = keyTableInfo.seekAndReadLong(long.fromNumber(offset), this.sizeOfItemKey).toNumber();
            offset += this.sizeOfItemKey;
            let rowIndex = keyTableInfo.seekAndReadLong(long.fromNumber(offset), this.sizeOfItemValue).toNumber();
            offset += this.sizeOfItemValue;
            this.keyMap.set(context, rowIndex);
        }

        // Read the Row Matrix
        this.rowNodeInfo = this.getNodeInfo(hnidRows);
        let numberOfBlocks: number = Math.trunc(this.rowNodeInfo.length() / this.BLOCK_SIZE);
        let numberOfRowsPerBlock: number = Math.trunc(this.BLOCK_SIZE / this.TCI_bm);
        let blockPadding = this.BLOCK_SIZE - numberOfRowsPerBlock * this.TCI_bm;
        this.numberOfDataSets = Math.trunc(numberOfBlocks * numberOfRowsPerBlock + (this.rowNodeInfo.length() % this.BLOCK_SIZE) / this.TCI_bm);
    }

    /**
     * Get items from the table.
     * @param {number} [startAtRecord] 
     * @param {number} [numberOfRecordsToReturn] 
     * @returns {Map<number, PSTTableItem>[]} 
     * @memberof PSTTable7C
     */
    public getItems(startAtRecord?: number, numberOfRecordsToReturn?: number): Map<number, PSTTableItem>[] {
        let itemList: Map<number, PSTTableItem>[] = [];
        let setLocalList = false;

        // okay, work out the number of records we have
        let numberOfBlocks = Math.trunc(this.rowNodeInfo.length() / this.BLOCK_SIZE);
        let numberOfRowsPerBlock = Math.trunc(this.BLOCK_SIZE / this.TCI_bm);
        let blockPadding = this.BLOCK_SIZE - numberOfRowsPerBlock * this.TCI_bm;
        this.numberOfDataSets = Math.trunc(numberOfBlocks * numberOfRowsPerBlock + (this.rowNodeInfo.length() % this.BLOCK_SIZE) / this.TCI_bm);

        if (startAtRecord === undefined) {
            numberOfRecordsToReturn = this.numberOfDataSets;
            startAtRecord = 0;
            setLocalList = true;
        }

        // repeat the reading process for every dataset
        let currentValueArrayStart =
            Math.trunc(startAtRecord / numberOfRowsPerBlock) * this.BLOCK_SIZE + (startAtRecord % numberOfRowsPerBlock) * this.TCI_bm;
        if (numberOfRecordsToReturn > this.rowCount - startAtRecord) {
            numberOfRecordsToReturn = this.rowCount - startAtRecord;
        }

        let dataSetNumber = 0;
        for (let rowCounter = 0; rowCounter < numberOfRecordsToReturn; rowCounter++) {
            let currentItem: Map<number, PSTTableItem> = new Map();
            // add on some padding for block boundries?
            if (this.rowNodeInfo.pstNodeInputStream.pstFile.pstFileType == PSTFile.PST_TYPE_ANSI) {
                if (currentValueArrayStart >= this.BLOCK_SIZE) {
                    currentValueArrayStart = currentValueArrayStart + 4 * (currentValueArrayStart / this.BLOCK_SIZE);
                }
                if (this.rowNodeInfo.startOffset + currentValueArrayStart + this.TCI_1b > this.rowNodeInfo.pstNodeInputStream.length.toNumber()) {
                    continue;
                }
            } else {
                if (currentValueArrayStart % this.BLOCK_SIZE > this.BLOCK_SIZE - this.TCI_bm) {
                    // adjust!
                    currentValueArrayStart += blockPadding;
                    if (currentValueArrayStart + this.TCI_bm > this.rowNodeInfo.length()) {
                        continue;
                    }
                }
            }
            let bitmap = new Buffer((this.numColumns + 7) / 8);
            this.rowNodeInfo.pstNodeInputStream.seek(long.fromNumber(this.rowNodeInfo.startOffset + currentValueArrayStart + this.TCI_1b));
            this.rowNodeInfo.pstNodeInputStream.readCompletely(bitmap);
            let id = this.rowNodeInfo.seekAndReadLong(long.fromNumber(currentValueArrayStart), 4);

            // Put into the item map as PidTagLtpRowId (0x67F2)
            let item: PSTTableItem = new PSTTableItem();
            item.itemIndex = -1;
            item.entryValueType = 3;
            item.entryType = long.fromNumber(0x67f2);
            item.entryValueReference = id.toNumber();
            item.isExternalValueReference = true;
            currentItem.set(item.entryType.toNumber(), item);

            let col = 0;
            if (this.overrideCol > -1) {
                col = this.overrideCol - 1;
            }
            while (col < this.numColumns - 1) {
                col++;

                // Does this column exist for this row?
                let bitIndex = Math.trunc(this.columnDescriptors[col].iBit / 8);
                let bit = this.columnDescriptors[col].iBit % 8;
                if (bitIndex >= bitmap.length || (bitmap[bitIndex] & (1 << bit)) == 0) {
                    // Column doesn't exist
                    continue;
                }

                item = new PSTTableItem();
                item.itemIndex = col;
                item.entryValueType = this.columnDescriptors[col].type;
                item.entryType = long.fromNumber(this.columnDescriptors[col].id);
                item.entryValueReference = 0;

                switch (this.columnDescriptors[col].cbData) {
                    case 1: // Single byte data
                        item.entryValueReference =
                            this.rowNodeInfo
                                .seekAndReadLong(long.fromNumber(currentValueArrayStart + this.columnDescriptors[col].ibData), 1)
                                .toNumber() & 0xff;
                        item.isExternalValueReference = true;
                        break;

                    case 2: // Two byte data
                        item.entryValueReference =
                            this.rowNodeInfo
                                .seekAndReadLong(long.fromNumber(currentValueArrayStart + this.columnDescriptors[col].ibData), 2)
                                .toNumber() & 0xffff;
                        item.isExternalValueReference = true;
                        break;

                    case 8: // 8 byte data
                        item.data = new Buffer(8);
                        this.rowNodeInfo.pstNodeInputStream.seek(
                            long.fromNumber(this.rowNodeInfo.startOffset + currentValueArrayStart + this.columnDescriptors[col].ibData)
                        );
                        this.rowNodeInfo.pstNodeInputStream.readCompletely(item.data);
                        break;

                    default:
                        // Four byte data
                        item.entryValueReference = this.rowNodeInfo
                            .seekAndReadLong(long.fromNumber(currentValueArrayStart + this.columnDescriptors[col].ibData), 4)
                            .toNumber();
                        if (
                            this.columnDescriptors[col].type == 0x0003 ||
                            this.columnDescriptors[col].type == 0x0004 ||
                            this.columnDescriptors[col].type == 0x000a
                        ) {
                            // True 32bit data
                            item.isExternalValueReference = true;
                            break;
                        }

                        // Variable length data so it's an hnid
                        if ((item.entryValueReference & 0x1f) != 0) {
                            // Some kind of external reference...
                            item.isExternalValueReference = true;
                            break;
                        }

                        if (item.entryValueReference == 0) {
                            item.data = new Buffer(0);
                            break;
                        } else {
                            let entryInfo: NodeInfo = this.getNodeInfo(item.entryValueReference);
                            item.data = new Buffer(entryInfo.length());
                            entryInfo.pstNodeInputStream.seek(long.fromNumber(entryInfo.startOffset));
                            entryInfo.pstNodeInputStream.readCompletely(item.data);
                        }
                        break;
                }
                currentItem.set(item.entryType.toNumber(), item);
            }
            itemList[dataSetNumber] = currentItem;
            dataSetNumber++;
            currentValueArrayStart += this.TCI_bm;
        }
        Log.debug2('PSTTable7C::getItems number of items = ' + itemList.length);
        if (setLocalList) {
            this.items = itemList;
        }
        return itemList;
    }

    /**
     * Get the number of rows.
     * @readonly
     * @type {number}
     * @memberof PSTTable7C
     */
    public get rowCount(): number {
        return this.numberOfDataSets;
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
    public toJSON(): string {
        return (
            'PSTTable7C: ' +
            JSON.stringify(
                {
                    rowCount: this.rowCount,
                    numColumns: this.numColumns,
                    TCI_bm: this.TCI_bm,
                    TCI_1b: this.TCI_1b,
                    overrideCol: this.overrideCol,
                    numberOfKeys: this.numberOfKeys,
                    items: this.itemsJSON(),
                },
                null,
                2
            ) +
            '\n' +
            super.toJSON()
        );
    }
}
