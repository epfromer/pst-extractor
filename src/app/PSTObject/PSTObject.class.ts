import { PSTTableBCItem } from '../PSTTableBCItem/PSTTableBCItem.class';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import { OffsetIndexItem } from '../OffsetIndexItem/OffsetIndexItem.class';
import * as long from 'long';
import { PSTFolder } from '../PSTFolder/PSTFolder.class';

// PST Object is the root class of most PST Items.
// It also provides a number of static utility functions. The most important is
// detectAndLoadPSTObject call which allows extraction of a PST Item from the file.
export class PSTObject {
    // protected byte[] data;
    protected pstFile: PSTFile;
    protected descriptorIndexNode: DescriptorIndexNode;
    private localDescriptorItems: Map<number, PSTDescriptorItem> = null;
    // protected LinkedHashMap<String, HashMap<DescriptorIndexNode, PSTObject>> children;
    private pstTableBC: PSTTableBC;
    protected pstTableItems: Map<number, PSTTableBCItem>;
    protected table: PSTTableBC;

    constructor() {}

    protected loadDescriptor(pstFile: PSTFile, descriptorIndexNode: DescriptorIndexNode) {
        this.pstFile = pstFile;
        this.descriptorIndexNode = descriptorIndexNode;

        // get the table items for this descriptor
        let offsetIndexItem: OffsetIndexItem = this.pstFile.getOffsetIndexNode(descriptorIndexNode.dataOffsetIndexIdentifier);
        let pstNodeInputStream: PSTNodeInputStream = new PSTNodeInputStream(this.pstFile, offsetIndexItem);
        this.pstTableBC = new PSTTableBC(pstNodeInputStream);
        this.pstTableItems = this.pstTableBC.getItems();

        if (descriptorIndexNode.localDescriptorsOffsetIndexIdentifier.notEquals(long.ZERO)) {
            this.localDescriptorItems = pstFile.getPSTDescriptorItems(descriptorIndexNode.localDescriptorsOffsetIndexIdentifier);
        }
    }

    protected prePopulate(
        theFile: PSTFile,
        folderIndexNode: DescriptorIndexNode,
        table: PSTTableBC,
        localDescriptorItems: Map<number, PSTDescriptorItem>
    ) {
        this.pstFile = theFile;
        this.descriptorIndexNode = folderIndexNode;
        this.pstTableItems = table.getItems();
        this.table = table;
        this.localDescriptorItems = localDescriptorItems;
    }

    // /**
    //  * for pre-population
    //  *
    //  * @param theFile
    //  * @param folderIndexNode
    //  * @param table
    //  */
    // protected PSTObject(final PSTFile theFile, final DescriptorIndexNode folderIndexNode, final PSTTableBC table,
    //     final HashMap<Integer, PSTDescriptorItem> localDescriptorItems) {
    //     this.pstFile = theFile;
    //     this.descriptorIndexNode = folderIndexNode;
    //     this.items = table.getItems();
    //     this.table = table;
    //     this.localDescriptorItems = localDescriptorItems;
    // }

    // protected PSTTableBC table;

    // /**
    //  * get the descriptor node for this item
    //  * this identifies the location of the node in the BTree and associated info
    //  *
    //  * @return item's descriptor node
    //  */
    // public DescriptorIndexNode getDescriptorNode() {
    //     return this.descriptorIndexNode;
    // }

    // /**
    //  * get the descriptor identifier for this item
    //  * can be used for loading objects through detectAndLoadPSTObject(PSTFile
    //  * theFile, long descriptorIndex)
    //  *
    //  * @return item's descriptor node identifier
    //  */
    // public long getDescriptorNodeId() {
    //     if (this.descriptorIndexNode != null) { // Prevent null pointer
    //                                             // exceptions for embedded
    //                                             // messages
    //         return this.descriptorIndexNode.descriptorIdentifier;
    //     }
    //     return 0;
    // }

    // public int getNodeType() {
    //     return PSTObject.getNodeType(this.descriptorIndexNode.descriptorIdentifier);
    // }

    // public static int getNodeType(final int descriptorIdentifier) {
    //     return descriptorIdentifier & 0x1F;
    // }

