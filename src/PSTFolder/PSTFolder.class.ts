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
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import * as long from 'long';
import { Log } from '../Log.class';
import { PSTTableItem } from '../PSTTableItem/PSTTableItem.class';
import { OutlookProperties } from '../OutlookProperties';

/**
 * Represents a folder in the PST File.  Allows you to access child folders or items.
 * Items are accessed through a sort of cursor arrangement.  This allows for
 * incremental reading of a folder which may have _lots_ of emails.
 * @export
 * @class PSTFolder
 * @extends {PSTObject}
 */
export class PSTFolder extends PSTObject {
    private currentEmailIndex = 0;
    private subfoldersTable: PSTTable7C | null =  null;
    private emailsTable: PSTTable7C | null =  null;
    private fallbackEmailsTable: DescriptorIndexNode[] | null = null;

    /**
     * Creates an instance of PSTFolder.
     * Represents a folder in the PST File.  Allows you to access child folders or items.
     * Items are accessed through a sort of cursor arrangement.  This allows for
     * incremental reading of a folder which may have _lots_ of emails.
     * @param {PSTFile} pstFile
     * @param {DescriptorIndexNode} descriptorIndexNode
     * @param {PSTTableBC} [table]
     * @param {Map<number, PSTDescriptorItem>} [localDescriptorItems]
     * @memberof PSTFolder
     */
    constructor(
        pstFile: PSTFile,
        descriptorIndexNode: DescriptorIndexNode,
        table?: PSTTableBC,
        localDescriptorItems?: Map<number, PSTDescriptorItem>
    ) {
        super(pstFile, descriptorIndexNode);
        if (table) {
            // pre-populate folder object with values
            this.prePopulate(descriptorIndexNode, table, localDescriptorItems);
        }
    }

    /**
     * Get folders in one fell swoop, since there's not usually thousands of them.
     * @returns {PSTFolder[]}
     * @memberof PSTFolder
     */
    public getSubFolders(): PSTFolder[] {
        let output: PSTFolder[] = [];
        try {
            this.initSubfoldersTable();
            if (this.subfoldersTable) {
                let itemMapSet = this.subfoldersTable.getItems();
                for (let itemMap of itemMapSet) {
                    let item = itemMap.get(26610);
                    if (item) {
                        output.push(PSTUtil.detectAndLoadPSTObject(this.pstFile, long.fromNumber(item.entryValueReference)));
                    }
                }
            }
        } catch (err) {
            Log.error("PSTFolder::getSubFolders Can't get child folders for folder " + this.displayName + '\n' + err);
            throw err;
        }
        return output;
    }

    /**
     * Load subfolders table.
     * @private
     * @returns
     * @memberof PSTFolder
     */
    private initSubfoldersTable() {
        if (this.subfoldersTable) {
            return;
        }
        if(!this.descriptorIndexNode) {
            throw new Error('PSTFolder::initSubfoldersTable descriptorIndexNode is null');
        }

        let folderDescriptorIndex: long = long.fromValue(this.descriptorIndexNode.descriptorIdentifier + 11);
        try {
            let folderDescriptor: DescriptorIndexNode = this.pstFile.getDescriptorIndexNode(folderDescriptorIndex);
            let tmp = undefined;
            if (folderDescriptor.localDescriptorsOffsetIndexIdentifier.greaterThan(0)) {
                tmp = this.pstFile.getPSTDescriptorItems(folderDescriptor.localDescriptorsOffsetIndexIdentifier);
            }
            let offsetIndexItem = this.pstFile.getOffsetIndexNode(folderDescriptor.dataOffsetIndexIdentifier);
            let pstNodeInputStream = new PSTNodeInputStream(this.pstFile, offsetIndexItem);
            this.subfoldersTable = new PSTTable7C(pstNodeInputStream, tmp);
        } catch (err) {
            Log.error("PSTFolder::initSubfoldersTable Can't get child folders for folder " + this.displayName + '\n' + err);
            throw err;
        }
    }

    // get all of the children
    private initEmailsTable() {
        if (this.emailsTable || this.fallbackEmailsTable) {
            return;
        }

        // some folder types don't have children:
        if (this.getNodeType() == PSTUtil.NID_TYPE_SEARCH_FOLDER) {
            return;
        }
        if(!this.descriptorIndexNode) {
            throw new Error('PSTFolder::initEmailsTable descriptorIndexNode is null');
        }

        try {
            let folderDescriptorIndex = this.descriptorIndexNode.descriptorIdentifier + 12;
            let folderDescriptor: DescriptorIndexNode = this.pstFile.getDescriptorIndexNode(long.fromNumber(folderDescriptorIndex));
            let tmp = undefined;
            if (folderDescriptor.localDescriptorsOffsetIndexIdentifier.greaterThan(0)) {
                tmp = this.pstFile.getPSTDescriptorItems(folderDescriptor.localDescriptorsOffsetIndexIdentifier);
            }
            const offsetIndexItem = this.pstFile.getOffsetIndexNode(folderDescriptor.dataOffsetIndexIdentifier);
            const pstNodeInputStream = new PSTNodeInputStream(this.pstFile, offsetIndexItem);
            this.emailsTable = new PSTTable7C(pstNodeInputStream, tmp, 0x67f2);
        } catch (err) {
            // fallback to children as listed in the descriptor b-tree
            Log.error(`PSTFolder::initEmailsTable Can't get child folders for folder {this.displayName}, resorting to using alternate tree`);
            let tree = this.pstFile.getChildDescriptorTree();
            this.fallbackEmailsTable = [];
            let allChildren = tree.get(this.descriptorIndexNode.descriptorIdentifier);
            if (allChildren) {
                // remove items that aren't messages
                for (let node of allChildren) {
                    if (node != null && this.getNodeType(node.descriptorIdentifier) == PSTUtil.NID_TYPE_NORMAL_MESSAGE) {
                        this.fallbackEmailsTable.push(node);
                    }
                }
            }
        }
    }

