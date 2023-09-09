import { GamePredictionDTO } from '../interfaces/game-prediction-dto';

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
}
