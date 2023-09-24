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
}
