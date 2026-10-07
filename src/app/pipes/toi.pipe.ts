import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'TOI',
})
export class ToiPipe implements PipeTransform {
  transform(data: number) {
    // The backend sends minutes.seconds with two decimals; round, because 14.45 % 1 * 100 is 44.99999999999993
    return `${Math.floor(data)}:${Math.round((data % 1) * 100).toLocaleString(
      'en-US',
      {
        minimumIntegerDigits: 2,
        useGrouping: false,
      }
    )}`;
  }
}
