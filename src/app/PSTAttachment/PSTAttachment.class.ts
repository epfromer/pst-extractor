import { PSTObject } from "../PSTObject/PSTObject.class";
import { PSTFile } from "../PSTFile/PSTFile.class";
import { PSTTableBC } from "../PSTTableBC/PSTTableBC.class";
import { DescriptorIndexNode } from "../DescriptorIndexNode/DescriptorIndexNode.class";
import { PSTDescriptorItem } from "../PSTDescriptorItem/PSTDescriptorItem.class";

// Class containing attachment information.
export class PSTAttachment extends PSTObject {

    public static ATTACHMENT_METHOD_NONE = 0;
    public static ATTACHMENT_METHOD_BY_VALUE = 1;
    public static ATTACHMENT_METHOD_BY_REFERENCE = 2;
    public static ATTACHMENT_METHOD_BY_REFERENCE_RESOLVE = 3;
    public static ATTACHMENT_METHOD_BY_REFERENCE_ONLY = 4;
    public static ATTACHMENT_METHOD_EMBEDDED = 5;
    public static ATTACHMENT_METHOD_OLE = 6;

    constructor(
        pstFile: PSTFile,  // theFile
        table: PSTTableBC,
        localDescriptorItems: Map<number, PSTDescriptorItem>
    ) {
        debugger;
        super();
        // pre-populate folder object with values
        this.prePopulate(pstFile, null, table, localDescriptorItems);
    }

    // constructor(final PSTFile theFile, final PSTTableBC table,
    //     final HashMap<Integer, PSTDescriptorItem> localDescriptorItems) {
    //     super(theFile, null, table, localDescriptorItems);
    // }

    public getSize(): number {
        return this.getIntItem(0x0e20);
    }

    public getCreationTime(): Date {
        return this.getDateItem(0x3007);
    }

    public getModificationTime(): Date {
        return this.getDateItem(0x3008);
    }

    // public PSTMessage getEmbeddedPSTMessage() throws IOException, PSTException {
    //     PSTNodeInputStream in = null;
    //     if (this.getIntItem(0x3705) == PSTAttachment.ATTACHMENT_METHOD_EMBEDDED) {
    //         final PSTTableBCItem item = this.items.get(0x3701);
    //         if (item.entryValueType == 0x0102) {
    //             if (!item.isExternalValueReference) {
    //                 in = new PSTNodeInputStream(this.pstFile, item.data);
    //             } else {
    //                 // We are in trouble!
    //                 throw new PSTException("External reference in getEmbeddedPSTMessage()!\n");
    //             }
    //         } else if (item.entryValueType == 0x000D) {
    //             final int descriptorItem = (int) PSTObject.convertLittleEndianBytesToLong(item.data, 0, 4);
    //             // PSTObject.printHexFormatted(item.data, true);
    //             final PSTDescriptorItem descriptorItemNested = this.localDescriptorItems.get(descriptorItem);
    //             in = new PSTNodeInputStream(this.pstFile, descriptorItemNested);
    //             if (descriptorItemNested.subNodeOffsetIndexIdentifier > 0) {
    //                 this.localDescriptorItems
    //                     .putAll(this.pstFile
    //                                 .getPSTDescriptorItems(descriptorItemNested.subNodeOffsetIndexIdentifier));
    //             }
    //             /*
    //              * if ( descriptorItemNested != null ) {
    //              * try {
    //              * data = descriptorItemNested.getData();
    //              * blockOffsets = descriptorItemNested.getBlockOffsets();
    //              * } catch (Exception e) {
    //              * e.printStackTrace();
    //              * 
    //              * data = null;
    //              * blockOffsets = null;
    //              * }
    //              * }
    //              *
    //              */
    //         }

    //         if (in == null) {
    //             return null;
    //         }

