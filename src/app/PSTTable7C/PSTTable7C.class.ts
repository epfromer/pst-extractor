import { PSTTable7CItem } from './../PSTTable7CItem/PSTTable7CItem.class';
import { ColumnDescriptor } from './ColumnDescriptor.class';
import { PSTObject } from './../PSTObject/PSTObject.class';
import { PSTTable } from '../PSTTable/PSTTable.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import { NodeInfo } from '../NodeInfo/NodeInfo.class';
import * as long from 'long';
import { PSTFile } from '../PSTFile/PSTFile.class';

// Specific functions for the 7c table type ("Table Context").
// This is used for attachments.
export class PSTTable7C extends PSTTable {
    // private List<HashMap<Integer, PSTTable7CItem>> items = null;
    private numberOfDataSets = 0;
    private BLOCK_SIZE = 8176;
    private cCols = 0;
    private TCI_bm = 0;
    private TCI_1b = 0;
    private columnDescriptors: ColumnDescriptor[] = [];
    private overrideCol = -1;
    private rowNodeInfo: NodeInfo = null;
    private keyMap: Map<number, number> = null;

    // protected PSTTable7C(final PSTNodeInputStream in, final HashMap<Integer, PSTDescriptorItem> subNodeDescriptorItems)
    //     throws PSTException, java.io.IOException {
    //     this(in, subNodeDescriptorItems, -1);
    // }

    // protected PSTTable7C(final PSTNodeInputStream in, final HashMap<Integer, PSTDescriptorItem> subNodeDescriptorItems,
    //     final int entityToExtract) throws PSTException, java.io.IOException {
    //     super(in, subNodeDescriptorItems);

    constructor(pstNodeInputStream: PSTNodeInputStream, subNodeDescriptorItems: Map<number, PSTDescriptorItem>, entityToExtract?: number) {
        super(pstNodeInputStream, new Map<number, PSTDescriptorItem>());

        if (this.tableTypeByte != 0x7c) {
            throw new Error("unable to create PSTTable7C, table does not appear to be a 7c!");
        }

        // TCINFO header is in the hidUserRoot node
        // byte[] tcHeaderNode = getNodeInfo(hidUserRoot);
        let tcHeaderNode: NodeInfo = this.getNodeInfo(this.hidUserRoot);
        let offset = 0;

        // get the TCINFO header information
        this.cCols = tcHeaderNode.seekAndReadLong(long.fromNumber(offset + 1), 1).toNumber();
        let TCI_4b: number = tcHeaderNode.seekAndReadLong(long.fromNumber(offset + 2), 2).toNumber();
        let TCI_2b: number = tcHeaderNode.seekAndReadLong(long.fromNumber(offset + 4), 2).toNumber();
        this.TCI_1b = tcHeaderNode.seekAndReadLong(long.fromNumber(offset + 6), 2).toNumber();
        this.TCI_bm = tcHeaderNode.seekAndReadLong(long.fromNumber(offset + 8), 2).toNumber();
        let hidRowIndex: number = tcHeaderNode.seekAndReadLong(long.fromNumber(offset + 10), 4).toNumber();
        let hnidRows: number = tcHeaderNode.seekAndReadLong(long.fromNumber(offset + 14), 4).toNumber();

        // 22... column descriptors
        offset += 22;
        if (this.cCols != 0) {
            for (let col = 0; col < this.cCols; ++col) {
                this.columnDescriptors[col] = new ColumnDescriptor(tcHeaderNode, offset);
                if (this.columnDescriptors[col].id === entityToExtract) {
                    this.overrideCol = col;
                }
                offset += 8;
            }
        }

        // if we are asking for a specific column, only get that!
        if (this.overrideCol > -1) {
            this.cCols = this.overrideCol + 1;
        }

        // Read the key table
        this.keyMap = new Map();
        let keyTableInfo: NodeInfo = this.getNodeInfo(this.hidRoot);
        this.numberOfKeys = keyTableInfo.length() / (this.sizeOfItemKey + this.sizeOfItemValue);
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

        this.description += "Number of keys: " + this.numberOfKeys + "\n" + "Number of columns: " + this.cCols + "\n"
            + "Row Size: " + this.TCI_bm + "\n" + "hidRowIndex: " + hidRowIndex + "\n" + "hnidRows: " + hnidRows + "\n";
        console.log(this.description);

        let numberOfBlocks: number = Math.trunc(this.rowNodeInfo.length() / this.BLOCK_SIZE);
        let numberOfRowsPerBlock: number = Math.trunc(this.BLOCK_SIZE / this.TCI_bm);
        let blockPadding = this.BLOCK_SIZE - (numberOfRowsPerBlock * this.TCI_bm);
        this.numberOfDataSets = (numberOfBlocks * numberOfRowsPerBlock)
            + ((this.rowNodeInfo.length() % this.BLOCK_SIZE) / this.TCI_bm);
    }

    // get all the items parsed out of this table.
    // List<HashMap<Integer, PSTTable7CItem>> getItems() throws PSTException, IOException {
    //     if (this.items == null) {
    //         this.items = this.getItems(-1, -1);
    //     }
    //     return this.items;
    // }

