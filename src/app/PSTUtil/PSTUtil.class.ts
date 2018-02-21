import * as long from 'long';

// utility functions for PST components
export class PSTUtil {

    // substitution table for the compressible encryption type.
    public static compEnc = [ 0x47, 0xf1, 0xb4, 0xe6, 0x0b, 0x6a, 0x72, 0x48, 0x85, 0x4e, 0x9e, 0xeb, 0xe2, 0xf8, 0x94,
        0x53, 0xe0, 0xbb, 0xa0, 0x02, 0xe8, 0x5a, 0x09, 0xab, 0xdb, 0xe3, 0xba, 0xc6, 0x7c, 0xc3, 0x10, 0xdd, 0x39,
        0x05, 0x96, 0x30, 0xf5, 0x37, 0x60, 0x82, 0x8c, 0xc9, 0x13, 0x4a, 0x6b, 0x1d, 0xf3, 0xfb, 0x8f, 0x26, 0x97,
        0xca, 0x91, 0x17, 0x01, 0xc4, 0x32, 0x2d, 0x6e, 0x31, 0x95, 0xff, 0xd9, 0x23, 0xd1, 0x00, 0x5e, 0x79, 0xdc,
        0x44, 0x3b, 0x1a, 0x28, 0xc5, 0x61, 0x57, 0x20, 0x90, 0x3d, 0x83, 0xb9, 0x43, 0xbe, 0x67, 0xd2, 0x46, 0x42,
        0x76, 0xc0, 0x6d, 0x5b, 0x7e, 0xb2, 0x0f, 0x16, 0x29, 0x3c, 0xa9, 0x03, 0x54, 0x0d, 0xda, 0x5d, 0xdf, 0xf6,
        0xb7, 0xc7, 0x62, 0xcd, 0x8d, 0x06, 0xd3, 0x69, 0x5c, 0x86, 0xd6, 0x14, 0xf7, 0xa5, 0x66, 0x75, 0xac, 0xb1,
        0xe9, 0x45, 0x21, 0x70, 0x0c, 0x87, 0x9f, 0x74, 0xa4, 0x22, 0x4c, 0x6f, 0xbf, 0x1f, 0x56, 0xaa, 0x2e, 0xb3,
        0x78, 0x33, 0x50, 0xb0, 0xa3, 0x92, 0xbc, 0xcf, 0x19, 0x1c, 0xa7, 0x63, 0xcb, 0x1e, 0x4d, 0x3e, 0x4b, 0x1b,
        0x9b, 0x4f, 0xe7, 0xf0, 0xee, 0xad, 0x3a, 0xb5, 0x59, 0x04, 0xea, 0x40, 0x55, 0x25, 0x51, 0xe5, 0x7a, 0x89,
        0x38, 0x68, 0x52, 0x7b, 0xfc, 0x27, 0xae, 0xd7, 0xbd, 0xfa, 0x07, 0xf4, 0xcc, 0x8e, 0x5f, 0xef, 0x35, 0x9c,
        0x84, 0x2b, 0x15, 0xd5, 0x77, 0x34, 0x49, 0xb6, 0x12, 0x0a, 0x7f, 0x71, 0x88, 0xfd, 0x9d, 0x18, 0x41, 0x7d,
        0x93, 0xd8, 0x58, 0x2c, 0xce, 0xfe, 0x24, 0xaf, 0xde, 0xb8, 0x36, 0xc8, 0xa1, 0x80, 0xa6, 0x99, 0x98, 0xa8,
        0x2f, 0x0e, 0x81, 0x65, 0x73, 0xe4, 0xc2, 0xa2, 0x8a, 0xd4, 0xe1, 0x11, 0xd0, 0x08, 0x8b, 0x2a, 0xf2, 0xed,
        0x9a, 0x64, 0x3f, 0xc1, 0x6c, 0xf9, 0xec ];

