export interface GamePredictionDTO {
  homeTeamName: string;
  homeTeamAcronym: string;
  awayTeamName: string;
  awayTeamAcronym: string;
  gameDate: Date;
  // Moscow wall-clock start time without an offset ("2026-10-08T02:30:00"), null when unknown.
  gameStartTimeMsk: string | null;
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
