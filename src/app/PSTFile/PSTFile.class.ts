import { DescriptorIndexNode } from './../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTDescriptorItem } from './../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTNodeInputStream } from './../PSTNodeInputStream/PSTNodeInputStream.class';
import { OffsetIndexItem } from './../OffsetIndexItem/OffsetIndexItem.class';
import { PSTObject } from './../PSTObject/PSTObject.class'
import * as fs from 'fs';
import * as util from 'util';

export class PSTFile {
    public static ENCRYPTION_TYPE_NONE: number = 0;
    public static ENCRYPTION_TYPE_COMPRESSIBLE: number = 1;
    public static MESSAGE_STORE_DESCRIPTOR_IDENTIFIER: number = 33;
    public static ROOT_FOLDER_DESCRIPTOR_IDENTIFIER: number = 290;
    public static PST_TYPE_ANSI: number = 14;
    public static PST_TYPE_ANSI_2: number = 15;
    public static PST_TYPE_UNICODE: number = 23;
    public static PST_TYPE_2013_UNICODE: number = 36;
    public static PS_PUBLIC_STRINGS: number = 0;
    public static PSETID_Common: number = 1;
    public static PSETID_Address: number = 2;
    public static PS_INTERNET_HEADERS: number = 3;
    public static PSETID_Appointment: number = 4;
    public static PSETID_Meeting: number = 5;
    public static PSETID_Log: number = 6;
    public static PSETID_Messaging: number = 7;
    public static PSETID_Note: number = 8;
    public static PSETID_PostRss: number = 9;
    public static PSETID_Task: number = 10;
    public static PSETID_UnifiedMessaging: number = 11;
    public static PS_MAPI: number = 12;
    public static PSETID_AirSync: number = 13;
    public static PSETID_Sharing: number = 14;

    private guidMap = {
        '00020329-0000-0000-C000-000000000046': 0,
        '00062008-0000-0000-C000-000000000046': 1,
        '00062004-0000-0000-C000-000000000046': 2,
        '00020386-0000-0000-C000-000000000046': 3,
        '00062002-0000-0000-C000-000000000046': 4,
        '6ED8DA90-450B-101B-98DA-00AA003F1305': 5,
        '0006200A-0000-0000-C000-000000000046': 6,
        '41F28F13-83F4-4114-A584-EEDB5A6B0BFF': 7,
        '0006200E-0000-0000-C000-000000000046': 8,
        '00062041-0000-0000-C000-000000000046': 9,
        '00062003-0000-0000-C000-000000000046': 10,
        '4442858E-A9E3-4E80-B900-317A210CC15B': 11,
        '00020328-0000-0000-C000-000000000046': 12,
        '71035549-0739-4DCB-9163-00F0580DBBDF': 13,
        '00062040-0000-0000-C000-000000000046': 14
    };

    // the type of encryption the files uses
    private _encryptionType = 0;
    get encryptionType(): number { return this._encryptionType; }

    // type of file (e.g. ANSI)
    private _pstFileType = 0;
    get pstFileType(): number { return this._pstFileType; }

    // file descriptor
    private pstFilename: string;
    private pstFD: number;
    private pstStream: fs.ReadStream;

    public constructor(fileName: string) {
        this.pstFilename = fileName;
    }

    public open() {
        // attempt to open file
        // confirm first 4 bytes are !BDN
        this.pstFD = fs.openSync(this.pstFilename, 'r');
        let buffer = new Buffer(514);
        fs.readSync(this.pstFD, buffer, 0, 514, 0);
        let key = '!BDN';
        if (
            buffer[0] != key.charCodeAt(0) ||
            buffer[1] != key.charCodeAt(1) ||
            buffer[2] != key.charCodeAt(2) ||
            buffer[3] != key.charCodeAt(3)
        ) {
            throw new Error(
                'Invalid file header (expected: "!BDN"): ' + buffer
            );
        }

        // make sure we are using a supported version of a PST...
        if (buffer[10] === PSTFile.PST_TYPE_ANSI_2) {
            buffer[10] = PSTFile.PST_TYPE_ANSI;
        }
        if (
            buffer[10] !== PSTFile.PST_TYPE_ANSI &&
            buffer[10] !== PSTFile.PST_TYPE_UNICODE &&
            buffer[10] !== PSTFile.PST_TYPE_2013_UNICODE
        ) {
            throw new Error(
                'Unrecognised PST File version: ' + buffer[10]
            );
        }
        this._pstFileType = buffer[10];

        // make sure no encryption
        let encryptionType: number;
        if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
            encryptionType = buffer[461];
        } else {
            encryptionType = buffer[513];
        }
        if (encryptionType === 0x02) {
            throw new Error('PST is encrypted');
        }

