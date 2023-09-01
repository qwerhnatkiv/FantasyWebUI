import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'keys',
})
export class MapKeysPipe implements PipeTransform {
  transform(data: {}) {
    return Object.keys(data);
  }
}
