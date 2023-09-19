import { GamePredictionDTO } from "./game-prediction-dto";
import { TeamStatsDTO } from "./team-stats-dto";

export interface GamesDTO {
  gamePredictions: GamePredictionDTO[];
  teamsStats: TeamStatsDTO[];
}
