import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { GamePredictionDTO } from '../interfaces/game-prediction-dto';
import { GamesUtils } from '../common/games-utils';
import { Utils } from '../common/utils';
import { GamesDTO } from '../interfaces/games-dto';
import { TeamStatsDTO } from '../interfaces/team-stats-dto';
import { PlayerStatsDTO } from '../interfaces/player-stats-dto';
import { TeamGameInformation } from '../interfaces/team-game-information';
import { PlayerExpectedFantasyPointsDTO } from '../interfaces/player-expected-fantasy-points-dto';
import { PlayerExpectedFantasyPointsInfo } from '../interfaces/player-efp-info';
import { SportsSquadDTO } from '../interfaces/sports-squad-dto';
import { PlayerSquadRecord } from '../interfaces/player-squad-record';
import {
  DEFAULT_FORM_LENGTH,
  DEFAULT_POSITIONS,
  REMOVE_PLAYERS_WITH_NO_GAMES,
  USER_ID_NAME,
} from 'src/constants';
import { OfoVariant } from '../interfaces/ofo-variant';
import { PositionsAvailableToPick } from '../interfaces/positions-available-to-pick';
import { UpdateLogInformation } from '../interfaces/update-log-information';
import { DateFiltersService } from 'src/services/filtering/date-filters.service';
import { DatesRangeModel } from '../interfaces/dates-range.model';
import { PlayersObservableProxyService } from 'src/services/observable-proxy/players-observable-proxy.service';
import { Subscription } from 'rxjs';
import { TeamsEasySeriesService } from 'src/services/teams-easy-series/teams-easy-series.service';
import { ApiService } from 'src/services/api/api.service';

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html',
  styleUrl: './main-view.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainViewComponent implements OnInit, OnChanges, OnDestroy {
  title = 'Fantasy Web';
  private _updatePlayersEfpDataByDateRangeSubscription?: Subscription;
  private _filterDatesRangeSubscription?: Subscription;

  protected _filterDates?: DatesRangeModel;

  protected isCalendarHidden: boolean = false;
  protected updateLogInformation?: UpdateLogInformation;

  public games: GamePredictionDTO[] = [];
  public teamStats: TeamStatsDTO[] = [];

  public playerStats: PlayerStatsDTO[] = [];
  public squadPlayers: PlayerSquadRecord[] = [];
  public balanceValue: number = 0;
  public substitutionsLeft: number = 0;
  public squadAvailableSlots: PositionsAvailableToPick | undefined;

  set addedToSquadPlayer(value: PlayerSquadRecord) {
    if (this.squadPlayers.length <= 0) {
      return;
    }
    const matchedPlayer: PlayerSquadRecord | undefined = this.squadPlayers.find(
      (x) => x.playerObject.playerID == value.playerObject.playerID
    );
    if (matchedPlayer != null) {
      matchedPlayer.isRemoved = false;
    } else {
      this.squadPlayers.push(value);
    }

    this.squadPlayers = Object.assign([], this.squadPlayers);
  }

  public lowerBoundPrice: number | undefined = undefined;
  public upperBoundPrice: number | undefined = undefined;
  public positions: string[] | undefined = [];
  public teams: string[] | undefined = [];
  public powerPlayUnits: string[] | undefined = [];
  public selectedPlayerIds: number[] = [];
  public playersAreNotPlayedDisabled: boolean = REMOVE_PLAYERS_WITH_NO_GAMES;
  public hideLowGPPlayersEnabled: boolean = false;

  public teamPlayerExpectedOfoMap: Map<
    number,
    Map<Date, PlayerExpectedFantasyPointsInfo[]>
  > = new Map<number, Map<Date, PlayerExpectedFantasyPointsInfo[]>>();

  protected formLength: number = DEFAULT_FORM_LENGTH;

  public _selectedUser: string | undefined = undefined;
  set selectedUser(value: string | undefined) {
    this._selectedUser = value;
    this.squadPlayers = [];
    this.fetchUserSquad();
  }

  public firstChoiceOfo: OfoVariant = {
    priceByExpectedFantasyPointsSum: 0,
    priceSum: 0,
    expectedFantasyPointsSum: 0,
    playersCount: 0,
  };

  public secondChoiceOfo: OfoVariant = {
    priceByExpectedFantasyPointsSum: 0,
    priceSum: 0,
    expectedFantasyPointsSum: 0,
    playersCount: 0,
  };

  public playerGamesOfoMap:
    | Map<number, PlayerExpectedFantasyPointsDTO[]>
    | undefined;

  public filteredTeamGames: Map<number, TeamGameInformation[]> = new Map<
    number,
    TeamGameInformation[]
  >();

  // O(1) lookup indexes built once whenever games/playerStats/teamStats are
  // (re)loaded (see getCalendarData), so per-player/per-game lookups on the
  // "date changed" hot path don't have to re-scan the full arrays every time.
  private playerStatsById: Map<number, PlayerStatsDTO> = new Map();
  private playerStatsBySportsId: Map<number, PlayerStatsDTO> = new Map();
  private teamStatsById: Map<number, TeamStatsDTO> = new Map();
  private gamesById: Map<number, GamePredictionDTO> = new Map();

  // Cached response from the last successful squad fetch, so a date change
  // can recompute squad OFO totals locally instead of re-fetching the squad
  // (see docs/perf-notes.md).
  private _sportsSquadResult?: SportsSquadDTO;

  constructor(
    private ngxLoader: NgxUiLoaderService,
    private _dateFiltersService: DateFiltersService,
    private _playersObservableProxyService: PlayersObservableProxyService,
    private _teamsEasySeriesService: TeamsEasySeriesService,
    private _apiService: ApiService
  ) {
    this._teamsEasySeriesService.getTeamsEasySeries();
    this.getCalendarData(true);
  }

  ngOnInit(): void {
    this._filterDatesRangeSubscription =
      this._dateFiltersService.$dateFiltersObservable.subscribe(
        (value: DatesRangeModel) => {
          this._filterDates = value;
        }
      );
    this._updatePlayersEfpDataByDateRangeSubscription =
      this._playersObservableProxyService.$updatePlayersEfpDataByDateRangeObservable.subscribe(
        () => {
          this.updateFilteredTeamsGamesMap();
          this.setOfoDataForPlayers();
        }
      );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedUser']?.currentValue) {
      this.fetchUserSquad();
    }
  }

  ngOnDestroy(): void {
    this._updatePlayersEfpDataByDateRangeSubscription?.unsubscribe();
    this._filterDatesRangeSubscription?.unsubscribe();
  }

  public formLengthChanged(event: any) {
    this.formLength = event;
    this.getCalendarData(false);
    this._playersObservableProxyService.triggerUpdatePlayersEfpDataByDateRangeEvent();
  }

  private getCalendarData(setDefaultDates: boolean) {
    this.ngxLoader.start();
    this._apiService.getGames(this.formLength).subscribe({
      next: (result) => {
        this.games = result.gamePredictions.sort(
          (n1, n2) => n1.weekNumber - n2.weekNumber
        );
        //this.games = this.games.filter((x) => x.weekNumber < 4);
        this.teamStats = result.teamsStats;
        this.playerStats = result.playerStats;
        this.updateLogInformation = result.updateLogInformation;

        this.playerStatsById = new Map(
          this.playerStats.map((x) => [x.playerID, x])
        );
        this.playerStatsBySportsId = new Map(
          this.playerStats.map((x) => [x.playerIdSports, x])
        );
        this.teamStatsById = new Map(this.teamStats.map((x) => [x.teamID, x]));
        this.gamesById = new Map(this.games.map((x) => [x.gameId, x]));

        this.setUpFilters(setDefaultDates);
      },
      error: (err) => {
        console.error(err);
      },
      complete: () => this.ngxLoader.stop(),
    });
  }

  private setUpFilters(setDefaultDates: boolean) {
    const upcomingWeeks: number[] = this.games
      ?.filter((x) => !x.isOldGame)
      .map((x) => x.weekNumber)
      .filter(Utils.onlyUnique)
      .sort((n1, n2) => n1 - n2);

    if (setDefaultDates) {
      this._dateFiltersService.setFiltersDefaultDates(
        upcomingWeeks,
        this.games.filter((x) => !x.isOldGame)
      );
    }
  }

  private updateFilteredTeamsGamesMap() {
    const newMap: Map<number, TeamGameInformation[]> = new Map<
      number,
      TeamGameInformation[]
    >();

    // Hoisted out of the per-team loop below: previously every team re-parsed
    // every game's date (O(teams x games) Date construction) to check the
    // range. Parsing each game's date once up front makes this O(games) +
    // O(teams x games) cheap comparisons instead (see docs/perf-notes.md).
    const minDateMs: number = this._filterDates?.minDate?.getTime()!;
    const maxDateMs: number = this._filterDates?.maxDate?.getTime()!;
    const gamesInDateRange: GamePredictionDTO[] = this.games.filter((x) => {
      const gameDateMs = new Date(x.gameDate).getTime();
      return gameDateMs >= minDateMs && gameDateMs <= maxDateMs;
    });

    for (var i = 0, n = this.teamStats?.length!; i < n; ++i) {
      const teamStats: TeamStatsDTO = this.teamStats![i];

      const gamesByDateRange: GamePredictionDTO[] = gamesInDateRange.filter(
        (x) => x.awayTeamId == teamStats.teamID || x.homeTeamId == teamStats.teamID
      );

      let teamGameInformation: TeamGameInformation[] = [];

      for (var j = 0, k = gamesByDateRange.length!; j < k; ++j) {
        let game: GamePredictionDTO = gamesByDateRange[j];

        if (game.homeTeamId == teamStats.teamID) {
          teamGameInformation.push({
            teamID: game.homeTeamId,
            teamName: game.homeTeamName,
            opponentTeamID: game.awayTeamId,
            winChance: game.homeTeamWinChance,
            isHome: true,
            gameDate: game.gameDate,
            gameID: game.gameId,
          });
        } else {
          teamGameInformation.push({
            teamID: game.awayTeamId,
            teamName: game.awayTeamName,
            opponentTeamID: game.homeTeamId,
            winChance: game.awayTeamWinChance,
            isHome: false,
            gameDate: game.gameDate,
            gameID: game.gameId,
          });
        }
      }

      newMap.set(teamStats.teamID, teamGameInformation);
    }

    this.filteredTeamGames = newMap;
  }

  private setOfoDataForPlayers() {
    this.ngxLoader.start();
    const minDate: string = this._filterDates?.minDate
      ?.toISOString()
      .replace(':', '%3A')
      .split('.')[0]!;

    const maxDate: string = Utils.addDateDays(this._filterDates?.maxDate!, 1)
      .toISOString()
      .replace(':', '%3A')
      .split('.')[0]!;

    const gamesIdsForDates: number[] = this.games
      .map((x) => {
        return {
          gameDate: new Date(x.gameDate).toISOString(),
          id: x.gameId,
        };
      })
      .filter((x) => x.gameDate >= minDate && x.gameDate <= maxDate)
      .map((x) => x.id);
    const playersIds: number[] = this.playerStats.map((x) => x.playerID);

    this._apiService
      .getPlayersEFP(minDate, maxDate, this.formLength, {
        gameIds: gamesIdsForDates,
        playerIds: playersIds,
      })
      .subscribe({
        next: (result) => {
          let localOfoMap: Map<number, PlayerExpectedFantasyPointsDTO[]> =
            new Map<number, PlayerExpectedFantasyPointsDTO[]>();

          let keys: string[] = Object.keys(result);
          let key: number;

          this.teamPlayerExpectedOfoMap = new Map<
            number,
            Map<Date, PlayerExpectedFantasyPointsInfo[]>
          >();

          for (var i = 0, n = keys.length; i < n; ++i) {
            key = +keys[i];
            localOfoMap.set(key, result[key]);

            this.setTop3PlayersForEachTeam(key, result[key]);
          }

          for (let [_, gameOfoMap] of this.teamPlayerExpectedOfoMap) {
            for (let [dateKey, value] of gameOfoMap) {
              value = value.sort(
                (n1, n2) =>
                  n2.playerExpectedFantasyPoints -
                  n1.playerExpectedFantasyPoints
              );
              gameOfoMap.set(dateKey, value.splice(0, 3));
            }
          }

          this.playerGamesOfoMap = localOfoMap;

          // The squad membership itself doesn't depend on the selected date
          // range, only each player's OFO total does - so once we already
          // have a squad, recompute it locally instead of re-fetching it
          // from the server (a sports.ru-backed call) on every date change.
          if (this._sportsSquadResult) {
            this.buildSquadPlayers(this._sportsSquadResult);
          } else {
            this.fetchUserSquad();
          }
        },
        error: (err) => {
          console.error(err);
        },
        complete: () => this.ngxLoader.stop(),
      });
  }

  // Fetches the squad from the server (sports.ru-backed). Only needed when the
  // selected user changes - date changes reuse the cached result via
  // buildSquadPlayers() instead of calling this again (see docs/perf-notes.md).
  private fetchUserSquad() {
    if (this._selectedUser == null || this._selectedUser == '') {
      this.squadPlayers = [];
      this.balanceValue = 0;
      this._sportsSquadResult = undefined;
      return;
    }

    this.ngxLoader.start();
    this._apiService.getSportsSquad(this._selectedUser).subscribe({
      next: (result) => {
        this._sportsSquadResult = result;
        this.buildSquadPlayers(result);
      },
      error: (err) => {
        console.error(err);
      },
      complete: () => this.ngxLoader.stop(),
    });
  }

  // Pure/local: builds squadPlayers from an already-fetched squad result plus
  // whatever is currently known (playerStats/teamStats/playerGamesOfoMap).
  // Safe to call again whenever playerGamesOfoMap changes (i.e. on every date
  // change) without hitting the network.
  private buildSquadPlayers(result: SportsSquadDTO) {
    let removedIds: Array<number> = this.squadPlayers
      .filter((x) => x.isRemoved)
      .map((x) => x.playerObject.playerID);
    let addedIds: Array<number> = this.squadPlayers
      .filter((x) => x.isNew)
      .map((x) => x.playerObject.playerID);

    this.balanceValue = result.balance;
    this.substitutionsLeft = result.substitutions;

    const newSquadPlayers: PlayerSquadRecord[] = [];

    for (var i = 0, n = result.players.length; i < n; ++i) {
      let matchingPlayerInfo: PlayerStatsDTO = this.playerStatsBySportsId.get(
        result.players[i].id
      )!;
      newSquadPlayers.push(
        this.createSquadRecord(matchingPlayerInfo, removedIds, addedIds)
      );
    }

    for (var i = 0, n = addedIds.length; i < n; ++i) {
      let matchingPlayerInfo: PlayerStatsDTO = this.playerStatsById.get(
        addedIds[i]
      )!;
      newSquadPlayers.push(
        this.createSquadRecord(matchingPlayerInfo, removedIds, addedIds)
      );
    }

    newSquadPlayers.sort(
      (a, b) =>
        DEFAULT_POSITIONS.indexOf(a.position) -
          DEFAULT_POSITIONS.indexOf(b.position) || b.price - a.price
    );

    this.squadPlayers = newSquadPlayers;
  }

  private createSquadRecord(
    matchingPlayerInfo: PlayerStatsDTO,
    removedIds: number[],
    addedIds: number[]
  ): PlayerSquadRecord {
    let matchingTeam: TeamStatsDTO = this.teamStatsById.get(
      matchingPlayerInfo.teamID
    )!;

    let ofo: number = this.playerGamesOfoMap
      ?.get(matchingPlayerInfo.playerID)
      ?.reduce(
        (partialSum, x) => partialSum + x.playerExpectedFantasyPoints,
        0.0
      )!;

    return {
      playerName: matchingPlayerInfo.playerName,
      position: matchingPlayerInfo.position,
      price: matchingPlayerInfo.price,
      startPrice: matchingPlayerInfo.startPrice,
      gamesCount: this.filteredTeamGames.get(matchingPlayerInfo.teamID)
        ?.length!,
      expectedFantasyPoints: ofo ?? 0,
      isRemoved: removedIds.includes(matchingPlayerInfo.playerID),
      isNew: addedIds.includes(matchingPlayerInfo.playerID),
      isOptimal: false,
      playerObject: matchingPlayerInfo,
      teamObject: matchingTeam,
      powerPlayNumber: GamesUtils.GetPPText(
        matchingPlayerInfo.formPowerPlayNumber
      ),
      sortOrder: matchingPlayerInfo.price,
      tooltipLines: [],
    };
  }

  private setTop3PlayersForEachTeam(
    playerId: number,
    playersOfoDataArray: PlayerExpectedFantasyPointsDTO[]
  ) {
    if (playersOfoDataArray.length == 0) {
      return;
    }

    let teamID: number = playersOfoDataArray[0].teamID;

    if (!this.teamPlayerExpectedOfoMap.has(teamID)) {
      this.teamPlayerExpectedOfoMap.set(
        teamID,
        new Map<Date, PlayerExpectedFantasyPointsInfo[]>()
      );
    }

    let playerStat: PlayerStatsDTO = this.playerStatsById.get(playerId)!;

    if (playerStat == null) {
      return;
    }

    playersOfoDataArray.forEach((x) => {
      let playerOfoSum = x.playerExpectedFantasyPoints;
      let game: GamePredictionDTO = this.gamesById.get(x.gameID)!;

      let gameOfoMap: Map<Date, PlayerExpectedFantasyPointsInfo[]> =
        this.teamPlayerExpectedOfoMap.get(teamID)!;
      if (!gameOfoMap.has(game.gameDate)) {
        gameOfoMap.set(game.gameDate, []);
      }

      let powerPlayInfo: string =
        playerStat.formPowerPlayNumber > 0
          ? `ПП${playerStat.formPowerPlayNumber}`
          : 'нет';

      let modelInfo: PlayerExpectedFantasyPointsInfo = {
        playerName: playerStat.playerName,
        playerExpectedFantasyPoints: playerOfoSum,
        price: playerStat.price,
        powerPlayNumber: powerPlayInfo,
        isFire: false,
      };

      gameOfoMap.get(game.gameDate)?.push(modelInfo);
    });
  }

  protected updateCalendarVisibility(isCalendarHidden: boolean) {
    this.isCalendarHidden = isCalendarHidden;
  }
}