    // maps hex codes to names for properties
    public static propertyName: Map<number, string> = new Map([
        [0x0002, 'PidTagAlternateRecipientAllowed'],
        [0x0003, 'PidTagNameidStreamEntry'],
        [0x0004, 'PidTagNameidStreamString'],
        [0x0017, 'PidTagImportance'],
        [0x001A, 'PidTagMessageClass'],
        [0x0023, 'PidTagOriginatorDeliveryReportRequested'],
        [0x0026, 'PidTagPriority'],
        [0x0029, 'PidLidOldWhenStartWhole'],
        [0x002B, 'PidTagRecipientReassignmentProhibited'],
        [0x002E, 'PidTagOriginalSensitivity'],
        [0x0036, 'PidTagSensitivity'],
        [0x0037, 'PidTagSubject'],
        [0x0039, 'PidTagClientSubmitTime'],
        [0x003B, 'PidTagSentRepresentingSearchKey'],
        [0x003F, 'PidTagReceivedByEntryId'],
        [0x0040, 'PidTagReceivedByName'],
        [0x0041, 'PidTagSentRepresentingEntryId'],
        [0x0042, 'PidTagSentRepresentingName'],
        [0x0043, 'PidTagReceivedRepresentingEntryId'],
        [0x0044, 'PidTagReceivedRepresentingName'],
        [0x004D, 'PidTagOriginalAuthorName'],
        [0x0052, 'PidTagReceivedRepresentingSearchKey'],
        [0x0057, 'PidTagMessageToMe'],
        [0x0058, 'PidTagMessageCcMe'],
        [0x0060, 'PidTagStartDate'],
        [0x0061, 'PidTagEndDate'],
        [0x0062, 'PidTagOwnerAppointmentId'],
        [0x0063, 'PidTagResponseRequested'],
        [0x0064, 'PidTagSentRepresentingAddressType'],
        [0x0065, 'PidTagSentRepresentingEmailAddress'],
        [0x0070, 'PidTagConversationTopic'],
        [0x0071, 'PidTagConversationIndex'],
        [0x0075, 'PidTagReceivedByAddressType'],
        [0x0076, 'PidTagReceivedByEmailAddress'],
        [0x0077, 'PidTagReceivedRepresentingAddressType'],
        [0x0078, 'PidTagReceivedRepresentingEmailAddress'],
        [0x007D, 'PidTagTransportMessageHeaders'],
        [0x0C15, 'PidTagRecipientType'],
        [0x0C17, 'PidTagReplyRequested'],
        [0x0C19, 'PidTagSenderEntryId'],
        [0x0C1A, 'PidTagSenderName'],
        [0x0C1D, 'PidTagSenderSearchKey'],
        [0x0C1E, 'PidTagSenderAddressType'],
        [0x0C1F, 'PidTagSenderEmailAddress'],
        [0x0E01, 'PidTagDeleteAfterSubmit'],
        [0x0E02, 'PidTagDisplayBcc'],
        [0x0E03, 'PidTagDisplayCc'],
        [0x0E04, 'PidTagDisplayTo'],
        [0x0E06, 'PidTagMessageDeliveryTime'],
        [0x0E07, 'PidTagMessageFlags'],
        [0x0E08, 'PidTagMessageSize'],
        [0x0E0F, 'PidTagResponsibility'],
        [0x0E20, 'PidTagAttachSize'],
        [0x0E23, 'PidTagInternetArticleNumber'],
        [0x0E38, 'PidTagReplFlags'],
        [0x0E62, 'PidTagUrlCompNameSet'],
        [0x0E79, 'PidTagTrustSender'],
        [0x0FF9, 'PidTagRecordKey'],
        [0x0FFE, 'PidTagObjectType'],
        [0x0FFF, 'PidTagEntryId'],
        [0x1000, 'PidTagBody'],
        [0x1009, 'PidTagRtfCompressed'],
        [0x1013, 'PidTagBodyHtml'],
        [0x1035, 'PidTagInternetMessageId'],
        [0x1039, 'PidTagInternetReferences'],
        [0x1042, 'PidTagInReplyToId'],
        [0x1080, 'PidTagIconIndex'],
        [0x1081, 'PidTagLastVerbExecuted'],
        [0x1082, 'PidTagLastVerbExecutionTime'],
        [0x1096, 'PidTagBlockStatus'],
        [0x10C3, 'PidTagICalendarStartTime'],
        [0x10C4, 'PidTagICalendarEndTime'],
        [0x10F2, 'Unknown_10F2'],
        [0x10F3, 'PidTagUrlCompName'],
        [0x10F4, 'PidTagAttributeHidden'],
        [0x10F5, 'PidTagAttributeSystem'],
        [0x10F6, 'PidTagAttributeReadOnly'],
        [0x3001, 'PidTagDisplayName'],
        [0x3002, 'PidTagAddressType'],
        [0x3003, 'PidTagEmailAddress'],
        [0x3007, 'PidTagCreationTime'],
        [0x3008, 'PidTagLastModificationTime'],
        [0x300B, 'PidTagSearchKey'],
        [0x3701, 'PidTagAttachDataBinary'],
        [0x3702, 'PidTagAttachEncoding'],
        [0x3703, 'PidTagAttachExtension'],
        [0x3704, 'PidTagAttachFilename'],
        [0x3705, 'PidTagAttachMethod'],
        [0x3709, 'PidTagAttachRendering'],
        [0x370B, 'PidTagRenderingPosition'],
        [0x370E, 'PidTagAttachMimeTag'],
        [0x370A, 'PidTagAttachTag'],
        [0x3712, 'PidTagAttachContentId'],
        [0x3714, 'PidTagAttachFlags'],
        [0x3900, 'PidTagDisplayType'],
        [0x39FE, 'PidTagPrimarySmtpAddress'],
        [0x39FF, 'PidTag7BitDisplayName'],
        [0x3A00, 'PidTagAccount'],
        [0x3A08, 'PidTagBusinessTelephoneNumber'],
        [0x3A20, 'PidTagTransmittableDisplayName'],
        [0x3A40, 'PidTagSendRichInfo'],
        [0x3A70, 'PidTagUserX509Certificate'],
        [0x3A71, 'PidTagSendInternetEncoding'],
        [0x3FDE, 'PidTagInternetCodepage'],
        [0x3FF1, 'PidTagMessageLocaleId'],
        [0x3FFD, 'PidTagMessageCodepage'],
        [0x3ff9, 'PidTagCreatorName'],
        [0x4019, 'PidTagSenderFlags'],
        [0x401A, 'PidTagSentRepresentingFlags'],
        [0x401B, 'PidTagReceivedByFlags'],
        [0x401C, 'PidTagReceivedRepresentingFlags'],
        [0x403E, 'Unknown_403E'],
        [0x4A08, 'Unknown_4A08'],
        [0x5902, 'PidTagInternetMailOverrideFormat'],
        [0x5909, 'PidTagMessageEditorFormat'],
        [0x5FDE, 'PidTagRecipientResourceState'],
        [0x5FDF, 'PidTagRecipientOrder'],
        [0x5FEB, 'Unknown_5FEB'],
        [0x5FEF, 'Unknown_5FEF'],
        [0x5FF2, 'Unknown_5FF2'],
        [0x5FF5, 'Unknown_5FF5'],
        [0x5FF6, 'PidTagRecipientDisplayName'],
        [0x5FF7, 'PidTagRecipientEntryId'],
        [0x5FFB, 'PidTagRecipientTrackStatusTime'],
        [0x5FFD, 'PidTagRecipientFlags'],
        [0x5FFF, 'PidTagRecipientTrackStatus'],
        [0x6001, 'PidTagNickname'],
        [0x6610, 'Unknown_6610'],
        [0x6614, 'Unknown_6614'],
        [0x6617, 'Unknown_6617'],
        [0x6619, 'PidTagUserEntryId'],
        [0x6743, 'Unknown_6743'],
        [0x6744, 'Unknown_6744'],
        [0x67F2, 'PidTagLtpRowId'],
        [0x67F3, 'PidTagLtpRowVer'],
        [0x67F4, 'Unknown_67F4'],
        [0x7FFA, 'PidTagAttachmentLinkId'],
        [0x7FFB, 'PidTagExceptionStartTime'],
        [0x7FFC, 'PidTagExceptionEndTime'],
        [0x7FFD, 'PidTagAttachmentFlags'],
        [0x7FFE, 'PidTagAttachmentHidden'],
        [0x7FFF, 'PidTagAttachmentContactPhoto'],
        [0x3FFA, 'PidTagLastModifiedName_W'],
        [0x3FFB, 'PidTagLastModifierEntryId']
    ]);

