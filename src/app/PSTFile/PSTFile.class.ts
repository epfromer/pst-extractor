import { DescriptorIndexNode } from './../DescriptorIndexNode/DescriptorIndexNode.class';
import { PSTDescriptorItem } from './../PSTDescriptorItem/PSTDescriptorItem.class';
import { PSTNodeInputStream } from './../PSTNodeInputStream/PSTNodeInputStream.class';
import { OffsetIndexItem } from './../OffsetIndexItem/OffsetIndexItem.class';
import { PSTObject } from './../PSTObject/PSTObject.class';
import { PSTFileContent } from '../PSTFileContent/PSTFileContent.class';
import { PSTTableBC } from '../PSTTableBC/PSTTableBC.class';
import { PSTTableBCItem } from '../PSTTableBCItem/PSTTableBCItem.class';
import { PSTTableItem } from '../PSTTableItem/PSTTableItem.class';
import * as fs from 'fs';
import * as fsext from 'fs-ext';
import * as util from 'util';
import * as long from 'long';
import * as uuidparse from 'uuid-parse';

export class PSTFile extends PSTObject {
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

    private guidMap: Map<string, number> = new Map ([
        ['00020329-0000-0000-C000-000000000046', 0],
        ['00062008-0000-0000-C000-000000000046', 1],
        ['00062004-0000-0000-C000-000000000046', 2],
        ['00020386-0000-0000-C000-000000000046', 3],
        ['00062002-0000-0000-C000-000000000046', 4],
        ['6ED8DA90-450B-101B-98DA-00AA003F1305', 5],
        ['0006200A-0000-0000-C000-000000000046', 6],
        ['41F28F13-83F4-4114-A584-EEDB5A6B0BFF', 7],
        ['0006200E-0000-0000-C000-000000000046', 8],
        ['00062041-0000-0000-C000-000000000046', 9],
        ['00062003-0000-0000-C000-000000000046', 10],
        ['4442858E-A9E3-4E80-B900-317A210CC15B', 11],
        ['00020328-0000-0000-C000-000000000046', 12],
        ['71035549-0739-4DCB-9163-00F0580DBBDF', 13],
        ['00062040-0000-0000-C000-000000000046', 14]
    ]);
    private guids: Buffer;

    // the type of encryption the files uses
    private _encryptionType = 0;
    get encryptionType(): number {
        return this._encryptionType;
    }

    // type of file (e.g. ANSI)
    private _pstFileType = 0;
    get pstFileType(): number {
        return this._pstFileType;
    }

    // file descriptor
    private pstFilename: string;
    private pstFD: number;
    private pstStream: fs.ReadStream;

    private _pstFileContent: PSTFileContent;
    public get pstFileContent() {
        return this._pstFileContent;
    }

    public constructor(fileName: string) {
        super();
        this.pstFilename = fileName;
    }

    public open() {
        // attempt to open file
        // confirm first 4 bytes are !BDN
        this.pstFD = fsext.openSync(this.pstFilename, 'r');
        this._pstFileContent = new PSTFileContent(this.pstFD);
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
            throw new Error('Unrecognised PST File version: ' + buffer[10]);
        }
        this._pstFileType = buffer[10];

