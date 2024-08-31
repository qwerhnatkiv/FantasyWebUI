import { Pipe, PipeTransform } from '@angular/core';
import {
  GREEN_GAMES_WEEK_BOUNDARY,
  GREEN_WIN_LOWER_BOUNDARY,
  RED_GAMES_WEEK_BOUNDARY,
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
    cellValue: number,
    showLongTermWeekStyles: boolean,
    weekMaximumGamesCount: number,
    weekMinimumGamesCount: number,
    priorToWeekGamesCount: number | undefined
  ) {
    const numericValue: number = Number(cellValue);

    if (isWeekCell) {
      return this._getWeekCellStyle(
        weekGames, 
        showFullCalendar, 
        cellValue, 
        showLongTermWeekStyles,
        weekMaximumGamesCount,
        weekMinimumGamesCount,
        priorToWeekGamesCount
      );
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

  private _getWeekCellStyle(
    weekGames: number,
    showFullCalendar: boolean,
    cellValue: number,
    showLongTermWeekStyles: boolean,
    weekMaximumGamesCount: number,
    weekMinimumGamesCount: number,
    priorToWeekGamesCount: number | undefined
  ): string {
    if (showLongTermWeekStyles) {
      if (weekMinimumGamesCount === weekMaximumGamesCount) {
        return 'calendar-cell-week';
      }

      if (priorToWeekGamesCount === weekMaximumGamesCount) {
        return 'calendar-cell-week-very-green';
      }

      if (priorToWeekGamesCount === weekMaximumGamesCount - 1) {
        return 'calendar-cell-week-green';
      }

      if (priorToWeekGamesCount! <= weekMinimumGamesCount + 1) {
        return 'calendar-cell-week-red';
      }

      return 'calendar-cell-week';
    }

    if (showFullCalendar ? weekGames > GREEN_GAMES_WEEK_BOUNDARY : cellValue > GREEN_GAMES_WEEK_BOUNDARY) {
      return 'calendar-cell-week-green';
    }

    if (showFullCalendar ? weekGames < RED_GAMES_WEEK_BOUNDARY : cellValue < RED_GAMES_WEEK_BOUNDARY) {
      return 'calendar-cell-week-red';
    }

    return 'calendar-cell-week';
  }
}
