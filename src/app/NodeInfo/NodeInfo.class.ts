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
import { PSTNodeInputStream } from '../PSTNodeInputStream/PSTNodeInputStream.class';
import * as long from 'long';

export class NodeInfo {
    private _startOffset: number;
    get startOffset() {
        return this._startOffset;
    }

    private _endOffset: number;
    get endOffset() {
        return this._endOffset;
    }

    public length(): number {
        return this.endOffset - this.startOffset;
    }

    private _pstNodeInputStream: PSTNodeInputStream;
    get pstNodeInputStream() {
        return this._pstNodeInputStream;
    }

    constructor(start: number, end: number, pstNodeInputStream: PSTNodeInputStream) {
        if (start > end) {
            throw new Error(`NodeInfo:: constructor Invalid NodeInfo parameters: start ${start} is greater than end ${end}`);
        }
        this._startOffset = start;
        this._endOffset = end;
        this._pstNodeInputStream = pstNodeInputStream;
    }

    public seekAndReadLong(offset: long, length: number): long {
        return this.pstNodeInputStream.seekAndReadLong(offset.add(this.startOffset), length);
    }

    public toJSONstring(): string {
        return (
            'NodeInfo: ' +
            JSON.stringify(
                {
                    _startOffset: this._startOffset,
                    _endOffset: this._endOffset,
                    length: this.length
                },
                null,
                2
            )
        );
    }
}