    protected getIntItem(identifier: number, defaultValue?: number): number {
        if (!defaultValue) {
            defaultValue = 0;
        }

        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableBCItem = this.pstTableItems.get(identifier);
            return item.entryValueReference;
        }
        return defaultValue;
    }

    // protected boolean getBooleanItem(final int identifier) {
    //     return this.getBooleanItem(identifier, false);
    // }

    // protected boolean getBooleanItem(final int identifier, final boolean defaultValue) {
    //     if (this.items.containsKey(identifier)) {
    //         final PSTTableBCItem item = this.items.get(identifier);
    //         return item.entryValueReference != 0;
    //     }
    //     return defaultValue;
    // }

    // protected double getDoubleItem(final int identifier) {
    //     return this.getDoubleItem(identifier, 0);
    // }

    // protected double getDoubleItem(final int identifier, final double defaultValue) {
    //     if (this.items.containsKey(identifier)) {
    //         final PSTTableBCItem item = this.items.get(identifier);
    //         final long longVersion = PSTObject.convertLittleEndianBytesToLong(item.data);
    //         return Double.longBitsToDouble(longVersion);
    //     }
    //     return defaultValue;
    // }

    // protected long getLongItem(final int identifier) {
    //     return this.getLongItem(identifier, 0);
    // }

    // protected long getLongItem(final int identifier, final long defaultValue) {
    //     if (this.items.containsKey(identifier)) {
    //         final PSTTableBCItem item = this.items.get(identifier);
    //         if (item.entryValueType == 0x0003) {
    //             // we are really just an int
    //             return item.entryValueReference;
    //         } else if (item.entryValueType == 0x0014) {
    //             // we are a long
    //             if (item.data != null && item.data.length == 8) {
    //                 return PSTObject.convertLittleEndianBytesToLong(item.data, 0, 8);
    //             } else {
    //                 System.err.printf("Invalid data length for long id 0x%04X\n", identifier);
    //                 // Return the default value for now...
    //             }
    //         }
    //     }
    //     return defaultValue;
    // }

    protected getStringItem(identifier: number, stringType?: number, codepage?: string): string {
        if (!stringType) {
            stringType = 0;
        }

        let item: PSTTableBCItem = this.pstTableItems.get(identifier);
        if (item) {
            if (!codepage) {
                codepage = this.getStringCodepage();
            }

            // get the string type from the item if not explicitly set
            if (!stringType) {
                stringType = item.entryValueType;
            }

            // see if there is a descriptor entry
            if (!item.isExternalValueReference) {
                return PSTUtil.createJavascriptString(item.data, stringType, codepage);
            }

            debugger;

            // if (this.localDescriptorItems != null && this.localDescriptorItems.containsKey(item.entryValueReference)) {
            //     // we have a hit!
            //     final PSTDescriptorItem descItem = this.localDescriptorItems.get(item.entryValueReference);

            //     try {
            //         final byte[] data = descItem.getData();
            //         if (data == null) {
            //             return "";
            //         }

            //         return PSTObject.createJavaString(data, stringType, codepage);
            //     } catch (final Exception e) {
            //         System.err.printf("Exception %s decoding string %s: %s\n", e.toString(),
            //             PSTFile.getPropertyDescription(identifier, stringType),
            //             this.data != null ? this.data.toString() : "null");
            //         return "";
            //     }
            //     // System.out.printf("PSTObject.getStringItem - item isn't a
            //     // string: 0x%08X\n", identifier);
            //     // return "";
            // }

            // return PSTUtil.createJavascriptString(this.data, stringType, codepage);
        }
        return '';
    }

    protected getStringCodepage(): string {
        // try and get the codepage
        let cpItem: PSTTableBCItem = this.pstTableItems.get(0x3ffd); // PidTagMessageCodepage
        if (cpItem == null) {
            cpItem = this.pstTableItems.get(0x3fde); // PidTagInternetCodepage
        }
        if (cpItem != null) {
            return PSTUtil.getInternetCodePageCharset(cpItem.entryValueReference);
        }
        return null;
    }

    // public Date getDateItem(final int identifier) {
    //     if (this.items.containsKey(identifier)) {
    //         final PSTTableBCItem item = this.items.get(identifier);
    //         if (item.data.length == 0) {
    //             return new Date(0);
    //         }
    //         final int high = (int) PSTObject.convertLittleEndianBytesToLong(item.data, 4, 8);
    //         final int low = (int) PSTObject.convertLittleEndianBytesToLong(item.data, 0, 4);

    //         return PSTObject.filetimeToDate(high, low);
    //     }
    //     return null;
    // }

    // protected byte[] getBinaryItem(final int identifier) {
    //     if (this.items.containsKey(identifier)) {
    //         final PSTTableBCItem item = this.items.get(identifier);
    //         if (item.entryValueType == 0x0102) {
    //             if (!item.isExternalValueReference) {
    //                 return item.data;
    //             }
    //             if (this.localDescriptorItems != null
    //                 && this.localDescriptorItems.containsKey(item.entryValueReference)) {
    //                 // we have a hit!
    //                 final PSTDescriptorItem descItem = this.localDescriptorItems.get(item.entryValueReference);
    //                 try {
    //                     return descItem.getData();
    //                 } catch (final Exception e) {
    //                     System.err.printf("Exception reading binary item: reference 0x%08X\n",
    //                         item.entryValueReference);

    //                     return null;
    //                 }
    //             }

    //             // System.out.println("External reference!!!\n");
    //         }
    //     }
    //     return null;
    // }

    // protected PSTTimeZone getTimeZoneItem(final int identifier) {
    //     final byte[] tzData = this.getBinaryItem(identifier);
    //     if (tzData != null && tzData.length != 0) {
    //         return new PSTTimeZone(tzData);
    //     }
    //     return null;
    // }

    // public String getMessageClass() {
    //     return this.getStringItem(0x001a);
    // }

    // @Override
    // public String toString() {
    //     return this.localDescriptorItems + "\n" + (this.items);
    // }

    //  These are the common properties, some don't really appear to be common
    //  across folders and emails, but hey

    //  get the display name
    public getDisplayName(): string {
        return this.getStringItem(0x3001);
    }

    // /**
    //  * Address type
    //  * Known values are SMTP, EX (Exchange) and UNKNOWN
    //  */
    // public String getAddrType() {
    //     return this.getStringItem(0x3002);
    // }

    // /**
    //  * E-mail address
    //  */
    // public String getEmailAddress() {
    //     return this.getStringItem(0x3003);
    // }

    // /**
    //  * Comment
    //  */
    // public String getComment() {
    //     return this.getStringItem(0x3004);
    // }

    // /**
    //  * Creation time
    //  */
    // public Date getCreationTime() {
    //     return this.getDateItem(0x3007);
    // }

    // /**
    //  * Modification time
    //  */
    // public Date getLastModificationTime() {
    //     return this.getDateItem(0x3008);
    // }

    // /**
    //  * Static stuff below
    //  * ------------------
    //  */

    // /**
    //  * Output a number in a variety of formats for easier consumption
    //  *
    //  * @param data
    //  */
    // protected static byte[] encode(final byte[] data) {
    //     // create the encoding array...
    //     final int[] enc = new int[compEnc.length];
    //     for (int x = 0; x < enc.length; x++) {
    //         enc[compEnc[x]] = x;
    //     }

    //     // now it's just the same as decode...
    //     int temp;
    //     for (int x = 0; x < data.length; x++) {
    //         temp = data[x] & 0xff;
    //         data[x] = (byte) enc[temp];
    //     }

    //     return data;
    // }

    // /*
    //  * protected static boolean isPSTArray(byte[] data) {
    //  * return (data[0] == 1 && data[1] == 1);
    //  * }
    //  * /
    //  **/
    // /*
    //  * protected static int[] getBlockOffsets(RandomAccessFile in, byte[] data)
    //  * throws IOException, PSTException
    //  * {
    //  * // is the data an array?
    //  * if (!(data[0] == 1 && data[1] == 1))
    //  * {
    //  * throw new
    //  * PSTException("Unable to process array, does not appear to be one!");
    //  * }
    //  *
    //  * // we are an array!
    //  * // get the array items and merge them together
    //  * int numberOfEntries = (int)PSTObject.convertLittleEndianBytesToLong(data,
    //  * 2, 4);
    //  * int[] output = new int[numberOfEntries];
    //  * int tableOffset = 8;
    //  * int blockOffset = 0;
    //  * for (int y = 0; y < numberOfEntries; y++) {
    //  * // get the offset identifier
    //  * long tableOffsetIdentifierIndex =
    //  * PSTObject.convertLittleEndianBytesToLong(data, tableOffset,
    //  * tableOffset+8);
    //  * // clear the last bit of the identifier. Why so hard?
    //  * tableOffsetIdentifierIndex = (tableOffsetIdentifierIndex & 0xfffffffe);
    //  * OffsetIndexItem tableOffsetIdentifier = PSTObject.getOffsetIndexNode(in,
    //  * tableOffsetIdentifierIndex);
    //  * blockOffset += tableOffsetIdentifier.size;
    //  * output[y] = blockOffset;
    //  * tableOffset += 8;
    //  * }
    //  *
    //  * // replace the item data with the stuff from the array...
    //  * return output;
    //  * }
    //  * /
    //  **/

    // /**
    //  * Detect and load a PST Object from a file with the specified descriptor
    //  * index
    //  *
    //  * @param theFile
    //  * @param descriptorIndex
    //  * @return PSTObject with that index
    //  * @throws IOException
    //  * @throws PSTException
    //  */
    // public static PSTObject detectAndLoadPSTObject(final PSTFile theFile, final long descriptorIndex)
    //     throws IOException, PSTException {
    //     return PSTObject.detectAndLoadPSTObject(theFile, theFile.getDescriptorIndexNode(descriptorIndex));
    // }

    // Detect and load a PST Object from a file with the specified descriptor index
    static detectAndLoadPSTObject(theFile: PSTFile, descriptorIndex: long): any;
    static detectAndLoadPSTObject(theFile: PSTFile, folderIndexNode: DescriptorIndexNode): any;
    static detectAndLoadPSTObject(theFile: PSTFile, arg: any): any {
        let folderIndexNode = arg;
        if (arg instanceof long) {
            folderIndexNode = theFile.getDescriptorIndexNode(arg);
        }

        let nidType = folderIndexNode.descriptorIdentifier & 0x1f;
        if (nidType == 0x02 || nidType == 0x03 || nidType == 0x04) {
            let table: PSTTableBC = new PSTTableBC(
                new PSTNodeInputStream(theFile, theFile.getOffsetIndexNode(folderIndexNode.dataOffsetIndexIdentifier))
            );

            let localDescriptorItems: Map<number, PSTDescriptorItem> = null;
            if (folderIndexNode.localDescriptorsOffsetIndexIdentifier != 0) {
                localDescriptorItems = theFile.getPSTDescriptorItems(folderIndexNode.localDescriptorsOffsetIndexIdentifier);
            }

            if (nidType == 0x02 || nidType == 0x03) {
                return new PSTFolder(theFile, folderIndexNode, table, localDescriptorItems);
            } else {
                debugger;
                return null;
                //return PSTObject.createAppropriatePSTMessageObject(theFile, folderIndexNode, table, localDescriptorItems);
            }
        } else {
            throw new Error('Unknown child type with offset id: ' + folderIndexNode.localDescriptorsOffsetIndexIdentifier);
        }
    }

    // static createAppropriatePSTMessageObject(theFile: PSTFile, folderIndexNode: DescriptorIndexNode, table: PSTTableBC, localDescriptorItems: Map<number, PSTDescriptorItem>): PSTMessage {

        // final PSTTableBCItem item = table.getItems().get(0x001a);
        // String messageClass = "";
        // if (item != null) {
        //     messageClass = item.getStringValue();
        // }

        // if (messageClass.equals("IPM.Note")
        //     || messageClass.equals("IPM.Note.SMIME.MultipartSigned")) {
        //     return new PSTMessage(theFile, folderIndexNode, table, localDescriptorItems);
        // } else if (messageClass.equals("IPM.Appointment")
        //     || messageClass.equals("IPM.OLE.CLASS.{00061055-0000-0000-C000-000000000046}")
        //     || messageClass.startsWith("IPM.Schedule.Meeting")) {
        //     return new PSTAppointment(theFile, folderIndexNode, table, localDescriptorItems);
        // } else if (messageClass.equals("IPM.Contact")) {
        //     return new PSTContact(theFile, folderIndexNode, table, localDescriptorItems);
        // } else if (messageClass.equals("IPM.Task")) {
        //     return new PSTTask(theFile, folderIndexNode, table, localDescriptorItems);
        // } else if (messageClass.equals("IPM.Activity")) {
        //     return new PSTActivity(theFile, folderIndexNode, table, localDescriptorItems);
        // } else if (messageClass.equals("IPM.Post.Rss")) {
        //     return new PSTRss(theFile, folderIndexNode, table, localDescriptorItems);
        // } else if (messageClass.equals("IPM.DistList")) {
        //     return new PSTDistList(theFile, folderIndexNode, table, localDescriptorItems);
        // } else {
        //     System.err.println("Unknown message type: " + messageClass);
        // }

        // return new PSTMessage(theFile, folderIndexNode, table, localDescriptorItems);
    // }

    // static String guessPSTObjectType(final PSTFile theFile, final DescriptorIndexNode folderIndexNode)
    //     throws IOException, PSTException {

    //     final PSTTableBC table = new PSTTableBC(
    //         new PSTNodeInputStream(theFile, theFile.getOffsetIndexNode(folderIndexNode.dataOffsetIndexIdentifier)));

    //     // get the table items and look at the types we are dealing with
    //     final Set<Integer> keySet = table.getItems().keySet();
    //     final Iterator<Integer> iterator = keySet.iterator();

    //     while (iterator.hasNext()) {
    //         final Integer key = iterator.next();
    //         if (key.intValue() >= 0x0001 && key.intValue() <= 0x0bff) {
    //             return "Message envelope";
    //         } else if (key.intValue() >= 0x1000 && key.intValue() <= 0x2fff) {
    //             return "Message content";
    //         } else if (key.intValue() >= 0x3400 && key.intValue() <= 0x35ff) {
    //             return "Message store";
    //         } else if (key.intValue() >= 0x3600 && key.intValue() <= 0x36ff) {
    //             return "Folder and address book";
    //         } else if (key.intValue() >= 0x3700 && key.intValue() <= 0x38ff) {
    //             return "Attachment";
    //         } else if (key.intValue() >= 0x3900 && key.intValue() <= 0x39ff) {
    //             return "Address book";
    //         } else if (key.intValue() >= 0x3a00 && key.intValue() <= 0x3bff) {
    //             return "Messaging user";
    //         } else if (key.intValue() >= 0x3c00 && key.intValue() <= 0x3cff) {
    //             return "Distribution list";
    //         }
    //     }
    //     return "Unknown";
    // }

    // /**
    //  * the code below was taken from a random apache project
    //  * http://www.koders.com/java/fidA9D4930E7443F69F32571905DD4CA01E4D46908C.aspx
    //  * my bit-shifting isn't that 1337
    //  */

    // /**
    //  * <p>
    //  * The difference between the Windows epoch (1601-01-01
    //  * 00:00:00) and the Unix epoch (1970-01-01 00:00:00) in
    //  * milliseconds: 11644473600000L. (Use your favorite spreadsheet
    //  * program to verify the correctness of this value. By the way,
    //  * did you notice that you can tell from the epochs which
    //  * operating system is the modern one? :-))
    //  * </p>
    //  */
    // private static final long EPOCH_DIFF = 11644473600000L;

    // /**
    //  * <p>
    //  * Converts a Windows FILETIME into a {@link Date}. The Windows
    //  * FILETIME structure holds a date and time associated with a
    //  * file. The structure identifies a 64-bit integer specifying the
    //  * number of 100-nanosecond intervals which have passed since
    //  * January 1, 1601. This 64-bit value is split into the two double
    //  * words stored in the structure.
    //  * </p>
    //  *
    //  * @param high
    //  *            The higher double word of the FILETIME structure.
    //  * @param low
    //  *            The lower double word of the FILETIME structure.
    //  * @return The Windows FILETIME as a {@link Date}.
    //  */
    // protected static Date filetimeToDate(final int high, final int low) {
    //     final long filetime = ((long) high) << 32 | (low & 0xffffffffL);
    //     // System.out.printf("0x%X\n", filetime);
    //     final long ms_since_16010101 = filetime / (1000 * 10);
    //     final long ms_since_19700101 = ms_since_16010101 - EPOCH_DIFF;
    //     return new Date(ms_since_19700101);
    // }

    // public static Calendar apptTimeToCalendar(final int minutes) {
    //     final long ms_since_16010101 = minutes * (60 * 1000L);
    //     final long ms_since_19700101 = ms_since_16010101 - EPOCH_DIFF;
    //     final Calendar c = Calendar.getInstance(PSTTimeZone.utcTimeZone);
    //     c.setTimeInMillis(ms_since_19700101);
    //     return c;
    // }

    // public static Calendar apptTimeToUTC(final int minutes, final PSTTimeZone tz) {
    //     // Must convert minutes since 1/1/1601 in local time to UTC
    //     // There's got to be a better way of doing this...
    //     // First get a UTC calendar object that contains _local time_
    //     final Calendar cUTC = PSTObject.apptTimeToCalendar(minutes);
    //     if (tz != null) {
    //         // Create an empty Calendar object with the required time zone
    //         final Calendar cLocal = Calendar.getInstance(tz.getSimpleTimeZone());
    //         cLocal.clear();

    //         // Now transfer the local date/time from the UTC calendar object
    //         // to the object that knows about the time zone...
    //         cLocal.set(cUTC.get(Calendar.YEAR), cUTC.get(Calendar.MONTH), cUTC.get(Calendar.DATE),
    //             cUTC.get(Calendar.HOUR_OF_DAY), cUTC.get(Calendar.MINUTE), cUTC.get(Calendar.SECOND));

    //         // Get the true UTC from the local time calendar object.
    //         // Drop any milliseconds, they won't be printed anyway!
    //         final long utcs = cLocal.getTimeInMillis() / 1000;

    //         // Finally, set the true UTC in the UTC calendar object
    //         cUTC.setTimeInMillis(utcs * 1000);
    //     } // else hope for the best!

    //     return cUTC;
    // }
}
