import { GamePredictionDTO } from '../interfaces/game-prediction-dto';

export class TableCell {
  public displayValue: string = '';
  public cellValue: any;
  public game: GamePredictionDTO | undefined;
  public weekGames: number | undefined;

  constructor(
    pDisplayValue: string,
    pCellValue: any,
    weekGames: number | undefined = undefined,
    pGame: GamePredictionDTO | undefined = undefined
  ) {
    this.displayValue = pDisplayValue;
    this.cellValue = pCellValue;
    this.game = pGame;
    this.weekGames = weekGames;
  }
}
