import { PlayerCommonRecord } from "./player-common-record";
import { PlayerStatsDTO } from "./player-stats-dto";
import { TeamStatsDTO } from "./team-stats-dto";

export interface PlayerChooseRecord extends PlayerCommonRecord{
    firstChoice: boolean;
    secondChoice: boolean;
    team: string;
    gamesCount: number;
    b2bGamesCount: number;
    easyGamesCount: number;
    b2bEasyGamesCount: number;
    winPercentage: number;
    powerPlayTime: string;
    toi: number;
    shotsOnGoal: number;
    iXG: number;
    iCF: number;
    iHDCF: number;
    expectedFantasyPoints: number;
    fantasyPointsPerGame: string;
    priceByExpectedFantasyPoints: number;
    priceByExpectedFantasyPointsPerGame: number;
    forecastSources: string;
  }
  