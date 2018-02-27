import { ResponseLevel } from './../ResponseLevel/ResponseLevel.class';
import { UUID } from './../UUID/UUID.class';

// Class to hold decoded PidTagConversationIndex
export class PSTConversationIndex {
    private static HUNDRED_NS_TO_MS = 1000;
    private static MINIMUM_HEADER_SIZE = 22;
    private static RESPONSE_LEVEL_SIZE = 5;

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

    protected PSTConversationIndex(rawConversationIndex: Buffer) {
        if (rawConversationIndex != null && rawConversationIndex.length >= PSTConversationIndex.MINIMUM_HEADER_SIZE) {
            this.decodeHeader(rawConversationIndex);
            if (rawConversationIndex.length >= PSTConversationIndex.MINIMUM_HEADER_SIZE + PSTConversationIndex.RESPONSE_LEVEL_SIZE) {
                this.decodeResponseLevel(rawConversationIndex);
            }
        }
    }

    public toString() {
        return this.guid + "@" + this.deliveryTime + " " + this.responseLevels.length + " ResponseLevels";
    }

    private void decodeHeader(final byte[] rawConversationIndex) {
        // According to the Spec the first byte is not included, but I believe
        // the spec is incorrect!
        // int reservedheaderMarker = (int)
        // PSTObject.convertBigEndianBytesToLong(rawConversationIndex, 0, 1);

        final long deliveryTimeHigh = PSTObject.convertBigEndianBytesToLong(rawConversationIndex, 0, 4);
        final long deliveryTimeLow = PSTObject.convertBigEndianBytesToLong(rawConversationIndex, 4, 6) << 16;
        this.deliveryTime = PSTObject.filetimeToDate((int) deliveryTimeHigh, (int) deliveryTimeLow);

        final long guidHigh = PSTObject.convertBigEndianBytesToLong(rawConversationIndex, 6, 14);
        final long guidLow = PSTObject.convertBigEndianBytesToLong(rawConversationIndex, 14, 22);

        this.guid = new UUID(guidHigh, guidLow);
    }

    private void decodeResponseLevel(final byte[] rawConversationIndex) {
        final int responseLevelCount = (rawConversationIndex.length - MINIMUM_HEADER_SIZE) / RESPONSE_LEVEL_SIZE;
        this.responseLevels = new ArrayList<>(responseLevelCount);

        for (int responseLevelIndex = 0, position = 22; responseLevelIndex < responseLevelCount; responseLevelIndex++, position += RESPONSE_LEVEL_SIZE) {

            final long responseLevelValue = PSTObject.convertBigEndianBytesToLong(rawConversationIndex, position,
                position + 5);
            final short deltaCode = (short) (responseLevelValue >> 39);
            final short random = (short) (responseLevelValue & 0xFF);

            // shift by 1 byte (remove the random) and mask off the deltaCode
            long deltaTime = (responseLevelValue >> 8) & 0x7FFFFFFF;

            if (deltaCode == 0) {
                deltaTime <<= 18;
            } else {
                deltaTime <<= 23;
            }

            deltaTime /= HUNDRED_NS_TO_MS;

            this.responseLevels.add(responseLevelIndex, new ResponseLevel(deltaCode, deltaTime, random));
        }
    }
}
