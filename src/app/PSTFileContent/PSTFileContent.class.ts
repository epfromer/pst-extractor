/**
 * Copyright 2010-2018 Richard Johnson, Orin Eman & Ed Pfromer
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * ---
 *
 * This file is part of pst-extractor.
 *
 * pst-extractor is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * pst-extractor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with pst-extractor. If not, see <http://www.gnu.org/licenses/>.
 */
import * as fs from 'fs';
import * as fsext from 'fs-ext';
import * as long from 'long';

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
    public seek(index: long) {
        fsext.seekSync(this._pstFD, index.toNumber(), 0);
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
        debugger;
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
