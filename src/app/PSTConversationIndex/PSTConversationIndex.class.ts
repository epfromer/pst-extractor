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

    public toString() {
        return this.guid + "@" + this.deliveryTime + " " + this.responseLevels.length + " ResponseLevels";
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
}
