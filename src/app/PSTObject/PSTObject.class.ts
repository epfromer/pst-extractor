export class PSTObject {

    // convert little endian bytes to number (long)
    public static convertLittleEndianBytesToLong(data: Buffer, start?: number, end?: number) {

        if (!start) {
            start = 0;
        }
        if (!end) {
            end = data.length;
        }

        let offset = data[end - 1] & 0xff;
        let tmpLongValue;
        for (let x = end - 2; x >= start; x--) {
            offset = offset << 8;
            tmpLongValue = data[x] & 0xff;
            offset |= tmpLongValue;
        }

        console.log("PSTObject: convertLittleEndianBytesToLong = %d", offset);
        
        return offset;
    }
    
}