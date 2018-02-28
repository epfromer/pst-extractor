import { PSTConversationIndex } from './../PSTConversationIndex/PSTConversationIndex.class';
import { PSTAttachment } from './../PSTAttachment/PSTAttachment.class';
import { PSTRecipient } from './../PSTRecipient/PSTRecipient.class';
import { PSTObject } from '../PSTObject/PSTObject.class';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTTable7C } from '../PSTTable7C/PSTTable7C.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTTable7CItem } from '../PSTTable7CItem/PSTTable7CItem.class';
import * as long from 'long';

// PST Message contains functions that are common across most MAPI objects.
// Note that many of these functions may not be applicable for the item in question,
// however there seems to be no hard and fast outline for what properties apply to which
// objects. For properties where no value is set, a blank value is returned (rather than
// an exception being raised).
export class PSTMessage extends PSTObject {
    public static IMPORTANCE_LOW = 0;
    public static IMPORTANCE_NORMAL = 1;
    public static IMPORTANCE_HIGH = 2;
    public static RECIPIENT_TYPE_TO = 1;
    public static RECIPIENT_TYPE_CC = 2;
    private recipientTable: PSTTable7C = null;
    private attachmentTable: PSTTable7C = null;
    
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

    public getRTFBody(): string {
        debugger;
        //     // do we have an entry for it?
        //     if (this.items.containsKey(0x1009)) {
        //         // is it a reference?
        //         final PSTTableBCItem item = this.items.get(0x1009);
        //         if (item.data.length > 0) {
        //             return (LZFu.decode(item.data));
        //         }
        //         final int ref = item.entryValueReference;
        //         final PSTDescriptorItem descItem = this.localDescriptorItems.get(ref);
        //         if (descItem != null) {
        //             return LZFu.decode(descItem.getData());
        //         }
        //     }
        return '';
    }

    // get the importance of the email
    public getImportance(): number {
        return this.getIntItem(0x0017, PSTMessage.IMPORTANCE_NORMAL);
    }

    // get the message class for the email
    public getMessageClass(): string {
        return this.getStringItem(0x001a);
    }

    // get the subject
    public getSubject(): string {
        let subject = this.getStringItem(0x0037);
        if (subject != null && subject.length >= 2 && subject.charCodeAt(0) == 0x01) {
            if (subject.length == 2) {
                subject = '';
            } else {
                subject = subject.substring(2, subject.length);
            }
        }
        return subject;
    }

    // get the client submit time
    public getClientSubmitTime(): Date {
        return this.getDateItem(0x0039);
    }

    // get received by name
    public getReceivedByName(): string {
        return this.getStringItem(0x0040);
    }

    // get sent representing name
    public getSentRepresentingName(): string {
        return this.getStringItem(0x0042);
    }

    // Sent representing address type
    // Known values are SMTP, EX (Exchange) and UNKNOWN
    public getSentRepresentingAddressType(): string {
        return this.getStringItem(0x0064);
    }

    // Sent representing email address
    public getSentRepresentingEmailAddress(): string {
        return this.getStringItem(0x0065);
    }

    // Conversation topic
    // This is basically the subject from which Fwd:, Re, etc. has been removed
    public getConversationTopic(): string {
        return this.getStringItem(0x0070);
    }

    // Received by address type
    // Known values are SMTP, EX (Exchange) and UNKNOWN
    public getReceivedByAddressType(): string {
        return this.getStringItem(0x0075);
    }

    // Received by email address
    public getReceivedByAddress(): string {
        return this.getStringItem(0x0076);
    }

    // Transport message headers ASCII or Unicode string These contain the SMTP
    // e-mail headers.
    public getTransportMessageHeaders(): string {
        return this.getStringItem(0x007d);
    }

    public isRead(): boolean {
        return ((this.getIntItem(0x0e07) & 0x01) != 0);
    }

    public isUnmodified(): boolean {
        return ((this.getIntItem(0x0e07) & 0x02) != 0);
    }

    public isSubmitted(): boolean {
        return ((this.getIntItem(0x0e07) & 0x04) != 0);
    }

