import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from './../PSTObject/PSTObject.class'

export class OffsetIndexItem extends PSTObject {
    indexIdentifier: number;
    fileOffset: number;
    size: number;
    cRef: number;

    constructor(data: Buffer, pstFileType: number) {
        super();

        if (pstFileType == PSTFile.PST_TYPE_ANSI) {
            this.indexIdentifier = PSTObject.convertLittleEndianBytesToLong(data, 0, 4);
            this.fileOffset = PSTObject.convertLittleEndianBytesToLong(data, 4, 8);
            this.size = PSTObject.convertLittleEndianBytesToLong(data, 8, 10);
            this.cRef = PSTObject.convertLittleEndianBytesToLong(data, 10, 12);
        } else {
            this.indexIdentifier = PSTObject.convertLittleEndianBytesToLong(data, 0, 8);
            this.fileOffset = PSTObject.convertLittleEndianBytesToLong(data, 8, 16);
            this.size = PSTObject.convertLittleEndianBytesToLong(data, 16, 18);
            this.cRef = PSTObject.convertLittleEndianBytesToLong(data, 16, 18);
        }
    }
}
