export interface TeamGameInformation {
  teamID: number;
  teamName: string;
  opponentTeamID: number;
  winChance: number;
  isHome: boolean;
  gameDate: Date;
  gameID: number;
}