    //     public static final int NID_TYPE_HID = 0x00; // Heap node
    // public static final int NID_TYPE_INTERNAL = 0x01; // Internal node (section
    //                                                   // 2.4.1)
    // public static final int NID_TYPE_NORMAL_FOLDER = 0x02; // Normal Folder
    //                                                        // object (PC)
    // public static final int NID_TYPE_SEARCH_FOLDER = 0x03; // Search Folder
    //                                                        // object (PC)
    // public static final int NID_TYPE_NORMAL_MESSAGE = 0x04; // Normal Message
    //                                                         // object (PC)
    // public static final int NID_TYPE_ATTACHMENT = 0x05; // Attachment object
    //                                                     // (PC)
    // public static final int NID_TYPE_SEARCH_UPDATE_QUEUE = 0x06; // Queue of
    //                                                              // changed
    //                                                              // objects for
    //                                                              // search
    //                                                              // Folder
    //                                                              // objects
    // public static final int NID_TYPE_SEARCH_CRITERIA_OBJECT = 0x07; // Defines
    //                                                                 // the
    //                                                                 // search
    //                                                                 // criteria
    //                                                                 // for a
    //                                                                 // search
    //                                                                 // Folder
    //                                                                 // object
    // public static final int NID_TYPE_ASSOC_MESSAGE = 0x08; // Folder associated
    //                                                        // information (FAI)
    //                                                        // Message object
    //                                                        // (PC)
    // public static final int NID_TYPE_CONTENTS_TABLE_INDEX = 0x0A; // Internal,
    //                                                               // persisted
    //                                                               // view-related
    // public static final int NID_TYPE_RECEIVE_FOLDER_TABLE = 0X0B; // Receive
    //                                                               // Folder
    //                                                               // object
    //                                                               // (Inbox)
    // public static final int NID_TYPE_OUTGOING_QUEUE_TABLE = 0x0C; // Outbound
    //                                                               // queue
    //                                                               // (Outbox)
    // public static final int NID_TYPE_HIERARCHY_TABLE = 0x0D; // Hierarchy table
    //                                                          // (TC)
    // public static final int NID_TYPE_CONTENTS_TABLE = 0x0E; // Contents table
    //                                                         // (TC)
    // public static final int NID_TYPE_ASSOC_CONTENTS_TABLE = 0x0F; // FAI
    //                                                               // contents
    //                                                               // table (TC)
    // public static final int NID_TYPE_SEARCH_CONTENTS_TABLE = 0x10; // Contents
    //                                                                // table (TC)
    //                                                                // of a
    //                                                                // search
    //                                                                // Folder
    //                                                                // object
    // public static final int NID_TYPE_ATTACHMENT_TABLE = 0x11; // Attachment
    //                                                           // table (TC)
    // public static final int NID_TYPE_RECIPIENT_TABLE = 0x12; // Recipient table
    //                                                          // (TC)
    // public static final int NID_TYPE_SEARCH_TABLE_INDEX = 0x13; // Internal,
    //                                                             // persisted
    //                                                             // view-related
    // public static final int NID_TYPE_LTP = 0x1F; // LTP

