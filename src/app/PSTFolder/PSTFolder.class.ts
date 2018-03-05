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
import { PSTObject } from './../PSTObject/PSTObject.class';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTTable7C } from '../PSTTable7C/PSTTable7C.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTTable7CItem } from '../PSTTable7CItem/PSTTable7CItem.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import * as long from 'long';
import { Log } from '../Log.class';

// Represents a folder in the PST File.  Allows you to access child folders or items.
// Items are accessed through a sort of cursor arrangement.  This allows for
// incremental reading of a folder which may have _lots_ of emails.
export class PSTFolder extends PSTObject {
    private subfoldersTable: PSTTable7C = null;
    private currentEmailIndex = 0;
    private emailsTable: PSTTable7C = null;
    private fallbackEmailsTable: DescriptorIndexNode[] = null;

    constructor(
        pstFile: PSTFile,
        descriptorIndexNode: DescriptorIndexNode,
        table?: PSTTableBC,
        localDescriptorItems?: Map<number, PSTDescriptorItem>
    ) {
        super();
        if (table) {
            // pre-populate folder object with values
            this.prePopulate(pstFile, descriptorIndexNode, table, localDescriptorItems);
        } else {
            // load folder object
            this.loadDescriptor(pstFile, descriptorIndexNode);
        }
    }

    // get all of the sub folders...
    // there are not usually thousands, so we just do it in one big operation.
    public getSubFolders(): PSTFolder[] {
        let output: PSTFolder[] = [];
        try {
            this.initSubfoldersTable();
            let itemMapSet: Map<number, PSTTable7CItem>[] = this.subfoldersTable.getItems();
            for (let itemMap of itemMapSet) {
                let item: PSTTable7CItem = itemMap.get(26610);
                let folder: PSTFolder = PSTUtil.detectAndLoadPSTObject(this.pstFile, long.fromNumber(item.entryValueReference));
                output.push(folder);
            }
        } catch (err) {
            Log.error("PSTFolder::getSubFolders Can't get child folders for folder " + this.displayName);
            throw err;
        }
        return output;
    }

    private initSubfoldersTable() {
        if (this.subfoldersTable) {
            return;
        }

        let folderDescriptorIndex: long = long.fromValue(this.descriptorIndexNode.descriptorIdentifier + 11);
        try {
            let folderDescriptor: DescriptorIndexNode = this.pstFile.getDescriptorIndexNode(folderDescriptorIndex);
            let tmp: Map<number, PSTDescriptorItem> = null;
            if (folderDescriptor.localDescriptorsOffsetIndexIdentifier.greaterThan(0)) {
                tmp = this.pstFile.getPSTDescriptorItems(folderDescriptor.localDescriptorsOffsetIndexIdentifier);
            }
            let offsetIndexItem = this.pstFile.getOffsetIndexNode(folderDescriptor.dataOffsetIndexIdentifier);
            let pstNodeInputStream = new PSTNodeInputStream(this.pstFile, offsetIndexItem);
            this.subfoldersTable = new PSTTable7C(pstNodeInputStream, tmp);
        } catch (err) {
            Log.error("PSTFolder::initSubfoldersTable Can't get child folders for folder " + this.displayName);
            throw err;
        }
    }

    // get all of the children
    private initEmailsTable() {
        if (this.emailsTable != null || this.fallbackEmailsTable != null) {
            return;
        }

        // some folder types don't have children:
        if (this.getNodeType() == PSTUtil.NID_TYPE_SEARCH_FOLDER) {
            return;
        }

        try {
            let folderDescriptorIndex = this.descriptorIndexNode.descriptorIdentifier + 12; 
            let folderDescriptor: DescriptorIndexNode = this.pstFile.getDescriptorIndexNode(long.fromNumber(folderDescriptorIndex));
            let tmp: Map<number, PSTDescriptorItem> = null;
            if (folderDescriptor.localDescriptorsOffsetIndexIdentifier.greaterThan(0)) {
                tmp = this.pstFile.getPSTDescriptorItems(folderDescriptor.localDescriptorsOffsetIndexIdentifier);
            }
            const offsetIndexItem = this.pstFile.getOffsetIndexNode(folderDescriptor.dataOffsetIndexIdentifier);
            const pstNodeInputStream = new PSTNodeInputStream(this.pstFile, offsetIndexItem);
            this.emailsTable = new PSTTable7C(pstNodeInputStream, tmp, 0x67F2);
        } catch (err) {
            Log.error("PSTFolder::initEmailsTable Can't get child folders for folder " + this.displayName);
            throw err;
        }
    }