    private getItems(startAtRecord?: number, numberOfRecordsToReturn?: number): Map<number, PSTTable7CItem>[] {
        debugger;

        let itemList: Map<number, PSTTable7CItem>[] = [];

        // okay, work out the number of records we have
        let numberOfBlocks = Math.trunc(this.rowNodeInfo.length() / this.BLOCK_SIZE);
        let numberOfRowsPerBlock = Math.trunc(this.BLOCK_SIZE / this.TCI_bm);
        let blockPadding = this.BLOCK_SIZE - (numberOfRowsPerBlock * this.TCI_bm);
        this.numberOfDataSets = (numberOfBlocks * numberOfRowsPerBlock) + ((this.rowNodeInfo.length() % this.BLOCK_SIZE) / this.TCI_bm);

        if (!startAtRecord) {
            numberOfRecordsToReturn = this.numberOfDataSets;
            startAtRecord = 0;
        }

        // repeat the reading process for every dataset
        let currentValueArrayStart = ((startAtRecord / numberOfRowsPerBlock) * this.BLOCK_SIZE) + ((startAtRecord % numberOfRowsPerBlock) * this.TCI_bm);
        if (numberOfRecordsToReturn > this.getRowCount() - startAtRecord) {
            numberOfRecordsToReturn = this.getRowCount() - startAtRecord;
        }

        let dataSetNumber = 0;
        // while ( currentValueArrayStart + ((cCols+7)/8) + TCI_1b <=
        // rowNodeInfo.length())
        for (let rowCounter = 0; rowCounter < numberOfRecordsToReturn; rowCounter++) {
            let currentItem: Map<number, PSTTable7CItem>  = new Map();
            // add on some padding for block boundries?
            if (this.rowNodeInfo.pstNodeInputStream.pstFile.pstFileType == PSTFile.PST_TYPE_ANSI) {
                if (currentValueArrayStart >= this.BLOCK_SIZE) {
                    currentValueArrayStart = currentValueArrayStart + (4) * (currentValueArrayStart / this.BLOCK_SIZE);
                }
                if (this.rowNodeInfo.startOffset + currentValueArrayStart + this.TCI_1b > this.rowNodeInfo.pstNodeInputStream.length.toNumber()) {
                    continue;
                }
            } else {
                if ((currentValueArrayStart % this.BLOCK_SIZE) > this.BLOCK_SIZE - this.TCI_bm) {
                    // adjust!
                    // currentValueArrayStart += 8176 - (currentValueArrayStart
                    // % 8176);
                    currentValueArrayStart += blockPadding;
                    if (currentValueArrayStart + this.TCI_bm > this.rowNodeInfo.length()) {
                        continue;
                    }
                }
            }
            let bitmap = new Buffer((this.cCols + 7) / 8);
            this.rowNodeInfo.pstNodeInputStream.seek(long.fromNumber(this.rowNodeInfo.startOffset + currentValueArrayStart + this.TCI_1b));
            this.rowNodeInfo.pstNodeInputStream.readCompletely(bitmap);
            let id = this.rowNodeInfo.seekAndReadLong(long.fromNumber(currentValueArrayStart), 4);

            // Put into the item map as PidTagLtpRowId (0x67F2)
            let item: PSTTable7CItem = new PSTTable7CItem();
            item.itemIndex = -1;
            item.entryValueType = 3;
            item.entryType = long.fromNumber(0x67F2);
            item.entryValueReference = id.toNumber();
            item.isExternalValueReference = true;
            currentItem.set(item.entryType.toNumber(), item);

            let col = 0;
            if (this.overrideCol > -1) {
                col = this.overrideCol;
            }
//            for (; col < this.cCols; ++col) {
            while (col < this.cCols) {
                col++;

                // Does this column exist for this row?
                let bitIndex = Math.trunc(this.columnDescriptors[col].iBit / 8);
                let bit = this.columnDescriptors[col].iBit % 8;
                if (bitIndex >= bitmap.length || (bitmap[bitIndex] & (1 << bit)) == 0) {
                    // Column doesn't exist
                    continue;
                }

                item = new PSTTable7CItem();
                item.itemIndex = col;

                item.entryValueType = this.columnDescriptors[col].type;
                item.entryType = long.fromNumber(this.columnDescriptors[col].id);
                item.entryValueReference = 0;

                switch (this.columnDescriptors[col].cbData) {
                    case 1: // Single byte data
                        item.entryValueReference = this.rowNodeInfo.seekAndReadLong(
                            long.fromNumber(currentValueArrayStart + this.columnDescriptors[col].ibData), 1).toNumber() & 0xFF;
                        item.isExternalValueReference = true;
                        break;

                    case 2: // Two byte data
                        item.entryValueReference = this.rowNodeInfo.seekAndReadLong(
                            long.fromNumber(currentValueArrayStart + this.columnDescriptors[col].ibData), 2).toNumber() & 0xFFFF;
                        item.isExternalValueReference = true;
                        break;

                    case 8: // 8 byte data
                        item.data = new Buffer(8);
                        this.rowNodeInfo.pstNodeInputStream.seek(
                            long.fromNumber(this.rowNodeInfo.startOffset + currentValueArrayStart + this.columnDescriptors[col].ibData));
                        this.rowNodeInfo.pstNodeInputStream.readCompletely(item.data);
                        break;

                default:// Four byte data
                        item.entryValueReference = this.rowNodeInfo.seekAndReadLong(
                            long.fromNumber(currentValueArrayStart + this.columnDescriptors[col].ibData), 4).toNumber();
                        if (this.columnDescriptors[col].type == 0x0003 || this.columnDescriptors[col].type == 0x0004
                            || this.columnDescriptors[col].type == 0x000A) {
                            // True 32bit data
                            item.isExternalValueReference = true;
                            break;
                        }

                        // Variable length data so it's an hnid
                        if ((item.entryValueReference & 0x1F) != 0) {
                            // Some kind of external reference...
                            item.isExternalValueReference = true;
                            break;
                        }

                        if (item.entryValueReference == 0) {
                            item.data = new Buffer(0);
                            break;
                        } else {
                            let entryInfo: NodeInfo  = this.getNodeInfo(item.entryValueReference);
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

        console.log(this.description);

        return itemList;
    }
}
