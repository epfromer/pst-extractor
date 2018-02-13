import { DescriptorIndexNode } from './../DescriptorIndexNode/DescriptorIndexNode.class';
import * as fs from 'fs';

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

    public open(): Promise<any> {
        return new Promise((resolve, reject) => {
            // attempt to open file
            // confirm first 4 bytes are !BDN
            this.pstStream = fs.createReadStream(this.pstFilename, {
                start: 0,
                end: 514
            });
            this.pstStream.on('open', fd => {
                this.pstFD = fd;
            });
            this.pstStream.on('error', () => {
                throw new Error('Error opening ' + this.pstFilename);
            });
            this.pstStream.on('data', chunk => {
                this.pstStream.pause();

                let key = '!BDN';
                if (
                    chunk[0] != key.charCodeAt(0) ||
                    chunk[1] != key.charCodeAt(1) ||
                    chunk[2] != key.charCodeAt(2) ||
                    chunk[3] != key.charCodeAt(3)
                ) {
                    throw new Error(
                        'Invalid file header (expected: "!BDN"): ' + chunk
                    );
                }

                // make sure we are using a supported version of a PST...
                if (chunk[10] === PSTFile.PST_TYPE_ANSI_2) {
                    chunk[10] = PSTFile.PST_TYPE_ANSI;
                }
                if (
                    chunk[10] !== PSTFile.PST_TYPE_ANSI &&
                    chunk[10] !== PSTFile.PST_TYPE_UNICODE &&
                    chunk[10] !== PSTFile.PST_TYPE_2013_UNICODE
                ) {
                    throw new Error(
                        'Unrecognised PST File version: ' + chunk[10]
                    );
                }
                this._pstFileType = chunk[10];

                // make sure no encryption
                let encryptionType: number;
                if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
                    encryptionType = chunk[461];
                } else {
                    encryptionType = chunk[513];
                }
                if (encryptionType === 0x02) {
                    throw new Error('PST is encrypted');
                }

                // build out name to id map
                this.processNameToIDMap();

                resolve('success');
            });
        });
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

    private findBtreeItem(index: number, descTree: boolean): number {
        let btreeStartOffset: number;
        let fileTypeAdjustment: number;

        // first find the starting point for the offset index
        let offset: number;
        if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
            offset = descTree ? 188 : 196;
        } else {
            offset = descTree ? 224 : 240;
        }
        this.extractLEFileOffset(offset).then(function(result) {
            btreeStartOffset = result;
        });
        return 0;
    }

    /*
    * Read a file offset from the file
    * PST Files store file offsets (pointers) in 8 little endian bytes.
    * Convert this to a long for seeking to.
    */
    private extractLEFileOffset(startOffset: number): Promise<number> {
        console.log('startOffset = ' + startOffset);
        return new Promise((resolve, reject) => {
            let offset = 0;
            if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
                const options = {
                    fd: this.pstFD,
                    start: startOffset,
                    end: startOffset + 4
                };
                let stream = fs.createReadStream(this.pstFilename, options);
                stream.on('data', function(chunk) {
                    offset |= chunk[3] & 0xff;
                    offset <<= 8;
                    offset |= chunk[2] & 0xff;
                    offset <<= 8;
                    offset |= chunk[1] & 0xff;
                    offset <<= 8;
                    offset |= chunk[0] & 0xff;

                    console.log('resolve with offset = ' + offset);
                    resolve(offset);
                });
            } else {
                const options = {
                    fd: this.pstFD,
                    start: startOffset,
                    end: startOffset + 8
                };
                let stream = fs.createReadStream(this.pstFilename, options);
                stream.on('data', function(chunk) {
                    console.log('chunk[0]: ' + chunk[0]);
                    console.log('chunk[1]: ' + chunk[1]);
                    console.log('chunk[2]: ' + chunk[2]);
                    console.log('chunk[3]: ' + chunk[3]);
                    console.log('chunk[4]: ' + chunk[4]);
                    console.log('chunk[5]: ' + chunk[5]);
                    console.log('chunk[6]: ' + chunk[6]);
                    console.log('chunk[7]: ' + chunk[7]);
                    offset = chunk[7] & 0xff;
                    let tmpLongValue: number;
                    for (let x = 6; x >= 0; x--) {
                        offset = offset << 8;
                        tmpLongValue = chunk[x] & 0xff;
                        offset |= tmpLongValue;
                    }

                    console.log('resolve with offset = ' + offset);
                    resolve(offset);
                });
            }
        });
    }
}
