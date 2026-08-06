export interface TeamGameStatDTO {
  teamId: number;
  gameDateTime: string;
  isAway: boolean;
  teamGoals: number;
  teamGoalsAway: number;
  teamShots: number;
  teamShotsAway: number;
  teamHdcf: number;
  teamHdcfAway: number;
  opponentAcronym: string;
  resultType: string;
}
