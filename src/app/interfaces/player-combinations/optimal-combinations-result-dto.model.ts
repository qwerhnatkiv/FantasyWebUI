import { PlayerCombinationsStatsDto } from './player-combinations-stats-dto.model';

export interface OptimalCombinationsResultDto {
  total: number;
  cost: number;
  players: PlayerCombinationsStatsDto[];
}
