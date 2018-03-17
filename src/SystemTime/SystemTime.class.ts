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
import { PSTUtil } from './../PSTUtil/PSTUtil.class';

export class SystemTime {
    private wYear = 0;
    private wMonth = 0;
    private wDayOfWeek = 0;
    private wDay = 0;
    private wHour = 0;
    private wMinute = 0;
    private wSecond = 0;
    private wMilliseconds = 0;

    /**
     * Creates an instance of SystemTime.
     * @param {Buffer} timeZoneData 
     * @param {number} offset 
     * @memberof SystemTime
     */
    constructor(timeZoneData: Buffer, offset: number) {
        this.wYear = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset, offset + 2)
            .and(0x7fff)
            .toNumber();
        this.wMonth = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset + 2, offset + 4)
            .and(0x7fff)
            .toNumber();
        this.wDayOfWeek = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset + 4, offset + 6)
            .and(0x7fff)
            .toNumber();
        this.wDay = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset + 6, offset + 8)
            .and(0x7fff)
            .toNumber();
        this.wHour = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset + 8, offset + 10)
            .and(0x7fff)
            .toNumber();
        this.wMinute = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset + 10, offset + 12)
            .and(0x7fff)
            .toNumber();
        this.wSecond = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset + 12, offset + 14)
            .and(0x7fff)
            .toNumber();
        this.wMilliseconds = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset + 14, offset + 16)
            .and(0x7fff)
            .toNumber();
    }

    /**
     * Determines if two times are equal.
     * @param {SystemTime} rhs 
     * @returns 
     * @memberof SystemTime
     */
    isEqual(rhs: SystemTime) {
        return (
            this.wYear === rhs.wYear &&
            this.wMonth === rhs.wMonth &&
            this.wDayOfWeek === rhs.wDayOfWeek &&
            this.wDay === rhs.wDay &&
            this.wHour === rhs.wHour &&
            this.wMinute === rhs.wMinute &&
            this.wSecond === rhs.wSecond &&
            this.wMilliseconds === rhs.wMilliseconds
        );
    }

    /**
     * JSON stringify the object properties.
     * @returns {string} 
     * @memberof SystemTime
     */
    public toJSON(): any {
        return this;
    }
}
