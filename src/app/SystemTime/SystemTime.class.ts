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
}
