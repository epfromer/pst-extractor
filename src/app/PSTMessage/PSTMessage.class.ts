/**
 * Copyright 2010-2018 Richard Johnson, Orin Eman & Ed Pfromer
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * ---
 *
 * This file is part of pst-extractor.
 *
 * pst-extractor is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * pst-extractor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with pst-extractor. If not, see <http://www.gnu.org/licenses/>.
 */
import { LZFu } from './../LZFu/LZFu.class';
import { PSTAttachment } from './../PSTAttachment/PSTAttachment.class';
import { PSTRecipient } from './../PSTRecipient/PSTRecipient.class';
import { PSTObject } from '../PSTObject/PSTObject.class';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTTable7C } from '../PSTTable7C/PSTTable7C.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import * as long from 'long';
import { PSTTableItem } from '../PSTTableItem/PSTTableItem.class';
import { Log } from '../Log.class';

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

    public get rtfBody(): string {
        // do we have an entry for it?
        if (this.pstTableItems.has(0x1009)) {
            // is it a reference?
            let item: PSTTableItem = this.pstTableItems.get(0x1009);
            if (item.data.length > 0) {
                return LZFu.decode(item.data);
            }
            let ref = item.entryValueReference;
            let descItem: PSTDescriptorItem = this.localDescriptorItems.get(ref);
            if (descItem != null) {
                return LZFu.decode(descItem.getData());
            }
        }
        return '';
    }

    // get the importance of the email
    public get importance(): number {
        return this.getIntItem(0x0017, PSTMessage.IMPORTANCE_NORMAL);
    }

    // get the message class for the email
    public get messageClass(): string {
        return this.getStringItem(0x001a);
    }

    // get the subject
    public get subject(): string {
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
    public get clientSubmitTime(): Date {
        return this.getDateItem(0x0039);
    }

    // get received by name
    public get receivedByName(): string {
        return this.getStringItem(0x0040);
    }

    // get sent representing name
    public get sentRepresentingName(): string {
        return this.getStringItem(0x0042);
    }

    // Sent representing address type
    // Known values are SMTP, EX (Exchange) and UNKNOWN
    public get sentRepresentingAddressType(): string {
        return this.getStringItem(0x0064);
    }

    // Sent representing email address
    public get sentRepresentingEmailAddress(): string {
        return this.getStringItem(0x0065);
    }

    // Conversation topic
    // This is basically the subject from which Fwd:, Re, etc. has been removed
    public get conversationTopic(): string {
        return this.getStringItem(0x0070);
    }

    // Received by address type
    // Known values are SMTP, EX (Exchange) and UNKNOWN
    public get receivedByAddressType(): string {
        return this.getStringItem(0x0075);
    }

    // Received by email address
    public get receivedByAddress(): string {
        return this.getStringItem(0x0076);
    }

    // Transport message headers ASCII or Unicode string These contain the SMTP
    // e-mail headers.
    public get transportMessageHeaders(): string {
        return this.getStringItem(0x007d);
    }

    public get isRead(): boolean {
        return (this.getIntItem(0x0e07) & 0x01) != 0;
    }

    public get isUnmodified(): boolean {
        return (this.getIntItem(0x0e07) & 0x02) != 0;
    }

    public get isSubmitted(): boolean {
        return (this.getIntItem(0x0e07) & 0x04) != 0;
    }

    public get isUnsent(): boolean {
        return (this.getIntItem(0x0e07) & 0x08) != 0;
    }

    public get hasAttachments(): boolean {
        return (this.getIntItem(0x0e07) & 0x10) != 0;
    }

    public get isFromMe(): boolean {
        return (this.getIntItem(0x0e07) & 0x20) != 0;
    }

    public get isAssociated(): boolean {
        return (this.getIntItem(0x0e07) & 0x40) != 0;
    }

    public get isResent(): boolean {
        return (this.getIntItem(0x0e07) & 0x80) != 0;
    }

    // Acknowledgment mode Integer 32-bit signed
    public get acknowledgementMode(): number {
        return this.getIntItem(0x0001);
    }

    // Originator delivery report requested set if the sender wants a delivery
    // report from all recipients 0 = false 0 != true
    public get originatorDeliveryReportRequested(): boolean {
        return this.getIntItem(0x0023) != 0;
    }

    // 0x0025 0x0102 PR_PARENT_KEY Parent key Binary data Contains a GUID
    // Priority Integer 32-bit signed -1 = NonUrgent 0 = Normal 1 = Urgent
    public get priority(): number {
        return this.getIntItem(0x0026);
    }

    // Read Receipt Requested Boolean 0 = false 0 != true
    public get readReceiptRequested(): boolean {
        return this.getIntItem(0x0029) != 0;
    }

    // Recipient Reassignment Prohibited Boolean 0 = false 0 != true
    public get recipientReassignmentProhibited(): boolean {
        return this.getIntItem(0x002b) != 0;
    }

    // Original sensitivity Integer 32-bit signed the sensitivity of the message
    // before being replied to or forwarded 0 = None 1 = Personal 2 = Private 3
    //  = Company Confidential
    public get originalSensitivity(): number {
        return this.getIntItem(0x002e);
    }

    // Sensitivity Integer 32-bit signed sender's opinion of the sensitivity of
    // an email 0 = None 1 = Personal 2 = Private 3 = Company Confidential
    public get sensitivity(): number {
        return this.getIntItem(0x0036);
    }
    // // 0x003f 0x0102 PR_RECEIVED_BY_ENTRYID (PidTagReceivedByEntr yId) Received
    // // by entry identifier Binary data Contains recipient/sender structure
    // // 0x0041 0x0102 PR_SENT_REPRESENTING_ENTRYID Sent representing entry
    // // identifier Binary data Contains recipient/sender structure
    // // 0x0043 0x0102 PR_RCVD_REPRESENTING_ENTRYID Received representing entry
    // // identifier Binary data Contains recipient/sender structure

    // Address book search key
    public get pidTagSentRepresentingSearchKey(): Buffer {
        return this.getBinaryItem(0x003b);
    }

    // Received representing name ASCII or Unicode string
    public get rcvdRepresentingName(): string {
        return this.getStringItem(0x0044);
    }

    // Original subject ASCII or Unicode string
    public get originalSubject(): string {
        return this.getStringItem(0x0049);
    }

    // 0x004e 0x0040 PR_ORIGINAL_SUBMIT_TIME Original submit time Filetime
    // Reply recipients names ASCII or Unicode string
    public get replyRecipientNames(): string {
        return this.getStringItem(0x0050);
    }

    // My address in To field Boolean
    public get messageToMe(): boolean {
        return this.getIntItem(0x0057) != 0;
    }

    // My address in CC field Boolean
    public get messageCcMe(): boolean {
        return this.getIntItem(0x0058) != 0;
    }

    // Indicates that the receiving mailbox owner is a primary or a carbon copy
    // (Cc) recipient
    public get messageRecipMe(): boolean {
        return this.getIntItem(0x0059) != 0;
    }

    // Response requested Boolean
    public get responseRequested(): boolean {
        return this.getBooleanItem(0x0063);
    }

    // Sent representing address type ASCII or Unicode string Known values are
    // SMTP, EX (Exchange) and UNKNOWN
    public get sentRepresentingAddrtype(): string {
        return this.getStringItem(0x0064);
    }

    // 0x0071 0x0102 PR_CONVERSATION_INDEX (PidTagConversationInd ex)
    // Conversation index Binary data
    // Original display BCC ASCII or Unicode string
    public get originalDisplayBcc(): string {
        return this.getStringItem(0x0072);
    }

    // Original display CC ASCII or Unicode string
    public get originalDisplayCc(): string {
        return this.getStringItem(0x0073);
    }

    // Original display TO ASCII or Unicode string
    public get originalDisplayTo(): string {
        return this.getStringItem(0x0074);
    }

    // Received representing address type.
    // Known values are SMTP, EX (Exchange) and UNKNOWN
    public get rcvdRepresentingAddrtype(): string {
        return this.getStringItem(0x0077);
    }

    // Received representing e-mail address
    public get rcvdRepresentingEmailAddress(): string {
        return this.getStringItem(0x0078);
    }

    // Recipient details

    // Non receipt notification requested
    public get isNonReceiptNotificationRequested(): boolean {
        return this.getIntItem(0x0c06) != 0;
    }

    // Originator non delivery report requested
    public get isOriginatorNonDeliveryReportRequested(): boolean {
        return this.getIntItem(0x0c08) != 0;
    }

    // Recipient type Integer 32-bit signed 0x01 => To 0x02 =>CC
    public get recipientType(): number {
        return this.getIntItem(0x0c15);
    }

    // Reply requested
    public get isReplyRequested(): boolean {
        return this.getIntItem(0x0c17) != 0;
    }

    // Sending mailbox owner's address book entry ID
    public get senderEntryId(): Buffer {
        return this.getBinaryItem(0x0c19);
    }

    // Sender name
    public get senderName(): string {
        return this.getStringItem(0x0c1a);
    }

    // Sender address type.
    // Known values are SMTP, EX (Exchange) and UNKNOWN
    public get senderAddrtype(): string {
        return this.getStringItem(0x0c1e);
    }

    // Sender e-mail address
    public get senderEmailAddress(): string {
        return this.getStringItem(0x0c1f);
    }

    // Non-transmittable message properties

    // Message size
    public get messageSize(): long {
        return this.getLongItem(0x0e08);
    }

    // Internet article number
    public get internetArticleNumber(): number {
        return this.getIntItem(0x0e23);
    }

    // Server that the client should attempt to send the mail with
    public get primarySendAccount(): string {
        return this.getStringItem(0x0e28);
    }

    // Server that the client is currently using to send mail
    public get nextSendAcct(): string {
        return this.getStringItem(0x0e29);
    }

    // URL computer name postfix
    public get urlCompNamePostfix(): number {
        return this.getIntItem(0x0e61);
    }

    // Object type
    public get objectType(): number {
        return this.getIntItem(0x0ffe);
    }

    // Delete after submit
    public get deleteAfterSubmit(): boolean {
        return this.getIntItem(0x0e01) != 0;
    }

    // Responsibility
    public get responsibility(): boolean {
        return this.getIntItem(0x0e0f) != 0;
    }

    // Compressed RTF in Sync Boolean
    public get isRTFInSync(): boolean {
        return this.getIntItem(0x0e1f) != 0;
    }

    // URL computer name set
    public get isURLCompNameSet(): boolean {
        return this.getIntItem(0x0e62) != 0;
    }

    // Display BCC
    public get displayBCC(): string {
        return this.getStringItem(0x0e02);
    }

    // Display CC
    public get displayCC(): string {
        return this.getStringItem(0x0e03);
    }

    // Display To
    public get displayTo(): string {
        return this.getStringItem(0x0e04);
    }

    // Message delivery time
    public get messageDeliveryTime(): Date {
        return this.getDateItem(0x0e06);
    }

    // Message content properties
    public get nativeBodyType(): number {
        return this.getIntItem(0x1016);
    }

    // Plain text e-mail body
    public get body(): string {
        let cp: string = null;
        let cpItem: PSTTableItem = this.pstTableItems.get(0x3ffd); // PidTagMessageCodepage
        if (cpItem == null) {
            cpItem = this.pstTableItems.get(0x3fde); // PidTagInternetCodepage
        }
        if (cpItem != null) {
            cp = PSTUtil.getInternetCodePageCharset(cpItem.entryValueReference);
        }
        return this.getStringItem(0x1000, 0, cp);
    }

    // Plain text body prefix
    public get bodyPrefix(): string {
        return this.getStringItem(0x6619);
    }

    // RTF Sync Body CRC
    public get rtfSyncBodyCRC(): number {
        return this.getIntItem(0x1006);
    }

    // RTF Sync Body character count
    public get rtfSyncBodyCount(): number {
        return this.getIntItem(0x1007);
    }

    // RTF Sync body tag
    public get rtfSyncBodyTag(): string {
        return this.getStringItem(0x1008);
    }

    // RTF whitespace prefix count
    public get rtfSyncPrefixCount(): number {
        return this.getIntItem(0x1010);
    }

    // RTF whitespace tailing count
    public get rtfSyncTrailingCount(): number {
        return this.getIntItem(0x1011);
    }

    // HTML e-mail body
    public get bodyHTML(): string {
        let cp: string = null;
        let cpItem: PSTTableItem = this.pstTableItems.get(0x3fde); // PidTagInternetCodepage
        if (cpItem == null) {
            cpItem = this.pstTableItems.get(0x3ffd); // PidTagMessageCodepage
        }
        if (cpItem != null) {
            cp = PSTUtil.getInternetCodePageCharset(cpItem.entryValueReference);
        }
        return this.getStringItem(0x1013, 0, cp);
    }

    // Message ID for this email as allocated per rfc2822
    public get internetMessageId(): string {
        return this.getStringItem(0x1035);
    }

    // In-Reply-To
    public get inReplyToId(): string {
        return this.getStringItem(0x1042);
    }

    // Return Path
    public get returnPath(): string {
        return this.getStringItem(0x1046);
    }

    // Icon index
    public get iconIndex(): number {
        return this.getIntItem(0x1080);
    }

    // Action flag
    // This relates to the replying / forwarding of messages.
    // It is classified as "unknown" atm, so just provided here
    // in case someone works out what all the various flags mean.
    public get actionFlag(): number {
        return this.getIntItem(0x1081);
    }

    // is the action flag for this item "forward"?
    public get hasForwarded(): boolean {
        let actionFlag = this.getIntItem(0x1081);
        return (actionFlag & 0x8) > 0;
    }

    // is the action flag for this item "replied"?
    public get hasReplied(): boolean {
        let actionFlag = this.getIntItem(0x1081);
        return (actionFlag & 0x4) > 0;
    }

    // the date that this item had an action performed (eg. replied or
    // forwarded)
    public get actionDate(): Date {
        return this.getDateItem(0x1082);
    }

    // Disable full fidelity
    public get disableFullFidelity(): boolean {
        return this.getIntItem(0x10f2) != 0;
    }

    // URL computer name
    // Contains the .eml file name
    public get urlCompName(): String {
        return this.getStringItem(0x10f3);
    }

    // Attribute hidden
    public get attrHidden(): boolean {
        return this.getIntItem(0x10f4) != 0;
    }

    // Attribute system
    public get attrSystem(): boolean {
        return this.getIntItem(0x10f5) != 0;
    }

    // Attribute read only
    public get attrReadonly(): boolean {
        return this.getIntItem(0x10f6) != 0;
    }

    // find, extract and load up all of the attachments in this email
    // necessary for the other operations.
    private processRecipients() {
        try {
            let recipientTableKey = 0x0692;
            if (this.recipientTable == null && this.localDescriptorItems != null && this.localDescriptorItems.has(recipientTableKey)) {
                let item: PSTDescriptorItem = this.localDescriptorItems.get(recipientTableKey);
                let descriptorItems: Map<number, PSTDescriptorItem> = null;
                if (item.subNodeOffsetIndexIdentifier > 0) {
                    descriptorItems = this.pstFile.getPSTDescriptorItems(long.fromNumber(item.subNodeOffsetIndexIdentifier));
                }
                this.recipientTable = new PSTTable7C(new PSTNodeInputStream(this.pstFile, item), descriptorItems);
            }
        } catch (err) {
            Log.error('PSTMessage::processRecipients\n' + err)
            this.recipientTable = null;
        }
    }

    // get the number of recipients for this message
    public get numberOfRecipients(): number {
        this.processRecipients();

        // still nothing? must be no recipients...
        if (this.recipientTable == null) {
            return 0;
        }
        return this.recipientTable.rowCount;
    }

    // attachment stuff here, not sure if these can just exist in emails or not,
    // but a table key of 0x0671 would suggest that this is a property of the
    // envelope rather than a specific email property
    // find, extract and load up all of the attachments in this email
    // necessary for the other operations.
    private processAttachments() {
        let attachmentTableKey = 0x0671;
        if (this.attachmentTable == null && this.localDescriptorItems != null && this.localDescriptorItems.has(attachmentTableKey)) {
            let item: PSTDescriptorItem = this.localDescriptorItems.get(attachmentTableKey);
            let descriptorItems: Map<number, PSTDescriptorItem> = null;
            if (item.subNodeOffsetIndexIdentifier > 0) {
                descriptorItems = this.pstFile.getPSTDescriptorItems(long.fromValue(item.subNodeOffsetIndexIdentifier));
            }
            this.attachmentTable = new PSTTable7C(new PSTNodeInputStream(this.pstFile, item), descriptorItems);
        }
    }

    // Start date Filetime
    public get taskStartDate(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00008104, PSTFile.PSETID_Task));
    }

    // Due date Filetime
    public get taskDueDate(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00008105, PSTFile.PSETID_Task));
    }

    // Is a reminder set on this object?
    public get reminderSet(): boolean {
        return this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008503, PSTFile.PSETID_Common));
    }

    public get reminderDelta(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008501, PSTFile.PSETID_Common));
    }

    // "flagged" items are actually emails with a due date.
    // This convience method just checks to see if that is true.
    public get isFlagged(): boolean {
        return this.taskDueDate != null;
    }

    // get the categories defined for this message
    public get colorCategories(): string[] {
        let keywordCategory: number = PSTFile.getPublicStringToIdMapItem('Keywords');

        let categories: string[] = [];
        if (this.pstTableItems.has(keywordCategory)) {
            try {
                let item: PSTTableItem = this.pstTableItems.get(keywordCategory);
                if (item.data.length == 0) {
                    return [];
                }
                let categoryCount: number = item.data[0];
                if (categoryCount > 0) {
                    let categories: string[] = [];
                    let offsets: number[] = [];
                    for (let x = 0; x < categoryCount; x++) {
                        offsets[x] = PSTUtil.convertBigEndianBytesToLong(item.data, x * 4 + 1, (x + 1) * 4 + 1).toNumber();
                    }
                    for (let x = 0; x < offsets.length - 1; x++) {
                        let start = offsets[x];
                        let end = offsets[x + 1];
                        let length = end - start;
                        let buf: Buffer = new Buffer(length);
                        PSTUtil.arraycopy(item.data, start, buf, 0, length);
                        let name: string = new Buffer(buf).toString();
                        categories[x] = name;
                    }
                    let start = offsets[offsets.length - 1];
                    let end = item.data.length;
                    let length = end - start;
                    let buf: Buffer = new Buffer(length);
                    PSTUtil.arraycopy(item.data, start, buf, 0, length);
                    let name: string = new Buffer(buf).toString();
                    categories[categories.length - 1] = name;
                }
            } catch (err) {
                Log.error('PSTMessage::colorCategories Unable to decode category data\n' + err);
                throw err;
            }
        }
        return categories;
    }

    // get the number of attachments for this message
    public get numberOfAttachments(): number {
        try {
            this.processAttachments();
        } catch (err) {
            Log.error('PSTMessage::numberOfAttachments\n' + err);
            return 0;
        }

        // still nothing? must be no attachments...
        if (this.attachmentTable == null) {
            return 0;
        }
        return this.attachmentTable.rowCount;
    }

    // get a specific attachment from this email
    public getAttachment(attachmentNumber: number): PSTAttachment {
        this.processAttachments();

        let attachmentCount = 0;
        if (this.attachmentTable != null) {
            attachmentCount = this.attachmentTable.rowCount;
        }

        if (attachmentNumber >= attachmentCount) {
            throw new Error('PSTMessage::getAttachment unable to fetch attachment number ' + attachmentNumber);
        }

        // we process the C7 table here, basically we just want the attachment local descriptor...
        let attachmentDetails: Map<number, PSTTableItem> = this.attachmentTable.getItems()[attachmentNumber];
        let attachmentTableItem: PSTTableItem = attachmentDetails.get(0x67f2);
        let descriptorItemId = attachmentTableItem.entryValueReference;

        // get the local descriptor for the attachmentDetails table.
        let descriptorItem: PSTDescriptorItem = this.localDescriptorItems.get(descriptorItemId);

        // try and decode it
        let attachmentData: Buffer = descriptorItem.getData();
        if (attachmentData != null && attachmentData.length > 0) {
            let attachmentDetailsTable: PSTTableBC = new PSTTableBC(new PSTNodeInputStream(this.pstFile, descriptorItem));

            // create our all-precious attachment object.
            // note that all the information that was in the c7 table is
            // repeated in the eb table in attachment data.
            // so no need to pass it...
            let attachmentDescriptorItems: Map<number, PSTDescriptorItem> = new Map();
            if (descriptorItem.subNodeOffsetIndexIdentifier > 0) {
                attachmentDescriptorItems = this.pstFile.getPSTDescriptorItems(long.fromNumber(descriptorItem.subNodeOffsetIndexIdentifier));
            }
            return new PSTAttachment(this.pstFile, attachmentDetailsTable, attachmentDescriptorItems);
        }

        throw new Error(
            'PSTMessage::getAttachment unable to fetch attachment number ' + attachmentNumber + ', unable to read attachment details table'
        );
    }

    // get a specific recipient from this email.
    public getRecipient(recipientNumber: number): PSTRecipient {
        if (recipientNumber >= this.numberOfRecipients || recipientNumber >= this.recipientTable.getItems().length) {
            throw new Error('PSTMessage::getAttachment unable to fetch recipient number ' + recipientNumber);
        }

        let recipientDetails: Map<number, PSTTableItem> = this.recipientTable.getItems()[recipientNumber];

        if (recipientDetails != null) {
            return new PSTRecipient(recipientDetails);
        }

        return null;
    }

    public get recipientsString(): string {
        if (this.recipientTable != null) {
            return this.recipientTable.itemsString;
        }
        return 'No recipients table!';
    }

    public get conversationId(): Buffer {
        return this.getBinaryItem(0x3013);
    }

    public get isConversationIndexTracking(): boolean {
        return this.getBooleanItem(0x3016, false);
    }

    public get emailAddress(): string {
        return this.getStringItem(0x3003);
    }

    public get addrType(): string {
        return this.getStringItem(0x3002);
    }

    public get comment(): string {
        return this.getStringItem(0x3004);
    }

    public get creationTime(): Date {
        return this.getDateItem(0x3007);
    }

    public get modificationTime(): Date {
        return this.getDateItem(0x3008);
    }

    // note, not all fields (e.g. the body fields, pidTagSentRepresentingSearchKey, senderEntryId)
    // are included in the JSON string.  caller can get those fields independently.
    public toJSONstring(): string {
        return (
            'PSTMessage:' +
            JSON.stringify(
                {
                    messageClass: this.messageClass,
                    emailAddress: this.emailAddress,
                    subject: this.subject,
                    addrType: this.addrType,
                    comment: this.comment,
                    creationTime: this.creationTime,
                    modificationTime: this.modificationTime,
                    importance: this.importance,
                    transportMessageHeaders: this.transportMessageHeaders,
                    clientSubmitTime: this.clientSubmitTime,
                    receivedByName: this.receivedByName,
                    sentRepresentingName: this.sentRepresentingName,
                    sentRepresentingAddressType: this.sentRepresentingAddressType,
                    sentRepresentingEmailAddress: this.sentRepresentingEmailAddress,
                    conversationTopic: this.conversationTopic,
                    receivedByAddressType: this.receivedByAddressType,
                    receivedByAddress: this.receivedByAddress,
                    isRead: this.isRead,
                    isUnmodified: this.isUnmodified,
                    isSubmitted: this.isSubmitted,
                    isUnsent: this.isUnsent,
                    hasAttachments: this.hasAttachments,
                    isFromMe: this.isFromMe,
                    isAssociated: this.isAssociated,
                    isResent: this.isResent,
                    acknowledgementMode: this.acknowledgementMode,
                    originatorDeliveryReportRequested: this.originatorDeliveryReportRequested,
                    readReceiptRequested: this.readReceiptRequested,
                    recipientReassignmentProhibited: this.recipientReassignmentProhibited,
                    originalSensitivity: this.originalSensitivity,
                    sensitivity: this.sensitivity,
                    //pidTagSentRepresentingSearchKey: this.pidTagSentRepresentingSearchKey,
                    rcvdRepresentingName: this.rcvdRepresentingName,
                    bloriginalSubjectah: this.originalSubject,
                    replyRecipientNames: this.replyRecipientNames,
                    messageToMe: this.messageToMe,
                    messageCcMe: this.messageCcMe,
                    messageRecipMe: this.messageRecipMe,
                    responseRequested: this.responseRequested,
                    sentRepresentingAddrtype: this.sentRepresentingAddrtype,
                    originalDisplayBcc: this.originalDisplayBcc,
                    originalDisplayCc: this.originalDisplayCc,
                    originalDisplayTo: this.originalDisplayTo,
                    rcvdRepresentingAddrtype: this.rcvdRepresentingAddrtype,
                    rcvdRepresentingEmailAddress: this.rcvdRepresentingEmailAddress,
                    isNonReceiptNotificationRequested: this.isNonReceiptNotificationRequested,
                    isOriginatorNonDeliveryReportRequested: this.isOriginatorNonDeliveryReportRequested,
                    recipientType: this.recipientType,
                    isReplyRequested: this.isReplyRequested,
                    //senderEntryId: this.senderEntryId,
                    senderName: this.senderName,
                    senderAddrtype: this.senderAddrtype,
                    senderEmailAddress: this.senderEmailAddress,
                    messageSize: this.messageSize,
                    internetArticleNumber: this.internetArticleNumber,
                    primarySendAccount: this.primarySendAccount,
                    nextSendAcct: this.nextSendAcct,
                    urlCompNamePostfix: this.urlCompNamePostfix,
                    objectType: this.objectType,
                    deleteAfterSubmit: this.deleteAfterSubmit,
                    responsibility: this.responsibility,
                    isRTFInSync: this.isRTFInSync,
                    isURLCompNameSet: this.isURLCompNameSet,
                    displayBCC: this.displayBCC,
                    displayCC: this.displayCC,
                    displayTo: this.displayTo,
                    messageDeliveryTime: this.messageDeliveryTime,
                    nativeBodyType: this.nativeBodyType,
                    bodyPrefix: this.bodyPrefix,
                    rtfSyncBodyCRC: this.rtfSyncBodyCRC,
                    rtfSyncBodyCount: this.rtfSyncBodyCount,
                    rtfSyncBodyTag: this.rtfSyncBodyTag,
                    rtfSyncPrefixCount: this.rtfSyncPrefixCount,
                    rtfSyncTrailingCount: this.rtfSyncTrailingCount,
                    internetMessageId: this.internetMessageId,
                    inReplyToId: this.inReplyToId,
                    returnPath: this.returnPath,
                    iconIndex: this.iconIndex,
                    actionFlag: this.actionFlag,
                    hasReplied: this.hasReplied,
                    actionDate: this.actionDate,
                    disableFullFidelity: this.disableFullFidelity,
                    urlCompName: this.urlCompName,
                    attrHidden: this.attrHidden,
                    attrSystem: this.attrSystem,
                    attrReadonly: this.attrReadonly,
                    numberOfRecipients: this.numberOfRecipients,
                    taskStartDate: this.taskStartDate,
                    taskDueDate: this.taskDueDate,
                    reminderSet: this.reminderSet,
                    reminderDelta: this.reminderDelta,
                    isFlagged: this.isFlagged,
                    colorCategories: this.colorCategories,
                    numberOfAttachments: this.numberOfAttachments,
                    recipientsString: this.recipientsString,
                    conversationId: this.conversationId,
                    isConversationIndexTracking: this.isConversationIndexTracking
                },
                null,
                2
            ) +
            '\n' +
            super.toJSONstring()
        );
    }
}
