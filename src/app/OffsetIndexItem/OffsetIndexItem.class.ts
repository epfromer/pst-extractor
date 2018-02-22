import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from './../PSTObject/PSTObject.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import * as long from 'long';

export class OffsetIndexItem {
    private _indexIdentifier: long;
    public get indexIdentifier(): long {
        return this._indexIdentifier;
    }

    private _fileOffset: long;
    public get fileOffset(): long {
        return this._fileOffset;
    }

    private _size: number;
    public get size(): number {
        return this._size;
    }

    private cRef: long;

    constructor(data: Buffer, pstFileType: number) {
        if (pstFileType == PSTFile.PST_TYPE_ANSI) {
            this._indexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, 0, 4);
            this._fileOffset = PSTUtil.convertLittleEndianBytesToLong(data, 4, 8);
            this._size = PSTUtil.convertLittleEndianBytesToLong(data, 8, 10).toNumber();
            this.cRef = PSTUtil.convertLittleEndianBytesToLong(data, 10, 12);
        } else {
            this._indexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, 0, 8);
            this._fileOffset = PSTUtil.convertLittleEndianBytesToLong(data, 8, 16);
            this._size = PSTUtil.convertLittleEndianBytesToLong(data, 16, 18).toNumber();
            this.cRef = PSTUtil.convertLittleEndianBytesToLong(data, 16, 18);
        }
    }
}
