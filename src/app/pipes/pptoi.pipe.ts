import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'PPTOI',
})
export class PPToiPipe implements PipeTransform {
  transform(data: number, ppPosition: number) {
    return (
      Math.floor(data) +
      ':' +
      Math.floor((data % 1) * 100).toLocaleString('en-US', {
        minimumIntegerDigits: 2,
        useGrouping: false,
      }) +
      (ppPosition ? '(' + ppPosition + ')' : '')
    );
  }
}
