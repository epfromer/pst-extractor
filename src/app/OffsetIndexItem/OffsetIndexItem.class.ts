import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from './../PSTObject/PSTObject.class'
import * as long from 'long';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';

export class OffsetIndexItem {
    indexIdentifier: long;
    fileOffset: long;
    size: number;
    cRef: long;

    constructor(data: Buffer, pstFileType: number) {
        if (pstFileType == PSTFile.PST_TYPE_ANSI) {
            this.indexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, 0, 4);
            this.fileOffset = PSTUtil.convertLittleEndianBytesToLong(data, 4, 8);
            this.size = PSTUtil.convertLittleEndianBytesToLong(data, 8, 10).toNumber();
            this.cRef = PSTUtil.convertLittleEndianBytesToLong(data, 10, 12);
        } else {
            this.indexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, 0, 8);
            this.fileOffset = PSTUtil.convertLittleEndianBytesToLong(data, 8, 16);
            this.size = PSTUtil.convertLittleEndianBytesToLong(data, 16, 18).toNumber();
            this.cRef = PSTUtil.convertLittleEndianBytesToLong(data, 16, 18);
        }
    }
}
