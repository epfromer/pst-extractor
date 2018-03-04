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
import { PSTFile } from './../PSTFile/PSTFile.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTMessage } from '../PSTMessage/PSTMessage.class';

// PSTActivity represents Journal entries
export class PSTActivity extends PSTMessage {
    constructor(
        pstFile: PSTFile,
        descriptorIndexNode: DescriptorIndexNode,
        table?: PSTTableBC,
        localDescriptorItems?: Map<number, PSTDescriptorItem>
    ) {
        super(pstFile, descriptorIndexNode, table, localDescriptorItems);
    }

    // Type
    public get logType(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008700, PSTFile.PSETID_Log));
    }

    // Start
    public get logStart(): Date {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00008706, PSTFile.PSETID_Log));
    }

    // Duration
    public get logDuration(): number  {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008707, PSTFile.PSETID_Log));
    }

    // End
    public get logEnd(): Date  {
        return this.getDateItem(this.pstFile.getNameToIdMapItem(0x00008708, PSTFile.PSETID_Log));
    }

    // LogFlags
    public get logFlags(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x0000870c, PSTFile.PSETID_Log));
    }

    // DocPrinted
    public get isDocumentPrinted(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x0000870e, PSTFile.PSETID_Log)));
    }

    // DocSaved
    public get isDocumentSaved(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x0000870f, PSTFile.PSETID_Log)));
    }

    // DocRouted
    public get isDocumentRouted(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008710, PSTFile.PSETID_Log)));
    }

    // DocPosted
    public get isDocumentPosted(): boolean {
        return (this.getBooleanItem(this.pstFile.getNameToIdMapItem(0x00008711, PSTFile.PSETID_Log)));
    }

    // Type Description
    public get logTypeDesc(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008712, PSTFile.PSETID_Log));
    }

    public toString() {
        return (
            '\n messageClass: ' + this.messageClass + 
            '\n subject: ' + this.subject + 
            '\n importance: ' + this.importance + 
            '\n transportMessageHeaders: ' + this.transportMessageHeaders + 
            '\n logType: ' + this.logType + 
            '\n logStart: ' + this.logStart + 
            '\n logDuration: ' + this.logDuration + 
            '\n logEnd: ' + this.logEnd + 
            '\n logFlags: ' + this.logFlags + 
            '\n isDocumentPrinted: ' + this.isDocumentPrinted + 
            '\n isDocumentSaved: ' + this.isDocumentSaved + 
            '\n isDocumentRouted: ' + this.isDocumentRouted + 
            '\n isDocumentPosted: ' + this.isDocumentPosted + 
            '\n logTypeDesc: ' + this.logTypeDesc 
        );
    }

    public toJSONstring(): string {
        return JSON.stringify({
            messageClass: this.messageClass,
            subject: this.subject,
            importance: this.importance,
            transportMessageHeaders: this.transportMessageHeaders,
            logType: this.logType,
            logStart: this.logStart,
            logDuration: this.logDuration,
            logEnd: this.logEnd,
            logFlags: this.logFlags,
            isDocumentPrinted: this.isDocumentPrinted,
            isDocumentSaved: this.isDocumentSaved,
            isDocumentRouted: this.isDocumentRouted,
            isDocumentPosted: this.isDocumentPosted,
            logTypeDesc: this.logTypeDesc 
        }, null, 2);
    }
}