    public isUnsent(): boolean {
        return ((this.getIntItem(0x0e07) & 0x08) != 0);
    }

    public hasAttachments(): boolean {
        return ((this.getIntItem(0x0e07) & 0x10) != 0);
    }

    public isFromMe(): boolean {
        return ((this.getIntItem(0x0e07) & 0x20) != 0);
    }

    public isAssociated(): boolean {
        return ((this.getIntItem(0x0e07) & 0x40) != 0);
    }

    public isResent(): boolean {
        return ((this.getIntItem(0x0e07) & 0x80) != 0);
    }

    // Acknowledgment mode Integer 32-bit signed
    public getAcknowledgementMode(): number {
        return this.getIntItem(0x0001);
    }

    // Originator delivery report requested set if the sender wants a delivery
    // report from all recipients 0 = false 0 != true
    public getOriginatorDeliveryReportRequested(): boolean {
        return (this.getIntItem(0x0023) != 0);
    }

    // 0x0025 0x0102 PR_PARENT_KEY Parent key Binary data Contains a GUID
    // Priority Integer 32-bit signed -1 = NonUrgent 0 = Normal 1 = Urgent
    public getPriority(): number {
        return this.getIntItem(0x0026);
    }

    // Read Receipt Requested Boolean 0 = false 0 != true
    public getReadReceiptRequested(): boolean {
        return (this.getIntItem(0x0029) != 0);
    }

    // Recipient Reassignment Prohibited Boolean 0 = false 0 != true
    public getRecipientReassignmentProhibited(): boolean {
        return (this.getIntItem(0x002b) != 0);
    }

    // Original sensitivity Integer 32-bit signed the sensitivity of the message
    // before being replied to or forwarded 0 = None 1 = Personal 2 = Private 3
    //  = Company Confidential
    public getOriginalSensitivity(): number {
        return this.getIntItem(0x002e);
    }

    // Sensitivity Integer 32-bit signed sender's opinion of the sensitivity of
    // an email 0 = None 1 = Personal 2 = Private 3 = Company Confidential
    public getSensitivity(): number {
        return this.getIntItem(0x0036);
    }
    // // 0x003f 0x0102 PR_RECEIVED_BY_ENTRYID (PidTagReceivedByEntr yId) Received
    // // by entry identifier Binary data Contains recipient/sender structure
    // // 0x0041 0x0102 PR_SENT_REPRESENTING_ENTRYID Sent representing entry
    // // identifier Binary data Contains recipient/sender structure
    // // 0x0043 0x0102 PR_RCVD_REPRESENTING_ENTRYID Received representing entry
    // // identifier Binary data Contains recipient/sender structure

    // Address book search key
    public getPidTagSentRepresentingSearchKey(): Buffer {
        return this.getBinaryItem(0x003b);
    }

    // Received representing name ASCII or Unicode string
    public getRcvdRepresentingName(): string {
        return this.getStringItem(0x0044);
    }

    // Original subject ASCII or Unicode string
    public getOriginalSubject(): string {
        return this.getStringItem(0x0049);
    }

    // 0x004e 0x0040 PR_ORIGINAL_SUBMIT_TIME Original submit time Filetime
    // Reply recipients names ASCII or Unicode string
    public getReplyRecipientNames(): string {
        return this.getStringItem(0x0050);
    }

    // My address in To field Boolean
    public getMessageToMe(): boolean {
        return (this.getIntItem(0x0057) != 0);
    }

    // My address in CC field Boolean
    public getMessageCcMe(): boolean {
        return (this.getIntItem(0x0058) != 0);
    }

    // Indicates that the receiving mailbox owner is a primary or a carbon copy
    // (Cc) recipient
    public getMessageRecipMe(): boolean {
        return this.getIntItem(0x0059) != 0;
    }

    // Response requested Boolean
    public getResponseRequested(): boolean {
        return this.getBooleanItem(0x0063);
    }

    // Sent representing address type ASCII or Unicode string Known values are
    // SMTP, EX (Exchange) and UNKNOWN
    public getSentRepresentingAddrtype(): string {
        return this.getStringItem(0x0064);
    }

