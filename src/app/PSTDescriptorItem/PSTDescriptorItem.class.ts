import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from '../PSTObject/PSTObject.class';
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import * as long from 'long';

export class PSTDescriptorItem {

    descriptorIdentifier: number;
    offsetIndexIdentifier: number;
    subNodeOffsetIndexIdentifier: number;

    // These are private to ensure that getData()/getBlockOffets() are used
    // private PSTFile.PSTFileBlock dataBlock = null;
    private dataBlockData: Buffer;
    private dataBlockOffsets: number[] = [];
    private _pstFile: PSTFile;

    constructor(data: Buffer, offset: number, pstFile: PSTFile) {
        this._pstFile = pstFile;

        if (pstFile.pstFileType == PSTFile.PST_TYPE_ANSI) {
            this.descriptorIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset, offset + 4).toNumber();
            this.offsetIndexIdentifier = (PSTUtil.convertLittleEndianBytesToLong(data, offset + 4, offset + 8)).toNumber() & 0xfffffffe;
            this.subNodeOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset + 8, offset + 12).toNumber() & 0xfffffffe;
        } else {
            this.descriptorIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset, offset + 4).toNumber();
            this.offsetIndexIdentifier = (PSTUtil.convertLittleEndianBytesToLong(data, offset + 8, offset + 16)).toNumber() & 0xfffffffe;
            this.subNodeOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(data, offset + 16, offset + 24).toNumber() & 0xfffffffe;
        }
    }

    public getData(): Buffer {
        if (this.dataBlockData != null) {
            return this.dataBlockData;
        }

        let pstNodeInputStream: PSTNodeInputStream = this._pstFile.readLeaf(this.offsetIndexIdentifier);
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

    // public int getDataSize() throws IOException, PSTException {
    //     return this.pstFile.getLeafSize(this.offsetIndexIdentifier);
    // }


}


