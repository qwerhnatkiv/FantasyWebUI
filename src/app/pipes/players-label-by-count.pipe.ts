import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'playersLabelByCount',
})
export class PlayersLabelByCountPipe implements PipeTransform {
  transform(value: number): string {
    if (value == 1) {
        return 'гравець';
      }
      else if (value > 1 && value < 5) {
        return 'гравці';
      }
  
      return 'гравців';
  }
}
