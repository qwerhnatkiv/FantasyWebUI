export module Utils {
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
}
