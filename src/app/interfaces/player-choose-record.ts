import { PlayerStatsDTO } from "./player-stats-dto";
import { TeamStatsDTO } from "./team-stats-dto";

export interface PlayerChooseRecord {
    firstChoice: boolean;
    secondChoice: boolean;
    playerName: string;
    team: string;
    position: string;
    price: number;
    gamesCount: number;
    easyGamesCount: number;
    winPercentage: number;
    powerPlayTime: string;
    powerPlayNumber: string;
    toi: number;
    shotsOnGoal: number;
    iXG: number;
    iCF: number;
    iHDCF: number;
    expectedFantasyPoints: string;
    fantasyPointsPerGame: string;
    priceByExpectedFantasyPoints: number;
    forecastSources: string;
    playerObject: PlayerStatsDTO;
    teamObject: TeamStatsDTO;
  }
  