    // 0x0071 0x0102 PR_CONVERSATION_INDEX (PidTagConversationInd ex)
    // Conversation index Binary data
    // Original display BCC ASCII or Unicode string
    public getOriginalDisplayBcc(): string {
        return this.getStringItem(0x0072);
    }

    // Original display CC ASCII or Unicode string
    public getOriginalDisplayCc(): string {
        return this.getStringItem(0x0073);
    }

    // Original display TO ASCII or Unicode string
    public getOriginalDisplayTo(): string {
        return this.getStringItem(0x0074);
    }

    // Received representing address type.
    // Known values are SMTP, EX (Exchange) and UNKNOWN
    public getRcvdRepresentingAddrtype(): string {
        return this.getStringItem(0x0077);
    }

    // Received representing e-mail address
    public getRcvdRepresentingEmailAddress(): string {
        return this.getStringItem(0x0078);
    }

    // Recipient details

    // Non receipt notification requested
    public isNonReceiptNotificationRequested(): boolean {
        return (this.getIntItem(0x0c06) != 0);
    }

    // Originator non delivery report requested
    public isOriginatorNonDeliveryReportRequested(): boolean {
        return (this.getIntItem(0x0c08) != 0);
    }

    // Recipient type Integer 32-bit signed 0x01 => To 0x02 =>CC
    public getRecipientType(): number {
        return this.getIntItem(0x0c15);
    }

    // Reply requested
    public isReplyRequested(): boolean {
        return (this.getIntItem(0x0c17) != 0);
    }

    // Sending mailbox owner's address book entry ID
    public getSenderEntryId(): Buffer {
        return this.getBinaryItem(0x0c19);
    }

    // Sender name
    public getSenderName(): string {
        return this.getStringItem(0x0c1a);
    }

    // Sender address type.
    // Known values are SMTP, EX (Exchange) and UNKNOWN
    public getSenderAddrtype(): string {
        return this.getStringItem(0x0c1e);
    }

    // Sender e-mail address
    public getSenderEmailAddress(): string {
        return this.getStringItem(0x0c1f);
    }

    // Non-transmittable message properties

    // Message size
    public getMessageSize(): long {
        return this.getLongItem(0x0e08);
    }

    // Internet article number
    public getInternetArticleNumber(): number {
        return this.getIntItem(0x0e23);
    }

    // Server that the client should attempt to send the mail with
    public getPrimarySendAccount(): string {
        return this.getStringItem(0x0e28);
    }

    // Server that the client is currently using to send mail
    public getNextSendAcct(): string {
        return this.getStringItem(0x0e29);
    }

    // URL computer name postfix
    public getURLCompNamePostfix(): number {
        return this.getIntItem(0x0e61);
    }

    // Object type
    public getObjectType(): number {
        return this.getIntItem(0x0ffe);
    }

    // Delete after submit
    public getDeleteAfterSubmit(): boolean {
        return ((this.getIntItem(0x0e01)) != 0);
    }

    // Responsibility
    public getResponsibility(): boolean {
        return ((this.getIntItem(0x0e0f)) != 0);
    }

    // Compressed RTF in Sync Boolean
    public isRTFInSync(): boolean {
        return ((this.getIntItem(0x0e1f)) != 0);
    }

    // URL computer name set
    public isURLCompNameSet(): boolean {
        return ((this.getIntItem(0x0e62)) != 0);
    }

    // Display BCC
    public getDisplayBCC(): string {
        return this.getStringItem(0x0e02);
    }

    // Display CC
    public getDisplayCC(): string {
        return this.getStringItem(0x0e03);
    }

    // Display To
    public getDisplayTo(): string {
        return this.getStringItem(0x0e04);
    }

    // Message delivery time
    public getMessageDeliveryTime(): Date {
        return this.getDateItem(0x0e06);
    }

    // Message content properties
    public getNativeBodyType(): number {
        return this.getIntItem(0x1016);
    }

