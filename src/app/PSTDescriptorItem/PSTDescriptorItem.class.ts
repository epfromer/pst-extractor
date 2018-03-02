import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from '../PSTObject/PSTObject.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import * as long from 'long';

export class PSTDescriptorItem {
    private dataBlockData: Buffer;
    private dataBlockOffsets: number[] = [];
    private _pstFile: PSTFile;

    private _subNodeOffsetIndexIdentifier: number;
    public get subNodeOffsetIndexIdentifier(): number {
        return this._subNodeOffsetIndexIdentifier;
    }

    private _descriptorIdentifier: number;
    public get descriptorIdentifier(): number {
        return this._descriptorIdentifier;
    }

    private _offsetIndexIdentifier: number;
    public get offsetIndexIdentifier(): number {
        return this._offsetIndexIdentifier;
    }

    constructor(data: Buffer, offset: number, pstFile: PSTFile) {
        this._pstFile = pstFile;

        if (pstFile.pstFileType == PSTFile.PST_TYPE_ANSI) {
            this._descriptorIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset, offset + 4).toNumber();
            this._offsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset + 4, offset + 8).toNumber() & 0xfffffffe;
            this._subNodeOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset + 8, offset + 12).toNumber() & 0xfffffffe;
        } else {
            this._descriptorIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset, offset + 4).toNumber();
            this._offsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset + 8, offset + 16).toNumber() & 0xfffffffe;
            this._subNodeOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset + 16, offset + 24).toNumber() & 0xfffffffe;
        }
    }

    public getData(): Buffer {
        if (this.dataBlockData != null) {
            return this.dataBlockData;
        }

        let pstNodeInputStream: PSTNodeInputStream = this._pstFile.readLeaf(long.fromValue(this.offsetIndexIdentifier));
        let out = new Buffer(pstNodeInputStream.length.toNumber());
        pstNodeInputStream.readCompletely(out);
        this.dataBlockData = out;
        return this.dataBlockData;
    }

    // public int[] getBlockOffsets() throws IOException, PSTException {
    //     if (this.dataBlockOffsets != null) {

    //         return this.dataBlockOffsets;
    //     }
    //     final Long[] offsets = this.pstFile.readLeaf(this.offsetIndexIdentifier).getBlockOffsets();
    //     final int[] offsetsOut = new int[offsets.length];
    //     for (int x = 0; x < offsets.length; x++) {
    //         offsetsOut[x] = offsets[x].intValue();
    //     }
    //     return offsetsOut;
    // }

    public getDataSize(): number {
        return this._pstFile.getLeafSize(long.fromNumber(this.offsetIndexIdentifier));
    }
}
