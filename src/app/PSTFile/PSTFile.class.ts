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
import { NodeMap } from './NodeMap.class';
import { PSTFolder } from './../PSTFolder/PSTFolder.class';
import { PSTMessageStore } from './../PSTMessageStore/PSTMessageStore.class';
import { DescriptorIndexNode } from './../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTDescriptorItem } from './../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTNodeInputStream } from './../PSTNodeInputStream/PSTNodeInputStream.class';
import { OffsetIndexItem } from './../OffsetIndexItem/OffsetIndexItem.class';
import { PSTObject } from './../PSTObject/PSTObject.class';
import { PSTFileContent } from '../PSTFileContent/PSTFileContent.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { PSTTableItem } from '../PSTTableItem/PSTTableItem.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import { Log } from '../Log.class';
import * as fs from 'fs';
import * as fsext from 'fs-ext';
import * as util from 'util';
import * as long from 'long';
const uuidparse = require('uuid-parse');

export class PSTFile {
    public static ENCRYPTION_TYPE_NONE: number = 0;
    public static ENCRYPTION_TYPE_COMPRESSIBLE: number = 1;
    public static MESSAGE_STORE_DESCRIPTOR_IDENTIFIER: number = 33;
    public static ROOT_FOLDER_DESCRIPTOR_IDENTIFIER: number = 290;
    public static PST_TYPE_ANSI: number = 14;
    public static PST_TYPE_ANSI_2: number = 15;
    public static PST_TYPE_UNICODE: number = 23;
    public static PST_TYPE_2013_UNICODE: number = 36;
    public static PS_PUBLIC_STRINGS: number = 0;
    public static PS_INTERNET_HEADERS: number = 3;
    public static PSETID_Messaging: number = 7;
    public static PSETID_Note: number = 8;
    public static PSETID_PostRss: number = 9;
    public static PSETID_Task: number = 10;
    public static PSETID_UnifiedMessaging: number = 11;
    public static PS_MAPI: number = 12;
    public static PSETID_AirSync: number = 13;
    public static PSETID_Sharing: number = 14;

    private guidMap: Map<string, number> = new Map([
        ['00020329-0000-0000-C000-000000000046', 0],
        ['00062008-0000-0000-C000-000000000046', 1],
        ['00062004-0000-0000-C000-000000000046', 2],
        ['00020386-0000-0000-C000-000000000046', 3],
        ['00062002-0000-0000-C000-000000000046', 4],
        ['6ED8DA90-450B-101B-98DA-00AA003F1305', 5],
        ['0006200A-0000-0000-C000-000000000046', 6],
        ['41F28F13-83F4-4114-A584-EEDB5A6B0BFF', 7],
        ['0006200E-0000-0000-C000-000000000046', 8],
        ['00062041-0000-0000-C000-000000000046', 9],
        ['00062003-0000-0000-C000-000000000046', 10],
        ['4442858E-A9E3-4E80-B900-317A210CC15B', 11],
        ['00020328-0000-0000-C000-000000000046', 12],
        ['71035549-0739-4DCB-9163-00F0580DBBDF', 13],
        ['00062040-0000-0000-C000-000000000046', 14]
    ]);
    private guids: Buffer;

    // the type of encryption the files uses
    private _encryptionType = 0;
    get encryptionType(): number {
        return this._encryptionType;
    }

    // type of file (e.g. ANSI)
    private _pstFileType = 0;
    public get pstFileType(): number {
        return this._pstFileType;
    }

    private _pstFilename: string;
    public get pstFilename(): string {
        return this._pstFilename;
    }

    private _pstFileContent: PSTFileContent;
    public get pstFileContent() {
        return this._pstFileContent;
    }

    // node tree maps
    private static nodeMap: NodeMap = new NodeMap();

    // file descriptor
    private pstFD: number;

    public constructor(fileName: string) {
        this._pstFilename = fileName;
        this.open();
    }