    /**
     * Get the next child of this folder. As there could be thousands of emails, we have these
     * kind of cursor operations.
     * @returns {*}
     * @memberof PSTFolder
     */
    public getNextChild(): any {
        this.initEmailsTable();

        if (this.emailsTable) {
            if (this.currentEmailIndex == this.contentCount) {
                // no more!
                return null;
            }

            // get the emails from the rows in the main email table
            let rows: Map<number, PSTTableItem>[] = this.emailsTable.getItems(this.currentEmailIndex, 1);
            let emailRow = rows[0].get(0x67f2);
            if ((emailRow && emailRow.itemIndex == -1) || !emailRow) {
                // no more!
                return null;
            }

            let childDescriptor = this.pstFile.getDescriptorIndexNode(long.fromNumber(emailRow.entryValueReference));
            let child = PSTUtil.detectAndLoadPSTObject(this.pstFile, childDescriptor);
            this.currentEmailIndex++;
            return child;
        } else if (this.fallbackEmailsTable) {
            if (this.currentEmailIndex >= this.contentCount || this.currentEmailIndex >= this.fallbackEmailsTable.length) {
                // no more!
                return null;
            }

            let childDescriptor = this.fallbackEmailsTable[this.currentEmailIndex];
            let child = PSTUtil.detectAndLoadPSTObject(this.pstFile, childDescriptor);
            this.currentEmailIndex++;
            return child;
        }
        return null;
    }

    /**
     *  Move the internal folder cursor to the desired position position 0 is before the first record.
     * @param {number} newIndex
     * @returns
     * @memberof PSTFolder
     */
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

    /**
     * The number of child folders in this folder
     * @readonly
     * @type {number}
     * @memberof PSTFolder
     */
    public get subFolderCount(): number {
        this.initSubfoldersTable();
        if (this.subfoldersTable != null) {
            return this.subfoldersTable.rowCount;
        } else {
            return 0;
        }
    }

    /**
     * Number of emails in this folder
     * @readonly
     * @type {number}
     * @memberof PSTFolder
     */
    public get emailCount(): number {
        this.initEmailsTable();
        if (this.emailsTable == null) {
            return -1;
        }
        return this.emailsTable.rowCount;
    }

    /**
     * Contains a constant that indicates the folder type.
     * https://msdn.microsoft.com/en-us/library/office/cc815373.aspx
     * @readonly
     * @type {number}
     * @memberof PSTFolder
     */
    public get folderType(): number {
        return this.getIntItem(OutlookProperties.PR_FOLDER_TYPE);
    }

    /**
     * Contains the number of messages in a folder, as computed by the message store.
     * For a number calculated by the library use getEmailCount
     * @readonly
     * @type {number}
     * @memberof PSTFolder
     */
    public get contentCount(): number {
        return this.getIntItem(OutlookProperties.PR_CONTENT_COUNT);
    }

    /**
     * Contains the number of unread messages in a folder, as computed by the message store.
     * https://msdn.microsoft.com/en-us/library/office/cc841964.aspx
     * @readonly
     * @type {number}
     * @memberof PSTFolder
     */
    public get unreadCount(): number {
        return this.getIntItem(OutlookProperties.PR_CONTENT_UNREAD);
    }

    /**
     * Contains TRUE if a folder contains subfolders.
     * once again, read from the PST, use getSubFolderCount if you want to know
     * @readonly
     * @type {boolean}
     * @memberof PSTFolder
     */
    public get hasSubfolders(): boolean {
        return this.getIntItem(OutlookProperties.PR_SUBFOLDERS) != 0;
    }

    /**
     * Contains a text string describing the type of a folder. Although this property is
     * generally ignored, versions of Microsoft® Exchange Server prior to Exchange Server
     * 2003 Mailbox Manager expect this property to be present.
     * https://msdn.microsoft.com/en-us/library/office/cc839839.aspx
     * @readonly
     * @type {string}
     * @memberof PSTFolder
     */
    public get containerClass(): string {
        return this.getStringItem(OutlookProperties.PR_CONTAINER_CLASS);
    }

    /**
     * Contains a bitmask of flags describing capabilities of an address book container.
     * https://msdn.microsoft.com/en-us/library/office/cc839610.aspx
     * @readonly
     * @type {number}
     * @memberof PSTFolder
     */
    public get containerFlags(): number {
        return this.getIntItem(OutlookProperties.PR_CONTAINER_FLAGS);
    }

    /**
     * JSON stringify the object properties.
     * @returns {string}
     * @memberof PSTFolder
     */
    public toJSON(): any {
        let clone = Object.assign(
            {
                subFolderCount: this.subFolderCount,
                emailCount: this.emailCount,
                folderType: this.folderType,
                contentCount: this.contentCount,
                unreadCount: this.unreadCount,
                hasSubfolders: this.hasSubfolders,
                containerClass: this.containerClass,
                containerFlags: this.containerFlags
            },
            this
        );
        return clone;
    }
}
