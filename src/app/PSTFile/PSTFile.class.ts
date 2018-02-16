import { DescriptorIndexNode } from './../DescriptorIndexNode/DescriptorIndexNode.class';
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

    private that: PSTFile = this;

    // type of file (e.g. ANSI)
    private _pstFileType = 0;

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

    get pstFileType(): number {
        return this._pstFileType;
    }

    public processNameToIDMap() {
        // // process the name to id map
        // final DescriptorIndexNode nameToIdMapDescriptorNode = (this.getDescriptorIndexNode(97));
        // // nameToIdMapDescriptorNode.readData(this);

        // // get the descriptors if we have them
        // HashMap<Integer, PSTDescriptorItem> localDescriptorItems = null;
        // if (nameToIdMapDescriptorNode.localDescriptorsOffsetIndexIdentifier != 0) {
        //     // PSTDescriptor descriptor = new PSTDescriptor(this,
        //     // nameToIdMapDescriptorNode.localDescriptorsOffsetIndexIdentifier);
        //     // localDescriptorItems = descriptor.getChildren();
        //     localDescriptorItems = this
        //         .getPSTDescriptorItems(nameToIdMapDescriptorNode.localDescriptorsOffsetIndexIdentifier);
        // }

        let nameToIdMapDescriptorNode = this.getDescriptorIndexNode(97);
    }

    // navigate the internal descriptor B-Tree and find a specific item
    private getDescriptorIndexNode(id: number): DescriptorIndexNode {
        return new DescriptorIndexNode(
            this.findBtreeItem(id, true),
            this._pstFileType
        );
    }

    // navigate PST B-tree
    private findBtreeItem(index: number, descTree: boolean): number {
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
        let offset = this.extractLEFileOffset(startOffset);
        console.log('result = ' + offset);
        btreeStartOffset = offset;

        let position = 224;  // btreeStartOffset + fileTypeAdjustment;
        let buffer = new Buffer(2);
        this.seekAndRead(buffer, position);
        console.log(buffer[0]);
        console.log(buffer[1]);

        while ((buffer[0] == 0xffffff80 && buffer[1] == 0xffffff80 && !descTree)
            || (buffer[0] == 0xffffff81 && buffer[1] == 0xffffff81 && descTree)) {

            start = btreeStartOffset;
            if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
                end = start + 496;
            } else if (this._pstFileType == PSTFile.PST_TYPE_2013_UNICODE) {
                end = start + 4056;
            } else {
                end = start + 488;
            }

            console.log('start = ' + start);
            console.log('size = ' + (end - start));

        }

        return 0;
    }

    // seek to a specific place in file, and get specific number of bytes
    // returns a promise of a chunk of bytes
    private seekAndRead(buffer: Buffer, position: number) {
        console.log('seekAndRead: start = ' + position + ', length = ' + buffer.length);
        fs.readSync(this.pstFD, buffer, 0, buffer.length, position);

        // const read = util.promisify(fs.read);
        // const offset = 0;
        // console.log(this)
        // return await read(this.pstFD, buffer, offset, length, position);

        // return new Promise((resolve, reject) => {
        //     const options = {
        //         fd: this.pstFD,
        //         start: start,
        //         end: end
        //     };
        //     console.log('seekAndRead: fd = ' + this.pstFD);
        //     let stream = fs.createReadStream(this.pstFilename, options);
        //     stream.on('data', function(chunk) {
        //         console.log('seekAndRead - finished: start = ' + start + ', end = ' + end);
        //         resolve(chunk);
        //     })
        //     stream.on('error', (error) => {
        //         console.log('seekAndRead error: ' + error);
        //        // throw new Error('seekAndRead error: ' + error);
        //        reject(error);
        //     });
        // })
    }

   // get file offset, which is sotred in 8 little endian bytes
   // returns a promise of a number
    private extractLEFileOffset(startOffset: number): number {
        console.log('startOffset = ' + startOffset);
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
