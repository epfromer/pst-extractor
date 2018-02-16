export class PSTObject {

    // convert little endian bytes to number (long)
    public static convertLittleEndianBytesToLong(data: Buffer) {

        let offset = data[data.length - 1] & 0xff;
        let tmpLongValue;
        for (let x = data.length - 2; x >= 0; x--) {
            offset = offset << 8;
            tmpLongValue = data[x] & 0xff;
            offset |= tmpLongValue;
        }

        console.log("PSTObject: convertLittleEndianBytesToLong = %d", offset);
        
        return offset;
    }
    
}