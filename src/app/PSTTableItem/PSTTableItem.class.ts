import { PSTObject } from "../PSTObject/PSTObject.class";
import { PSTFile } from "../PSTFile/PSTFile.class";

// Generic table item
// Provides some basic string functions
export class PSTTableItem extends PSTObject {

    public static VALUE_TYPE_PT_UNICODE = 0x1f;
    public static VALUE_TYPE_PT_STRING8 = 0x1e;
    public static VALUE_TYPE_PT_BIN = 0x102;

    public itemIndex = 0;
    public entryType = 0;
    public entryValueType = 0;
    public entryValueReference = 0;
    public data: Buffer = new Buffer(1);
    public isExternalValueReference = false;

    public getLongValue() {
        if (this.data.length > 0) {
            return PSTObject.convertLittleEndianBytesToLong(this.data);
        }
        return -1;
    }

    // public getStringValue(): string {
    //     return this.getStringValue(this.entryValueType);
    // }

    // get a string value of the data
    public getStringValue(stringType: number): string {

        if (stringType === PSTTableItem.VALUE_TYPE_PT_UNICODE) {
            // little-endian unicode string
            try {
                if (this.isExternalValueReference) {
                    return "External string reference!";
                }
                return this.data.toString();
            } catch (err) {
                console.log("Error decoding string: " + this.data.toString());
                return "";
            }
        }

        if (stringType == PSTTableItem.VALUE_TYPE_PT_STRING8) {
            return this.data.toString();
        }
        debugger;
        throw new Error('not yet implemented');

        // final StringBuffer outputBuffer = new StringBuffer();

        // // we are not a normal string, give a hexish sort of output
        // final StringBuffer hexOut = new StringBuffer();
        // for (final byte element : this.data) {
        //     final int valueChar = element & 0xff;
        //     if (Character.isLetterOrDigit((char) valueChar)) {
        //         outputBuffer.append((char) valueChar);
        //         outputBuffer.append(" ");
        //     } else {
        //         outputBuffer.append(". ");
        //     }
        //     final String hexValue = Long.toHexString(valueChar);
        //     hexOut.append(hexValue);
        //     hexOut.append(" ");
        //     if (hexValue.length() > 1) {
        //         outputBuffer.append(" ");
        //     }
        // }
        // outputBuffer.append("\n");
        // outputBuffer.append("	");
        // outputBuffer.append(hexOut);

        // return new String(outputBuffer);
    }

    public toString(): string {

        debugger;

        let ret = this.getPropertyDescription(this.entryType, this.entryValueType);

        // if (this.entryValueType == 0x000B) {
        //     return ret + (this.entryValueReference == 0 ? "false" : "true");
        // }

        // if (this.isExternalValueReference) {
        //     // Either a true external reference, or entryValueReference contains
        //     // the actual data
        //     return ret + String.format("0x%08X (%d)", this.entryValueReference, this.entryValueReference);
        // }

        // if (this.entryValueType == 0x0005 || this.entryValueType == 0x0014) {
        //     // 64bit data
        //     if (this.data == null) {
        //         return ret + "no data";
        //     }
        //     if (this.data.length == 8) {
        //         final long l = PSTObject.convertLittleEndianBytesToLong(this.data, 0, 8);
        //         return String.format("%s0x%016X (%d)", ret, l, l);
        //     } else {
        //         return String.format("%s invalid data length: %d", ret, this.data.length);
        //     }
        // }

        // if (this.entryValueType == 0x0040) {
        //     // It's a date...
        //     final int high = (int) PSTObject.convertLittleEndianBytesToLong(this.data, 4, 8);
        //     final int low = (int) PSTObject.convertLittleEndianBytesToLong(this.data, 0, 4);

        //     final Date d = PSTObject.filetimeToDate(high, low);
        //     this.dateFormatter.setTimeZone(utcTimeZone);
        //     return ret + this.dateFormatter.format(d);
        // }

        // if (this.entryValueType == 0x001F) {
        //     // Unicode string
        //     String s;
        //     try {
        //         s = new String(this.data, "UTF-16LE");
        //     } catch (final UnsupportedEncodingException e) {
        //         System.err.println("Error decoding string: " + this.data.toString());
        //         s = "";
        //     }

        //     if (s.length() >= 2 && s.charAt(0) == 0x0001) {
        //         return String.format("%s [%04X][%04X]%s", ret, (short) s.charAt(0), (short) s.charAt(1),
        //             s.substring(2));
        //     }

        //     return ret + s;
        // }

        // return ret + this.getStringValue();
        return ret;
    }

    // private final SimpleDateFormat dateFormatter = new SimpleDateFormat("yyyyMMdd'T'HHmmss'Z'");
    // private static SimpleTimeZone utcTimeZone = new SimpleTimeZone(0, "UTC");
}
