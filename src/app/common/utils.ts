import { DecimalPipe } from "@angular/common";
import { ONE_DIGIT_NUMBER_FORMAT } from "src/constants";

export module Utils {
  const numberPipe: DecimalPipe = new DecimalPipe('en-US');

  export function groupBy(array: any[], f: Function) {
    let groups: any = {};
    array.forEach(function (o) {
      var group = JSON.stringify(f(o));
      groups[group] = groups[group] || [];
      groups[group].push(o);
    });
    return Object.keys(groups).map(function (group) {
      return groups[group];
    });
  }

  export function sortTypes(n1: any, n2: any): number {
    if (n1 > n2) {
      return 1;
    }

    if (n1 < n2) {
      return -1;
    }

    return 0;
  }

  export function getDatesInRange(startDate: Date, endDate: Date): Date[] {
    let dateArray: Array<Date> = new Array<Date>();
    let currentDate: Date = startDate;
    while (currentDate <= endDate) {
      dateArray.push(new Date(currentDate));
      currentDate = addDateDays(currentDate, 1);
    }
    return dateArray;
  }

  export function addDateDays(date: Date, days: number): Date {
    if (!days) return date;
    let newDate: Date = new Date(date.getTime());
    newDate.setDate(newDate.getDate() + days);

    return newDate;
  }

  export function onlyUnique(value: any, index: number, array: any[]) {
    return array.indexOf(value) === index;
  }

  export function getMonday(date: Date, weeksBefore: number) {
    date = new Date(date);
    let day: number = date.getDay();
    let diff: number = date.getDate() - day - (weeksBefore * 7) + (day == 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
  }

  /**
   * Determines whether two dates are in the same week or not
   * @param startDate Start date of the date range
   * @param endDate End date of the date range
   * @returns True if two dates exist on the same week, otherwise false
   */
  export function areOnTheSameWeek(startDate: Date, endDate: Date) {
    if (startDate > endDate) {
      return false;
    }

    if (startDate.getTime() === endDate.getTime()) {
      return true;
    }

    const millisecondsInOneWeek: number = 604800000;
    if (endDate.getTime() - startDate.getTime() >= millisecondsInOneWeek) {
      return false;
    }

    // As the week starts on sunday (but system needs monday), days get shifted
    const startDay: number = (startDate.getUTCDay() - 1) % 7;
    const endDay: number = (endDate.getUTCDay() - 1) % 7;
    if (startDay >= endDay) {
      return false;
    }

    return true;
  }

  /**
   * Returns count of array items with specific predicate filter
   * @param items Array of items 
   * @param predicateFn Predicate to filter the items
   * @returns Count of items in filtered array
   */
  export function count<T>(items: Array<T>, predicateFn: (item: T) => boolean): number {
    return items.reduce(
      (n, item) => 
        predicateFn(item)
      ? n + 1
      : n,
      0
    )
  }

  export function formatNumber(value: number): string {
    if (value == null) {
      return value;
    }

    return numberPipe.transform(
      value,
      ONE_DIGIT_NUMBER_FORMAT
    )!.replace(',', ' ');
  }
}
