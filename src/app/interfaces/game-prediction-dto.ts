export interface GamePredictionDTO {
  homeTeamName: string;
  homeTeamAcronym: string;
  awayTeamName: string;
  awayTeamAcronym: string;
  gameDate: Date;
  homeTeamWinChance: number;
  awayTeamWinChance: number;
  drawChance: number;
  weekNumber: number;
  homeTeamId: number;
  awayTeamId: number;
  gameId: number;
  isFromBookmakers: boolean;
  isOldGame: boolean;
  homeTeamGoals: number | null;
  awayTeamGoals: number | null;
}
