import { PlayerStatsDTO } from "./player-stats-dto";
import { TeamStatsDTO } from "./team-stats-dto";

export interface PlayerCommonRecord {
    playerName: string;
    position: string;
    price: number;
    startPrice: number;
    gamesCount: number;
    expectedFantasyPoints: number;
    playerObject: PlayerStatsDTO;
    powerPlayNumber: string;
    teamObject: TeamStatsDTO;
}