    public open() {
        // attempt to open file
        // confirm first 4 bytes are !BDN
        this.pstFD = fsext.openSync(this._pstFilename, 'r');
        this._pstFileContent = new PSTFileContent(this.pstFD);
        let buffer = new Buffer(514);
        fs.readSync(this.pstFD, buffer, 0, 514, 0);
        let key = '!BDN';
        if (buffer[0] != key.charCodeAt(0) || buffer[1] != key.charCodeAt(1) || buffer[2] != key.charCodeAt(2) || buffer[3] != key.charCodeAt(3)) {
            throw new Error('PSTFile::open Invalid file header (expected: "!BDN"): ' + buffer);
        }

        // make sure we are using a supported version of a PST...
        if (buffer[10] === PSTFile.PST_TYPE_ANSI_2) {
            buffer[10] = PSTFile.PST_TYPE_ANSI;
        }
        if (buffer[10] !== PSTFile.PST_TYPE_ANSI && buffer[10] !== PSTFile.PST_TYPE_UNICODE && buffer[10] !== PSTFile.PST_TYPE_2013_UNICODE) {
            throw new Error('PSTFile::open Unrecognised PST File version: ' + buffer[10]);
        }
        this._pstFileType = buffer[10];

        // make sure no encryption
        if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
            this._encryptionType = buffer[461];
        } else {
            this._encryptionType = buffer[513];
        }
        if (this._encryptionType === 0x02) {
            throw new Error('PSTFile::open PST is encrypted');
        }

