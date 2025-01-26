import { PlayerSquadRecord } from "../player-squad-record";
import { PlayerCombinationsStatsDto } from "./player-combinations-stats-dto.model";

export interface PlayerCombinationsDto {
  availableBudget: number;
  solutionsCount: number;
  availablePlayers: PlayerCombinationsStatsDto[];
  squadPlayers: PlayerSquadRecord[];
  defaultPositions: string[];
}
