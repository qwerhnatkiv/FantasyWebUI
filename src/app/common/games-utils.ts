import { GREEN_WIN_LOWER_BOUNDARY, VERY_GREEN_WIN_LOWER_BOUNDARY, WHITE_WIN_LOWER_BOUNDARY } from 'src/constants';
import { GamePredictionDTO } from '../interfaces/game-prediction-dto';
import { TeamGameInformation } from '../interfaces/team-game-information';

export module GamesUtils {
  export function getExtremumDateForGames(
    games: GamePredictionDTO[],
    sortSequence: boolean
  ): Date {
    if (games.length === 0) {
      return new Date();
    }

    let expression: (extremum: Date, game: GamePredictionDTO) => Date;
    if (!sortSequence) {
      expression = (min, game) => (game.gameDate < min ? game.gameDate : min);
    } else {
      expression = (max, game) => (game.gameDate > max ? game.gameDate : max);
    }

    return new Date(
      games.reduce(
        (extremum, game) => expression(extremum, game),
        games[0].gameDate
      )
    );
  }

  export function isEasyGame(winChance: number) {
    if (winChance >= GREEN_WIN_LOWER_BOUNDARY) {
      return true;
    }

    return false;
  }

  export function getB2BGamesCount(teamGames: TeamGameInformation[]): number {
    let b2bCounter: number = 0;

    for (var i = 0, n = teamGames.length; i < n; ++i) {
      let date: Date = new Date(teamGames[i].gameDate);
      let tomorrowDate: Date = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1
      );

      for (var j = 0, m = teamGames.length; j < m; ++j) {
        if (i == j) {
          continue;
        }

        let dateJ: Date = new Date(teamGames[j].gameDate);
        if (
          tomorrowDate.getFullYear() == dateJ.getFullYear() &&
          tomorrowDate.getMonth() == dateJ.getMonth() &&
          tomorrowDate.getDate() == dateJ.getDate()
        ) {
          b2bCounter++;
        }
      }
    }

    return b2bCounter;
  }

  export function getTooltipWinChanceSectionClass(winChance: number) {
    if (winChance >= VERY_GREEN_WIN_LOWER_BOUNDARY) {
      return '#00AA30';
    }

    if (winChance >= GREEN_WIN_LOWER_BOUNDARY) {
      return '#64ff8f';
    }

    if (winChance >= WHITE_WIN_LOWER_BOUNDARY) {
      return 'white';
    }

    return '#ff7e7e';
  }

  export function getB2BEasyGamesCount(
    teamGames: TeamGameInformation[]
  ): number {
    let b2bCounter: number = 0;

    for (var i = 0, n = teamGames.length; i < n; ++i) {
      let date: Date = new Date(teamGames[i].gameDate);
      let tomorrowDate: Date = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1
      );

      for (var j = 0, m = teamGames.length; j < m; ++j) {
        if (i == j) {
          continue;
        }

        let dateJ: Date = new Date(teamGames[j].gameDate);

        if (
          tomorrowDate.getFullYear() != dateJ.getFullYear() ||
          tomorrowDate.getMonth() != dateJ.getMonth() ||
          tomorrowDate.getDate() != dateJ.getDate()
        ) {
          continue;
        }

        if (
          GamesUtils.isEasyGame(teamGames[i].winChance) &&
          GamesUtils.isEasyGame(teamGames[j].winChance)
        ) {
          b2bCounter++;
        }
      }
    }

    return b2bCounter;
  }

  export function GetPPText(ppNumber: number) {
    return ppNumber > 0
              ? `ПП${ppNumber}`
              : 'нет';
  }

  /**
   * Generates and returns cell value for simplified calendar view (only weeks).
   * Currently it's in "activeGamesForWeekCount/allGamesPriorToWeekCount" format
   * @param activeGamesForWeekCount Active (not played yet) games in current week count
   * @param allGamesPriorToWeekCount All games before current week inluding current week count
   * @returns Cell value for simplified calendar view
   */
  export function getSimplifiedCalendarViewCellText(activeGamesForWeekCount: number, allGamesPriorToWeekCount: number): string {
    return activeGamesForWeekCount.toString() + '/' + allGamesPriorToWeekCount.toString()
  }

  /**
   * Compares two dates and determines whether source date is older than target date
   * @param sourceDate Main date
   * @param targetDate Date to compare with
   * @returns True/False result
   */
  export function isOldDate(sourceDate: Date | undefined, targetDate: Date): boolean {
    return sourceDate?.getTime()! < targetDate.getTime();
  }
}
