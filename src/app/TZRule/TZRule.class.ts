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
import { SystemTime } from '../SystemTime/SystemTime.class';

export class TZRule {

    private _dtStart: SystemTime;
    public get dtStart() {
        return this._dtStart;
    }

    private _lBias: number;
    public get lBias() {
        return this._lBias;
    }

    private _lStandardBias: number;
    public get lStandardBias() {
        return this._lStandardBias;
    }

    private _lDaylightBias: number;
    public get lDaylightBias() {
        return this._lDaylightBias;
    }

    private _startStandard: SystemTime;
    public get startStandard() {
        return this._startStandard;
    }

    private _startDaylight: SystemTime;
    public get startDaylight() {
        return this._startDaylight;
    }

    constructor(timeZoneData: Buffer, offset: number, dtStart?: SystemTime) {
        if (dtStart) {
            this._dtStart = dtStart;
            this.InitBiases(timeZoneData, offset);
            //const wStandardYear = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset + 12, offset + 14);
            this._startStandard = new SystemTime(timeZoneData, offset + 14);
            //final short wDaylightYear = (short) PSTObject.convertLittleEndianBytesToLong(timeZoneData, offset + 30, offset + 32);
            this._startDaylight = new SystemTime(timeZoneData, offset + 32);
        } else {
            this._dtStart = new SystemTime(timeZoneData, offset);
            this.InitBiases(timeZoneData, offset + 16);
            this._startStandard = new SystemTime(timeZoneData, offset + 28);
            this._startDaylight = new SystemTime(timeZoneData, offset + 44);
        }
    }

    private InitBiases(timeZoneData: Buffer, offset: number) {
        this._lBias = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset, offset + 4).toNumber();
        this._lStandardBias = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset + 4, offset + 8).toNumber();
        this._lDaylightBias = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset + 8, offset + 12).toNumber();
    }

    public isEqual(rhs: TZRule): boolean {
        return (
            this._dtStart.isEqual(rhs._dtStart) &&
            this._lBias == rhs._lBias &&
            this._lStandardBias == rhs._lStandardBias &&
            this._lDaylightBias == rhs._lDaylightBias &&
            this._startStandard.isEqual(rhs._startStandard) &&
            this._startDaylight.isEqual(rhs._startDaylight)
        );
    }

    public toJSONstring(): string {
        return (
            'TZRule: ' +
            JSON.stringify(
                {
                    _dtStart: this._dtStart,
                    _lBias: this._lBias,
                    _lStandardBias: this._lStandardBias,
                    _lDaylightBias: this._lDaylightBias,
                    _startStandard: this._startStandard,
                    _startDaylight: this._startDaylight,
                },
                null,
                2
            ));
    }
}
