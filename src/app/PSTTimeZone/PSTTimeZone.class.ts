import { SystemTime } from "../SystemTime/SystemTime.class";
import { Log } from "../Log.class";
import { TZRule } from "../TZRule/TZRule.class";
import { PSTUtil } from "../PSTUtil/PSTUtil.class";

// Class containing time zone information
export class PSTTimeZone {
    private _name: string;
    public get name() {
        return this._name;
    }

    private rule: TZRule;
    // private simpleTimeZone: SimpleTimeZone = null;

    constructor(timeZoneData: Buffer) {
        this.rule = null;
        this._name = "";

        debugger;
        // try {
        //     const headerLen = PSTUtil.convertLittleEndianBytesToLong(timeZoneData, 2, 4).toNumber();
        //     const nameLen = 2 * PSTUtil.convertLittleEndianBytesToLong(timeZoneData, 6, 8).toNumber();
        //     this.name = new String(timeZoneData, 8, nameLen, "UTF-16LE");
        //     int ruleOffset = 8 + nameLen;
        //     final int nRules = (int) PSTUtil.convertLittleEndianBytesToLong(timeZoneData, ruleOffset, ruleOffset + 2);

        //     ruleOffset = 4 + headerLen;
        //     for (int rule = 0; rule < nRules; ++rule) {
        //         // Is this rule the effective rule?
        //         final int flags = (int) PSTUtil.convertLittleEndianBytesToLong(timeZoneData, ruleOffset + 4,
        //             ruleOffset + 6);
        //         if ((flags & 0x0002) != 0) {
        //             this.rule = new TZRule(timeZoneData, ruleOffset + 6);
        //             break;
        //         }
        //         ruleOffset += 66;
        //     }
        // } catch (final Exception e) {
        //     System.err.printf("Exception reading timezone: %s\n", e.toString());
        //     e.printStackTrace();
        //     this.rule = null;
        //     this.name = "";
        // }
    }

    // PSTTimeZone(String name, final byte[] timeZoneData) {
    //     this.name = name;
    //     this.rule = null;

    //     try {
    //         this.rule = new TZRule(new SYSTEMTIME(), timeZoneData, 0);
    //     } catch (final Exception e) {
    //         System.err.printf("Exception reading timezone: %s\n", e.toString());
    //         e.printStackTrace();
    //         this.rule = null;
    //         name = "";
    //     }
    // }

    // public SimpleTimeZone getSimpleTimeZone() {
    //     if (this.simpleTimeZone != null) {
    //         return this.simpleTimeZone;
    //     }

    //     if (this.rule.startStandard.wMonth == 0) {
    //         // A time zone with no daylight savings time
    //         this.simpleTimeZone = new SimpleTimeZone((this.rule.lBias + this.rule.lStandardBias) * 60 * 1000,
    //             this.name);

    //         return this.simpleTimeZone;
    //     }

    //     final int startMonth = (this.rule.startDaylight.wMonth - 1) + Calendar.JANUARY;
    //     final int startDayOfMonth = (this.rule.startDaylight.wDay == 5) ? -1
    //         : ((this.rule.startDaylight.wDay - 1) * 7) + 1;
    //     final int startDayOfWeek = this.rule.startDaylight.wDayOfWeek + Calendar.SUNDAY;
    //     final int endMonth = (this.rule.startStandard.wMonth - 1) + Calendar.JANUARY;
    //     final int endDayOfMonth = (this.rule.startStandard.wDay == 5) ? -1
    //         : ((this.rule.startStandard.wDay - 1) * 7) + 1;
    //     final int endDayOfWeek = this.rule.startStandard.wDayOfWeek + Calendar.SUNDAY;
    //     final int savings = (this.rule.lStandardBias - this.rule.lDaylightBias) * 60 * 1000;

    //     this.simpleTimeZone = new SimpleTimeZone(-((this.rule.lBias + this.rule.lStandardBias) * 60 * 1000), this.name,
    //         startMonth, startDayOfMonth, -startDayOfWeek,
    //         (((((this.rule.startDaylight.wHour * 60) + this.rule.startDaylight.wMinute) * 60)
    //             + this.rule.startDaylight.wSecond) * 1000) + this.rule.startDaylight.wMilliseconds,
    //         endMonth, endDayOfMonth, -endDayOfWeek,
    //         (((((this.rule.startStandard.wHour * 60) + this.rule.startStandard.wMinute) * 60)
    //             + this.rule.startStandard.wSecond) * 1000) + this.rule.startStandard.wMilliseconds,
    //         savings);

    //     return this.simpleTimeZone;
    // }

    // public isEqual(rhs: PSTTimeZone): boolean {
    //     if (this.name.equalsIgnoreCase(rhs.name)) {
    //         if (this.rule.isEqual(rhs.rule)) {
    //             return true;
    //         }

    //         Log.error("Warning: different timezones with the same name: " + this.name);
    //     }
    //     return false;
    // }

    // public getStart(): SystemTime {
    //     return this.rule.dtStart;
    // }

    // public getBias(): number {
    //     return this.rule.lBias;
    // }

    // public getStandardBias(): number {
    //     return this.rule.lStandardBias;
    // }

    // public getDaylightBias(): number {
    //     return this.rule.lDaylightBias;
    // }

    // public getDaylightStart(): SystemTime {
    //     return this.rule.startDaylight;
    // }

    // public getStandardStart(): SystemTime {
    //     return this.rule.startStandard;
    // }
}
