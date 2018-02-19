class PSTTableBC extends PSTTable {

    // private final HashMap<Integer, PSTTableBCItem> items = new HashMap<>();

    // private final StringBuilder descBuffer = new StringBuilder();
    // private boolean isDescNotYetInitiated = false;

    // PSTTableBC(final PSTNodeInputStream in) throws PSTException, java.io.IOException {
    //     super(in, new HashMap<Integer, PSTDescriptorItem>());
    //     // data = null; // No direct access to data!

    //     if (this.tableTypeByte != 0xffffffbc) {
    //         // System.out.println(Long.toHexString(this.tableTypeByte));
    //         throw new PSTException("unable to create PSTTableBC, table does not appear to be a bc!");
    //     }

    //     // go through each of the entries.
    //     // byte[] keyTableInfo = getNodeInfo(hidRoot);
    //     final NodeInfo keyTableInfoNodeInfo = this.getNodeInfo(this.hidRoot);
    //     final byte[] keyTableInfo = new byte[keyTableInfoNodeInfo.length()];
    //     keyTableInfoNodeInfo.in.seek(keyTableInfoNodeInfo.startOffset);
    //     keyTableInfoNodeInfo.in.readCompletely(keyTableInfo);

    //     // PSTObject.printHexFormatted(keyTableInfo, true);
    //     // System.out.println(in.length());
    //     // System.exit(0);
    //     this.numberOfKeys = keyTableInfo.length / (this.sizeOfItemKey + this.sizeOfItemValue);

    //     this.descBuffer.append("Number of entries: " + this.numberOfKeys + "\n");

    //     // Read the key table
    //     int offset = 0;
    //     for (int x = 0; x < this.numberOfKeys; x++) {

    //         final PSTTableBCItem item = new PSTTableBCItem();
    //         item.itemIndex = x;
    //         item.entryType = (int) PSTObject.convertLittleEndianBytesToLong(keyTableInfo, offset + 0, offset + 2);
    //         // item.entryType =(int)in.seekAndReadLong(offset, 2);
    //         item.entryValueType = (int) PSTObject.convertLittleEndianBytesToLong(keyTableInfo, offset + 2, offset + 4);
    //         // item.entryValueType = (int)in.seekAndReadLong(offset+2, 2);
    //         item.entryValueReference = (int) PSTObject.convertLittleEndianBytesToLong(keyTableInfo, offset + 4,
    //             offset + 8);
    //         // item.entryValueReference = (int)in.seekAndReadLong(offset+4, 4);

    //         // Data is in entryValueReference for all types <= 4 bytes long
    //         switch (item.entryValueType) {

    //         case 0x0002: // 16bit integer
    //             item.entryValueReference &= 0xFFFF;
    //         case 0x0003: // 32bit integer
    //         case 0x000A: // 32bit error code
    //             /*
    //              * System.out.printf("Integer%s: 0x%04X:%04X, %d\n",
    //              * (item.entryValueType == 0x0002) ? "16" : "32",
    //              * item.entryType, item.entryValueType,
    //              * item.entryValueReference);
    //              * /
    //              **/
    //         case 0x0001: // Place-holder
    //         case 0x0004: // 32bit floating
    //             item.isExternalValueReference = true;
    //             break;

    //         case 0x000b: // Boolean - a single byte
    //             item.entryValueReference &= 0xFF;
    //             /*
    //              * System.out.printf("boolean: 0x%04X:%04X, %s\n",
    //              * item.entryType, item.entryValueType,
    //              * (item.entryValueReference == 0) ? "false" : "true");
    //              * /
    //              **/
    //             item.isExternalValueReference = true;
    //             break;

    //         case 0x000D:
    //         default:
    //             // Is it in the local heap?
    //             item.isExternalValueReference = true; // Assume not
    //             // System.out.println(item.entryValueReference);
    //             // byte[] nodeInfo = getNodeInfo(item.entryValueReference);
    //             final NodeInfo nodeInfoNodeInfo = this.getNodeInfo(item.entryValueReference);
    //             if (nodeInfoNodeInfo == null) {
    //                 // It's an external reference that we don't deal with here.
    //                 /*
    //                  * System.out.printf("%s: %shid 0x%08X\n",
    //                  * (item.entryValueType == 0x1f || item.entryValueType ==
    //                  * 0x1e) ? "String" : "Other",
    //                  * PSTFile.getPropertyDescription(item.entryType,
    //                  * item.entryValueType),
    //                  * item.entryValueReference);
    //                  * /
    //                  **/
    //             } else {
    //                 // Make a copy of the data
    //                 // item.data = new
    //                 // byte[nodeInfo.endOffset-nodeInfo.startOffset];
    //                 final byte[] nodeInfo = new byte[nodeInfoNodeInfo.length()];
    //                 nodeInfoNodeInfo.in.seek(nodeInfoNodeInfo.startOffset);
    //                 nodeInfoNodeInfo.in.readCompletely(nodeInfo);
    //                 item.data = nodeInfo; // should be new array, so just use it
    //                 // System.arraycopy(nodeInfo.data, nodeInfo.startOffset,
    //                 // item.data, 0, item.data.length);
    //                 item.isExternalValueReference = false;
    //                 /*
    //                  * if ( item.entryValueType == 0x1f ||
    //                  * item.entryValueType == 0x1e )
    //                  * {
    //                  * try {
    //                  * // if ( item.entryType == 0x0037 )
    //                  * {
    //                  * String temp = new String(item.data, item.entryValueType
    //                  * == 0x1E ? "UTF8" : "UTF-16LE");
    //                  * System.out.printf("String: 0x%04X:%04X, \"%s\"\n",
    //                  * item.entryType, item.entryValueType, temp);
    //                  * }
    //                  * } catch (UnsupportedEncodingException e) {
    //                  * e.printStackTrace();
    //                  * }
    //                  * }
    //                  * else
    //                  * {
    //                  * 
    //                  * System.out.printf("Other: 0x%04X:%04X, %d bytes\n",
    //                  * item.entryType, item.entryValueType, item.data.length);
    //                  * 
    //                  * }
    //                  * /
    //                  **/
    //             }
    //             break;
    //         }

    //         offset = offset + 8;

    //         this.items.put(item.entryType, item);
    //         // description += item.toString()+"\n\n";

    //     }

    //     this.releaseRawData();
    // }

    // /**
    //  * get the items parsed out of this table.
    //  * 
    //  * @return
    //  */
    // public HashMap<Integer, PSTTableBCItem> getItems() {
    //     return this.items;
    // }

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
