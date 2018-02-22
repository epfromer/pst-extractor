import { PSTUtil } from './../PSTUtil/PSTUtil.class';
import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from './../PSTObject/PSTObject.class';
import * as long from 'long';

// DescriptorIndexNode is a leaf item from the Descriptor index b-tree
// It is like a pointer to an element in the PST file, everything has one...
export class DescriptorIndexNode {
    private descriptorIdentifier: number;
    private parentDescriptorIndexIdentifier: number;
    private itemType: number;

    private _localDescriptorsOffsetIndexIdentifier: long;
    public get localDescriptorsOffsetIndexIdentifier(): long {
        return this._localDescriptorsOffsetIndexIdentifier;
    }

    private _dataOffsetIndexIdentifier: long;
    public get dataOffsetIndexIdentifier(): long {
        return this._dataOffsetIndexIdentifier;
    }

    constructor(buffer: Buffer, pstFileType: number) {
        if (pstFileType == PSTFile.PST_TYPE_ANSI) {
            this.descriptorIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 0, 4).toNumber();
            this._dataOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 4, 8);
            this._localDescriptorsOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 8, 12);
            this.parentDescriptorIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 12, 16).toNumber();
        } else {
            this.descriptorIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 0, 4).toNumber();
            this._dataOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 8, 16);
            this._localDescriptorsOffsetIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 16, 24);
            this.parentDescriptorIndexIdentifier = PSTUtil.convertLittleEndianBytesToLong(buffer, 24, 28).toNumber();
            this.itemType = PSTUtil.convertLittleEndianBytesToLong(buffer, 28, 32).toNumber();
        }
    }
}