        // make sure no encryption
        if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
            this._encryptionType = buffer[461];
        } else {
            this._encryptionType = buffer[513];
        }
        if (this._encryptionType === 0x02) {
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
            localDescriptorItems = this.getPSTDescriptorItems(
                nameToIdMapDescriptorNode.localDescriptorsOffsetIndexIdentifier
            );
        }

        // process the map
        let off: OffsetIndexItem = this.getOffsetIndexNode(
            nameToIdMapDescriptorNode.dataOffsetIndexIdentifier
        );
        let nodein = new PSTNodeInputStream(this, off);
        let bcTable = new PSTTableBC(nodein);
        let tableItems: Map<number, PSTTableBCItem> = bcTable.getItems();

        // Get the guids
        debugger;
        let guidEntry: PSTTableBCItem = tableItems.get(2); 
        this.guids = this.getData(guidEntry, localDescriptorItems);
        let nGuids = this.guids.length / 16;
        // final UUID[] uuidArray = new UUID[nGuids];
        let uuidIndexes: number[] = [];
        let offset = 0;
        for (let i = 0; i < nGuids; ++i) {
            let leftQuad: long = this.convertLittleEndianBytesToLong(
                this.guids,
                offset,
                offset + 4
            );
            leftQuad = leftQuad.shiftLeft(32);
            let midQuad: long = this.convertLittleEndianBytesToLong(
                this.guids,
                offset + 4,
                offset + 6
            );
            midQuad = midQuad.shiftLeft(16);
            let rightQuad: long = this.convertLittleEndianBytesToLong(
                this.guids,
                offset + 6,
                offset + 8
            );
            let mostSigBits: long = leftQuad.or(midQuad).or(rightQuad);
            let leastSigBits: long = this.convertBigEndianBytesToLong(
                this.guids,
                offset + 8,
                offset + 16
            );
            let mostBuffer: number[] = mostSigBits.toBytes();
            let leastBuffer: number[] = leastSigBits.toBytes();
            let arrUID = [].concat(mostBuffer, leastBuffer);
            let strUID: string = uuidparse.unparse(arrUID).toUpperCase();

            debugger;
            if (this.guidMap.has(strUID)) {
                uuidIndexes[i] = this.guidMap.get(strUID);
            } else {
                uuidIndexes[i] = -1; // We don't know this guid
            }
            console.log('idx: ' + i + ', ' + strUID + ', ' + uuidIndexes[i]);
            offset += 16;
        }

        // // if we have a reference to an internal descriptor
        // final PSTTableBCItem mapEntries = tableItems.get(3); //
        // final byte[] nameToIdByte = this.getData(mapEntries, localDescriptorItems);

        // final PSTTableBCItem stringMapEntries = tableItems.get(4); //
        // final byte[] stringNameToIdByte = this.getData(stringMapEntries, localDescriptorItems);

        // // process the entries
        // for (int x = 0; x + 8 < nameToIdByte.length; x += 8) {
        //     final int dwPropertyId = (int) PSTObject.convertLittleEndianBytesToLong(nameToIdByte, x, x + 4);
        //     int wGuid = (int) PSTObject.convertLittleEndianBytesToLong(nameToIdByte, x + 4, x + 6);
        //     int wPropIdx = ((int) PSTObject.convertLittleEndianBytesToLong(nameToIdByte, x + 6, x + 8));

        //     if ((wGuid & 0x0001) == 0) {
        //         wPropIdx += 0x8000;
        //         wGuid >>= 1;
        //         int guidIndex;
        //         if (wGuid == 1) {
        //             guidIndex = PS_MAPI;
        //         } else if (wGuid == 2) {
        //             guidIndex = PS_PUBLIC_STRINGS;
        //         } else {
        //             guidIndex = uuidIndexes[wGuid - 3];
        //         }
        //         this.nameToId.put(dwPropertyId | ((long) guidIndex << 32), wPropIdx);
        //         idToName.put(wPropIdx, (long) dwPropertyId);
        //         /*
        //          * System.out.printf("0x%08X:%04X, 0x%08X\n", dwPropertyId,
        //          * guidIndex, wPropIdx);
        //          * /
        //          **/
        //     } else {
        //         // else the identifier is a string
        //         // dwPropertyId becomes thHke byte offset into the String stream
        //         // in which the string name of the property is stored.
        //         final int len = (int) PSTObject.convertLittleEndianBytesToLong(stringNameToIdByte, dwPropertyId,
        //             dwPropertyId + 4);
        //         final byte[] keyByteValue = new byte[len];
        //         System.arraycopy(stringNameToIdByte, dwPropertyId + 4, keyByteValue, 0, keyByteValue.length);
        //         wPropIdx += 0x8000;
        //         final String key = new String(keyByteValue, "UTF-16LE");
        //         this.stringToId.put(key, wPropIdx);
        //         this.idToString.put(wPropIdx, key);
        //     }
        // }
    }

    private getData(
        item: PSTTableItem,
        localDescriptorItems: Map<number, PSTDescriptorItem>
    ): Buffer {
        if (item.data.length != 0) {
            return item.data;
        }

        if (localDescriptorItems == null) {
            throw new Error(
                'External reference but no localDescriptorItems in PSTFile.getData()'
            );
        }

        if (item.entryValueType != 0x0102) {
            throw new Error(
                'Attempting to get non-binary data in PSTFile.getData()'
            );
        }

        let mapDescriptorItem: PSTDescriptorItem = localDescriptorItems.get(
            item.entryValueReference
        );
        if (mapDescriptorItem == null) {
            throw new Error(
                'Descriptor not found: ' + item.entryValueReference
            );
        }
        return mapDescriptorItem.getData();
    }

    // int getNameToIdMapItem(final int key, final int propertySetIndex) {
    //     final long lKey = ((long) propertySetIndex << 32) | key;
    //     final Integer i = this.nameToId.get(lKey);
    //     if (i == null) {
    //         return -1;
    //     }
    //     return i;
    // }

    // int getPublicStringToIdMapItem(final String key) {
    //     final Integer i = this.stringToId.get(key);
    //     if (i == null) {
    //         return -1;
    //     }
    //     return i;
    // }

    // static private Properties propertyInternetCodePages = null;
    // static private boolean bCPFirstTime = true;

    // static String getInternetCodePageCharset(final int propertyId) {
    //     if (bCPFirstTime) {
    //         bCPFirstTime = false;
    //         propertyInternetCodePages = new Properties();
    //         try {
    //             final InputStream propertyStream = PSTFile.class.getResourceAsStream("/InternetCodepages.txt");
    //             if (propertyStream != null) {
    //                 propertyInternetCodePages.load(propertyStream);
    //             } else {
    //                 propertyInternetCodePages = null;
    //             }
    //         } catch (final FileNotFoundException e) {
    //             propertyInternetCodePages = null;
    //             e.printStackTrace();
    //         } catch (final IOException e) {
    //             propertyInternetCodePages = null;
    //             e.printStackTrace();
    //         }
    //     }
    //     if (propertyInternetCodePages != null) {
    //         return propertyInternetCodePages.getProperty(propertyId + "");
    //     }
    //     return null;
    // }

    // static private Properties propertyNames = null;
    // static private boolean bFirstTime = true;

    // /**
    //  * destructor just closes the file handle...
    //  */
    // @Override
    // protected void finalize() throws IOException {
    //     this.in.close();
    // }

    // /**
    //  * get the type of encryption the file uses
    //  *
    //  * @return encryption type used in the PST File
    //  */
    // public int getEncryptionType() {
    //     return this.encryptionType;
    // }

    // /**
    //  * get the handle to the RandomAccessFile we are currently accessing (if
    //  * any)
    //  */
    // public RandomAccessFile getFileHandle() {
    //     if (this.in instanceof PSTRAFileContent) {
    //         return ((PSTRAFileContent) this.in).getFile();
    //     } else {
    //         return null;
    //     }
    // }

    // /**
    //  * get the handle to the file content we are currently accessing
    //  */
    // public PSTFileContent getContentHandle() {
    //     return this.in;
    // }

    // /**
    //  * get the message store of the PST file.
    //  * Note that this doesn't really have much information, better to look under
    //  * the root folder
    //  *
    //  * @throws PSTException
    //  * @throws IOException
    //  */
    // public PSTMessageStore getMessageStore() throws PSTException, IOException {
    //     final DescriptorIndexNode messageStoreDescriptor = this
    //         .getDescriptorIndexNode(MESSAGE_STORE_DESCRIPTOR_IDENTIFIER);
    //     return new PSTMessageStore(this, messageStoreDescriptor);
    // }

    // /**
    //  * get the root folder for the PST file.
    //  * You should find all of your data under here...
    //  *
    //  * @throws PSTException
    //  * @throws IOException
    //  */
    // public PSTFolder getRootFolder() throws PSTException, IOException {
    //     final DescriptorIndexNode rootFolderDescriptor = this.getDescriptorIndexNode(ROOT_FOLDER_DESCRIPTOR_IDENTIFIER);
    //     final PSTFolder output = new PSTFolder(this, rootFolderDescriptor);
    //     return output;
    // }

    public readLeaf(bid: number): PSTNodeInputStream {
        // get the index node for the descriptor index
        let offsetItem = this.getOffsetIndexNode(bid);
        return new PSTNodeInputStream(this, offsetItem);
    }

    // public int getLeafSize(final long bid) throws IOException, PSTException {
    //     final OffsetIndexItem offsetItem = this.getOffsetIndexNode(bid);

    //     // Internal block?
    //     if ((offsetItem.indexIdentifier & 0x02) == 0) {
    //         // No, return the raw size
    //         return offsetItem.size;
    //     }

    //     // we only need the first 8 bytes
    //     final byte[] data = new byte[8];
    //     this.in.seek(offsetItem.fileOffset);
    //     this.in.readCompletely(data);

    //     // we are an array, get the sum of the sizes...
    //     return (int) PSTObject.convertLittleEndianBytesToLong(data, 4, 8);
    // }

    // get file offset, which is sorted in 8 little endian bytes
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
        while (
            (buffer[0] === b2[0] && buffer[1] === b2[0] && !descTree) ||
            (buffer[0] === b2[1] && buffer[1] === b2[1] && descTree)
        ) {
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
                debugger;
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
                        let indexIdOfFirstChildNode = this.extractLEFileOffset(
                            btreeStartOffset + x * 12
                        );
                        if (indexIdOfFirstChildNode > index) {
                            // get the address for the child first node in this group
                            btreeStartOffset = this.extractLEFileOffset(
                                btreeStartOffset + (x - 1) * 12 + 8
                            );
                            this.seekAndRead(buffer, btreeStartOffset + 500);
                            found = true;
                            break;
                        }
                    } else {
                        let indexIdOfFirstChildNode = this.extractLEFileOffset(
                            btreeStartOffset + x * 24
                        );
                        if (indexIdOfFirstChildNode > index) {
                            // get the address for the child first node in this group
                            btreeStartOffset = this.extractLEFileOffset(
                                btreeStartOffset + (x - 1) * 24 + 16
                            );
                            this.seekAndRead(
                                buffer,
                                btreeStartOffset + fileTypeAdjustment
                            );
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    // it must be in the very last branch...
                    if (this._pstFileType == PSTFile.PST_TYPE_ANSI) {
                        btreeStartOffset = this.extractLEFileOffset(
                            btreeStartOffset + (numberOfItems - 1) * 12 + 8
                        );
                        this.seekAndRead(buffer, btreeStartOffset + 500);
                    } else {
                        btreeStartOffset = this.extractLEFileOffset(
                            btreeStartOffset + (numberOfItems - 1) * 24 + 16
                        );
                        this.seekAndRead(
                            buffer,
                            btreeStartOffset + fileTypeAdjustment
                        );
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
                            this.seekAndRead(buffer, btreeStartOffset + x * 16);
                            if (
                                this.convertLittleEndianBytesToLong(
                                    buffer
                                ).toNumber() == index
                            ) {
                                // give me the offset index please!
                                buffer = new Buffer(16);
                                this.seekAndRead(
                                    buffer,
                                    btreeStartOffset + x * 16
                                );
                                return buffer;
                            }
                        } else {
                            // The 32-bit (file) offset index item
                            let indexIdOfFirstChildNode = this.extractLEFileOffset(
                                btreeStartOffset + x * 12
                            );

                            if (indexIdOfFirstChildNode == index) {
                                // we found it!!!! OMG
                                // System.out.println("item found as item #"+x);
                                buffer = new Buffer(12);
                                this.seekAndRead(
                                    buffer,
                                    btreeStartOffset + x * 12
                                );
                                return buffer;
                            }
                        }
                    } else {
                        if (descTree) {
                            // The 64-bit descriptor index b-tree leaf node item
                            buffer = new Buffer(4);
                            this.seekAndRead(buffer, btreeStartOffset + x * 32);

                            if (
                                this.convertLittleEndianBytesToLong(
                                    buffer
                                ).toNumber() == index
                            ) {
                                // give me the offset index please!
                                buffer = new Buffer(32);
                                this.seekAndRead(
                                    buffer,
                                    btreeStartOffset + x * 32
                                );

                                console.log('item found!!!');
                                // PSTObject.printHexFormatted(temp, true);
                                return buffer;
                            }
                        } else {
                            // The 64-bit (file) offset index item
                            let indexIdOfFirstChildNode = this.extractLEFileOffset(
                                btreeStartOffset + x * 24
                            );

                            if (indexIdOfFirstChildNode == index) {
                                // we found it!!!! OMG
                                // System.out.println("item found as item #"+x +
                                // " size (should be 24): "+itemSize);
                                buffer = new Buffer(24);
                                this.seekAndRead(
                                    buffer,
                                    btreeStartOffset + x * 24
                                );

                                console.log('item found!!!');
                                return buffer;
                            }
                        }
                    }
                }
                throw new Error(
                    'Unable to find ' + index + ' is desc: ' + descTree
                );
            }
        }

        throw new Error(
            'Unable to find node: ' + index + ' is desc: ' + descTree
        );
    }

    // navigate the internal descriptor B-Tree and find a specific item
    public getDescriptorIndexNode(id: number): DescriptorIndexNode {
        return new DescriptorIndexNode(
            this.findBtreeItem(id, true),
            this._pstFileType
        );
    }

    // navigate b-tree index and find specific item
    public getOffsetIndexNode(id: number): OffsetIndexItem {
        return new OffsetIndexItem(
            this.findBtreeItem(id, false),
            this._pstFileType
        );
    }

    // /**
    //  * parse a PSTDescriptor and get all of its items
    //  */
    // HashMap<Integer, PSTDescriptorItem> getPSTDescriptorItems(final long localDescriptorsOffsetIndexIdentifier)
    //     throws PSTException, IOException {
    //     return this.getPSTDescriptorItems(this.readLeaf(localDescriptorsOffsetIndexIdentifier));
    // }

    // HashMap<Integer, PSTDescriptorItem> getPSTDescriptorItems(final PSTNodeInputStream in)
    //     throws PSTException, IOException {
    //     // make sure the signature is correct
    //     in.seek(0);
    //     final int sig = in.read();
    //     if (sig != 0x2) {
    //         throw new PSTException("Unable to process descriptor node, bad signature: " + sig);
    //     }

    //     final HashMap<Integer, PSTDescriptorItem> output = new HashMap<>();
    //     final int numberOfItems = (int) in.seekAndReadLong(2, 2);
    //     int offset;
    //     if (this.getPSTFileType() == PSTFile.PST_TYPE_ANSI) {
    //         offset = 4;
    //     } else {
    //         offset = 8;
    //     }

    //     final byte[] data = new byte[(int) in.length()];
    //     in.seek(0);
    //     in.readCompletely(data);

    //     for (int x = 0; x < numberOfItems; x++) {
    //         final PSTDescriptorItem item = new PSTDescriptorItem(data, offset, this);
    //         output.put(item.descriptorIdentifier, item);
    //         if (this.getPSTFileType() == PSTFile.PST_TYPE_ANSI) {
    //             offset += 12;
    //         } else {
    //             offset += 24;
    //         }
    //     }

    //     return output;
    // }

    // /**
    //  * Build the children descriptor tree
    //  * This goes through the entire descriptor B-Tree and adds every item to the
    //  * childrenDescriptorTree.
    //  * This is used as fallback when the nodes that list file contents are
    //  * broken.
    //  *
    //  * @param in
    //  * @throws IOException
    //  * @throws PSTException
    //  */
    // LinkedHashMap<Integer, LinkedList<DescriptorIndexNode>> getChildDescriptorTree() throws IOException, PSTException {
    //     if (this.childrenDescriptorTree == null) {
    //         long btreeStartOffset = 0;
    //         if (this.getPSTFileType() == PST_TYPE_ANSI) {
    //             btreeStartOffset = this.extractLEFileOffset(188);
    //         } else {
    //             btreeStartOffset = this.extractLEFileOffset(224);
    //         }
    //         this.childrenDescriptorTree = new LinkedHashMap<>();
    //         this.processDescriptorBTree(btreeStartOffset);
    //     }
    //     return this.childrenDescriptorTree;
    // }

    // /**
    //  * Recursive function for building the descriptor tree, used by
    //  * buildDescriptorTree
    //  *
    //  * @param in
    //  * @param btreeStartOffset
    //  * @throws IOException
    //  * @throws PSTException
    //  */
    // private void processDescriptorBTree(final long btreeStartOffset) throws IOException, PSTException {
    //     int fileTypeAdjustment;

    //     byte[] temp = new byte[2];
    //     if (this.getPSTFileType() == PST_TYPE_ANSI) {
    //         fileTypeAdjustment = 500;
    //     } else if (this.getPSTFileType() == PST_TYPE_2013_UNICODE) {
    //         fileTypeAdjustment = 0x1000 - 24;
    //     } else {
    //         fileTypeAdjustment = 496;
    //     }
    //     this.in.seek(btreeStartOffset + fileTypeAdjustment);
    //     this.in.readCompletely(temp);

    //     if ((temp[0] == 0xffffff81 && temp[1] == 0xffffff81)) {

    //         if (this.getPSTFileType() == PST_TYPE_ANSI) {
    //             this.in.seek(btreeStartOffset + 496);
    //         } else if (this.getPSTFileType() == PST_TYPE_2013_UNICODE) {
    //             this.in.seek(btreeStartOffset + 4056);
    //         } else {
    //             this.in.seek(btreeStartOffset + 488);
    //         }

    //         long numberOfItems = 0;
    //         if (this.getPSTFileType() == PST_TYPE_2013_UNICODE) {
    //             final byte[] numberOfItemsBytes = new byte[2];
    //             this.in.readCompletely(numberOfItemsBytes);
    //             numberOfItems = PSTObject.convertLittleEndianBytesToLong(numberOfItemsBytes);
    //             this.in.readCompletely(numberOfItemsBytes);
    //             final long maxNumberOfItems = PSTObject.convertLittleEndianBytesToLong(numberOfItemsBytes);
    //         } else {
    //             numberOfItems = this.in.read();
    //             this.in.read(); // maxNumberOfItems
    //         }
    //         this.in.read(); // itemSize
    //         final int levelsToLeaf = this.in.read();

    //         if (levelsToLeaf > 0) {
    //             for (long x = 0; x < numberOfItems; x++) {
    //                 if (this.getPSTFileType() == PST_TYPE_ANSI) {
    //                     final long branchNodeItemStartIndex = (btreeStartOffset + (12 * x));
    //                     final long nextLevelStartsAt = this.extractLEFileOffset(branchNodeItemStartIndex + 8);
    //                     this.processDescriptorBTree(nextLevelStartsAt);
    //                 } else {
    //                     final long branchNodeItemStartIndex = (btreeStartOffset + (24 * x));
    //                     final long nextLevelStartsAt = this.extractLEFileOffset(branchNodeItemStartIndex + 16);
    //                     this.processDescriptorBTree(nextLevelStartsAt);
    //                 }
    //             }
    //         } else {
    //             for (long x = 0; x < numberOfItems; x++) {
    //                 // The 64-bit descriptor index b-tree leaf node item
    //                 // give me the offset index please!
    //                 if (this.getPSTFileType() == PSTFile.PST_TYPE_ANSI) {
    //                     this.in.seek(btreeStartOffset + (x * 16));
    //                     temp = new byte[16];
    //                     this.in.readCompletely(temp);
    //                 } else {
    //                     this.in.seek(btreeStartOffset + (x * 32));
    //                     temp = new byte[32];
    //                     this.in.readCompletely(temp);
    //                 }

    //                 final DescriptorIndexNode tempNode = new DescriptorIndexNode(temp, this.getPSTFileType());

    //                 // we don't want to be children of ourselves...
    //                 if (tempNode.parentDescriptorIndexIdentifier == tempNode.descriptorIdentifier) {
    //                     // skip!
    //                 } else if (this.childrenDescriptorTree.containsKey(tempNode.parentDescriptorIndexIdentifier)) {
    //                     // add this entry to the existing list of children
    //                     final LinkedList<DescriptorIndexNode> children = this.childrenDescriptorTree
    //                         .get(tempNode.parentDescriptorIndexIdentifier);
    //                     children.add(tempNode);
    //                 } else {
    //                     // create a new entry and add this one to that
    //                     final LinkedList<DescriptorIndexNode> children = new LinkedList<>();
    //                     children.add(tempNode);
    //                     this.childrenDescriptorTree.put(tempNode.parentDescriptorIndexIdentifier, children);
    //                 }
    //                 this.itemCount++;
    //             }
    //         }
    //     } else {
    //         PSTObject.printHexFormatted(temp, true);
    //         throw new PSTException("Unable to read descriptor node, is not a descriptor");
    //     }
    // }

    // public void close() throws IOException {
    //     this.in.close();
    // }

    // parse a PSTDescriptor and get all of its items
    public getPSTDescriptorItems(
        localDescriptorsOffsetIndexIdentifier: number
    ): Map<number, PSTDescriptorItem>;
    public getPSTDescriptorItems(
        inputStream: PSTNodeInputStream
    ): Map<number, PSTDescriptorItem>;
    public getPSTDescriptorItems(arg: any): Map<number, PSTDescriptorItem> {
        let inputStream: PSTNodeInputStream = arg;
        if (typeof arg === 'number') {
            inputStream = this.readLeaf(arg);
        }

        // make sure the signature is correct
        inputStream.seek(0);
        let sig = inputStream.read();
        if (sig != 0x2) {
            throw new Error(
                'Unable to process descriptor node, bad signature: ' + sig
            );
        }

        let output = new Map();
        let numberOfItems = inputStream.seekAndReadLong(2, 2);
        let offset;
        if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
            offset = 4;
        } else {
            offset = 8;
        }

        let data = new Buffer(inputStream.length);
        inputStream.seek(0);
        inputStream.readCompletely(data);

        for (let x = 0; x < numberOfItems.toNumber(); x++) {
            let item: PSTDescriptorItem = new PSTDescriptorItem(
                data,
                offset,
                this
            );
            output.set(item.descriptorIdentifier, item);
            if (this._pstFileType === PSTFile.PST_TYPE_ANSI) {
                offset += 12;
            } else {
                offset += 24;
            }
        }

        // return output;
        return output;
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
}
