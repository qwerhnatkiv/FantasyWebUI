import { Injectable } from '@angular/core';
import { TableCell } from 'src/app/classes/table-cell';
import { GamesUtils } from 'src/app/common/games-utils';
import { GamePredictionDTO } from 'src/app/interfaces/game-prediction-dto';
import { DEFAULT_WEEK_HEADER_PREFIX } from 'src/constants';

@Injectable()
export class CalendarWeekGamesMapService {
  /**
   * Map that contains data about maximum amount of games for each week by any team
   */
  public weekMaximumGamesMap: Map<number, number> = new Map<number, number>();

  /**
   * Map that contains data about minimum amount of games for each week by any team
   */
  public weekMinimumGamesMap: Map<number, number> = new Map<number, number>();

  //#region PUBLIC METHODS

  /**
   * Returns amount of all games for team prior to specific week from specific start date
   * @param games Array of all games
   * @param teamName Team Name
   * @param week Week number
   * @param startDate Start Date
   * @returns Numeric value, count of games
   */
  public getGamesCountForTeamAndWeekFromStartDate(
    games: GamePredictionDTO[],
    teamName: string,
    week: number,
    startDate: Date | undefined
  ): number {
    const allGamesPriorToWeekCount: number = games.filter(
      (game) =>
        (game.homeTeamName == teamName || game.awayTeamName == teamName) &&
        !game.isOldGame &&
        game.weekNumber <= week &&
        (startDate == null || new Date(game.gameDate).getTime() > startDate!.getTime())
    ).length;

    this._addOrUpdateWeekGamesMapValues(week, allGamesPriorToWeekCount);

    return allGamesPriorToWeekCount;
  }

  /**
   * Sets updated week games count based on changing start date. Updates calendar data source to show changes in UI
   * @param dataSourceArray Calendar data source objects array
   * @param games Array of all games
   * @param startDate Start date
   */
  public setUpdatedWeeksGamesCount(
    dataSourceArray: any[],
    games: GamePredictionDTO[],
    startDate: Date | undefined
  ): void {
    this._resetWeekGameMapValues();
    for (let i = 0, n = dataSourceArray.length; i < n; ++i) {
      const teamRow: any = dataSourceArray[i];
      const teamInformationCell: TableCell = teamRow['team'];
      const teamName: string = teamInformationCell.cellValue;

      for (const columnName in teamRow) {
        if (!columnName.includes(DEFAULT_WEEK_HEADER_PREFIX)) {
          continue;
        }

        const cell: TableCell = teamRow[columnName];
        const weekNumber: number = +columnName.replace(
          DEFAULT_WEEK_HEADER_PREFIX,
          ''
        );

        const gamesCountForTeamAndWeekPriorToWeek: number =
          this.getGamesCountForTeamAndWeekFromStartDate(
            games,
            teamName,
            weekNumber,
            startDate
          );

        dataSourceArray[i][columnName].displayValue =
          cell.cellValue == gamesCountForTeamAndWeekPriorToWeek
            ? cell.cellValue.toString()
            : GamesUtils.getSimplifiedCalendarViewCellText(
                cell.cellValue,
                gamesCountForTeamAndWeekPriorToWeek
              );

        dataSourceArray[i][columnName].priorToWeekGamesCount =
          gamesCountForTeamAndWeekPriorToWeek;

        this._addOrUpdateWeekGamesMapValues(
          weekNumber,
          gamesCountForTeamAndWeekPriorToWeek
        );
      }
    }
  }

  //#endregion PUBLIC METHODS

  //#region PRIVATE METHODS

  private _resetWeekGameMapValues(): void {
    this.weekMaximumGamesMap = new Map<number, number>();
    this.weekMinimumGamesMap = new Map<number, number>();
  }

  private _addOrUpdateWeekGamesMapValues(
    weekNumber: number,
    allGamesPriorToWeek: number
  ): void {
    if (
      !this.weekMaximumGamesMap.has(weekNumber) ||
      this.weekMaximumGamesMap.get(weekNumber)! < allGamesPriorToWeek
    ) {
      this.weekMaximumGamesMap.set(weekNumber, allGamesPriorToWeek);
    }

    if (
      !this.weekMinimumGamesMap.has(weekNumber) ||
      this.weekMinimumGamesMap.get(weekNumber)! > allGamesPriorToWeek
    ) {
      this.weekMinimumGamesMap.set(weekNumber, allGamesPriorToWeek);
    }
  }

  //#endregion PRIVATE METHODS
}
