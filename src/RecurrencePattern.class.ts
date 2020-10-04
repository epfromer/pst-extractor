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

export enum NthOccurrence {
  First = 0x0001,
  Second = 0x0002,
  Third = 0x0003,
  Fourth = 0x0004,
  Last = 0x0005,
}

export type WeekSpecific = boolean[] & { length: 7 }
export type MonthNthSpecific = {
  weekdays: WeekSpecific
  nth: NthOccurrence
}

export class RecurrencePattern {
  public recurFrequency: RecurFrequency
  public patternType: PatternType
  public firstDateTime: Date
  public period: number
  public patternTypeSpecific
  public endType: EndType
  public occurrenceCount: number
  public firstDOW: number
  public startDate: Date
  public endDate: Date

  constructor(private buffer: Buffer) {
    const bufferEnd = buffer.length
    let patternTypeOffset = 0

    this.recurFrequency = this.readInt(OFFSETS.RecurFrequency, 1)
    this.patternType = this.readInt(OFFSETS.PatternType, 1)
    this.firstDateTime = winToJsDate(this.readInt(OFFSETS.FirstDateTime, 2))
    this.period = this.readInt(OFFSETS.Period, 2)
    this.patternTypeSpecific = this.readPatternTypeSpecific(this.patternType)

    switch (this.patternType) {
      case PatternType.Week:
      case PatternType.Month:
      case PatternType.MonthEnd:
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
      patternTypeSpecific: this.patternTypeSpecific,
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

  private readPatternTypeSpecific(
    type: PatternType
  ): null | number | WeekSpecific | MonthNthSpecific {
    switch (type) {
      case PatternType.Day:
        return null
      case PatternType.Week:
        return readWeekByte(this.buffer.readInt8(OFFSETS.PatternTypeSpecific))
      case PatternType.Month:
      case PatternType.MonthEnd:
        return this.readInt(OFFSETS.PatternTypeSpecific, 2)
      case PatternType.MonthNth:
        return {
          weekdays: readWeekByte(
            this.buffer.readInt8(OFFSETS.PatternTypeSpecific)
          ),
          nth: this.readInt(OFFSETS.PatternTypeSpecific + 4, 2),
        }
    }
  }
}

function winToJsDate(dateInt: number): Date {
  return new Date(dateInt * 60 * 1000 - 1.16444736e13) // subtract milliseconds between 1601-01-01 and 1970-01-01
}

function readWeekByte(byte: number): WeekSpecific {
  const weekArr = []
  for (let i = 0; i < 7; ++i) {
    weekArr.push(Boolean(byte & (1 << i)))
  }
  return weekArr as WeekSpecific
}
