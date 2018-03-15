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
import { PSTDescriptorItem } from './../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTObject } from './../PSTObject/PSTObject.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { NodeInfo } from '../NodeInfo/NodeInfo.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import * as long from 'long';

// The PST Table is the workhorse of the whole system.
// It allows for an item to be read and broken down into the individual properties that it consists of.
// For most PST Objects, it appears that only 7c and bc table types are used.
export abstract class PSTTable {
    protected tableType: string;
    protected tableTypeByte: number;
    protected hidUserRoot: number;
    protected arrayBlocks: long[];

    // info from the b5 header
    protected sizeOfItemKey: number;
    protected sizeOfItemValue: number;
    protected hidRoot: number;
    protected numberOfKeys = 0;
    protected numberOfIndexLevels = 0;
    private pstNodeInputStream: PSTNodeInputStream;
    private subNodeDescriptorItems: Map<number, PSTDescriptorItem> = null;

    /**
     * Creates an instance of PSTTable.  The PST Table is the workhorse of the whole system.
     * It allows for an item to be read and broken down into the individual properties that it consists of.
     * For most PST Objects, it appears that only 7C and BC table types are used.
     * @param {PSTNodeInputStream} pstNodeInputStream
     * @param {Map<number, PSTDescriptorItem>} subNodeDescriptorItems
     * @memberof PSTTable
     */
    constructor(pstNodeInputStream: PSTNodeInputStream, subNodeDescriptorItems: Map<number, PSTDescriptorItem>) {
        this.subNodeDescriptorItems = subNodeDescriptorItems;
        this.pstNodeInputStream = pstNodeInputStream;
        this.arrayBlocks = pstNodeInputStream.getBlockOffsets();

        // the next two bytes should be the table type (bSig)
        // 0xEC is HN (Heap-on-Node)
        pstNodeInputStream.seek(long.ZERO);
        let headdata = new Buffer(4);
        pstNodeInputStream.readCompletely(headdata);
        this.tableTypeByte = headdata[3];
        switch (this.tableTypeByte) { // bClientSig
            case 0x7c: // Table Context (TC/HN)
                this.tableType = '7c';
                break;
            case 188:
                this.tableType = 'bc'; // Property Context (PC/BTH)
                break;
            default:
                throw new Error('PSTTable::constructor Unable to parse table, bad table type.  Unknown identifier: 0x' + headdata[3].toString(16));
        }

        this.hidUserRoot = pstNodeInputStream.seekAndReadLong(long.fromValue(4), 4).toNumber(); // hidUserRoot

        // all tables should have a BTHHEADER at hnid == 0x20
        let headerNodeInfo: NodeInfo = this.getNodeInfo(0x20);
        headerNodeInfo.pstNodeInputStream.seek(long.fromValue(headerNodeInfo.startOffset));
        let headerByte = headerNodeInfo.pstNodeInputStream.read() & 0xff;
        if (headerByte != 0xb5) {
            headerNodeInfo.pstNodeInputStream.seek(long.fromValue(headerNodeInfo.startOffset));
            headerByte = headerNodeInfo.pstNodeInputStream.read() & 0xff;
            headerNodeInfo.pstNodeInputStream.seek(long.fromValue(headerNodeInfo.startOffset));
            let tmp = new Buffer(1024);
            headerNodeInfo.pstNodeInputStream.readCompletely(tmp);
            throw new Error("PSTTable::constructor Unable to parse table, can't find BTHHEADER header information: " + headerByte);
        }

        this.sizeOfItemKey = headerNodeInfo.pstNodeInputStream.read() & 0xff; // Size of key in key table
        this.sizeOfItemValue = headerNodeInfo.pstNodeInputStream.read() & 0xff; // Size of value in key table
        this.numberOfIndexLevels = headerNodeInfo.pstNodeInputStream.read() & 0xff;
        this.hidRoot = headerNodeInfo.seekAndReadLong(long.fromValue(4), 4).toNumber();
    }

    /**
     * Release data.
     * @protected
     * @memberof PSTTable
     */
    protected releaseRawData() {
        this.subNodeDescriptorItems = null;
    }

    /**
     * Number of items in table.
     * @readonly
     * @type {number}
     * @memberof PSTTable
     */
    public get rowCount(): number {
        return this.numberOfKeys;
    }

    /**
     * Get information for the node in the b-tree.
     * @param {number} hnid
     * @returns {NodeInfo}
     * @memberof PSTTable
     */
    public getNodeInfo(hnid: number): NodeInfo {
        // Zero-length node?
        if (hnid == 0) {
            return new NodeInfo(0, 0, this.pstNodeInputStream);
        }

        // Is it a subnode ID?
        if (this.subNodeDescriptorItems && this.subNodeDescriptorItems.has(hnid)) {
            let item: PSTDescriptorItem = this.subNodeDescriptorItems.get(hnid);
            let subNodeInfo: NodeInfo = null;

            try {
                let subNodeIn: PSTNodeInputStream = new PSTNodeInputStream(this.pstNodeInputStream.pstFile, item);
                subNodeInfo = new NodeInfo(0, subNodeIn.length.toNumber(), subNodeIn);
            } catch (err) {
                throw new Error('IOException reading subNode:\n' + err);
            }

            // return new NodeInfo(0, data.length, data);
            return subNodeInfo;
        }

        if ((hnid & 0x1f) != 0) {
            // Some kind of external node
            return null;
        }

        let whichBlock: number = hnid >>> 16;
        if (whichBlock > this.arrayBlocks.length) {
            throw new Error("PSTTable::getNodeInfo: block doesn't exist: " + hnid + ', ' + whichBlock + ', ' + this.arrayBlocks.length);
        }

        // A normal node in a local heap
        let index = (hnid & 0xffff) >> 5;
        let blockOffset = 0;
        if (whichBlock > 0) {
            blockOffset = this.arrayBlocks[whichBlock - 1].toNumber();
        }
        // Get offset of HN page map
        let iHeapNodePageMap = this.pstNodeInputStream.seekAndReadLong(long.fromValue(blockOffset), 2).toNumber() + blockOffset;
        let cAlloc = this.pstNodeInputStream.seekAndReadLong(long.fromValue(iHeapNodePageMap), 2).toNumber();
        if (index >= cAlloc + 1) {
            throw new Error("PSTTable::getNodeInfo: node index doesn't exist! nid = " + hnid);
        }
        iHeapNodePageMap += 2 * index + 2;
        let start = this.pstNodeInputStream.seekAndReadLong(long.fromValue(iHeapNodePageMap), 2).toNumber() + blockOffset;
        let end = this.pstNodeInputStream.seekAndReadLong(long.fromValue(iHeapNodePageMap + 2), 2).toNumber() + blockOffset;

        return new NodeInfo(start, end, this.pstNodeInputStream);
    }

    /**
     * JSON stringify the object properties.
     * @returns {string}
     * @memberof PSTTable
     */
    public toJSON(): any {
        let clone = Object.assign(
            {
                tableType: this.tableType,
                tableTypeByte: this.tableTypeByte,
                hidUserRoot: this.hidUserRoot,
                sizeOfItemKey: this.sizeOfItemKey,
                sizeOfItemValue: this.sizeOfItemValue,
                hidRoot: this.hidRoot,
                numberOfKeys: this.numberOfKeys,
                numberOfIndexLevels: this.numberOfIndexLevels
            },
            this
        );
        return clone;
    }
}