     // Get the next child of this folder as there could be thousands of emails, we have these kind of cursor operations
    public getNextChild(): any {
        this.initEmailsTable();

        if (this.emailsTable != null) {
            let rows: Map<number, PSTTable7CItem>[] = this.emailsTable.getItems(this.currentEmailIndex, 1);

            if (this.currentEmailIndex == this.contentCount) {
                // no more!
                return null;
            }
            // get the emails from the rows
            let emailRow: PSTTable7CItem = rows[0].get(0x67F2);
            let childDescriptor: DescriptorIndexNode = this.pstFile.getDescriptorIndexNode(long.fromNumber(emailRow.entryValueReference));
            let child: PSTObject = PSTUtil.detectAndLoadPSTObject(this.pstFile, childDescriptor);
            this.currentEmailIndex++;
            return child;
        } else if (this.fallbackEmailsTable != null) {
            if (this.currentEmailIndex >= this.contentCount || this.currentEmailIndex >= this.fallbackEmailsTable.length) {
                // no more!
                return null;
            }
            // get the emails from the rows
            let childDescriptor: DescriptorIndexNode = this.fallbackEmailsTable[this.currentEmailIndex];
            let child: PSTObject = PSTUtil.detectAndLoadPSTObject(this.pstFile, childDescriptor);
            this.currentEmailIndex++;
            return child;
        }
        return null;
    }

    //  move the internal folder cursor to the desired position
    //  position 0 is before the first record.
    public moveChildCursorTo(newIndex: number) {
        this.initEmailsTable();

        if (newIndex < 1) {
            this.currentEmailIndex = 0;
            return;
        }
        if (newIndex > this.contentCount) {
            newIndex = this.contentCount;
        }
        this.currentEmailIndex = newIndex;
    }

    // the number of child folders in this folder
    public get subFolderCount(): number {
        this.initSubfoldersTable();
        if (this.subfoldersTable != null) {
            return this.subfoldersTable.getRowCount();
        } else {
            return 0;
        }
    }

    // number of emails in this folder
    public get emailCount(): number {
        this.initEmailsTable();
        if (this.emailsTable == null) {
            return -1;
        }
        return this.emailsTable.getRowCount();
    }

    public get folderType(): number {
        return this.getIntItem(0x3601);
    }

     // the number of emails in this folder this is as reported by the PST file, 
     // for a number calculated by the library use getEmailCount
    public get contentCount(): number {
        return this.getIntItem(0x3602);
    }

    //  number unread content items
    public get unreadCount(): number {
        return this.getIntItem(0x3603);
    }

    //  does this folder have subfolders
    //  once again, read from the PST, use getSubFolderCount if you want to know
    //  what the library makes of it all
    public get hasSubfolders(): boolean {
        return this.getIntItem(0x360a) != 0;
    }

    public get containerClass() {
        return this.getStringItem(0x3613);
    }

    public get associateContentCount() {
        return this.getIntItem(0x3617);
    }

    public get containerFlags() {
        return this.getIntItem(0x3600);
    }

    public toString() {
        return (
            '\n subFolderCount: ' + this.subFolderCount + 
            '\n emailCount: ' + this.emailCount + 
            '\n folderType: ' + this.folderType + 
            '\n contentCount: ' + this.contentCount + 
            '\n unreadCount: ' + this.unreadCount + 
            '\n hasSubfolders: ' + this.hasSubfolders + 
            '\n containerClass: ' + this.containerClass + 
            '\n associateContentCount: ' + this.associateContentCount + 
            '\n containerFlags: ' + this.containerFlags 
        );
    }

    public toJSONstring(): string {
        return JSON.stringify({
            subFolderCount: this.subFolderCount,
            emailCount: this.emailCount,
            folderType: this.folderType,
            contentCount: this.contentCount,
            unreadCount: this.unreadCount,
            hasSubfolders: this.hasSubfolders,
            containerClass: this.containerClass,
            associateContentCount: this.associateContentCount,
            containerFlags: this.containerFlags
        }, null, 2);
    }

}
