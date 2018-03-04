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
import { PSTObject } from './../PSTObject/PSTObject.class';
import { PSTFile } from './../PSTFile/PSTFile.class';
import { DescriptorIndexNode } from './../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTTableBCItem } from '../PSTTableBCItem/PSTTableBCItem.class';

// Object that represents the message store.
// Not much use other than to get the "name" of the PST file.
export class PSTMessageStore extends PSTObject {
    constructor(pstFile: PSTFile, descriptorIndexNode: DescriptorIndexNode) {
        super();
        this.loadDescriptor(pstFile, descriptorIndexNode);
    }

    // Get the tag record key, unique to this pst
    // public UUID getTagRecordKeyAsUUID() {
    //     // attempt to find in the table.
    //     final int guidEntryType = 0x0ff9;
    //     if (this.items.containsKey(guidEntryType)) {
    //         final PSTTableBCItem item = this.items.get(guidEntryType);
    //         final int offset = 0;
    //         final byte[] bytes = item.data;
    //         final long mostSigBits = (PSTObject.convertLittleEndianBytesToLong(bytes, offset, offset + 4) << 32)
    //             | (PSTObject.convertLittleEndianBytesToLong(bytes, offset + 4, offset + 6) << 16)
    //             | PSTObject.convertLittleEndianBytesToLong(bytes, offset + 6, offset + 8);
    //         final long leastSigBits = PSTObject.convertBigEndianBytesToLong(bytes, offset + 8, offset + 16);
    //         return new UUID(mostSigBits, leastSigBits);
    //     }
    //     return null;
    // }

    // get the message store display name
    public getDisplayName(): string {
        // attempt to find in the table.
        let displayNameEntryType = 0x3001;
        if (this.pstTableItems.has(displayNameEntryType)) {
            return this.getStringItem(displayNameEntryType);
        }
        return '';
    }

    // public String getDetails() {
    //     return this.items.toString();
    // }

    // /**
    //  * Is this pst file is password protected.
    //  *
    //  * @throws PSTException
    //  *             on corrupted pst
    //  * @throws IOException
    //  *             on bad read
    //  * @return - true if protected,false otherwise
    //  *         pstfile has the password stored against identifier 0x67FF.
    //  *         if there is no password the value stored is 0x00000000.
    //  */
    // public boolean isPasswordProtected() throws PSTException, IOException {
    //     return (this.getLongItem(0x67FF) != 0);
    // }
}
