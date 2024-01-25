export interface PlayerStatsDTO {
    playerID: number
    playerIdSports: number
    playerName: string
    playerNameEng: string;
    teamID: number
    position: string
    price: number
    expectedFPForGame: ExpectedFpforGame
    formGamesPlayed: number
    formGoals: number
    formAssists: number
    formPlusMinus: number
    formPIM: number
    formPowerPlayTime: number
    formPowerPlayTeamPosition: number
    formPowerPlayNumber: number
    formTOI: number
    formShotsOnGoal: number
    formIxG: number
    formICF: number
    formIHDCF: number
    forecastGamesPlayed?: number
    forecastGoals?: number
    forecastAssists?: number
    forecastPIM?: number
    forecastPlusMinus?: number
    forecastSources: string
  }
  
  export interface ExpectedFpforGame {}