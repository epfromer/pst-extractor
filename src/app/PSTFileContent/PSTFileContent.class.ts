import * as fs from 'fs';
import * as fsext from 'fs-ext';

export class PSTFileContent {

    constructor(pstFD: number) {
        this._pstFD = pstFD;
    }
    
    // node fs file descriptor
    private _pstFD: number;
    // set pstFD(fd: number) { this._pstFD = fd; }
    // get pstFD() { return this._pstFD };

    // public getFilePointer(): number {
    //     return fsext.seekSync(this._pstFD, index, 0);
    // }

    // reads a single byte
    public read(position?: number): number {
        if (!position) {
            position = null;
        }
        
        let buffer = new Buffer(1);
        fs.readSync(this._pstFD, buffer, 0, buffer.length, position);
        return buffer[0];
    }

    // seek to a specific position in file
    public seek(index: number): number {
        return fsext.seekSync(this._pstFD, index, 0);
    }

    public readCompletely(buffer: Buffer, position?: number) {
        if (!position) {
            position = null;
        }

        // attempt to fill the supplied buffer
        let bytesRead = fs.readSync(this._pstFD, buffer, 0, buffer.length, position);
        if (bytesRead <= 0 || bytesRead === buffer.length) {
            return;
        }
        throw new Error('not yet implemented');
        // byte[] buffer = new byte[8192];
        // int offset = read;
        // while (offset < target.length) {
        //     read = this.read(buffer);
        //     if (read <= 0) {
        //         break;
        //     }
        //     System.arraycopy(buffer, 0, target, offset, read);
        //     offset += read;
        // }
    }
}