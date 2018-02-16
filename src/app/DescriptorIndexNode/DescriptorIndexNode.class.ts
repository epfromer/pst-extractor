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
        // if (pstFileType == PSTFile.PST_TYPE_ANSI) {
        //     this.descriptorIdentifier = (int) PSTObject.convertLittleEndianBytesToLong(data, 0, 4);
        //     this.dataOffsetIndexIdentifier = (int) PSTObject.convertLittleEndianBytesToLong(data, 4, 8);
        //     this.localDescriptorsOffsetIndexIdentifier = (int) PSTObject.convertLittleEndianBytesToLong(data, 8, 12);
        //     this.parentDescriptorIndexIdentifier = (int) PSTObject.convertLittleEndianBytesToLong(data, 12, 16);
        //     // itemType = (int)PSTObject.convertLittleEndianBytesToLong(data,
        //     // 28, 32);
        // } else {
        //     this.descriptorIdentifier = (int) PSTObject.convertLittleEndianBytesToLong(data, 0, 4);
        //     this.dataOffsetIndexIdentifier = (int) PSTObject.convertLittleEndianBytesToLong(data, 8, 16);
        //     this.localDescriptorsOffsetIndexIdentifier = (int) PSTObject.convertLittleEndianBytesToLong(data, 16, 24);
        //     this.parentDescriptorIndexIdentifier = (int) PSTObject.convertLittleEndianBytesToLong(data, 24, 28);
        //     this.itemType = (int) PSTObject.convertLittleEndianBytesToLong(data, 28, 32);
        // }
    }

}