        // build out name to id map
        this.processNameToIDMap();
    }


    public processNameToIDMap() {

        // process the name to id map
        let nameToIdMapDescriptorNode = this.getDescriptorIndexNode(97);

        // get the descriptors if we have them
        let localDescriptorItems;
        if (nameToIdMapDescriptorNode.localDescriptorsOffsetIndexIdentifier) {
            localDescriptorItems = this.getPSTDescriptorItems(nameToIdMapDescriptorNode.localDescriptorsOffsetIndexIdentifier);
        }
    }

    // parse a PSTDescriptor and get all items
    getPSTDescriptorItems(localDescriptorsOffsetIndexIdentifier: number): Map<number, PSTDescriptorItem> {
        return this.getPSTDescriptorItems(this.readLeaf(localDescriptorsOffsetIndexIdentifier));
    }

    readLeaf(bid: number): PSTNodeInputStream {
        // PSTFileBlock ret = null;
        let ret: PSTNodeInputStream = null;

        // get the index node for the descriptor index
        let offsetItem = this.getOffsetIndexNode(bid);
        return new PSTNodeInputStream(this, offsetItem);
    }

    // navigate b-tree index and find specific item
    public getOffsetIndexNode(id: number): OffsetIndexItem {
        return new OffsetIndexItem(this.findBtreeItem(id, false), this._pstFileType);
    }

    // navigate the internal descriptor B-Tree and find a specific item
    public getDescriptorIndexNode(id: number): DescriptorIndexNode {
        return new DescriptorIndexNode(this.findBtreeItem(id, true), this._pstFileType);
    }

    // navigate PST B-tree
    private findBtreeItem(index: number, descTree: boolean): Buffer {
        let btreeStartOffset: number;
        let fileTypeAdjustment: number;

        // first find the starting point for the offset index
        let startOffset: number;
        if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
            startOffset = descTree ? 188 : 196;
            fileTypeAdjustment = 500;
        } else if (this._pstFileType == PSTFile.PST_TYPE_2013_UNICODE) {
            startOffset = descTree ? 224 : 240;
            fileTypeAdjustment = 0x1000 - 24;
        } else {
            startOffset = descTree ? 224 : 240;
            fileTypeAdjustment = 496;
        }
        btreeStartOffset = this.extractLEFileOffset(startOffset);

        let buffer = new Buffer(2);
        this.seekAndRead(buffer, btreeStartOffset + fileTypeAdjustment);

        let b2 = new Buffer(2);
        b2[0] = 0xff80;
        b2[1] = 0xff81;

        // ensure apples to apples comparison
        while ((buffer[0] === b2[0] && buffer[1] === b2[0] && !descTree)
            || (buffer[0] === b2[1] && buffer[1] === b2[1] && descTree)) {

            // get the rest of the data
            let len: number;
            if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
                len = 496;
            } else if (this._pstFileType == PSTFile.PST_TYPE_2013_UNICODE) {
                len = 4056;
            } else {
                len = 488;
            }
            let branchNodeItems = new Buffer(len);
            this.seekAndRead(branchNodeItems, btreeStartOffset);
            let filePosition = btreeStartOffset + len;

            console.log('btreeStartOffset = ' + btreeStartOffset);

            let numberOfItems = 0;
            if (this._pstFileType == PSTFile.PST_TYPE_2013_UNICODE) {
                let numberOfItemsBytes = new Buffer(2);
                this.seekAndRead(numberOfItemsBytes, null);
                throw new Error('not yet implemented');
                // numberOfItems = this.convertLittleEndianBytesToLong(numberOfItemsBytes);
                // in.readCompletely(numberOfItemsBytes);
                // final long maxNumberOfItems = PSTObject.convertLittleEndianBytesToLong(numberOfItemsBytes);
            } else {
                numberOfItems = this.readSingleByte(filePosition++);
                this.readSingleByte(filePosition++); // maxNumberOfItems
            }
            let itemSize = this.readSingleByte(filePosition++); // itemSize
            let levelsToLeaf = this.readSingleByte(filePosition++);

            if (levelsToLeaf > 0) {
                let found = false;
                for (let x = 0; x < numberOfItems; x++) {
                    if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
                        let indexIdOfFirstChildNode = this.extractLEFileOffset(btreeStartOffset + (x * 12));
                        if (indexIdOfFirstChildNode > index) {
                            // get the address for the child first node in this group
                            btreeStartOffset = this.extractLEFileOffset(btreeStartOffset + ((x - 1) * 12) + 8);
                            this.seekAndRead(buffer, btreeStartOffset + 500);
                            found = true;
                            break;
                        }
                    } else {
                        let indexIdOfFirstChildNode = this.extractLEFileOffset(btreeStartOffset + (x * 24));
                        if (indexIdOfFirstChildNode > index) {
                            // get the address for the child first node in this group
                            btreeStartOffset = this.extractLEFileOffset(btreeStartOffset + ((x - 1) * 24) + 16);
                            this.seekAndRead(buffer, btreeStartOffset + fileTypeAdjustment);
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    // it must be in the very last branch...
                    if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
                        btreeStartOffset = this.extractLEFileOffset(btreeStartOffset + ((numberOfItems - 1) * 12) + 8);
                        this.seekAndRead(buffer, btreeStartOffset + 500);
                    } else {
                        btreeStartOffset = this.extractLEFileOffset(btreeStartOffset + ((numberOfItems - 1) * 24) + 16);
                        this.seekAndRead(buffer, btreeStartOffset + fileTypeAdjustment);
                    }
                }
            } else {
                // System.out.println(String.format("At bottom, looking through
                // %d items", numberOfItems));
                // we are at the bottom of the tree...
                // we want to get our file offset!
                for (let x = 0; x < numberOfItems; x++) {

                    if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
                        if (descTree) {
                            // The 32-bit descriptor index b-tree leaf node item
                            buffer = new Buffer(4);
                            this.seekAndRead(buffer, btreeStartOffset + (x * 16));
                            if (PSTObject.convertLittleEndianBytesToLong(buffer) == index) {
                                // give me the offset index please!
                                buffer = new Buffer(16);
                                this.seekAndRead(buffer, btreeStartOffset + (x * 16));
                                return buffer;
                            }
                        } else {
                            // The 32-bit (file) offset index item
                            let indexIdOfFirstChildNode = this.extractLEFileOffset(btreeStartOffset + (x * 12));

                            if (indexIdOfFirstChildNode == index) {
                                // we found it!!!! OMG
                                // System.out.println("item found as item #"+x);
                                buffer = new Buffer(12);
                                this.seekAndRead(buffer, btreeStartOffset + (x * 12));
                                return buffer;
                            }
                        }
                    } else {
                        if (descTree) {
                            // The 64-bit descriptor index b-tree leaf node item
                            buffer = new Buffer(4);
                            this.seekAndRead(buffer, btreeStartOffset + (x * 32));

                            if (PSTObject.convertLittleEndianBytesToLong(buffer) == index) {
                                // give me the offset index please!
                                buffer = new Buffer(32);
                                this.seekAndRead(buffer, btreeStartOffset + (x * 32));
                                
                                console.log("item found!!!");
                                // PSTObject.printHexFormatted(temp, true);
                                return buffer;
                            }
                        } else {
                            // The 64-bit (file) offset index item
                            let indexIdOfFirstChildNode = this.extractLEFileOffset(btreeStartOffset + (x * 24));

                            if (indexIdOfFirstChildNode == index) {
                                // we found it!!!! OMG
                                // System.out.println("item found as item #"+x +
                                // " size (should be 24): "+itemSize);
                                buffer = new Buffer(24);
                                this.seekAndRead(buffer, btreeStartOffset + (x * 24));

                                console.log("item found!!!");
                                return buffer;
                            }
                        }
                    }
                }
                throw new Error("Unable to find " + index + " is desc: " + descTree);
            }
        }

        throw new Error("Unable to find node: " + index + " is desc: " + descTree);
    }

    // reads a single byte from the current file position
    private readSingleByte(position: number): number {
        let buffer = new Buffer(1);
        fs.readSync(this.pstFD, buffer, 0, buffer.length, position);
        return buffer[0];
    }

    // seek to a specific place in file, and get specific number of bytes
    // returns a promise of a chunk of bytes
    public seekAndRead(buffer: Buffer, position: number) {
        // console.log('seekAndRead: start = ' + position + ', length = ' + buffer.length);
        fs.readSync(this.pstFD, buffer, 0, buffer.length, position);
    }

   // get file offset, which is sotred in 8 little endian bytes
   // returns a promise of a number
    private extractLEFileOffset(startOffset: number): number {
        // console.log('startOffset = ' + startOffset);
        let offset = 0;
        if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
            let buffer = new Buffer(4);
            this.seekAndRead(buffer, startOffset);
            offset |= buffer[3] & 0xff;
            offset <<= 8;
            offset |= buffer[2] & 0xff;
            offset <<= 8;
            offset |= buffer[1] & 0xff;
            offset <<= 8;
            offset |= buffer[0] & 0xff;
            // console.log('resolve with offset = ' + offset);
        } else {
            let buffer = new Buffer(8);
            this.seekAndRead(buffer, startOffset);
            offset = buffer[7] & 0xff;
            let tmpLongValue: number;
            for (let x = 6; x >= 0; x--) {
                offset = offset << 8;
                tmpLongValue = buffer[x] & 0xff;
                offset |= tmpLongValue;
            }
            // console.log('resolve with offset = ' + offset);
        }
        return offset;
    }
}
