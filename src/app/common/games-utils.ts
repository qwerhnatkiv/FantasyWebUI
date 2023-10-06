import { GREEN_WIN_LOWER_BOUNDARY } from 'src/constants';
import { GamePredictionDTO } from '../interfaces/game-prediction-dto';
import { TeamGameInformation } from '../interfaces/team-game-information';

export module GamesUtils {
  export function getExtremumDateForGames(
    games: GamePredictionDTO[],
    sortSequence: boolean
  ): Date {
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
}
