import { PSTObject } from './../PSTObject/PSTObject.class';
import { PSTTable } from '../PSTTable/PSTTable.class';
import { PSTTableBCItem } from '../PSTTableBCItem/PSTTableBCItem.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { NodeInfo } from '../NodeInfo/NodeInfo.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import * as long from 'long';
import { Log } from '../Log.class';

export class PSTTableBC extends PSTTable {
    private items: Map<number, PSTTableBCItem> = new Map();
    private descBuffer = ''; // TODO - make this more efficient than string
    private isDescNotYetInitiated = false;

    constructor(pstNodeInputStream: PSTNodeInputStream) {
        super(pstNodeInputStream, new Map<number, PSTDescriptorItem>());

        if (this.tableTypeByte != 188) {
            throw new Error('unable to create PSTTableBC, table does not appear to be a bc!');
        }

        // go through each of the entries
        let keyTableInfoNodeInfo: NodeInfo = this.getNodeInfo(this.hidRoot);
        let keyTableInfo: Buffer = new Buffer(keyTableInfoNodeInfo.length());
        keyTableInfoNodeInfo.pstNodeInputStream.seek(long.fromValue(keyTableInfoNodeInfo.startOffset));
        keyTableInfoNodeInfo.pstNodeInputStream.readCompletely(keyTableInfo);
        this.numberOfKeys = Math.trunc(keyTableInfo.length / (this.sizeOfItemKey + this.sizeOfItemValue));
        if (this.numberOfKeys == 0) { debugger; }
        this.descBuffer += 'Number of entries: ' + this.numberOfKeys + '\n';

        // Read the key table
        let offset = 0;
        for (let x = 0; x < this.numberOfKeys; x++) {
            let item = new PSTTableBCItem();
            item.itemIndex = x;
            item.entryType = PSTUtil.convertLittleEndianBytesToLong(keyTableInfo, offset + 0, offset + 2);
            item.entryValueType = PSTUtil.convertLittleEndianBytesToLong(keyTableInfo, offset + 2, offset + 4).toNumber();
            item.entryValueReference = PSTUtil.convertLittleEndianBytesToLong(keyTableInfo, offset + 4, offset + 8).toNumber();

            // Data is in entryValueReference for all types <= 4 bytes long
            switch (item.entryValueType) {
                case 0x0002: // 16bit integer
                    item.entryValueReference &= 0xffff;
                case 0x0003: // 32bit integer
                case 0x000a: // 32bit error code
                case 0x0001: // Place-holder
                case 0x0004: // 32bit floating
                    item.isExternalValueReference = true;
                    break;

                case 0x000b: // Boolean - a single byte
                    item.entryValueReference &= 0xff;
                    item.isExternalValueReference = true;
                    break;

                case 0x000d:
                default:
                    // Is it in the local heap?
                    item.isExternalValueReference = true; // Assume not
                    let nodeInfoNodeInfo = this.getNodeInfo(item.entryValueReference);
                    if (nodeInfoNodeInfo == null) {
                        // It's an external reference that we don't deal with here.
                    } else {
                        // Make a copy of the data
                        let nodeInfo = new Buffer(nodeInfoNodeInfo.length());
                        nodeInfoNodeInfo.pstNodeInputStream.seek(long.fromValue(nodeInfoNodeInfo.startOffset));
                        nodeInfoNodeInfo.pstNodeInputStream.readCompletely(nodeInfo);
                        item.data = nodeInfo; // should be new array, so just use it
                        item.isExternalValueReference = false;
                    }
                    break;
            }

            offset = offset + 8;

            this.items.set(item.entryType.toNumber(), item);
            Log.debug2('PSTTableBC::constructor ' + item.toString());
        }

        this.releaseRawData();
    }

    // Get the items parsed out of this table.
    public getItems(): Map<number, PSTTableBCItem> {
        return this.items;
    }

    // @Override
    // public String toString() {

    //     if (this.isDescNotYetInitiated) {
    //         this.isDescNotYetInitiated = false;

    //         for (final Integer curItem : this.items.keySet()) {
    //             this.descBuffer.append(this.items.get(curItem).toString() + "\n\n");
    //         }
    //         // description += item.toString()+"\n\n";
    //     }

    //     return this.description + this.descBuffer.toString();
    // }
}
