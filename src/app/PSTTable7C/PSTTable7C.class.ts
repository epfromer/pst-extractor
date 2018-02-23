import * as long from 'long';
import { ColumnDescriptor } from './ColumnDescriptor.class';
import { PSTObject } from './../PSTObject/PSTObject.class';
import { PSTTable } from '../PSTTable/PSTTable.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import { NodeInfo } from '../NodeInfo/NodeInfo.class';

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
        debugger;

        if (this.tableTypeByte != 0x7c) {
            throw new Error("unable to create PSTTable7C, table does not appear to be a 7c!");
        }

        // TCINFO header is in the hidUserRoot node
        // byte[] tcHeaderNode = getNodeInfo(hidUserRoot);
        let tcHeaderNode: NodeInfo = this.getNodeInfo(this.hidUserRoot);
        let offset = 0;

        // get the TCINFO header information
        this.cCols = tcHeaderNode.seekAndReadLong(long.fromValue(offset + 1), 1).toNumber();
        let TCI_4b: number = tcHeaderNode.seekAndReadLong(long.fromValue(offset + 2), 2).toNumber();
        let TCI_2b: number = tcHeaderNode.seekAndReadLong(long.fromValue(offset + 4), 2).toNumber();
        this.TCI_1b = tcHeaderNode.seekAndReadLong(long.fromValue(offset + 6), 2).toNumber();
        this.TCI_bm = tcHeaderNode.seekAndReadLong(long.fromValue(offset + 8), 2).toNumber();
        let hidRowIndex: number = tcHeaderNode.seekAndReadLong(long.fromValue(offset + 10), 4).toNumber();
        let hnidRows: number = tcHeaderNode.seekAndReadLong(long.fromValue(offset + 14), 4).toNumber();

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
            let context = keyTableInfo.seekAndReadLong(long.fromValue(offset), this.sizeOfItemKey).toNumber();
            offset += this.sizeOfItemKey;
            let rowIndex = keyTableInfo.seekAndReadLong(long.fromValue(offset), this.sizeOfItemValue).toNumber();
            offset += this.sizeOfItemValue;
            this.keyMap.set(context, rowIndex);
        }

        // Read the Row Matrix
        this.rowNodeInfo = this.getNodeInfo(hnidRows);

        this.description += "Number of keys: " + this.numberOfKeys + "\n" + "Number of columns: " + this.cCols + "\n"
            + "Row Size: " + this.TCI_bm + "\n" + "hidRowIndex: " + hidRowIndex + "\n" + "hnidRows: " + hnidRows + "\n";
        console.log(this.description);

        let numberOfBlocks: number = this.rowNodeInfo.length() / this.BLOCK_SIZE;
        let numberOfRowsPerBlock: number = this.BLOCK_SIZE / this.TCI_bm;
        let blockPadding = this.BLOCK_SIZE - (numberOfRowsPerBlock * this.TCI_bm);
        this.numberOfDataSets = (numberOfBlocks * numberOfRowsPerBlock)
            + ((this.rowNodeInfo.length() % this.BLOCK_SIZE) / this.TCI_bm);
    }

    // /**
    //  * get all the items parsed out of this table.
    //  *
    //  * @return
    //  */
    // List<HashMap<Integer, PSTTable7CItem>> getItems() throws PSTException, IOException {
    //     if (this.items == null) {
    //         this.items = this.getItems(-1, -1);
    //     }
    //     return this.items;
    // }

    // List<HashMap<Integer, PSTTable7CItem>> getItems(int startAtRecord, int numberOfRecordsToReturn)
    //     throws PSTException, IOException {
    //     final List<HashMap<Integer, PSTTable7CItem>> itemList = new ArrayList<>();

    //     // okay, work out the number of records we have
    //     final int numberOfBlocks = this.rowNodeInfo.length() / this.BLOCK_SIZE;
    //     final int numberOfRowsPerBlock = this.BLOCK_SIZE / this.TCI_bm;
    //     final int blockPadding = this.BLOCK_SIZE - (numberOfRowsPerBlock * this.TCI_bm);
    //     this.numberOfDataSets = (numberOfBlocks * numberOfRowsPerBlock)
    //         + ((this.rowNodeInfo.length() % this.BLOCK_SIZE) / this.TCI_bm);

    //     if (startAtRecord == -1) {
    //         numberOfRecordsToReturn = this.numberOfDataSets;
    //         startAtRecord = 0;
    //     }

    //     // repeat the reading process for every dataset
    //     int currentValueArrayStart = ((startAtRecord / numberOfRowsPerBlock) * this.BLOCK_SIZE)
    //         + ((startAtRecord % numberOfRowsPerBlock) * this.TCI_bm);

    //     if (numberOfRecordsToReturn > this.getRowCount() - startAtRecord) {
    //         numberOfRecordsToReturn = this.getRowCount() - startAtRecord;
    //     }

    //     int dataSetNumber = 0;
    //     // while ( currentValueArrayStart + ((cCols+7)/8) + TCI_1b <=
    //     // rowNodeInfo.length())
    //     for (int rowCounter = 0; rowCounter < numberOfRecordsToReturn; rowCounter++) {
    //         final HashMap<Integer, PSTTable7CItem> currentItem = new HashMap<>();
    //         // add on some padding for block boundries?
    //         if (this.rowNodeInfo.in.getPSTFile().getPSTFileType() == PSTFile.PST_TYPE_ANSI) {
    //             if (currentValueArrayStart >= this.BLOCK_SIZE) {
    //                 currentValueArrayStart = currentValueArrayStart + (4) * (currentValueArrayStart / this.BLOCK_SIZE);
    //             }
    //             if (this.rowNodeInfo.startOffset + currentValueArrayStart + this.TCI_1b > this.rowNodeInfo.in
    //                 .length()) {
    //                 continue;
    //             }
    //         } else {
    //             if ((currentValueArrayStart % this.BLOCK_SIZE) > this.BLOCK_SIZE - this.TCI_bm) {
    //                 // adjust!
    //                 // currentValueArrayStart += 8176 - (currentValueArrayStart
    //                 // % 8176);
    //                 currentValueArrayStart += blockPadding;
    //                 if (currentValueArrayStart + this.TCI_bm > this.rowNodeInfo.length()) {
    //                     continue;
    //                 }
    //             }
    //         }
    //         final byte[] bitmap = new byte[(this.cCols + 7) / 8];
    //         // System.arraycopy(rowNodeInfo, currentValueArrayStart+TCI_1b,
    //         // bitmap, 0, bitmap.length);
    //         this.rowNodeInfo.in.seek(this.rowNodeInfo.startOffset + currentValueArrayStart + this.TCI_1b);
    //         this.rowNodeInfo.in.readCompletely(bitmap);

    //         // int id =
    //         // (int)PSTObject.convertLittleEndianBytesToLong(rowNodeInfo,
    //         // currentValueArrayStart, currentValueArrayStart+4);
    //         final int id = (int) this.rowNodeInfo.seekAndReadLong(currentValueArrayStart, 4);

    //         // Put into the item map as PidTagLtpRowId (0x67F2)
    //         PSTTable7CItem item = new PSTTable7CItem();
    //         item.itemIndex = -1;
    //         item.entryValueType = 3;
    //         item.entryType = 0x67F2;
    //         item.entryValueReference = id;
    //         item.isExternalValueReference = true;
    //         currentItem.put(item.entryType, item);

    //         int col = 0;
    //         if (this.overrideCol > -1) {
    //             col = this.overrideCol;
    //         }
    //         for (; col < this.cCols; ++col) {
    //             // Does this column exist for this row?
    //             final int bitIndex = this.columnDescriptors[col].iBit / 8;
    //             final int bit = this.columnDescriptors[col].iBit % 8;
    //             if (bitIndex >= bitmap.length || (bitmap[bitIndex] & (1 << bit)) == 0) {
    //                 // Column doesn't exist
    //                 // System.out.printf("Col %d (0x%04X) not present\n", col,
    //                 // columnDescriptors[col].id); /**/

    //                 continue;
    //             }

    //             item = new PSTTable7CItem();
    //             item.itemIndex = col;

    //             item.entryValueType = this.columnDescriptors[col].type;
    //             item.entryType = this.columnDescriptors[col].id;
    //             item.entryValueReference = 0;

    //             switch (this.columnDescriptors[col].cbData) {
    //             case 1: // Single byte data
    //                 // item.entryValueReference =
    //                 // rowNodeInfo[currentValueArrayStart+columnDescriptors[col].ibData]
    //                 // & 0xFF;
    //                 item.entryValueReference = (int) this.rowNodeInfo
    //                     .seekAndReadLong(currentValueArrayStart + this.columnDescriptors[col].ibData, 1) & 0xFF;
    //                 item.isExternalValueReference = true;
    //                 /*
    //                  * System.out.printf("\tboolean: %s %s\n",
    //                  * PSTFile.getPropertyDescription(item.entryType,
    //                  * item.entryValueType),
    //                  * item.entryValueReference == 0 ? "false" : "true");
    //                  * /
    //                  **/
    //                 break;

    //             case 2: // Two byte data
    //                 /*
    //                  * item.entryValueReference =
    //                  * (rowNodeInfo[currentValueArrayStart+columnDescriptors[col
    //                  * ].ibData] & 0xFF) |
    //                  * ((rowNodeInfo[currentValueArrayStart+columnDescriptors[
    //                  * col].ibData+1] & 0xFF) << 8);
    //                  */
    //                 item.entryValueReference = (int) this.rowNodeInfo
    //                     .seekAndReadLong(currentValueArrayStart + this.columnDescriptors[col].ibData, 2) & 0xFFFF;
    //                 item.isExternalValueReference = true;
    //                 /*
    //                  * short i16 = (short)item.entryValueReference;
    //                  * System.out.printf("\tInteger16: %s %d\n",
    //                  * PSTFile.getPropertyDescription(item.entryType,
    //                  * item.entryValueType),
    //                  * i16);
    //                  * /
    //                  **/
    //                 break;

    //             case 8: // 8 byte data
    //                 item.data = new byte[8];
    //                 // System.arraycopy(rowNodeInfo,
    //                 // currentValueArrayStart+columnDescriptors[col].ibData,
    //                 // item.data, 0, 8);
    //                 this.rowNodeInfo.in.seek(
    //                     this.rowNodeInfo.startOffset + currentValueArrayStart + this.columnDescriptors[col].ibData);
    //                 this.rowNodeInfo.in.readCompletely(item.data);
    //                 /*
    //                  * System.out.printf("\tInteger64: %s\n",
    //                  * PSTFile.getPropertyDescription(item.entryType,
    //                  * item.entryValueType)); /
    //                  **/
    //                 break;

    //             default:// Four byte data

    //                 /*
    //                  * if (numberOfIndexLevels > 0 ) {
    //                  * System.out.println("here");
    //                  * System.out.println(rowNodeInfo.length());
    //                  * PSTObject.printHexFormatted(rowNodeInfo, true);
    //                  * System.exit(0);
    //                  * }
    //                  */

    //                 // item.entryValueReference =
    //                 // (int)PSTObject.convertLittleEndianBytesToLong(rowNodeInfo,
    //                 // currentValueArrayStart+columnDescriptors[col].ibData,
    //                 // currentValueArrayStart+columnDescriptors[col].ibData+4);
    //                 item.entryValueReference = (int) this.rowNodeInfo
    //                     .seekAndReadLong(currentValueArrayStart + this.columnDescriptors[col].ibData, 4);
    //                 if (this.columnDescriptors[col].type == 0x0003 || this.columnDescriptors[col].type == 0x0004
    //                     || this.columnDescriptors[col].type == 0x000A) {
    //                     // True 32bit data
    //                     item.isExternalValueReference = true;
    //                     /*
    //                      * System.out.printf("\tInteger32: %s %d\n",
    //                      * PSTFile.getPropertyDescription(item.entryType,
    //                      * item.entryValueType),
    //                      * item.entryValueReference); /
    //                      **/
    //                     break;
    //                 }

    //                 // Variable length data so it's an hnid
    //                 if ((item.entryValueReference & 0x1F) != 0) {
    //                     // Some kind of external reference...
    //                     item.isExternalValueReference = true;
    //                     /*
    //                      * System.out.printf("\tOther: %s 0x%08X\n",
    //                      * PSTFile.getPropertyDescription(item.entryType,
    //                      * item.entryValueType), item.entryValueReference); /
    //                      **/
    //                     break;
    //                 }

    //                 if (item.entryValueReference == 0) {
    //                     /*
    //                      * System.out.printf("\tOther: %s 0 bytes\n",
    //                      * PSTFile.getPropertyDescription(item.entryType,
    //                      * item.entryValueType)); /
    //                      **/
    //                     item.data = new byte[0];
    //                     break;
    //                 } else {
    //                     final NodeInfo entryInfo = this.getNodeInfo(item.entryValueReference);
    //                     item.data = new byte[entryInfo.length()];
    //                     // System.arraycopy(entryInfo, 0, item.data, 0,
    //                     // item.data.length);
    //                     entryInfo.in.seek(entryInfo.startOffset);
    //                     entryInfo.in.readCompletely(item.data);
    //                 }
    //                 /*
    //                  * if ( item.entryValueType != 0x001F ) {
    //                  * System.out.printf("\tOther: %s %d bytes\n",
    //                  * PSTFile.getPropertyDescription(item.entryType,
    //                  * item.entryValueType),
    //                  * item.data.length);
    //                  * } else {
    //                  * try {
    //                  * String s = new String(item.data, "UTF-16LE");
    //                  * System.out.printf("\tString: %s \"%s\"\n",
    //                  * PSTFile.getPropertyDescription(item.entryType,
    //                  * item.entryValueType),
    //                  * s);
    //                  * } catch (UnsupportedEncodingException e) {
    //                  * e.printStackTrace();
    //                  * }
    //                  * }
    //                  * /
    //                  **/
    //                 break;
    //             }

    //             currentItem.put(item.entryType, item);

    //             // description += item.toString()+"\n\n";
    //         }
    //         itemList.add(dataSetNumber, currentItem);
    //         dataSetNumber++;
    //         currentValueArrayStart += this.TCI_bm;
    //     }

    //     // System.out.println(description);

    //     return itemList;
    // }


}
