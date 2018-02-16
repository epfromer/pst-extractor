import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from './../PSTObject/PSTObject.class'

// DescriptorIndexNode is a leaf item from the Descriptor index b-tree
// It is like a pointer to an element in the PST file, everything has one...
export class DescriptorIndexNode {
    descriptorIdentifier: number;
    dataOffsetIndexIdentifier: number;
    localDescriptorsOffsetIndexIdentifier: number;
    parentDescriptorIndexIdentifier: number;
    itemType: number;

    constructor(buffer: Buffer, pstFileType: number) {
        // parse it out
        // first 4 bytes
        if (pstFileType == PSTFile.PST_TYPE_ANSI) {
            this.descriptorIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 0, 4);
            this.dataOffsetIndexIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 4, 8);
            this.localDescriptorsOffsetIndexIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 8, 12);
            this.parentDescriptorIndexIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 12, 16);
            // itemType = (int)PSTObject.convertLittleEndianBytesToLong(data,
            // 28, 32);
        } else {
            this.descriptorIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 0, 4);
            this.dataOffsetIndexIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 8, 16);
            this.localDescriptorsOffsetIndexIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 16, 24);
            this.parentDescriptorIndexIdentifier = PSTObject.convertLittleEndianBytesToLong(buffer, 24, 28);
            this.itemType = PSTObject.convertLittleEndianBytesToLong(buffer, 28, 32);
        }
    }

}