    //         try {
    //             final PSTTableBC attachmentTable = new PSTTableBC(in);
    //             return PSTObject.createAppropriatePSTMessageObject(this.pstFile, this.descriptorIndexNode,
    //                 attachmentTable, this.localDescriptorItems);
    //         } catch (final PSTException e) {
    //             e.printStackTrace();
    //         }
    //         return null;
    //     }
    //     return null;
    // }

    // public InputStream getFileInputStream() throws IOException, PSTException {

    //     final PSTTableBCItem attachmentDataObject = this.items.get(0x3701);
        
    //     if (null == attachmentDataObject) {
    //         return new ByteArrayInputStream(new byte[0]);
    //     } else if (attachmentDataObject.isExternalValueReference) {
    //         final PSTDescriptorItem descriptorItemNested = this.localDescriptorItems
    //             .get(attachmentDataObject.entryValueReference);
    //         return new PSTNodeInputStream(this.pstFile, descriptorItemNested);
    //     } else {
    //         // internal value references are never encrypted
    //         return new PSTNodeInputStream(this.pstFile, attachmentDataObject.data, false);
    //     }

    // }

    // public int getFilesize() throws PSTException, IOException {
    //     final PSTTableBCItem attachmentDataObject = this.items.get(0x3701);
    //     if (attachmentDataObject.isExternalValueReference) {
    //         final PSTDescriptorItem descriptorItemNested = this.localDescriptorItems
    //             .get(attachmentDataObject.entryValueReference);
    //         if (descriptorItemNested == null) {
    //             throw new PSTException(
    //                 "missing attachment descriptor item for: " + attachmentDataObject.entryValueReference);
    //         }
    //         return descriptorItemNested.getDataSize();
    //     } else {
    //         // raw attachment data, right there!
    //         return attachmentDataObject.data.length;
    //     }

    // }

    // attachment properties

    // Attachment (short) filename ASCII or Unicode string
    public getFilename(): string {
        return this.getStringItem(0x3704);
    }

    // Attachment method Integer 32-bit signed 0 => None (No attachment) 1 => By
    // value 2 => By reference 3 => By reference resolve 4 => By reference only
    // 5 => Embedded message 6 => OLE
    public getAttachMethod(): number {
        return this.getIntItem(0x3705);
    }

    // Attachment size
    public getAttachSize(): number {
        return this.getIntItem(0x0e20);
    }

    // Attachment number
    public getAttachNum(): number {
        return this.getIntItem(0x0e21);
    }

    // Attachment long filename ASCII or Unicode string
    public getLongFilename(): string {
        return this.getStringItem(0x3707);
    }

    // Attachment (short) pathname ASCII or Unicode string
    public getPathname(): string {
        return this.getStringItem(0x3708);
    }

    // Attachment Position Integer 32-bit signed
    public getRenderingPosition(): number {
        return this.getIntItem(0x370b);
    }

    // Attachment long pathname ASCII or Unicode string
    public getLongPathname(): string {
        return this.getStringItem(0x370d);
    }

    // Attachment mime type ASCII or Unicode string
    public getMimeTag(): string {
        return this.getStringItem(0x370e);
    }

    // Attachment mime sequence
    public getMimeSequence(): number {
        return this.getIntItem(0x3710);
    }

    // Attachment Content ID
    public getContentId(): string {
        return this.getStringItem(0x3712);
    }

    // Attachment not available in HTML
    public isAttachmentInvisibleInHtml(): boolean {
        let actionFlag = this.getIntItem(0x3714);
        return ((actionFlag & 0x1) > 0);
    }

    // Attachment not available in RTF
    public isAttachmentInvisibleInRTF(): boolean {
        let actionFlag = this.getIntItem(0x3714);
        return ((actionFlag & 0x2) > 0);
    }

    // Attachment is MHTML REF
    public isAttachmentMhtmlRef(): boolean {
        let actionFlag = this.getIntItem(0x3714);
        return ((actionFlag & 0x4) > 0);
    }

    // Attachment content disposition
    public getAttachmentContentDisposition(): string {
        return this.getStringItem(0x3716);
    }
}
