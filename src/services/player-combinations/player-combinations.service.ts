import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PlayerChooseRecord } from 'src/app/interfaces/player-choose-record';
import { OptimalCombinationsResultDto } from 'src/app/interfaces/player-combinations/optimal-combinations-result-dto.model';
import { PlayerCombinationsDto } from 'src/app/interfaces/player-combinations/player-combinations-dto.model';
import { PlayerSquadRecord } from 'src/app/interfaces/player-squad-record';
import { DEFAULT_POSITIONS } from 'src/constants';

@Injectable()
export class PlayerCombinationsService {
  public availablePlayers: PlayerChooseRecord[] = [];

  constructor(private http: HttpClient) {}

  //#region PUBLIC METHODS

  public getOptimalPlayersCombinations(
    availableBudget: number,
    squadPlayers: PlayerSquadRecord[],
  ): void {
    const playerCombinationsDto: PlayerCombinationsDto = {
      availableBudget: availableBudget,
      solutionsCount: 3,
      availablePlayers: this.availablePlayers.map((x) => {
        return {
          id: x.playerObject.playerID,
          name: x.playerName,
          team: x.team,
          price: x.price,
          position: x.position,
          expectedFantasyPoints: x.expectedFantasyPoints,
          toi: x.toi,
          hasProjections: x.projectedGamesCount > 0
        };
      }),
      missingPlayerCounts: Object.fromEntries(this.buildMissingPlayerCounts(squadPlayers))
    };

    this.http
      .post<OptimalCombinationsResultDto>(
        `https://qwerhnatkiv-backend.azurewebsites.net/player_combinations/find_optimal`,
        playerCombinationsDto
      )
      .subscribe({
        next: (result) => {
          console.log(result);
        },
        error: (err) => {
          console.error(err);
          return {
            total: 0,
            cost: 0,
            players: [],
          };
        }
      });
  }

  //#endregion PUBLIC METHODS

  //#region PRIVATE METHODS

  private buildMissingPlayerCounts(squadPlayers: PlayerSquadRecord[]): Map<string, number> {
    const missingPlayerCounts: Map<string, number> = new Map<string, number>();

    for (const position of DEFAULT_POSITIONS) {
      missingPlayerCounts.set(position, squadPlayers.filter(x => x.isRemoved && x.position === position).length);
    }

    return missingPlayerCounts;
  }

  //#endregion PRIVATE METHODS
}
