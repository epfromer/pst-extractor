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
import { PSTFile } from '../PSTFile/PSTFile.class';
import { DescriptorIndexNode } from '../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { PSTDescriptorItem } from '../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTMessage } from '../PSTMessage/PSTMessage.class';

// Object that represents a RSS item
export class PSTRss extends PSTMessage {
    constructor(
        pstFile: PSTFile,
        descriptorIndexNode: DescriptorIndexNode,
        table?: PSTTableBC,
        localDescriptorItems?: Map<number, PSTDescriptorItem>
    ) {
        super(pstFile, descriptorIndexNode, table, localDescriptorItems);
    }

    // Channel
    public get postRssChannelLink(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008900, PSTFile.PSETID_PostRss));
    }

    // Item link
    public get postRssItemLink(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008901, PSTFile.PSETID_PostRss));
    }

    // Item hash Integer 32-bit signed
    public get postRssItemHash(): number {
        return this.getIntItem(this.pstFile.getNameToIdMapItem(0x00008902, PSTFile.PSETID_PostRss));
    }

    // Item GUID
    public get postRssItemGuid(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008903, PSTFile.PSETID_PostRss));
    }

    // Channel GUID
    public get postRssChannel(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008904, PSTFile.PSETID_PostRss));
    }

    // Item XML
    public get postRssItemXml(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008905, PSTFile.PSETID_PostRss));
    }

    // Subscription
    public get postRssSubscription(): string {
        return this.getStringItem(this.pstFile.getNameToIdMapItem(0x00008906, PSTFile.PSETID_PostRss));
    }

    public toJSONstring(): string {
        return (
            'PSTRss: ' +
            JSON.stringify(
                {
                    messageClass: this.messageClass,
                    subject: this.subject,
                    importance: this.importance,
                    transportMessageHeaders: this.transportMessageHeaders,
                    postRssChannelLink: this.postRssChannelLink,
                    postRssItemLink: this.postRssItemLink,
                    postRssItemHash: this.postRssItemHash,
                    postRssItemGuid: this.postRssItemGuid,
                    postRssChannel: this.postRssChannel,
                    postRssItemXml: this.postRssItemXml,
                    postRssSubscription: this.postRssSubscription
                },
                null,
                2
            ) +
            '\n' +
            super.toJSONstring()
        );
    }
}
