import { PSTDescriptorItem } from './../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTObject } from './../PSTObject/PSTObject.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { NodeInfo } from '../NodeInfo/NodeInfo.class';

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
        pstNodeInputStream.readCompletely(headdata); // should be 4, 30, 236, 188
        if (!(headdata[0] === 4 && 
              headdata[1] === 30 &&
              headdata[2] === 236 &&
              headdata[3] === 188)) {
            this.decode(headdata);
            this.printHexFormatted(headdata, true);
            throw new Error("Unable to parse table, bad table type...");
        }

        this.tableTypeByte = headdata[3];
        switch (this.tableTypeByte) { // bClientSig
            case 0x7c: // Table Context (TC/HN)
                debugger;
                this.tableType = "7c";
                break;
            case 188:
                this.tableType = "bc"; // Property Context (PC/BTH)
                break;
            default:
                throw new Error("Unable to parse table, bad table type.  Unknown identifier: 0x" + headdata[3].toString(16));
        }

        this.hidUserRoot = pstNodeInputStream.seekAndReadLong(4, 4).toNumber(); // hidUserRoot

        // all tables should have a BTHHEADER at hnid == 0x20 
        let headerNodeInfo: NodeInfo = this.getNodeInfo(0x20);
        headerNodeInfo.pstNodeInputStream.seek(headerNodeInfo.startOffset);
        let headerByte = headerNodeInfo.pstNodeInputStream.read() & 0xFF;
        if (headerByte != 0xb5) {
            headerNodeInfo.pstNodeInputStream.seek(headerNodeInfo.startOffset);
            headerByte = headerNodeInfo.pstNodeInputStream.read() & 0xFF;
            headerNodeInfo.pstNodeInputStream.seek(headerNodeInfo.startOffset);
            let tmp = new Buffer(1024);
            headerNodeInfo.pstNodeInputStream.readCompletely(tmp);
            this.printHexFormatted(tmp, true);
            // System.out.println(PSTObject.compEnc[headerByte]);
            throw new Error("Unable to parse table, can't find BTHHEADER header information: " + headerByte);
        }

        this.sizeOfItemKey = headerNodeInfo.pstNodeInputStream.read() & 0xFF; // Size of key in key table
        this.sizeOfItemValue = headerNodeInfo.pstNodeInputStream.read() & 0xFF; // Size of value in key table
        this.numberOfIndexLevels = headerNodeInfo.pstNodeInputStream.read() & 0xFF;
        this.hidRoot = headerNodeInfo.seekAndReadLong(4, 4).toNumber();
        this.description += "Table (" + this.tableType + ")\n" + "hidUserRoot: " + this.hidUserRoot + " - 0x"
            + this.hidUserRoot.toString(16) + "\n" + "Size Of Keys: " + this.sizeOfItemKey + " - 0x"
            + this.hidUserRoot.toString(16) + "\n" + "Size Of Values: " + this.sizeOfItemValue + " - 0x"
            + this.hidUserRoot.toString(16) + "\n" + "hidRoot: " + this.hidRoot + " - 0x"
            + this.hidUserRoot.toString(16) + "\n";
    }

    protected releaseRawData() {
        this.subNodeDescriptorItems = null;
    }

    //  get the number of items stored in this table.
    public getRowCount(): number {
        return this.numberOfKeys;
    }

    public getNodeInfo(hnid: number): NodeInfo {

        // Zero-length node?
        if (hnid == 0) {
            return new NodeInfo(0, 0, this.pstNodeInputStream);
        }
    
        // Is it a subnode ID?
        if (this.subNodeDescriptorItems.has(hnid)) {
            let item: PSTDescriptorItem = this.subNodeDescriptorItems.get(hnid);
            let subNodeInfo: NodeInfo = null;
    
            try {
                let subNodeIn: PSTNodeInputStream = new PSTNodeInputStream(this.pstNodeInputStream.pstFile, item);
                subNodeInfo = new NodeInfo(0, subNodeIn.length, subNodeIn);
            } catch (err) {
                throw new Error("IOException reading subNode: " + hnid);
            }
    
            // return new NodeInfo(0, data.length, data);
            return subNodeInfo;
        }
    
        if ((hnid & 0x1F) != 0) {
            // Some kind of external node
            return null;
        }
    
        let whichBlock: number = (hnid >>> 16);
        if (whichBlock > this.arrayBlocks.length) {
            // Block doesn't exist!
            console.log("getNodeInfo: block doesn't exist! hnid = " + hnid);
            console.log("getNodeInfo: block doesn't exist! whichBlock = " + whichBlock);
            console.log("getNodeInfo: " + this.arrayBlocks.length);
            throw new Error("getNodeInfo: block doesn't exist!");
        }
    
        // A normal node in a local heap
        let index = (hnid & 0xFFFF) >> 5;
        let blockOffset = 0;
        if (whichBlock > 0) {
            blockOffset = this.arrayBlocks[whichBlock - 1];
        }
        // Get offset of HN page map
        let iHeapNodePageMap = this.pstNodeInputStream.seekAndReadLong(blockOffset, 2).toNumber() + blockOffset;
        let cAlloc = this.pstNodeInputStream.seekAndReadLong(iHeapNodePageMap, 2).toNumber();
        if (index >= cAlloc + 1) {
            throw new Error("getNodeInfo: node index doesn't exist! nid = " + hnid);
        }
        iHeapNodePageMap += (2 * index) + 2;
        let start = this.pstNodeInputStream.seekAndReadLong(iHeapNodePageMap, 2).toNumber() + blockOffset;
        let end = this.pstNodeInputStream.seekAndReadLong(iHeapNodePageMap + 2, 2).toNumber() + blockOffset;
    
        return new NodeInfo(start, end, this.pstNodeInputStream);
    }
}
