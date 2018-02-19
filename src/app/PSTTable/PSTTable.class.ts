import { PSTDescriptorItem } from './../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTObject } from './../PSTObject/PSTObject.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';

// The PST Table is the workhorse of the whole system.
// It allows for an item to be read and broken down into the individual properties that it consists of.
// For most PST Objects, it appears that only 7c and bc table types are used.
export class PSTTable extends PSTObject {
    protected tableType: string;
    protected tableTypeByte: number;
    protected hidUserRoot: number;
    protected arrayBlocks: number[] = null;

    // info from the b5 header
    protected sizeOfItemKey: number;
    protected sizeOfItemValue: number;
    protected hidRoot: number;
    protected numberOfKeys = 0;
    protected numberOfIndexLevels = 0;
    private pstNodeInputStream: PSTNodeInputStream;
    private subNodeDescriptorItems: Map<number, PSTDescriptorItem> = null;
    protected description = '';

    constructor (pstNodeInputStream: PSTNodeInputStream, subNodeDescriptorItems: Map<number, PSTDescriptorItem>) {
        super();

        this.subNodeDescriptorItems = subNodeDescriptorItems;
        this.pstNodeInputStream = pstNodeInputStream;
        this.arrayBlocks = pstNodeInputStream.getBlockOffsets();

        // the next two bytes should be the table type (bSig)
        // 0xEC is HN (Heap-on-Node)
        pstNodeInputStream.seek(0);
        let headdata = new Buffer(4);
        pstNodeInputStream.readCompletely(headdata);
        if (headdata[2] != 0xffffffec) {
            // System.out.println(in.isEncrypted());
            this.decode(headdata);
            this.printHexFormatted(headdata, true);
            throw new PSTException("Unable to parse table, bad table type...");
        }

        this.tableTypeByte = headdata[3];
        switch (this.tableTypeByte) { // bClientSig
        case 0x7c: // Table Context (TC/HN)
            this.tableType = "7c";
            break;
        case 0xffffffbc:
            this.tableType = "bc"; // Property Context (PC/BTH)
            break;
        default:
            throw new PSTException(
                "Unable to parse table, bad table type.  Unknown identifier: 0x" + Long.toHexString(headdata[3]));
        }

        this.hidUserRoot = (int) in.seekAndReadLong(4, 4); // hidUserRoot
        /*
         * System.out.printf("Table %s: hidUserRoot 0x%08X\n", tableType,
         * hidUserRoot);
         * /
         **/

        // all tables should have a BTHHEADER at hnid == 0x20
        final NodeInfo headerNodeInfo = this.getNodeInfo(0x20);
        headerNodeInfo.in.seek(headerNodeInfo.startOffset);
        int headerByte = headerNodeInfo.in.read() & 0xFF;
        if (headerByte != 0xb5) {
            headerNodeInfo.in.seek(headerNodeInfo.startOffset);
            headerByte = headerNodeInfo.in.read() & 0xFF;
            headerNodeInfo.in.seek(headerNodeInfo.startOffset);
            final byte[] tmp = new byte[1024];
            headerNodeInfo.in.readCompletely(tmp);
            PSTObject.printHexFormatted(tmp, true);
            // System.out.println(PSTObject.compEnc[headerByte]);
            throw new PSTException("Unable to parse table, can't find BTHHEADER header information: " + headerByte);
        }

        this.sizeOfItemKey = headerNodeInfo.in.read() & 0xFF; // Size of key in
                                                              // key table
        this.sizeOfItemValue = headerNodeInfo.in.read() & 0xFF; // Size of value
                                                                // in key table

        this.numberOfIndexLevels = headerNodeInfo.in.read() & 0xFF;
        if (this.numberOfIndexLevels != 0) {
            // System.out.println(this.tableType);
            // System.out.printf("Table with %d index levels\n",
            // numberOfIndexLevels);
        }
        // hidRoot = (int)PSTObject.convertLittleEndianBytesToLong(nodeInfo, 4,
        // 8); // hidRoot
        this.hidRoot = (int) headerNodeInfo.seekAndReadLong(4, 4);
        // System.out.println(hidRoot);
        // System.exit(0);
        /*
         * System.out.printf("Table %s: hidRoot 0x%08X\n", tableType, hidRoot);
         * /
         **/
        this.description += "Table (" + this.tableType + ")\n" + "hidUserRoot: " + this.hidUserRoot + " - 0x"
            + Long.toHexString(this.hidUserRoot) + "\n" + "Size Of Keys: " + this.sizeOfItemKey + " - 0x"
            + Long.toHexString(this.sizeOfItemKey) + "\n" + "Size Of Values: " + this.sizeOfItemValue + " - 0x"
            + Long.toHexString(this.sizeOfItemValue) + "\n" + "hidRoot: " + this.hidRoot + " - 0x"
            + Long.toHexString(this.hidRoot) + "\n";
    }