    // Plain text e-mail body
    public getBody(): string {
        debugger;
        return '';
        // let cp: string = null;
        // let cpItem: PSTTableBCItem = this.items.get(0x3FFD); // PidTagMessageCodepage
        // if (cpItem == null) {
        //     cpItem = this.items.get(0x3FDE); // PidTagInternetCodepage
        // }
        // if (cpItem != null) {
        //     cp = PSTFile.getInternetCodePageCharset(cpItem.entryValueReference);
        // }
        // return this.getStringItem(0x1000, 0, cp);
    }

    // Plain text body prefix
    public getBodyPrefix(): string {
        return this.getStringItem(0x6619);
    }

    // RTF Sync Body CRC
    public getRTFSyncBodyCRC(): number {
        return this.getIntItem(0x1006);
    }

    // RTF Sync Body character count
    public getRTFSyncBodyCount(): number {
        return this.getIntItem(0x1007);
    }

    // RTF Sync body tag
    public getRTFSyncBodyTag(): string {
        return this.getStringItem(0x1008);
    }

    // RTF whitespace prefix count
    public getRTFSyncPrefixCount(): number {
        return this.getIntItem(0x1010);
    }

    // RTF whitespace tailing count
    public getRTFSyncTrailingCount(): number {
        return this.getIntItem(0x1011);
    }

    // HTML e-mail body
    public getBodyHTML(): string {
        debugger;
        return '';
        // String cp = null;
        // PSTTableBCItem cpItem = this.items.get(0x3FDE); // PidTagInternetCodepage
        // if (cpItem == null) {
        //     cpItem = this.items.get(0x3FFD); // PidTagMessageCodepage
        // }
        // if (cpItem != null) {
        //     cp = PSTFile.getInternetCodePageCharset(cpItem.entryValueReference);
        // }
        // return this.getStringItem(0x1013, 0, cp);
    }

    // Message ID for this email as allocated per rfc2822
    public getInternetMessageId(): string {
        return this.getStringItem(0x1035);
    }

    // In-Reply-To
    public getInReplyToId(): string {
        return this.getStringItem(0x1042);
    }

    // Return Path
    public getReturnPath(): string {
        return this.getStringItem(0x1046);
    }

    // Icon index
    public getIconIndex(): number {
        return this.getIntItem(0x1080);
    }

    // Action flag
    // This relates to the replying / forwarding of messages.
    // It is classified as "unknown" atm, so just provided here
    // in case someone works out what all the various flags mean.
    public getActionFlag(): number {
        return this.getIntItem(0x1081);
    }

    // is the action flag for this item "forward"?
    public hasForwarded(): boolean {
        let actionFlag = this.getIntItem(0x1081);
        return ((actionFlag & 0x8) > 0);
    }

    // is the action flag for this item "replied"?
    public hasReplied(): boolean {
        let actionFlag = this.getIntItem(0x1081);
        return ((actionFlag & 0x4) > 0);
    }

    // the date that this item had an action performed (eg. replied or
    // forwarded)
    public getActionDate(): Date {
        return this.getDateItem(0x1082);
    }

    // Disable full fidelity
    public getDisableFullFidelity(): boolean {
        return (this.getIntItem(0x10f2) != 0);
    }

    // URL computer name
    // Contains the .eml file name
    public getURLCompName(): String {
        return this.getStringItem(0x10f3);
    }

    // Attribute hidden
    public getAttrHidden(): boolean {
        return (this.getIntItem(0x10f4) != 0);
    }

    // Attribute system
    public getAttrSystem(): boolean {
        return (this.getIntItem(0x10f5) != 0);
    }

    // Attribute read only
    public getAttrReadonly(): boolean {
        return (this.getIntItem(0x10f6) != 0);
    }

    // find, extract and load up all of the attachments in this email
    // necessary for the other operations.
    private processRecipients() {
        debugger;
        try {
            let recipientTableKey = 0x0692;
            if (this.recipientTable == null && this.localDescriptorItems != null
                && this.localDescriptorItems.has(recipientTableKey)) {
                let item: PSTDescriptorItem = this.localDescriptorItems.get(recipientTableKey);
                let descriptorItems: Map<number, PSTDescriptorItem> = null;
                if (item.subNodeOffsetIndexIdentifier > 0) {
                    descriptorItems = this.pstFile.getPSTDescriptorItems(long.fromNumber(item.subNodeOffsetIndexIdentifier));
                }
                this.recipientTable = new PSTTable7C(new PSTNodeInputStream(this.pstFile, item), descriptorItems);
            }
        } catch (err) {
            this.recipientTable = null;
        }
    }

