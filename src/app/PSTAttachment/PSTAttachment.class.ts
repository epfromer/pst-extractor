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
import { PSTUtil } from './../PSTUtil/PSTUtil.class';
import { PSTObject } from '../PSTObject/PSTObject.class';
import { PSTFile } from '../PSTFile/PSTFile.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTMessage } from '../PSTMessage/PSTMessage.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTTableBCItem } from '../PSTTableBCItem/PSTTableBCItem.class';
import * as long from 'long';

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
        pstFile: PSTFile, // theFile
        table: PSTTableBC,
        localDescriptorItems: Map<number, PSTDescriptorItem>
    ) {
        super();
        // pre-populate folder object with values
        this.prePopulate(pstFile, null, table, localDescriptorItems);
    }

    public get size(): number {
        return this.getIntItem(0x0e20);
    }

    public get creationTime(): Date {
        return this.getDateItem(0x3007);
    }

    public get modificationTime(): Date {
        return this.getDateItem(0x3008);
    }

    public get embeddedPSTMessage(): PSTMessage {
        let pstNodeInputStream: PSTNodeInputStream = null;
        if (this.getIntItem(0x3705) == PSTAttachment.ATTACHMENT_METHOD_EMBEDDED) {
            let item: PSTTableBCItem = this.pstTableItems.get(0x3701);
            if (item.entryValueType == 0x0102) {
                if (!item.isExternalValueReference) {
                    pstNodeInputStream = new PSTNodeInputStream(this.pstFile, item.data);
                } else {
                    // We are in trouble!
                    throw new Error('PSTAttachment::getEmbeddedPSTMessage External reference in getEmbeddedPSTMessage()!');
                }
            } else if (item.entryValueType == 0x000d) {
                let descriptorItem = PSTUtil.convertLittleEndianBytesToLong(item.data, 0, 4).toNumber();
                let descriptorItemNested: PSTDescriptorItem = this.localDescriptorItems.get(descriptorItem);
                pstNodeInputStream = new PSTNodeInputStream(this.pstFile, descriptorItemNested);
                if (descriptorItemNested.subNodeOffsetIndexIdentifier > 0) {
                    this.localDescriptorItems = this.pstFile.getPSTDescriptorItems(
                        long.fromNumber(descriptorItemNested.subNodeOffsetIndexIdentifier)
                    );
                }
            }

            if (!pstNodeInputStream) {
                return null;
            }

            try {
                let attachmentTable: PSTTableBC = new PSTTableBC(pstNodeInputStream);
                return PSTUtil.createAppropriatePSTMessageObject(this.pstFile, this.descriptorIndexNode, attachmentTable, this.localDescriptorItems);
            } catch (err) {
                err.printStackTrace();
            }
            return null;
        }
        return null;
    }

    public get fileInputStream(): PSTNodeInputStream {
        let attachmentDataObject: PSTTableBCItem = this.pstTableItems.get(0x3701);
        if (!attachmentDataObject) {
            return null;
        } else if (attachmentDataObject.isExternalValueReference) {
            let descriptorItemNested: PSTDescriptorItem = this.localDescriptorItems.get(attachmentDataObject.entryValueReference);
            return new PSTNodeInputStream(this.pstFile, descriptorItemNested);
        } else {
            // internal value references are never encrypted
            return new PSTNodeInputStream(this.pstFile, attachmentDataObject.data, false);
        }
    }

    public get filesize(): number {
        let attachmentDataObject: PSTTableBCItem = this.pstTableItems.get(0x3701);
        if (attachmentDataObject.isExternalValueReference) {
            let descriptorItemNested: PSTDescriptorItem = this.localDescriptorItems.get(attachmentDataObject.entryValueReference);
            if (descriptorItemNested == null) {
                throw new Error('PSTAttachment::filesize missing attachment descriptor item for: ' + attachmentDataObject.entryValueReference);
            }
            return descriptorItemNested.getDataSize();
        } else {
            // raw attachment data, right there!
            return attachmentDataObject.data.length;
        }
    }

    // Attachment (short) filename ASCII or Unicode string
    public get filename(): string {
        return this.getStringItem(0x3704);
    }

    // Attachment method Integer 32-bit signed 0 => None (No attachment) 1 => By
    // value 2 => By reference 3 => By reference resolve 4 => By reference only
    // 5 => Embedded message 6 => OLE
    public get attachMethod(): number {
        return this.getIntItem(0x3705);
    }

    // Attachment size
    public get attachSize(): number {
        return this.getIntItem(0x0e20);
    }

    // Attachment number
    public get attachNum(): number {
        return this.getIntItem(0x0e21);
    }

    // Attachment long filename ASCII or Unicode string
    public get longFilename(): string {
        return this.getStringItem(0x3707);
    }

    // Attachment (short) pathname ASCII or Unicode string
    public get pathname(): string {
        return this.getStringItem(0x3708);
    }

    // Attachment Position Integer 32-bit signed
    public get renderingPosition(): number {
        return this.getIntItem(0x370b);
    }

    // Attachment long pathname ASCII or Unicode string
    public get longPathname(): string {
        return this.getStringItem(0x370d);
    }

    // Attachment mime type ASCII or Unicode string
    public get mimeTag(): string {
        return this.getStringItem(0x370e);
    }

    // Attachment mime sequence
    public get mimeSequence(): number {
        return this.getIntItem(0x3710);
    }

    // Attachment Content ID
    public get contentId(): string {
        return this.getStringItem(0x3712);
    }

    // Attachment not available in HTML
    public get isAttachmentInvisibleInHtml(): boolean {
        let actionFlag = this.getIntItem(0x3714);
        return (actionFlag & 0x1) > 0;
    }

    // Attachment not available in RTF
    public get isAttachmentInvisibleInRTF(): boolean {
        let actionFlag = this.getIntItem(0x3714);
        return (actionFlag & 0x2) > 0;
    }

    // Attachment is MHTML REF
    public get isAttachmentMhtmlRef(): boolean {
        let actionFlag = this.getIntItem(0x3714);
        return (actionFlag & 0x4) > 0;
    }

    // Attachment content disposition
    public get attachmentContentDisposition(): string {
        return this.getStringItem(0x3716);
    }

    public toJSONstring(): string {
        return (
            'PSTAttachment: ' +
            JSON.stringify(
                {
                    size: this.size,
                    creationTime: this.creationTime,
                    modificationTime: this.modificationTime,
                    filename: this.filename,
                    attachMethod: this.attachMethod,
                    attachSize: this.attachSize,
                    attachNum: this.attachNum,
                    longFilename: this.longFilename,
                    pathname: this.pathname,
                    renderingPosition: this.renderingPosition,
                    longPathname: this.longPathname,
                    mimeTag: this.mimeTag,
                    mimeSequence: this.mimeSequence,
                    contentId: this.contentId,
                    isAttachmentInvisibleInHtml: this.isAttachmentInvisibleInHtml,
                    isAttachmentInvisibleInRTF: this.isAttachmentInvisibleInRTF,
                    isAttachmentMhtmlRef: this.isAttachmentMhtmlRef,
                    attachmentContentDisposition: this.attachmentContentDisposition
                },
                null,
                2
            ) +
            '\n' +
            super.toJSONstring()
        );
    }
}
