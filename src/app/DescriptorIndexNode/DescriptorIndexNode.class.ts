import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from './../PSTObject/PSTObject.class'
import * as long from 'long';

// DescriptorIndexNode is a leaf item from the Descriptor index b-tree
// It is like a pointer to an element in the PST file, everything has one...
export class DescriptorIndexNode extends PSTObject {
    descriptorIdentifier: number;
    dataOffsetIndexIdentifier: number;
    localDescriptorsOffsetIndexIdentifier: number;
    parentDescriptorIndexIdentifier: number;
    itemType: number;

    constructor(buffer: Buffer, pstFileType: number) {
        super();
        if (pstFileType == PSTFile.PST_TYPE_ANSI) {
            this.descriptorIdentifier = this.convertLittleEndianBytesToLong(buffer, 0, 4).toNumber();
            this.dataOffsetIndexIdentifier = this.convertLittleEndianBytesToLong(buffer, 4, 8).toNumber();
            this.localDescriptorsOffsetIndexIdentifier = this.convertLittleEndianBytesToLong(buffer, 8, 12).toNumber();
            this.parentDescriptorIndexIdentifier = this.convertLittleEndianBytesToLong(buffer, 12, 16).toNumber();
        } else {
            this.descriptorIdentifier = this.convertLittleEndianBytesToLong(buffer, 0, 4).toNumber();
            this.dataOffsetIndexIdentifier = this.convertLittleEndianBytesToLong(buffer, 8, 16).toNumber();
            this.localDescriptorsOffsetIndexIdentifier = this.convertLittleEndianBytesToLong(buffer, 16, 24).toNumber();
            this.parentDescriptorIndexIdentifier = this.convertLittleEndianBytesToLong(buffer, 24, 28).toNumber();
            this.itemType = this.convertLittleEndianBytesToLong(buffer, 28, 32).toNumber();
        }
    }
}