    // public String getItemsString() {
    //     return this.items.toString();
    // }

    // convert little endian bytes to long
    // TODO - can this be done by long library?
    public static convertLittleEndianBytesToLong(data: Buffer, start?: number, end?: number): long {
        if (!start) {
            start = 0;
        }
        if (!end) {
            end = data.length;
        }

        let offset: long = long.fromNumber(data[end - 1] & 0xff);
        let tmpLongValue: long;
        for (let x = end - 2; x >= start; x--) {
            offset = offset.shiftLeft(8);
            tmpLongValue = long.fromNumber(data[x] & 0xff);
            offset = offset.xor(tmpLongValue);
        }

        // console.log("PSTObject: convertLittleEndianBytesToLong = " + offset.toString());
        
        return offset;
    }

    // convert big endian bytes to long
    // TODO - can this be done by long library?
    public static convertBigEndianBytesToLong(data: Buffer, start?: number, end?: number): long {
        if (!start) {
            start = 0;
        }
        if (!end) {
            end = data.length;
        }

        let offset: long = long.ZERO;
        for (let x = start; x < end; ++x) {
            offset = offset.shiftLeft(8);
            let tmpLongValue = long.fromNumber(data[x] & 0xFF);
            offset = offset.xor(tmpLongValue);
        }

        // console.log("PSTObject: convertBigEndianBytesToLong = " + offset.toString());

        return offset;
    }

