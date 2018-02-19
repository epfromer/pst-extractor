import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from '../PSTObject/PSTObject.class';

export class PSTDescriptorItem extends PSTObject {

    descriptorIdentifier: number;
    offsetIndexIdentifier: number;
    subNodeOffsetIndexIdentifier: number;

    // These are private to ensure that getData()/getBlockOffets() are used
    // private PSTFile.PSTFileBlock dataBlock = null;
    private dataBlockData: Buffer;
    private dataBlockOffsets: number[] = [];
    private _pstFile: PSTFile;

    constructor(data: Buffer, offset: number, pstFile: PSTFile) {
        super();

        this._pstFile = pstFile;

        if (pstFile.pstFileType == PSTFile.PST_TYPE_ANSI) {
            this.descriptorIdentifier = PSTObject.convertLittleEndianBytesToLong(data, offset, offset + 4);
            this.offsetIndexIdentifier = (PSTObject.convertLittleEndianBytesToLong(data, offset + 4, offset + 8)) & 0xfffffffe;
            this.subNodeOffsetIndexIdentifier = PSTObject.convertLittleEndianBytesToLong(data, offset + 8, offset + 12) & 0xfffffffe;
        } else {
            this.descriptorIdentifier = PSTObject.convertLittleEndianBytesToLong(data, offset, offset + 4);
            this.offsetIndexIdentifier = (PSTObject.convertLittleEndianBytesToLong(data, offset + 8, offset + 16)) & 0xfffffffe;
            this.subNodeOffsetIndexIdentifier = PSTObject.convertLittleEndianBytesToLong(data, offset + 16, offset + 24) & 0xfffffffe;
        }
    }

    // public byte[] getData() throws IOException, PSTException {
    //     if (this.dataBlockData != null) {
    //         return this.dataBlockData;
    //     }

    //     final PSTNodeInputStream in = this.pstFile.readLeaf(this.offsetIndexIdentifier);
    //     final byte[] out = new byte[(int) in.length()];
    //     in.readCompletely(out);
    //     this.dataBlockData = out;
    //     return this.dataBlockData;
    // }

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


