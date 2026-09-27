import { PlayerCommonRecord } from "./player-common-record";

export interface PlayerChooseRecord extends PlayerCommonRecord{
    firstChoice: boolean;
    secondChoice: boolean;
    team: string;
    projectedGamesCount: number;
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
    expectedFantasyPointsOfo3: number;
    fantasyPointsPerGame: string;
    priceByExpectedFantasyPoints: number;
    priceByExpectedFantasyPointsPerGame: number;
    linemates: string;
    // 'Да' when the player has no contract for next season (UFA or RFA), '' otherwise.
    freeAgent: string;
    isPlayingInUpsideLine: boolean;
    forecastSources: string;
  }
  