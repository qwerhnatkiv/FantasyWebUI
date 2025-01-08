import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { PlayerChooseRecord } from 'src/app/interfaces/player-choose-record';
import { OptimalCombinationsResultDto } from 'src/app/interfaces/player-combinations/optimal-combinations-result-dto.model';
import { PlayerCombinationsDto } from 'src/app/interfaces/player-combinations/player-combinations-dto.model';
import { PlayerSquadRecord } from 'src/app/interfaces/player-squad-record';
import { DEFAULT_POSITIONS, PLAYER_COMBINATIONS_COUNT } from 'src/constants';

@Injectable()
export class PlayerCombinationsService {
  private _optimalPlayerCombinationsSubject: Subject<
    OptimalCombinationsResultDto[]
  > = new Subject<OptimalCombinationsResultDto[]>();

  public $optimalPlayerCombinationsObservable: Observable<
    OptimalCombinationsResultDto[]
  > = this._optimalPlayerCombinationsSubject.asObservable();

  public availablePlayers: PlayerChooseRecord[] = [];

  constructor(private http: HttpClient) {}

  //#region PUBLIC METHODS

  public getOptimalPlayersCombinations(
    availableBudget: number,
    squadPlayers: PlayerSquadRecord[]
  ): void {

    const availableSquadPlayers = squadPlayers.filter(x => x.isOptimal);
    const availablePlayers = this.availablePlayers.filter(
      (x) =>
        squadPlayers.findIndex(
          (y) => y.playerObject.playerID == x.playerObject.playerID
        ) === -1
        || 
        availableSquadPlayers.findIndex(
          (y) => y.playerObject.playerID == x.playerObject.playerID
        ) > -1
    );

    const playerCombinationsDto: PlayerCombinationsDto = {
      availableBudget: availableBudget,
      solutionsCount: PLAYER_COMBINATIONS_COUNT,
      availablePlayers: availablePlayers.map((x) => {
        return {
          id: x.playerObject.playerID,
          name: x.playerName,
          team: x.team,
          price: x.price,
          position: x.position,
          expectedFantasyPoints: x.expectedFantasyPoints,
          toi: x.toi,
          hasProjections: x.projectedGamesCount > 0,
        };
      }),
      missingPlayerCounts: Object.fromEntries(
        this.buildMissingPlayerCounts(squadPlayers)
      ),
    };

    this.http
      .post<OptimalCombinationsResultDto[]>(
        `https://qwerhnatkiv-backend.azurewebsites.net/player_combinations/find_optimal`,
        playerCombinationsDto
      )
      .subscribe({
        next: (result) => {
          this._optimalPlayerCombinationsSubject.next(result);
        },
        error: (err) => {
          console.error(err);
          return {
            total: 0,
            cost: 0,
            players: [],
          };
        },
      });
  }

  public createPlayerSquadRecord(
    player: PlayerChooseRecord,
    isOptimal: boolean
  ): PlayerSquadRecord {
    const playerSquadRecord: PlayerSquadRecord = {
      playerName: player.playerObject.playerName,
      position: player.playerObject.position,
      price: player.playerObject.price,
      gamesCount: player.gamesCount,
      expectedFantasyPoints: player.expectedFantasyPoints,
      isRemoved: false,
      isNew: true,
      isOptimal: isOptimal,
      playerObject: player.playerObject,
      teamObject: player.teamObject,
      powerPlayNumber: player.powerPlayNumber,
      sortOrder: 0,
    };

    return playerSquadRecord;
  }

  //#endregion PUBLIC METHODS

  //#region PRIVATE METHODS

  private buildMissingPlayerCounts(
    squadPlayers: PlayerSquadRecord[]
  ): Map<string, number> {
    const missingPlayerCounts: Map<string, number> = new Map<string, number>();

    for (const position of DEFAULT_POSITIONS) {
      missingPlayerCounts.set(
        position,
        squadPlayers.filter((x) => x.isRemoved && x.position === position)
          .length -
          squadPlayers.filter((x) => !x.isOptimal && x.isNew && x.position === position).length
      );
    }

    return missingPlayerCounts;
  }

  //#endregion PRIVATE METHODS
}
