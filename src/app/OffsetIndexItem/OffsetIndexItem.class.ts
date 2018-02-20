import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from './../PSTObject/PSTObject.class'
import * as long from 'long';

export class OffsetIndexItem extends PSTObject {
    indexIdentifier: number;
    fileOffset: number;
    size: number;
    cRef: number;

    constructor(data: Buffer, pstFileType: number) {
        super();

        if (pstFileType == PSTFile.PST_TYPE_ANSI) {
            this.indexIdentifier = this.convertLittleEndianBytesToLong(data, 0, 4).toNumber();
            this.fileOffset = this.convertLittleEndianBytesToLong(data, 4, 8).toNumber();
            this.size = this.convertLittleEndianBytesToLong(data, 8, 10).toNumber();
            this.cRef = this.convertLittleEndianBytesToLong(data, 10, 12).toNumber();
        } else {
            this.indexIdentifier = this.convertLittleEndianBytesToLong(data, 0, 8).toNumber();
            this.fileOffset = this.convertLittleEndianBytesToLong(data, 8, 16).toNumber();
            this.size = this.convertLittleEndianBytesToLong(data, 16, 18).toNumber();
            this.cRef = this.convertLittleEndianBytesToLong(data, 16, 18).toNumber();
        }
    }
}
