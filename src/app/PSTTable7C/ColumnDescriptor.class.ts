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
import * as long from 'long';
import { NodeInfo } from "../NodeInfo/NodeInfo.class";

export class ColumnDescriptor {
    private _ibData: number;
    public get ibData(): number {
        return this._ibData;
    }

    private _cbData: number;
    public get cbData(): number {
        return this._cbData;
    }

    private _type: number;
    public get type(): number {
        return this._type;
    }
    
    private _iBit: number;
    public get iBit(): number {
        return this._iBit;
    }
    
    private _id: number;
    public get id(): number {
        return this._id;
    }

    constructor(nodeInfo: NodeInfo, offset: number) {
        this._type = nodeInfo.seekAndReadLong(long.fromValue(offset), 2).toNumber(); // & 0xFFFF;
        this._id = nodeInfo.seekAndReadLong(long.fromValue(offset + 2), 2).toNumber(); // & 0xFFFF;
        this._ibData = nodeInfo.seekAndReadLong(long.fromValue(offset + 4), 2).toNumber(); // & 0xFFFF;
        this._cbData = nodeInfo.pstNodeInputStream.read(); // & 0xFFFF;
        this._iBit = nodeInfo.pstNodeInputStream.read(); // & 0xFFFF;
    }

    public toJSONstring(): string {
        return (
            'ColumnDescriptor: ' +
            JSON.stringify(
                {
                    _ibData: this._ibData,
                    _cbData: this._cbData,
                    _type: this._type,
                    _iBit: this._iBit,
                    _id: this._id,
                },
                null,
                2
            )
        );
    }
}