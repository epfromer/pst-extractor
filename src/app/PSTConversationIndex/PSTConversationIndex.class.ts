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
import { ResponseLevel } from './../ResponseLevel/ResponseLevel.class';
import { UUID } from './../UUID/UUID.class';
import { PSTObject } from '../PSTObject/PSTObject.class';
import { PSTUtil } from '../PSTUtil/PSTUtil.class';
import * as long from 'long';

// Class to hold decoded PidTagConversationIndex
export class PSTConversationIndex {
    private HUNDRED_NS_TO_MS = 1000;
    private MINIMUM_HEADER_SIZE = 22;
    private RESPONSE_LEVEL_SIZE = 5;

    private _deliveryTime: Date;
    public get deliveryTime(): Date {
        return this._deliveryTime;
    }

    private _guid: UUID;
    public get guid(): UUID {
        return this._guid;
    }

    private _responseLevels: ResponseLevel[] = [];
    public get responseLevels(): ResponseLevel[] {
        return this._responseLevels;
    }

    public constructor(rawConversationIndex: Buffer) {
        if (rawConversationIndex != null && rawConversationIndex.length >= this.MINIMUM_HEADER_SIZE) {
            this.decodeHeader(rawConversationIndex);
            if (rawConversationIndex.length >= this.MINIMUM_HEADER_SIZE + this.RESPONSE_LEVEL_SIZE) {
                this.decodeResponseLevel(rawConversationIndex);
            }
        }
    }

    private decodeHeader(rawConversationIndex: Buffer) {
        // According to the Spec the first byte is not included, but I believe
        // the spec is incorrect!
        let deliveryTimeHigh: long = PSTUtil.convertBigEndianBytesToLong(rawConversationIndex, 0, 4);
        let deliveryTimeLow: long = PSTUtil.convertBigEndianBytesToLong(rawConversationIndex, 4, 6);
        deliveryTimeLow = deliveryTimeLow.shiftLeft(16);
        this._deliveryTime = PSTUtil.filetimeToDate(deliveryTimeHigh, deliveryTimeLow);

        let guidHigh: long = PSTUtil.convertBigEndianBytesToLong(rawConversationIndex, 6, 14);
        let guidLow: long = PSTUtil.convertBigEndianBytesToLong(rawConversationIndex, 14, 22);

        this._guid = new UUID(guidHigh, guidLow);
    }

    private decodeResponseLevel(rawConversationIndex: Buffer) {
        let responseLevelCount: number = Math.trunc((rawConversationIndex.length - this.MINIMUM_HEADER_SIZE) / this.RESPONSE_LEVEL_SIZE);
        for (let responseLevelIndex = 0, position = 22; responseLevelIndex < responseLevelCount; responseLevelIndex++, position += this.RESPONSE_LEVEL_SIZE) {

            let responseLevelValue: long = PSTUtil.convertBigEndianBytesToLong(rawConversationIndex, position, position + 5);
            let deltaCode = responseLevelValue.shiftRight(39).toNumber();
            let random = responseLevelValue.and(0xFF);

            // shift by 1 byte (remove the random) and mask off the deltaCode
            let deltaTime: long = responseLevelValue.shiftRight(8).and(0x7FFFFFFF);

            if (deltaCode == 0) {
                deltaTime = deltaTime.shiftLeft(18);
            } else {
                deltaTime = deltaTime.shiftLeft(23);
            }

            deltaTime = deltaTime.divide(this.HUNDRED_NS_TO_MS);

            this.responseLevels[responseLevelIndex] = new ResponseLevel(deltaCode, deltaTime, random.toNumber());
        }
    }

    public toString() {
        return this.guid + "@" + this.deliveryTime + " " + this.responseLevels.length + " ResponseLevels";
    }

}
