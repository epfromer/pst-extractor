import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from './../PSTObject/PSTObject.class'
import * as long from 'long';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';

export class OffsetIndexItem {
    indexIdentifier: number;
    fileOffset: number;
    size: number;
    cRef: number;

    constructor(data: Buffer, pstFileType: number) {
        if (pstFileType == PSTFile.PST_TYPE_ANSI) {
            this.indexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, 0, 4).toNumber();
            this.fileOffset = PSTUtil.convertLittleEndianBytesToLong(data, 4, 8).toNumber();
            this.size = PSTUtil.convertLittleEndianBytesToLong(data, 8, 10).toNumber();
            this.cRef = PSTUtil.convertLittleEndianBytesToLong(data, 10, 12).toNumber();
        } else {
            this.indexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, 0, 8).toNumber();
            this.fileOffset = PSTUtil.convertLittleEndianBytesToLong(data, 8, 16).toNumber();
            this.size = PSTUtil.convertLittleEndianBytesToLong(data, 16, 18).toNumber();
            this.cRef = PSTUtil.convertLittleEndianBytesToLong(data, 16, 18).toNumber();
        }
    }
}
