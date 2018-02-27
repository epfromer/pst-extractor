import { PSTUtil } from './../PSTUtil/PSTUtil.class';
import { SystemTime } from '../SystemTime/SystemTime.class';

export class TZRule {
    private dtStart: SystemTime;
    private lBias: number;
    private lStandardBias: number;
    private lDaylightBias: number;
    private startStandard: SystemTime;
    private startDaylight: SystemTime;

    constructor(timeZoneData: Buffer, offset: number, dtStart?: SystemTime) {
        if (dtStart) {
            this.dtStart = dtStart;
            this.InitBiases(timeZoneData, offset);
            //const wStandardYear = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset + 12, offset + 14);
            this.startStandard = new SystemTime(timeZoneData, offset + 14);
            //final short wDaylightYear = (short) PSTObject.convertLittleEndianBytesToLong(timeZoneData, offset + 30, offset + 32);
            this.startDaylight = new SystemTime(timeZoneData, offset + 32);
        } else {
            this.dtStart = new SystemTime(timeZoneData, offset);
            this.InitBiases(timeZoneData, offset + 16);
            this.startStandard = new SystemTime(timeZoneData, offset + 28);
            this.startDaylight = new SystemTime(timeZoneData, offset + 44);
        }
    }

    private InitBiases(timeZoneData: Buffer, offset: number) {
        this.lBias = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset, offset + 4).toNumber();
        this.lStandardBias = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset + 4, offset + 8).toNumber();
        this.lDaylightBias = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, offset + 8, offset + 12).toNumber();
    }

    public isEqual(rhs: TZRule): boolean {
        return (
            this.dtStart.isEqual(rhs.dtStart) &&
            this.lBias == rhs.lBias &&
            this.lStandardBias == rhs.lStandardBias &&
            this.lDaylightBias == rhs.lDaylightBias &&
            this.startStandard.isEqual(rhs.startStandard) &&
            this.startDaylight.isEqual(rhs.startDaylight)
        );
    }
}
