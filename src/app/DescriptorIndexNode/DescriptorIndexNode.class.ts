import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from './../PSTObject/PSTObject.class'
import * as long from 'long';

// DescriptorIndexNode is a leaf item from the Descriptor index b-tree
// It is like a pointer to an element in the PST file, everything has one...
export class DescriptorIndexNode {
    descriptorIdentifier: number;
    dataOffsetIndexIdentifier: number;
    localDescriptorsOffsetIndexIdentifier: number;
    parentDescriptorIndexIdentifier: number;
    itemType: number;

    constructor(buffer: Buffer, pstFileType: number) {
        if (pstFileType == PSTFile.PST_TYPE_ANSI) {
            this.descriptorIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 0, 4).toNumber();
            this.dataOffsetIndexIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 4, 8).toNumber();
            this.localDescriptorsOffsetIndexIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 8, 12).toNumber();
            this.parentDescriptorIndexIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 12, 16).toNumber();
        } else {
            this.descriptorIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 0, 4).toNumber();
            this.dataOffsetIndexIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 8, 16).toNumber();
            this.localDescriptorsOffsetIndexIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 16, 24).toNumber();
            this.parentDescriptorIndexIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 24, 28).toNumber();
            this.itemType = PSTObject.convertLittleEndianBytesToLong(buffer, 28, 32).toNumber();
        }
    }
}