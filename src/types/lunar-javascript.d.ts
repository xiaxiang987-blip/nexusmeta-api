declare module 'lunar-javascript' {
  export class Solar {
    static fromDate(date: Date): Solar
    static fromYmd(year: number, month: number, day: number): Solar
    getLunar(): Lunar
    getYear(): number
    getMonth(): number
    getDay(): number
    getHour(): number
  }

  export class Lunar {
    getYearInGanZhi(): string
    getMonthInGanZhi(): string
    getDayInGanZhi(): string
    getTimeInGanZhi(): string
    getYearShengXiao(): string
    getEightChar(): EightChar
  }

  export class EightChar {
    getYear(): string
    getMonth(): string
    getDay(): string
    getTime(): string
  }
}
