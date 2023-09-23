import { GamePredictionDTO } from "./game-prediction-dto";
import { PlayerStatsDTO } from "./player-stats-dto";
import { TeamStatsDTO } from "./team-stats-dto";

export interface GamesDTO {
  gamePredictions: GamePredictionDTO[];
  teamsStats: TeamStatsDTO[];
  playerStats: PlayerStatsDTO[];
}