        // build out name to id map
        this.processNameToIDMap();
    }

    public close() {
        fsext.closeSync(this.pstFD);
    }

    private processNameToIDMap() {
        // process the name to id map
        let nameToIdMapDescriptorNode = this.getDescriptorIndexNode(long.fromNumber(97));

        // get the descriptors if we have them
        let localDescriptorItems;
        if (nameToIdMapDescriptorNode.localDescriptorsOffsetIndexIdentifier) {
            localDescriptorItems = this.getPSTDescriptorItems(nameToIdMapDescriptorNode.localDescriptorsOffsetIndexIdentifier);
        }

        // process the map
        let off: OffsetIndexItem = this.getOffsetIndexNode(nameToIdMapDescriptorNode.dataOffsetIndexIdentifier);
        let nodein = new PSTNodeInputStream(this, off);
        let bcTable = new PSTTableBC(nodein);
        let tableItems: Map<number, PSTTableItem> = bcTable.getItems();

        // Get the guids
        let guidEntry: PSTTableItem = tableItems.get(2);
        this.guids = this.getData(guidEntry, localDescriptorItems);
        let nGuids = Math.trunc(this.guids.length / 16);
        let guidIndexes: number[] = [];
        let offset = 0;
        for (let i = 0; i < nGuids; ++i) {
            let leftQuad: long = PSTUtil.convertLittleEndianBytesToLong(this.guids, offset, offset + 4);
            leftQuad = leftQuad.shiftLeft(32);
            let midQuad: long = PSTUtil.convertLittleEndianBytesToLong(this.guids, offset + 4, offset + 6);
            midQuad = midQuad.shiftLeft(16);
            let rightQuad: long = PSTUtil.convertLittleEndianBytesToLong(this.guids, offset + 6, offset + 8);
            let mostSigBits: long = leftQuad.or(midQuad).or(rightQuad);
            let leastSigBits: long = PSTUtil.convertBigEndianBytesToLong(this.guids, offset + 8, offset + 16);
            let mostBuffer: number[] = mostSigBits.toBytes();
            let leastBuffer: number[] = leastSigBits.toBytes();
            let arrUID = [].concat(mostBuffer, leastBuffer);
            let strUID: string = uuidparse.unparse(arrUID).toUpperCase();

            if (this.guidMap.has(strUID)) {
                guidIndexes[i] = this.guidMap.get(strUID);
            } else {
                guidIndexes[i] = -1; // We don't know this guid
            }
            Log.debug2('PSTFile:: processNameToIdMap idx: ' + i + ', ' + strUID + ', ' + guidIndexes[i]);
            offset += 16;
        }

        // if we have a reference to an internal descriptor
        let mapEntries: PSTTableItem = tableItems.get(3);
        let nameToIdByte: Buffer = this.getData(mapEntries, localDescriptorItems);
        let stringMapEntries: PSTTableItem = tableItems.get(4);
        let stringNameToIdByte: Buffer = this.getData(stringMapEntries, localDescriptorItems);

        // process the entries
        for (let x = 0; x + 8 < nameToIdByte.length; x += 8) {
            let dwPropertyId: number = PSTUtil.convertLittleEndianBytesToLong(nameToIdByte, x, x + 4).toNumber();
            let guid: number = PSTUtil.convertLittleEndianBytesToLong(nameToIdByte, x + 4, x + 6).toNumber();
            let propId: number = PSTUtil.convertLittleEndianBytesToLong(nameToIdByte, x + 6, x + 8).toNumber();

            if ((guid & 0x0001) == 0) {
                // identifier is numeric
                propId += 0x8000;
                guid >>= 1;
                let guidIndex: number;
                if (guid == 1) {
                    guidIndex = PSTFile.PS_MAPI;
                } else if (guid == 2) {
                    guidIndex = PSTFile.PS_PUBLIC_STRINGS;
                } else {
                    guidIndex = guidIndexes[guid - 3];
                }
                PSTFile.nodeMap.setId(dwPropertyId, propId, guidIndex);
            } else {
                // identifier is a string
                // dwPropertyId is byte offset into the String stream
                // in which the string name of the property is stored.
                let len = PSTUtil.convertLittleEndianBytesToLong(stringNameToIdByte, dwPropertyId, dwPropertyId + 4).toNumber();
                let keyByteValue = new Buffer(len);
                PSTUtil.arraycopy(stringNameToIdByte, dwPropertyId + 4, keyByteValue, 0, keyByteValue.length);
                propId += 0x8000;
                let key = keyByteValue.toString('utf16le').replace(/\0/g, '');
                PSTFile.nodeMap.setId(key, propId);
            }
        }
    }

    private getData(item: PSTTableItem, localDescriptorItems: Map<number, PSTDescriptorItem>): Buffer {
        if (item.data.length != 0) {
            return item.data;
        }

        if (localDescriptorItems == null) {
            throw new Error('PSTFile::getData External reference but no localDescriptorItems in PSTFile.getData()');
        }

        if (item.entryValueType != 0x0102) {
            throw new Error('PSTFile::getData Attempting to get non-binary data in PSTFile.getData()');
        }

        let mapDescriptorItem: PSTDescriptorItem = localDescriptorItems.get(item.entryValueReference);
        if (mapDescriptorItem == null) {
            throw new Error('PSTFile::getData Descriptor not found: ' + item.entryValueReference);
        }
        return mapDescriptorItem.getData();
    }

    // TODO - resolve static issue (should these functions be static?  not so sure)
    public getNameToIdMapItem(key: number, idx: number): number {
        return PSTFile.nodeMap.getId(key, idx);
    }

    public static getPublicStringToIdMapItem(key: string): number {
        return PSTFile.nodeMap.getId(key);    
    }

    public static getPropertyName(propertyId: number, bNamed: boolean): string {
        return PSTUtil.propertyName.get(propertyId);
    }

    public static getNameToIdMapKey(propId: number): long {
        return PSTFile.nodeMap.getNumericName(propId);
    }

    public static getPropertyDescription(entryType: number, entryValueType: number): string {
        let ret = '';
        if (entryType < 0x8000) {
            let name = this.getPropertyName(entryType, false);
            if (name != null) {
                ret = name + ':' + entryValueType.toString(16) + ':';
            } else {
                ret = entryType.toString(16) + ':' + entryValueType.toString(16) + ':';
            }
        } else {
            let type = PSTFile.getNameToIdMapKey(entryType);
            if (!type) {
                ret = '0xFFFF(' + entryType.toString(16) + '):' + entryValueType.toString(16) + ':';
            } else {
                let name = this.getPropertyName(type.toNumber(), true);
                if (name != null) {
                    ret = name + '(' + entryType.toString(16) + '):' + entryValueType.toString(16) + ':';
                } else {
                    ret = '0x' + type.toString(16) + '(' + entryType.toString(16) + '):' + entryValueType.toString(16) + ':';
                }
            }
        }
        return ret;
    }

    // Get the message store of the PST file.  Note that this doesn't really
    // have much information, better to look under the root folder.
    public getMessageStore(): PSTMessageStore {
        let messageStoreDescriptor: DescriptorIndexNode = this.getDescriptorIndexNode(long.fromNumber(PSTFile.MESSAGE_STORE_DESCRIPTOR_IDENTIFIER));
        return new PSTMessageStore(this, messageStoreDescriptor);
    }

    // get the root folder for the PST file
    public getRootFolder(): PSTFolder {
        let rootFolderDescriptor: DescriptorIndexNode = this.getDescriptorIndexNode(long.fromValue(PSTFile.ROOT_FOLDER_DESCRIPTOR_IDENTIFIER));
        let output: PSTFolder = new PSTFolder(this, rootFolderDescriptor);
        return output;
    }

    public readLeaf(bid: long): PSTNodeInputStream {
        // get the index node for the descriptor index
        let offsetItem = this.getOffsetIndexNode(bid);
        return new PSTNodeInputStream(this, offsetItem);
    }

    public getLeafSize(bid: long): number {
        let offsetItem: OffsetIndexItem = this.getOffsetIndexNode(bid);

        // Internal block?
        if ((offsetItem.indexIdentifier.toNumber() & 0x02) == 0) {
            // No, return the raw size
            return offsetItem.size;
        }

        // we only need the first 8 bytes
        let data: Buffer = new Buffer(8);
        this.pstFileContent.seek(offsetItem.fileOffset);
        this.pstFileContent.readCompletely(data);

        // we are an array, get the sum of the sizes...
        return PSTUtil.convertLittleEndianBytesToLong(data, 4, 8).toNumber();
    }

    // get file offset, which is sorted in 8 little endian bytes
    private extractLEFileOffset(startOffset: long): long {
        let offset: long = long.ZERO;
        if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
            this.pstFileContent.seek(startOffset);
            let buffer = new Buffer(4);
            this.pstFileContent.readCompletely(buffer);
            offset = offset.or(buffer[3] & 0xff);
            offset = offset.shiftLeft(8);
            offset = offset.or(buffer[2] & 0xff);
            offset = offset.shiftLeft(8);
            offset = offset.or(buffer[1] & 0xff);
            offset = offset.shiftLeft(8);
            offset = offset.or(buffer[0] & 0xff);
        } else {
            this.pstFileContent.seek(startOffset);
            let buffer = new Buffer(8);
            this.pstFileContent.readCompletely(buffer);
            offset = offset.or(buffer[7] & 0xff);
            let tmpLongValue: number;
            for (let x = 6; x >= 0; x--) {
                offset = offset.shiftLeft(8);
                tmpLongValue = buffer[x] & 0xff;
                offset = offset.or(tmpLongValue);
            }
        }
        return offset;
    }

    // navigate PST B-tree
    private findBtreeItem(index: long, descTree: boolean): Buffer {
        let btreeStartOffset: long;
        let fileTypeAdjustment: number;

        // first find the starting point for the offset index
        if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
            btreeStartOffset = this.extractLEFileOffset(long.fromValue(196));
            if (descTree) {
                btreeStartOffset = this.extractLEFileOffset(long.fromValue(188));
            }
        } else {
            btreeStartOffset = this.extractLEFileOffset(long.fromValue(240));
            if (descTree) {
                btreeStartOffset = this.extractLEFileOffset(long.fromValue(224));
            }
        }

        // okay, what we want to do is navigate the tree until you reach the bottom....
        // try and read the index b-tree
        let buffer = new Buffer(2);
        if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
            fileTypeAdjustment = 500;
        } else if (this._pstFileType === PSTFile.PST_TYPE_2013_UNICODE) {
            fileTypeAdjustment = 0x1000 - 24;
        } else {
            fileTypeAdjustment = 496;
        }
        this.pstFileContent.seek(btreeStartOffset.add(fileTypeAdjustment));
        this.pstFileContent.readCompletely(buffer);

        let b2 = new Buffer(2);
        b2[0] = 0xff80;
        b2[1] = 0xff81;

        // ensure apples to apples comparison
        while ((buffer[0] === b2[0] && buffer[1] === b2[0] && !descTree) || (buffer[0] === b2[1] && buffer[1] === b2[1] && descTree)) {
            // get the rest of the data
            let len: number;
            if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
                len = 496;
            } else if (this._pstFileType == PSTFile.PST_TYPE_2013_UNICODE) {
                len = 4056;
            } else {
                len = 488;
            }
            let branchNodeItems = new Buffer(len);
            this.pstFileContent.seek(btreeStartOffset);
            this.pstFileContent.readCompletely(branchNodeItems);

            Log.debug2('PSTFile::findBtreeItem btreeStartOffset = ' + btreeStartOffset);

            let numberOfItems = 0;
            if (this._pstFileType === PSTFile.PST_TYPE_2013_UNICODE) {
                let numberOfItemsBytes = new Buffer(2);
                this.pstFileContent.readCompletely(numberOfItemsBytes);
                numberOfItems = PSTUtil.convertLittleEndianBytesToLong(numberOfItemsBytes).toNumber();
                this.pstFileContent.readCompletely(numberOfItemsBytes);
            } else {
                numberOfItems = this.pstFileContent.read();
                this.pstFileContent.read(); // maxNumberOfItems
            }
            let itemSize = this.pstFileContent.read(); // itemSize
            let levelsToLeaf = this.pstFileContent.read();

            if (levelsToLeaf > 0) {
                let found = false;
                for (let x = 0; x < numberOfItems; x++) {
                    if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
                        let indexIdOfFirstChildNode = this.extractLEFileOffset(btreeStartOffset.add(x * 12));
                        if (indexIdOfFirstChildNode > index) {
                            // get the address for the child first node in this group
                            btreeStartOffset = this.extractLEFileOffset(btreeStartOffset.add((x - 1) * 12 + 8));
                            this.pstFileContent.seek(btreeStartOffset.add(500));
                            this.pstFileContent.readCompletely(buffer);
                            found = true;
                            break;
                        }
                    } else {
                        let indexIdOfFirstChildNode = this.extractLEFileOffset(btreeStartOffset.add(x * 24));
                        if (indexIdOfFirstChildNode.greaterThan(index)) {
                            // get the address for the child first node in this group
                            btreeStartOffset = this.extractLEFileOffset(btreeStartOffset.add((x - 1) * 24 + 16));
                            this.pstFileContent.seek(btreeStartOffset.add(fileTypeAdjustment));
                            this.pstFileContent.readCompletely(buffer);
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    // it must be in the very last branch...
                    if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
                        btreeStartOffset = this.extractLEFileOffset(btreeStartOffset.add((numberOfItems - 1) * 12 + 8));
                        this.pstFileContent.seek(btreeStartOffset.add(500));
                        this.pstFileContent.readCompletely(buffer);
                    } else {
                        btreeStartOffset = this.extractLEFileOffset(btreeStartOffset.add((numberOfItems - 1) * 24 + 16));
                        this.pstFileContent.seek(btreeStartOffset.add(fileTypeAdjustment));
                        this.pstFileContent.readCompletely(buffer);
                    }
                }
            } else {
                // we are at the bottom of the tree...
                // we want to get our file offset!
                for (let x = 0; x < numberOfItems; x++) {
                    if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
                        if (descTree) {
                            // The 32-bit descriptor index b-tree leaf node item
                            buffer = new Buffer(4);
                            this.pstFileContent.seek(btreeStartOffset.add(x * 16));
                            this.pstFileContent.readCompletely(buffer);
                            if (PSTUtil.convertLittleEndianBytesToLong(buffer).equals(index)) {
                                // give me the offset index please!
                                buffer = new Buffer(16);
                                this.pstFileContent.seek(btreeStartOffset.add(x * 16));
                                this.pstFileContent.readCompletely(buffer);
                                return buffer;
                            }
                        } else {
                            // The 32-bit (file) offset index item
                            let indexIdOfFirstChildNode = this.extractLEFileOffset(btreeStartOffset.add(x * 12));
                            if (indexIdOfFirstChildNode.equals(index)) {
                                // we found it!
                                buffer = new Buffer(12);
                                this.pstFileContent.seek(btreeStartOffset.add(x * 12));
                                this.pstFileContent.readCompletely(buffer);
                                Log.debug2('PSTFile::findBtreeItem ' + index.toString() + ' found!');
                                return buffer;
                            }
                        }
                    } else {
                        if (descTree) {
                            // The 64-bit descriptor index b-tree leaf node item
                            buffer = new Buffer(4);
                            this.pstFileContent.seek(btreeStartOffset.add(x * 32));
                            this.pstFileContent.readCompletely(buffer);
                            if (PSTUtil.convertLittleEndianBytesToLong(buffer).equals(index)) {
                                // give me the offset index please!
                                buffer = new Buffer(32);
                                this.pstFileContent.seek(btreeStartOffset.add(x * 32));
                                this.pstFileContent.readCompletely(buffer);
                                Log.debug2('PSTFile::findBtreeItem ' + index.toString() + ' found!');
                                return buffer;
                            }
                        } else {
                            // The 64-bit (file) offset index item
                            let indexIdOfFirstChildNode = this.extractLEFileOffset(btreeStartOffset.add(x * 24));
                            if (indexIdOfFirstChildNode.equals(index)) {
                                // we found it
                                buffer = new Buffer(24);
                                this.pstFileContent.seek(btreeStartOffset.add(x * 24));
                                this.pstFileContent.readCompletely(buffer);
                                Log.debug2('PSTFile::findBtreeItem ' + index.toString() + ' found!');
                                return buffer;
                            }
                        }
                    }
                }
                throw new Error('PSTFile::findBtreeItem Unable to find ' + index + ' is desc: ' + descTree);
            }
        }
        throw new Error('PSTFile::findBtreeItem Unable to find node: ' + index + ' is desc: ' + descTree);
    }

    // navigate the internal descriptor B-Tree and find a specific item
    public getDescriptorIndexNode(id: long): DescriptorIndexNode {
        Log.debug2('PSTFile::getDescriptorIndexNode ' + id.toString())
        return new DescriptorIndexNode(this.findBtreeItem(id, true), this._pstFileType);
    }

    // navigate b-tree index and find specific item
    public getOffsetIndexNode(id: long): OffsetIndexItem {
        return new OffsetIndexItem(this.findBtreeItem(id, false), this._pstFileType);
    }

    // parse a PSTDescriptor and get all of its items
    public getPSTDescriptorItems(localDescriptorsOffsetIndexIdentifier: long): Map<number, PSTDescriptorItem>;
    public getPSTDescriptorItems(inputStream: PSTNodeInputStream): Map<number, PSTDescriptorItem>;
    public getPSTDescriptorItems(arg: any): Map<number, PSTDescriptorItem> {
        let inputStream: PSTNodeInputStream = arg;
        if (arg instanceof long) {
            inputStream = this.readLeaf(arg);
        }

        // make sure the signature is correct
        inputStream.seek(long.ZERO);
        let sig = inputStream.read();
        if (sig != 0x2) {
            throw new Error('PSTFile::getPSTDescriptorItems Unable to process descriptor node, bad signature: ' + sig);
        }

        let output = new Map();
        let numberOfItems = inputStream.seekAndReadLong(long.fromValue(2), 2);
        let offset;
        if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
            offset = 4;
        } else {
            offset = 8;
        }

        let data = new Buffer(inputStream.length.toNumber());
        inputStream.seek(long.ZERO);
        inputStream.readCompletely(data);

        for (let x = 0; x < numberOfItems.toNumber(); x++) {
            let item: PSTDescriptorItem = new PSTDescriptorItem(data, offset, this);
            output.set(item.descriptorIdentifier, item);
            if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
                offset += 12;
            } else {
                offset += 24;
            }
        }

        return output;
    }

    public toJSONstring(): string {
        return JSON.stringify({
            encryptionType: this.encryptionType,
            pstFileType: this.pstFileType,
            pstFilename: this.pstFilename
        }, null, 2);
    }
}