    public static arraycopy(src: Buffer, srcPos: number, dest: Buffer, destPos: number, length: number) {
        // FIX THIS - TOO SLOW?
        let s = srcPos;
        let d = destPos;
        let i = 0;
        while(i++ < length) {
            dest[d++] = src[s++];
        }
    }

    // determine if character is alphanumeric
    public static isAlphaNumeric = (ch: string) => {
        return ch.match(/^[a-z0-9]+$/i) !== null;
    }

    // Output a dump of data in hex format in the order it was read in
    public static printHexFormatted(data: Buffer, pretty: boolean, indexes?: number[]) {

        if (!indexes) {
            indexes = [0];
        }

        // groups of two
        if (pretty) {
            console.log("---");
        }
        let tmpLongValue;
        let line = "";
        let nextIndex = 0;
        let indexIndex = 0;
        if (indexes.length > 0) {
            nextIndex = indexes[0];
            indexIndex++;
        }
        for (let x = 0; x < data.length; x++) {
            tmpLongValue = data[x] & 0xff;

            if (indexes.length > 0 && x == nextIndex && nextIndex < data.length) {
                console.log("+");
                line += "+";
                while (indexIndex < indexes.length - 1 && indexes[indexIndex] <= nextIndex) {
                    indexIndex++;
                }
                nextIndex = indexes[indexIndex];
                // indexIndex++;
            }

            if (this.isAlphaNumeric(tmpLongValue.toString())) {
                line += tmpLongValue;
            } else {
                line += ".";
            }

            // if (Long.toHexString(tmpLongValue).length() < 2) {
            //     System.out.print("0");
            // }
            console.log(tmpLongValue.toString(16));
            if (x % 2 == 1 && pretty) {
                console.log(" ");
            }
            if (x % 16 == 15 && pretty) {
                console.log(" " + line);
                console.log("");
                line = "";
            }
        }
        if (pretty) {
            console.log(" " + line);
            console.log("---");
            console.log(data.length);
        } else {
        }
    }

    // decode a lump of data that has been encrypted with the compressible encryption
    public static decode(data: Buffer): Buffer {
        let temp;
        for (let x = 0; x < data.length; x++) {
            temp = data[x] & 0xff;
            data[x] = this.compEnc[temp];
        }

        return data;
    }

        // public static void printFormattedNumber(final String pref, final long number) {
    //     System.out.print(pref);
    //     printFormattedNumber(number);
    // }

    // public static void printFormattedNumber(final long number) {
    //     System.out.print("dec: ");
    //     System.out.print(number);
    //     System.out.print(", hex: ");
    //     System.out.print(Long.toHexString(number));
    //     System.out.print(", bin: ");
    //     System.out.println(Long.toBinaryString(number));
    // }

    public static getPropertyName(propertyId: number, bNamed: boolean): string {
        return ''; // TODO
        // return this.propertyName.get(propertyId);
    }

    public static getNameToIdMapKey(id: number): number {
        return -1;
        // TODO
        // let i = idToName.get(id);
        // if (i == null) {
        //     // throw new PSTException("Name to Id mapping not found");
        //     return -1;
        // }
        // return i;
    }

    public static getPropertyDescription(entryType: number, entryValueType: number): string {
        let ret = "";
        if (entryType < 0x8000) {
            let name = this.getPropertyName(entryType, false);
            if (name != null) {
                ret = name + ':' + entryValueType.toString(16) + ':'; 
            } else {
                ret = entryType.toString(16) + ':' + entryValueType.toString(16) + ':'; 
            }
        } else {
            let type = this.getNameToIdMapKey(entryType);
            if (type == -1) {
                ret = '0xFFFF(' + entryType.toString(16) + '):' +  entryValueType.toString(16) + ':'; 
            } else {
                let name = this.getPropertyName(type, true);
                if (name != null) {
                    ret = name + '(' + entryType.toString(16) + '):' +  entryValueType.toString(16) + ':'; 
                } else {
                    ret = '0x' + type.toString(16) + '(' + entryType.toString(16) + '):' +  entryValueType.toString(16) + ':'; 
                }
            }
        }
        return ret;
    }
}