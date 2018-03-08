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
import { PSTTableItem } from '../PSTTableItem/PSTTableItem.class';

// Class containing recipient information
export class PSTRecipient {
    private details: Map<number, PSTTableItem>;

    public static MAPI_TO = 1;
    public static MAPI_CC = 2;
    public static MAPI_BCC = 3;

    constructor(recipientDetails: Map<number, PSTTableItem>) {
        this.details = recipientDetails;
    }

    public get displayName(): string {
        return this.getString(0x3001);
    }

    public get recipientType(): number {
        return this.getInt(0x0c15);
    }

    public get emailAddressType(): string {
        return this.getString(0x3002);
    }

    public get emailAddress(): string {
        return this.getString(0x3003);
    }

    public get recipientFlags(): number {
        return this.getInt(0x5ffd);
    }

    public get recipientOrder(): number {
        return this.getInt(0x5fdf);
    }

    public getSmtpAddress(): string {
        // If the recipient address type is SMTP,
        // we can simply return the recipient address.
        let addressType: string = this.emailAddressType;
        if (addressType != null && addressType.toLowerCase() === "smtp") {
            let addr: string = this.emailAddress;
            if (addr != null && addr.length != 0) {
                return addr;
            }
        }
        // Otherwise, we have to hope the SMTP address is
        // present as the PidTagPrimarySmtpAddress property.
        return this.getString(0x39FE);
    }

    private getString(id: number): string {
        if (this.details.has(id)) {
            let item: PSTTableItem = this.details.get(id);
            return item.getStringValue();
        }
        return "";
    }

    private getInt(id: number): number {
        if (this.details.has(id)) {
            let item: PSTTableItem = this.details.get(id);
            if (item.entryValueType == 0x0003) {
                return item.entryValueReference;
            }

            if (item.entryValueType == 0x0002) {
                debugger;
                // final short s = (short) item.entryValueReference;
                // return s;
            }
        }
        return 0;
    }

    public toJSONstring(): string {
        return (
            'PSTObject:' +
            JSON.stringify(
                {
                    displayName: this.displayName,
                    recipientType: this.recipientType,
                    emailAddressType: this.emailAddressType,
                    emailAddress: this.emailAddress,
                    recipientFlags: this.recipientFlags,
                    recipientOrder: this.recipientOrder,
                },
                null,
                2
            )
        );
    }
}
