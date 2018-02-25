import { PSTUtil } from './../PSTUtil/PSTUtil.class';
import * as long from 'long';
import { PSTObject } from './../PSTObject/PSTObject.class';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTTable7C } from '../PSTTable7C/PSTTable7C.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTTable7CItem } from '../PSTTable7CItem/PSTTable7CItem.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';

// Represents a folder in the PST File.  Allows you to access child folders or items.
// Items are accessed through a sort of cursor arrangement.  This allows for
// incremental reading of a folder which may have _lots_ of emails.
export class PSTFolder extends PSTObject {
    private subfoldersTable: PSTTable7C = null;
    private currentEmailIndex = 0;
    //private LinkedHashSet<DescriptorIndexNode> otherItems = null;
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
                let folder: PSTFolder = PSTObject.detectAndLoadPSTObject(this.pstFile, long.fromNumber(item.entryValueReference));
                output.push(folder);
            }
        } catch (err) {
            // hierarchy node doesn't exist: This is OK if child count is 0.
            // Seen with special search folders at the top of the hierarchy:
            // "8739 - SPAM Search Folder 2", "8739 - Content.Filter".
            // this.subfoldersTable may remain uninitialized (null) in that case.
            console.log("Can't get child folders for folder " + this.getDisplayName());
            debugger;
            throw err;
            // if (this.getContentCount() != 0) {
            // 	if (err.getMessage().startsWith("Can't get child folders")) {
            // 		throw err;
            // 	} else {
            //     	//err.printStackTrace();
            //         throw new PSTException("Can't get child folders for folder " + this.getDisplayName() + "("
            //                 + this.getDescriptorNodeId() + ") child count: " + this.getContentCount() + " - " + err.toString(), err);
            // 	}
            // }
        }
        return output;
    }

    private initSubfoldersTable() {
        debugger;
        
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
            this.subfoldersTable = new PSTTable7C(
                new PSTNodeInputStream(this.pstFile, this.pstFile.getOffsetIndexNode(folderDescriptor.dataOffsetIndexIdentifier)),
                tmp
            );
        } catch (err) {
            // hierarchy node doesn't exist
            console.log("Can't get child folders for folder " + this.getDisplayName());
            throw err;
        }
    }

    // this method goes through all of the children and sorts them into one of the three hash sets
    private initEmailsTable() {
        debugger;

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
            HashMap<Integer, PSTDescriptorItem> tmp = null;
            if (folderDescriptor.localDescriptorsOffsetIndexIdentifier > 0) {
                // tmp = new PSTDescriptor(pstFile,
                // folderDescriptor.localDescriptorsOffsetIndexIdentifier).getChildren();
                tmp = this.pstFile.getPSTDescriptorItems(folderDescriptor.localDescriptorsOffsetIndexIdentifier);
            }
            // PSTTable7CForFolder folderDescriptorTable = new
            // PSTTable7CForFolder(folderDescriptor.dataBlock.data,
            // folderDescriptor.dataBlock.blockOffsets,tmp, 0x67F2);
            this.emailsTable = new PSTTable7C(new PSTNodeInputStream(this.pstFile,
                this.pstFile.getOffsetIndexNode(folderDescriptor.dataOffsetIndexIdentifier)), tmp, 0x67F2);
        } catch (final Exception err) {

            // here we have to attempt to fallback onto the children as listed
            // by the descriptor b-tree
            final LinkedHashMap<Integer, LinkedList<DescriptorIndexNode>> tree = this.pstFile.getChildDescriptorTree();

            this.fallbackEmailsTable = new LinkedList<>();
            final LinkedList<DescriptorIndexNode> allChildren = tree.get(this.getDescriptorNode().descriptorIdentifier);

            if (allChildren != null) {
                // quickly go through and remove those entries that are not
                // messages!
                for (final DescriptorIndexNode node : allChildren) {
                    if (node != null
                        && PSTObject.getNodeType(node.descriptorIdentifier) == PSTObject.NID_TYPE_NORMAL_MESSAGE) {
                        this.fallbackEmailsTable.add(node);
                    }
                }
            }

            System.err.println("Can't get children for folder " + this.getDisplayName() + "("
                + this.getDescriptorNodeId() + ") child count: " + this.getContentCount() + " - " + err.toString()
                + ", using alternate child tree with " + this.fallbackEmailsTable.size() + " items");
        }
    }

    // /**
    //  * get some children from the folder
    //  * This is implemented as a cursor of sorts, as there could be thousands
    //  * and that is just too many to process at once.
    //  *
    //  * @param numberToReturn
    //  * @return bunch of children in this folder
    //  * @throws PSTException
    //  * @throws IOException
    //  */
    // public Vector<PSTObject> getChildren(final int numberToReturn) throws PSTException, IOException {
    //     this.initEmailsTable();

    //     final Vector<PSTObject> output = new Vector<>();
    //     if (this.emailsTable != null) {
    //         final List<HashMap<Integer, PSTTable7CItem>> rows = this.emailsTable.getItems(this.currentEmailIndex,
    //             numberToReturn);

    //         for (int x = 0; x < rows.size(); x++) {
    //             if (this.currentEmailIndex >= this.getContentCount()) {
    //                 // no more!
    //                 break;
    //             }
    //             // get the emails from the rows
    //             final PSTTable7CItem emailRow = rows.get(x).get(0x67F2);
    //             final DescriptorIndexNode childDescriptor = this.pstFile
    //                 .getDescriptorIndexNode(emailRow.entryValueReference);
    //             final PSTObject child = PSTObject.detectAndLoadPSTObject(this.pstFile, childDescriptor);
    //             output.add(child);
    //             this.currentEmailIndex++;
    //         }
    //     } else if (this.fallbackEmailsTable != null) {
    //         // we use the fallback
    //         final ListIterator<DescriptorIndexNode> iterator = this.fallbackEmailsTable
    //             .listIterator(this.currentEmailIndex);
    //         for (int x = 0; x < numberToReturn; x++) {
    //             if (this.currentEmailIndex >= this.getContentCount()) {
    //                 // no more!
    //                 break;
    //             }
    //             final DescriptorIndexNode childDescriptor = iterator.next();
    //             final PSTObject child = PSTObject.detectAndLoadPSTObject(this.pstFile, childDescriptor);
    //             output.add(child);
    //             this.currentEmailIndex++;
    //         }
    //     }

    //     return output;
    // }

    // public LinkedList<Integer> getChildDescriptorNodes() throws PSTException, IOException {
    //     this.initEmailsTable();
    //     if (this.emailsTable == null) {
    //         return new LinkedList<>();
    //     }
    //     final LinkedList<Integer> output = new LinkedList<>();
    //     final List<HashMap<Integer, PSTTable7CItem>> rows = this.emailsTable.getItems();
    //     for (final HashMap<Integer, PSTTable7CItem> row : rows) {
    //         // get the emails from the rows
    //         if (this.currentEmailIndex == this.getContentCount()) {
    //             // no more!
    //             break;
    //         }
    //         final PSTTable7CItem emailRow = row.get(0x67F2);
    //         if (emailRow.entryValueReference == 0) {
    //             break;
    //         }
    //         output.add(emailRow.entryValueReference);
    //     }
    //     return output;
    // }

     // Get the next child of this folder as there could be thousands of emails, 
     // we have these kind of cursor operations
    public getNextChild(): PSTObject {
        debugger;

        this.initEmailsTable();

        if (this.emailsTable != null) {
            final List<HashMap<Integer, PSTTable7CItem>> rows = this.emailsTable.getItems(this.currentEmailIndex, 1);

            if (this.currentEmailIndex == this.getContentCount()) {
                // no more!
                return null;
            }
            // get the emails from the rows
            final PSTTable7CItem emailRow = rows.get(0).get(0x67F2);
            final DescriptorIndexNode childDescriptor = this.pstFile
                .getDescriptorIndexNode(emailRow.entryValueReference);
            final PSTObject child = PSTObject.detectAndLoadPSTObject(this.pstFile, childDescriptor);
            this.currentEmailIndex++;

            return child;
        } else if (this.fallbackEmailsTable != null) {
            if (this.currentEmailIndex >= this.getContentCount()
                || this.currentEmailIndex >= this.fallbackEmailsTable.size()) {
                // no more!
                return null;
            }
            // get the emails from the rows
            final DescriptorIndexNode childDescriptor = this.fallbackEmailsTable.get(this.currentEmailIndex);
            final PSTObject child = PSTObject.detectAndLoadPSTObject(this.pstFile, childDescriptor);
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
        if (newIndex > this.getContentCount()) {
            newIndex = this.getContentCount();
        }
        this.currentEmailIndex = newIndex;
    }

    // the number of child folders in this folder
    public getSubFolderCount(): number {
        this.initSubfoldersTable();
        if (this.subfoldersTable != null) {
            return this.subfoldersTable.getRowCount();
        } else {
            return 0;
        }
    }

    // /**
    //  * the number of emails in this folder
    //  * this is the count of emails made by the library and will therefore should
    //  * be more accurate than getContentCount
    //  *
    //  * @return number of emails in this folder (as counted)
    //  * @throws IOException
    //  * @throws PSTException
    //  */
    // public int getEmailCount() throws IOException, PSTException {
    //     this.initEmailsTable();
    //     if (this.emailsTable == null) {
    //         return -1;
    //     }
    //     return this.emailsTable.getRowCount();
    // }

    // public int getFolderType() {
    //     return this.getIntItem(0x3601);
    // }

     // the number of emails in this folder this is as reported by the PST file, 
     // for a number calculated by the library use getEmailCount
    public getContentCount(): number {
        return this.getIntItem(0x3602);
    }

    // /**
    //  * Amount of unread content items Integer 32-bit signed
    //  */
    // public int getUnreadCount() {
    //     return this.getIntItem(0x3603);
    // }

    //  does this folder have subfolders
    //  once again, read from the PST, use getSubFolderCount if you want to know
    //  what the library makes of it all
    public hasSubfolders(): boolean {
        return this.getIntItem(0x360a) != 0;
    }

    // public String getContainerClass() {
    //     return this.getStringItem(0x3613);
    // }

    // public int getAssociateContentCount() {
    //     return this.getIntItem(0x3617);
    // }

    // /**
    //  * Container flags Integer 32-bit signed
    //  */
    // public int getContainerFlags() {
    //     return this.getIntItem(0x3600);
    // }
}