    // protected void releaseRawData() {
    //     this.subNodeDescriptorItems = null;
    // }

    // /**
    //  * get the number of items stored in this table.
    //  * 
    //  * @return
    //  */
    // public int getRowCount() {
    //     return this.numberOfKeys;
    // }

    // class NodeInfo {
    //     int startOffset;
    //     int endOffset;
    //     // byte[] data;
    //     PSTNodeInputStream in;

    //     NodeInfo(final int start, final int end, final PSTNodeInputStream in) throws PSTException {
    //         if (start > end) {
    //             throw new PSTException(
    //                 String.format("Invalid NodeInfo parameters: start %1$d is greater than end %2$d", start, end));
    //         }
    //         this.startOffset = start;
    //         this.endOffset = end;
    //         this.in = in;
    //         // this.data = data;
    //     }

    //     int length() {
    //         return this.endOffset - this.startOffset;
    //     }

    //     long seekAndReadLong(final long offset, final int length) throws IOException, PSTException {
    //         return this.in.seekAndReadLong(this.startOffset + offset, length);
    //     }
    // }

    // protected NodeInfo getNodeInfo(final int hnid) throws PSTException, IOException {

    //     // Zero-length node?
    //     if (hnid == 0) {
    //         return new NodeInfo(0, 0, this.in);
    //     }

    //     // Is it a subnode ID?
    //     if (this.subNodeDescriptorItems != null && this.subNodeDescriptorItems.containsKey(hnid)) {
    //         final PSTDescriptorItem item = this.subNodeDescriptorItems.get(hnid);
    //         // byte[] data;
    //         NodeInfo subNodeInfo = null;

    //         try {
    //             // data = item.getData();
    //             final PSTNodeInputStream subNodeIn = new PSTNodeInputStream(this.in.getPSTFile(), item);
    //             subNodeInfo = new NodeInfo(0, (int) subNodeIn.length(), subNodeIn);
    //         } catch (final IOException e) {
    //             throw new PSTException(String.format("IOException reading subNode: 0x%08X", hnid));
    //         }

    //         // return new NodeInfo(0, data.length, data);
    //         return subNodeInfo;
    //     }

    //     if ((hnid & 0x1F) != 0) {
    //         // Some kind of external node
    //         return null;
    //     }

    //     final int whichBlock = (hnid >>> 16);
    //     if (whichBlock > this.arrayBlocks.length) {
    //         // Block doesn't exist!
    //         String err = String.format("getNodeInfo: block doesn't exist! hnid = 0x%08X\n", hnid);
    //         err += String.format("getNodeInfo: block doesn't exist! whichBlock = 0x%08X\n", whichBlock);
    //         err += "\n" + (this.arrayBlocks.length);
    //         throw new PSTException(err);
    //         // return null;
    //     }

    //     // A normal node in a local heap
    //     final int index = (hnid & 0xFFFF) >> 5;
    //     int blockOffset = 0;
    //     if (whichBlock > 0) {
    //         blockOffset = this.arrayBlocks[whichBlock - 1].intValue();
    //     }
    //     // Get offset of HN page map
    //     int iHeapNodePageMap = (int) this.in.seekAndReadLong(blockOffset, 2) + blockOffset;
    //     final int cAlloc = (int) this.in.seekAndReadLong(iHeapNodePageMap, 2);
    //     if (index >= cAlloc + 1) {
    //         throw new PSTException(String.format("getNodeInfo: node index doesn't exist! nid = 0x%08X\n", hnid));
    //         // return null;
    //     }
    //     iHeapNodePageMap += (2 * index) + 2;
    //     final int start = (int) this.in.seekAndReadLong(iHeapNodePageMap, 2) + blockOffset;
    //     final int end = (int) this.in.seekAndReadLong(iHeapNodePageMap + 2, 2) + blockOffset;

    //     final NodeInfo out = new NodeInfo(start, end, this.in);
    //     return out;
    // }

}
