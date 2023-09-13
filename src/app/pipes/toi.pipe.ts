import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'TOI',
})
export class ToiPipe implements PipeTransform {
  transform(data: number) {
    return Math.floor(data) + ':' + Math.floor((data % 1) * 100);
  }
}
