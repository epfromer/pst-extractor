const OFFSETS = {
  RecurFrequency: 4,
  PatternType: 6,
  FirstDateTime: 10,
  Period: 14,
  PatternTypeSpecific: 22,
  EndType: 22,
  OccurrenceCount: 26,
  FirstDOW: 30,
  StartDate: -8,
  EndDate: -4,
}

export enum RecurFrequency {
  Daily = 0x200a,
  Weekly = 0x200b,
  Monthly = 0x200c,
  Yearly = 0x200d,
}

export enum PatternType {
  Day = 0x0000,
  Week = 0x0001,
  Month = 0x0002,
  MonthEnd = 0x0004,
  MonthNth = 0x0003,
}

export enum EndType {
  AfterDate = 0x00002021,
  AfterNOccurrences = 0x00002022,
  NeverEnd = 0x00002023,
}

export class RecurrencePattern {
  recurFrequency: RecurFrequency
  patternType: PatternType
  firstDateTime: Date
  period: number
  endType: EndType
  occurrenceCount: number
  firstDOW: number
  startDate: Date
  endDate: Date

  constructor(private buffer: Buffer) {
    const bufferEnd = buffer.length
    let patternTypeOffset = 0

    this.recurFrequency = this.readInt(OFFSETS.RecurFrequency, 1)
    this.patternType = this.readInt(OFFSETS.PatternType, 1)
    this.firstDateTime = winToJsDate(this.readInt(OFFSETS.FirstDateTime, 2))
    this.period = this.readInt(OFFSETS.Period, 2)

    switch (this.patternType) {
      case PatternType.Week:
      case PatternType.Month:
        patternTypeOffset = 4
        break
      case PatternType.MonthNth:
        patternTypeOffset = 8
        break
    }

    this.endType = this.readInt(OFFSETS.EndType + patternTypeOffset, 2)
    this.occurrenceCount = this.readInt(
      OFFSETS.OccurrenceCount + patternTypeOffset,
      2
    )
    this.firstDOW = this.readInt(OFFSETS.FirstDOW + patternTypeOffset, 2)
    this.startDate = winToJsDate(this.readInt(bufferEnd + OFFSETS.StartDate, 2))
    this.endDate = winToJsDate(this.readInt(bufferEnd + OFFSETS.EndDate, 2))
  }

  public toJSON(): any {
    return {
      recurFrequency: RecurFrequency[this.recurFrequency],
      patternType: PatternType[this.patternType],
      firstDateTime: this.firstDateTime,
      period: this.period,
      endType: EndType[this.endType],
      occurrenceCount: this.occurrenceCount,
      firstDOW: this.firstDOW,
      startDate: this.startDate,
      endDate: this.endDate,
    }
  }

  private readInt(offset: number, size: 1 | 2) {
    switch (size) {
      case 1:
        return this.buffer.readInt16LE(offset)
      case 2:
        return this.buffer.readInt32LE(offset)
    }
  }
}

function winToJsDate(dateInt: number): Date {
  return new Date(dateInt * 60 * 1000 - 1.16444736e13)
}