    // get the number of recipients for this message
    public getNumberOfRecipients(): number {
        this.processRecipients();

        // still nothing? must be no recipients...
        if (this.recipientTable == null) {
            return 0;
        }
        return this.recipientTable.getRowCount();
    }

    // attachment stuff here, not sure if these can just exist in emails or not,
    // but a table key of 0x0671 would suggest that this is a property of the
    // envelope rather than a specific email property

    // find, extract and load up all of the attachments in this email
    // necessary for the other operations.
    private processAttachments() {
        let attachmentTableKey = 0x0671;
        if (this.attachmentTable == null && this.localDescriptorItems != null
            && this.localDescriptorItems.has(attachmentTableKey)) {
            let item: PSTDescriptorItem = this.localDescriptorItems.get(attachmentTableKey);
            let descriptorItems: Map<number, PSTDescriptorItem> = null;
            if (item.subNodeOffsetIndexIdentifier > 0) {
                descriptorItems = this.pstFile.getPSTDescriptorItems(long.fromValue(item.subNodeOffsetIndexIdentifier));
            }
            this.attachmentTable = new PSTTable7C(new PSTNodeInputStream(this.pstFile, item), descriptorItems);
        }
    }

    // Start date Filetime
    public getTaskStartDate(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00008104, PSTFile.PSETID_Task));
    }

    // Due date Filetime
    public getTaskDueDate(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00008105, PSTFile.PSETID_Task));
    }

    // Is a reminder set on this object?
    public getReminderSet(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008503, PSTFile.PSETID_Common));
    }

    public getReminderDelta(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008501, PSTFile.PSETID_Common));
    }

    // "flagged" items are actually emails with a due date.
    // This convience method just checks to see if that is true.
    public isFlagged(): boolean {
        return this.getTaskDueDate() != null;
    }

    // get the categories defined for this message
    public getColorCategories(): string[] {
        debugger;
        return [];
    //     final int keywordCategory = this.pstFile.getPublicStringToIdMapItem("Keywords");

    //     String[] categories = new String[0];
    //     if (this.items.containsKey(keywordCategory)) {
    //         try {
    //             final PSTTableBCItem item = this.items.get(keywordCategory);
    //             if (item.data.length == 0) {
    //                 return categories;
    //             }
    //             final int categoryCount = item.data[0];
    //             if (categoryCount > 0) {
    //                 categories = new String[categoryCount];
    //                 final int[] offsets = new int[categoryCount];
    //                 for (int x = 0; x < categoryCount; x++) {
    //                     offsets[x] = (int) PSTObject.convertBigEndianBytesToLong(item.data, (x * 4) + 1,
    //                         (x + 1) * 4 + 1);
    //                 }
    //                 for (int x = 0; x < offsets.length - 1; x++) {
    //                     final int start = offsets[x];
    //                     final int end = offsets[x + 1];
    //                     final int length = (end - start);
    //                     final byte[] string = new byte[length];
    //                     System.arraycopy(item.data, start, string, 0, length);
    //                     final String name = new String(string, "UTF-16LE");
    //                     categories[x] = name;
    //                 }
    //                 final int start = offsets[offsets.length - 1];
    //                 final int end = item.data.length;
    //                 final int length = (end - start);
    //                 final byte[] string = new byte[length];
    //                 System.arraycopy(item.data, start, string, 0, length);
    //                 final String name = new String(string, "UTF-16LE");
    //                 categories[categories.length - 1] = name;
    //             }
    //         } catch (final Exception err) {
    //             throw new PSTException("Unable to decode category data", err);
    //         }
    //     }
    //     return categories;
    }

    // get the number of attachments for this message
    public getNumberOfAttachments(): number {
        try {
            this.processAttachments();
        } catch (e) {
            e.printStackTrace();
            debugger;
            return 0;
        }

        // still nothing? must be no attachments...
        if (this.attachmentTable == null) {
            return 0;
        }
        return this.attachmentTable.getRowCount();
    }

    // get a specific attachment from this email.
    public getAttachment(attachmentNumber: number): PSTAttachment {
        debugger;
        return null;
    //     this.processAttachments();

    //     int attachmentCount = 0;
    //     if (this.attachmentTable != null) {
    //         attachmentCount = this.attachmentTable.getRowCount();
    //     }

    //     if (attachmentNumber >= attachmentCount) {
    //         throw new PSTException("unable to fetch attachment number " + attachmentNumber + ", only " + attachmentCount
    //             + " in this email");
    //     }

    //     // we process the C7 table here, basically we just want the attachment
    //     // local descriptor...
    //     final HashMap<Integer, PSTTable7CItem> attachmentDetails = this.attachmentTable.getItems()
    //         .get(attachmentNumber);
    //     final PSTTable7CItem attachmentTableItem = attachmentDetails.get(0x67f2);
    //     final int descriptorItemId = attachmentTableItem.entryValueReference;

    //     // get the local descriptor for the attachmentDetails table.
    //     final PSTDescriptorItem descriptorItem = this.localDescriptorItems.get(descriptorItemId);

    //     // try and decode it
    //     final byte[] attachmentData = descriptorItem.getData();
    //     if (attachmentData != null && attachmentData.length > 0) {
    //         // PSTTableBC attachmentDetailsTable = new
    //         // PSTTableBC(descriptorItem.getData(),
    //         // descriptorItem.getBlockOffsets());
    //         final PSTTableBC attachmentDetailsTable = new PSTTableBC(
    //             new PSTNodeInputStream(this.pstFile, descriptorItem));

    //         // create our all-precious attachment object.
    //         // note that all the information that was in the c7 table is
    //         // repeated in the eb table in attachment data.
    //         // so no need to pass it...
    //         HashMap<Integer, PSTDescriptorItem> attachmentDescriptorItems = new HashMap<>();
    //         if (descriptorItem.subNodeOffsetIndexIdentifier > 0) {
    //             attachmentDescriptorItems = this.pstFile
    //                 .getPSTDescriptorItems(descriptorItem.subNodeOffsetIndexIdentifier);
    //         }
    //         return new PSTAttachment(this.pstFile, attachmentDetailsTable, attachmentDescriptorItems);
    //     }

    //     throw new PSTException(
    //         "unable to fetch attachment number " + attachmentNumber + ", unable to read attachment details table");
    }

    // get a specific recipient from this email.
    public getRecipient(recipientNumber: number): PSTRecipient {
        if (recipientNumber >= this.getNumberOfRecipients()
            || recipientNumber >= this.recipientTable.getItems().length) {
            throw new Error("unable to fetch recipient number " + recipientNumber);
        }

        debugger;

        let recipientDetails: Map<number, PSTTable7CItem> = this.recipientTable.getItems()[recipientNumber];

        if (recipientDetails != null) {
            return new PSTRecipient(recipientDetails);
        }

        return null;
    }

    public getRecipientsString(): string {
        if (this.recipientTable != null) {
            return this.recipientTable.getItemsString();
        }
        return "No recipients table!";
    }

    public getConversationId(): Buffer {
        return this.getBinaryItem(0x3013);
    }

    public getConversationIndex(): PSTConversationIndex {
        return new PSTConversationIndex(this.getBinaryItem(0x0071));
    }

    public isConversationIndexTracking(): boolean {
        return this.getBooleanItem(0x3016, false);
    }

    // string representation of this email
    public toString() {
        return "PSTEmail: " + this.getSubject() + "\n" + "Importance: " + this.getImportance() + "\n"
            + "Message Class: " + this.getMessageClass() + "\n\n" + this.getTransportMessageHeaders() + "\n\n\n"
            + this.pstTableItems + this.localDescriptorItems;
    }

    
}
