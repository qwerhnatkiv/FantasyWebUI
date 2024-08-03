import { Pipe, PipeTransform } from '@angular/core';
import {
  GREEN_WIN_LOWER_BOUNDARY,
  VERY_GREEN_WIN_LOWER_BOUNDARY,
  WHITE_WIN_LOWER_BOUNDARY,
} from 'src/constants';

@Pipe({
  name: 'cellTextClass',
})
export class CellTextClassPipe implements PipeTransform {
  transform(
    weekGames: number,
    isWeekCell: boolean,
    showFullCalendar: boolean,
    isOldGame: boolean,
    cellValue: number
  ) {
    const numericValue: number = Number(cellValue);

    if (isWeekCell) {
      if (showFullCalendar ? weekGames > 3 : cellValue > 3) {
        return 'calendar-cell-week-green';
      }

      if (showFullCalendar ? weekGames < 2 : cellValue < 2) {
        return 'calendar-cell-week-red';
      }

      return 'calendar-cell-week';
    }

    if (isOldGame) {
      return 'calendar-cell-old-content';
    }

    if (numericValue < 0) {
      return 'calendar-cell-empty';
    }

    if (numericValue >= VERY_GREEN_WIN_LOWER_BOUNDARY) {
      return 'calendar-cell-very-green';
    }

    if (numericValue >= GREEN_WIN_LOWER_BOUNDARY) {
      return 'calendar-cell-green';
    }

    if (numericValue >= WHITE_WIN_LOWER_BOUNDARY) {
      return 'calendar-cell-normal';
    }

    return 'calendar-cell-red';
  }
}
