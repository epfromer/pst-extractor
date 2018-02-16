import { OffsetIndexItem } from './../OffsetIndexItem/OffsetIndexItem.class';
import { PSTFile } from './../PSTFile/PSTFile.class';
import { PSTObject } from './../PSTObject/PSTObject.class'

export class PSTNodeInputStream {

    private pstFile: PSTFile;
    private skipPoints: number[];
    private indexItems: OffsetIndexItem[];
    private currentBlock = 0;
    private currentLocation = 0;
    private allData: Buffer = null;
    private length = 0;
    private encrypted = false;
    private isZlib = false;

    constructor(pstFile: PSTFile, offsetItem: OffsetIndexItem) {
        this.pstFile = pstFile;
        this.encrypted = pstFile.encryptionType == PSTFile.ENCRYPTION_TYPE_COMPRESSIBLE;
        this.loadFromOffsetItem(offsetItem);
        this.detectZlib();
    }

    private detectZlib() {
        // not really sure how this is meant to work, kind of going by feel here.
        if (this.length < 4) {
            return;
        }
        throw new Error('not yet implemented');
        // try {
        //     if (this.read() == 0x78 && this.read() == 0x9c) {
        //         boolean multiStreams = false;
        //         if (this.indexItems.size() > 1) {
        //             final OffsetIndexItem i = this.indexItems.get(1);
        //             this.in.seek(i.fileOffset);
        //             multiStreams = (this.in.read() == 0x78 && this.in.read() == 0x9c);
        //         }
        //         // we are a compressed block, decompress the whole thing into a
        //         // buffer
        //         // and replace our contents with that.
        //         // firstly, if we have blocks, use that as the length
        //         final ByteArrayOutputStream outputStream = new ByteArrayOutputStream((int) this.length);
        //         if (multiStreams) {
        //             int y = 0;
        //             for (final OffsetIndexItem i : this.indexItems) {
        //                 final byte[] inData = new byte[i.size];
        //                 this.in.seek(i.fileOffset);
        //                 this.in.readCompletely(inData);
        //                 final InflaterOutputStream inflaterStream = new InflaterOutputStream(outputStream);
        //                 //try {
        //                     inflaterStream.write(inData);
        //                     inflaterStream.close();
        //                 //} catch (Exception err) {
        //                 //    System.out.println("Y: " + y);
        //                 //    System.out.println(err);
        //                 //    PSTObject.printHexFormatted(inData, true);
        //                 //    System.exit(0);
        //                 //}
        //                 y++;
        //             }
        //             this.indexItems.clear();
        //             this.skipPoints.clear();
        //         } else {
        //             int compressedLength = (int) this.length;
        //             if (this.indexItems.size() > 0) {
        //                 compressedLength = 0;
        //                 for (final OffsetIndexItem i : this.indexItems) {
        //                     //System.out.println(i);
        //                     compressedLength += i.size;
        //                 }
        //             }
        //             final byte[] inData = new byte[compressedLength];
        //             this.seek(0);
        //             this.readCompletely(inData);

        //             final InflaterOutputStream inflaterStream = new InflaterOutputStream(outputStream);
        //             inflaterStream.write(inData);
        //             inflaterStream.close();
        //         }
        //         outputStream.close();
        //         final byte[] output = outputStream.toByteArray();
        //         this.allData = output;
        //         this.currentLocation = 0;
        //         this.currentBlock = 0;
        //         this.length = this.allData.length;
        //     }
        //     this.seek(0);
        // } catch (final IOException err) {
        //     throw new PSTException("Unable to decompress reportedly compressed block", err);
        // }
    }

    private loadFromOffsetItem(offsetItem: OffsetIndexItem) {
        let bInternal = (offsetItem.indexIdentifier & 0x02) != 0;

        let data = new Buffer(offsetItem.size);
        this.pstFile.seekAndRead(data, offsetItem.fileOffset);
        
        if (bInternal) {
            // All internal blocks are at least 8 bytes long...
            if (offsetItem.size < 8) {
                throw new Error("Invalid internal block size");
            }

            if (data[0] == 0x1) {
                bInternal = false;
                // we are a xblock, or xxblock
                this.length = PSTObject.convertLittleEndianBytesToLong(data, 4, 8);
                // go through all of the blocks and create skip points.
                this.getBlockSkipPoints(data);
                return;
            }
        }

        // (Internal blocks aren't compressed)
        if (bInternal) {
            this.encrypted = false;
        }
        this.allData = data;
        this.length = this.allData.length;

    }

    private getBlockSkipPoints(data: Buffer) {
        if (data[0] != 0x1) {
            throw new Error("Unable to process XBlock, incorrect identifier");
        }

        let numberOfEntries = PSTObject.convertLittleEndianBytesToLong(data, 2, 4);

        let arraySize = 8;
        if (this.pstFile.pstFileType == PSTFile.PST_TYPE_ANSI) {
            arraySize = 4;
        }
        if (data[1] == 0x2) {
            // XXBlock
            let offset = 8;
            for (let x = 0; x < numberOfEntries; x++) {
                let bid = PSTObject.convertLittleEndianBytesToLong(data, offset, offset + arraySize);
                bid &= 0xfffffffe;
                // get the details in this block and
                let offsetItem = this.pstFile.getOffsetIndexNode(bid);
                let blockData = new Buffer(offsetItem.size);
                this.pstFile.seekAndRead(blockData, offsetItem.fileOffset);

                // recurse
                this.getBlockSkipPoints(blockData);
                offset += arraySize;
            }
        } else if (data[1] == 0x1) {
            // normal XBlock
            let offset = 8;
            for (let x = 0; x < numberOfEntries; x++) {
                let bid = PSTObject.convertLittleEndianBytesToLong(data, offset, offset + arraySize);
                bid &= 0xfffffffe;
                // get the details in this block and add it to the list
                let offsetItem = this.pstFile.getOffsetIndexNode(bid);
                this.indexItems.push(offsetItem);
                this.skipPoints.push(this.currentLocation);
                this.currentLocation += offsetItem.size;
                offset += arraySize;
            }
        }
    }

}
