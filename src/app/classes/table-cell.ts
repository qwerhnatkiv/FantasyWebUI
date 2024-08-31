import { GamePredictionDTO } from '../interfaces/game-prediction-dto';

export class TableCell {
  public displayValue: string = '';
  public cellValue: any;
  public game: GamePredictionDTO | undefined;
  public weekGames: number | undefined;
  public isWeekCell: boolean;
  public priorToWeekGamesCount: number | undefined;

  constructor(
    pDisplayValue: string,
    pCellValue: any,
    weekGames: number | undefined = undefined,
    pGame: GamePredictionDTO | undefined = undefined,
    isWeekCell: boolean = false,
    priorToWeekGamesCount: number | undefined = undefined
  ) {
    this.displayValue = pDisplayValue;
    this.cellValue = pCellValue;
    this.game = pGame;
    this.weekGames = weekGames;
    this.isWeekCell = isWeekCell;
    this.priorToWeekGamesCount = priorToWeekGamesCount;
  }
}
