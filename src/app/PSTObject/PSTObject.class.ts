import { PSTTableBCItem } from '../PSTTableBCItem/PSTTableBCItem.class';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import { OffsetIndexItem } from '../OffsetIndexItem/OffsetIndexItem.class';
import { PSTFolder } from '../PSTFolder/PSTFolder.class';
import { PSTMessage } from '../PSTMessage/PSTMessage.class';
import { Log } from '../Log.class';
import * as long from 'long';
import { PSTTimeZone } from '../PSTTimeZone/PSTTimeZone.class';

// PST Object is the root class of most PST Items.
// It also provides a number of static utility functions. The most important is
// detectAndLoadPSTObject call which allows extraction of a PST Item from the file.
export class PSTObject {
    // protected byte[] data;
    protected pstFile: PSTFile;
    protected descriptorIndexNode: DescriptorIndexNode;
    protected localDescriptorItems: Map<number, PSTDescriptorItem> = null;
    // protected LinkedHashMap<String, HashMap<DescriptorIndexNode, PSTObject>> children;
    private pstTableBC: PSTTableBC;
    protected pstTableItems: Map<number, PSTTableBCItem>; // make this a JSON object?
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

    // get the descriptor identifier for this item which can be used for loading objects
    // through detectAndLoadPSTObject(PSTFile theFile, long descriptorIndex)
    public getDescriptorNodeId(): long {
        // Prevent null pointer exceptions for embedded messages
        if (this.descriptorIndexNode != null) {
            return long.fromNumber(this.descriptorIndexNode.descriptorIdentifier);
        }
        return long.ZERO;
    }

    public getNodeType(descriptorIdentifier?: number): number {
        if (descriptorIdentifier) {
            return descriptorIdentifier & 0x1f;
        } else {
            return this.descriptorIndexNode.descriptorIdentifier & 0x1f;
        }
    }

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

    protected getBooleanItem(identifier: number, defaultValue?: boolean) {
        if (defaultValue === undefined) {
            defaultValue = false;
        }

        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableBCItem = this.pstTableItems.get(identifier);
            return item.entryValueReference != 0;
        }
        return defaultValue;
    }

    protected getDoubleItem(identifier: number, defaultValue?: number) {
        if (defaultValue === undefined) {
            defaultValue = 0;
        }

        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableBCItem = this.pstTableItems.get(identifier);
            let longVersion: long = PSTUtil.convertLittleEndianBytesToLong(item.data);
            // TODO - is this necessary?
            if (longVersion.toNumber()) {
                debugger;
            }
            return longVersion.toNumber();
        }
        return defaultValue;
    }

    protected getLongItem(identifier: number, defaultValue?: long): long {
        if (defaultValue === undefined) {
            defaultValue = long.ZERO;
        }

        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableBCItem = this.pstTableItems.get(identifier);
            if (item.entryValueType == 0x0003) {
                // we are really just an int
                return long.fromNumber(item.entryValueReference);
            } else if (item.entryValueType == 0x0014) {
                // we are a long
                if (item.data != null && item.data.length == 8) {
                    return PSTUtil.convertLittleEndianBytesToLong(item.data, 0, 8);
                } else {
                    Log.error("PSTObject::getLongItem Invalid data length for long id " + identifier);
                    // Return the default value for now...
                }
            }
        }
        return defaultValue;
    }

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

    public getDateItem(identifier: number): Date {
        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableBCItem = this.pstTableItems.get(identifier);
            if (item.data.length == 0) {
                return new Date(0);
            }
            let hi = PSTUtil.convertLittleEndianBytesToLong(item.data, 4, 8);
            let low = PSTUtil.convertLittleEndianBytesToLong(item.data, 0, 4);
            return PSTUtil.filetimeToDate(hi, low);
        }
        return null;
    }

    protected getBinaryItem(identifier: number): Buffer {
        // TODO
        // debugger;

        if (this.pstTableItems.has(identifier)) {
            let item: PSTTableBCItem = this.pstTableItems.get(identifier);
            if (item.entryValueType == 0x0102) {
                if (!item.isExternalValueReference) {
                    return item.data;
                }
                if (this.localDescriptorItems != null
                    && this.localDescriptorItems.has(item.entryValueReference)) {
                    // we have a hit!
                    let descItem: PSTDescriptorItem = this.localDescriptorItems.get(item.entryValueReference);
                    try {
                        return descItem.getData();
                    } catch (e) {
                        Log.error("Exception reading binary item: reference " + item.entryValueReference);
                        return null;
                    }
                }
                Log.debug1("PSTObject::getBinaryItem External reference!");
            }
        }
        return null;
    }

    protected getTimeZoneItem(identifier: number): PSTTimeZone {
        let tzData: Buffer = this.getBinaryItem(identifier);
        if (tzData != null && tzData.length != 0) {
            return new PSTTimeZone(tzData);
        }
        return null;
    }

    public getMessageClass(): string {
        return this.getStringItem(0x001a);
    }

    public toString() {
        return this.localDescriptorItems + "\n" + this.pstTableItems;
    }

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
