import { Pipe, PipeTransform } from '@angular/core';
import { TableColumn } from '../interfaces/table-column';
import { LOW_GAMES_WEEK_BOUNDARY } from 'src/constants';
import { GamesUtils } from '../common/games-utils';

@Pipe({
  name: 'cellClass',
})
export class CellClassPipe implements PipeTransform {
  transform(
    column: TableColumn,
    minFilterDate: Date | undefined,
    maxFilterDate: Date | undefined,
    isWeekCell: boolean,
    weekGamesCount: number,
    targetOldDateBoundary: Date
  ) {
    if (GamesUtils.isOldDate(column.columnDef, targetOldDateBoundary)) {
      return 'calendar-cell-old';
    }

    let classStatement: string =
      minFilterDate != null &&
      maxFilterDate != null &&
      column.columnDef != null &&
      column.columnDef! >= minFilterDate! &&
      column.columnDef! <= maxFilterDate!
        ? 'calendar-cell-selected'
        : 'calendar-cell-not-selected';

    if (weekGamesCount! <= LOW_GAMES_WEEK_BOUNDARY && !isWeekCell) {
      classStatement += ' strike';
    }

    return classStatement;
  }
}
