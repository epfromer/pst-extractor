import { PSTTable7CItem } from './../PSTTable7CItem/PSTTable7CItem.class';

// Class containing recipient information
export class PSTRecipient {
    private details: Map<number, PSTTable7CItem>;

    public static MAPI_TO = 1;
    public static MAPI_CC = 2;
    public static MAPI_BCC = 3;

    constructor(recipientDetails: Map<number, PSTTable7CItem>) {
        this.details = recipientDetails;
    }

    public getDisplayName(): string {
        return this.getString(0x3001);
    }

    public getRecipientType(): number {
        return this.getInt(0x0c15);
    }

    public getEmailAddressType(): string {
        return this.getString(0x3002);
    }

    public getEmailAddress(): string {
        return this.getString(0x3003);
    }

    public getRecipientFlags(): number {
        return this.getInt(0x5ffd);
    }

    public getRecipientOrder(): number {
        return this.getInt(0x5fdf);
    }

    public getSmtpAddress(): string {
        // If the recipient address type is SMTP,
        // we can simply return the recipient address.
        let addressType: string = this.getEmailAddressType();
        if (addressType != null && addressType.toLowerCase() === "smtp") {
            let addr: string = this.getEmailAddress();
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
            let item: PSTTable7CItem = this.details.get(id);
            return item.getStringValue();
        }
        return "";
    }

    private getInt(id: number): number {
        if (this.details.has(id)) {
            let item: PSTTable7CItem = this.details.get(id);
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
}
