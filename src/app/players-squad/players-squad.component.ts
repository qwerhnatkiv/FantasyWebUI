import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { PlayerSquadRecord } from '../interfaces/player-squad-record';
import {
  DEADLINE_DELAY_MINS,
  DEFAULT_POSITIONS,
  DEFAULT_SUBSTITUTION_VALUE,
  MODEL_CHOICE_LABEL,
  SQUAD_PLAYERS_COUNT,
  TEAMS,
} from 'src/constants';
import { PositionsAvailableToPick } from '../interfaces/positions-available-to-pick';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { TeamGameInformation } from '../interfaces/team-game-information';
import { PlayerTooltipBuilder } from '../common/player-tooltip-builder';
import { TeamStatsDTO } from '../interfaces/team-stats-dto';
import { PlayerExpectedFantasyPointsDTO } from '../interfaces/player-expected-fantasy-points-dto';
import { PlayersObservableProxyService } from 'src/services/observable-proxy/players-observable-proxy.service';
import { GamesUtils } from '../common/games-utils';
import { Utils } from '../common/utils';
import { PlayerCombinationsService } from 'src/services/player-combinations/player-combinations.service';
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { OptimalCombinationsResultDto } from '../interfaces/player-combinations/optimal-combinations-result-dto.model';
import { PlayerChooseRecord } from '../interfaces/player-choose-record';
import { GamePredictionDTO } from '../interfaces/game-prediction-dto';
import { PlayerCombinationsStatsDto } from '../interfaces/player-combinations/player-combinations-stats-dto.model';
import { PlayerCommonRecord } from '../interfaces/player-common-record';

const FULL_COMBINATION_MAX_PLAYERS: number = 5;

// gameStartTimeMsk is Moscow wall-clock time without an offset
const MSK_UTC_OFFSET: string = '+03:00';

/** Player in an optimizer alternative: name with the team code, plus the same tooltip as in the tables. */
interface CombinationPlayerView {
  name: string;
  team: string;
  tooltip: string | null;
}

/**
 * One optimizer alternative. A short one lists its players in `playersIn`; a long one (e.g. all 17
 * after the squad reset) lists only the difference with the best one: who comes in, who goes out, ОФО delta.
 */
interface CombinationView {
  playersIn: CombinationPlayerView[];
  playersOut: CombinationPlayerView[];
  difference: string | null;
}

@Component({
  selector: 'app-players-squad',
  templateUrl: './players-squad.component.html',
  styleUrls: ['./players-squad.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayersSquadComponent implements OnInit {
  displayedColumns: string[] = [
    'action',
    'position',
    'playerName',
    'price',
    'gamesCount',
    'expectedFantasyPoints',
    'expectedFantasyPointsDifference',
  ];

  private playerCombinationsSubscription?: Subscription;

  protected UTILS = Utils;
  protected MODEL_CHOICE_LABEL = MODEL_CHOICE_LABEL;
  protected playerCombinations: CombinationView[] = [];

  // Teams whose players the lightbulb never picks (see getOptimalPlayersCombinations)
  protected selectTeams: string[] = TEAMS;
  protected excludedTeamsControl = new FormControl<string[]>([]);

  @ViewChild(MatTable)
  table!: MatTable<PlayerSquadRecord>;
  private _squadPlayers: PlayerSquadRecord[] = [];
  get squadPlayers(): PlayerSquadRecord[] {
    return this._squadPlayers;
  }
  @Input('squadPlayers') set squadPlayers(value: PlayerSquadRecord[]) {
    this._squadPlayers = value;

    this.setSquadPlayersSortOrder();

    this.dataSource = new MatTableDataSource(this.squadPlayers);

    this.sendAvailableSlots.emit(this.getAvailableSlots());
    this.substitutionsLeft =
      value.length == this.substitutionsLeft
        ? this.substitutionsValue
        : this.substitutionsValue -
          this._squadPlayers.filter((x) => x.isNew).length;
  }

  @Output('squadPlayersChange') squadPlayersChange: EventEmitter<
    PlayerSquadRecord[]
  > = new EventEmitter<PlayerSquadRecord[]>();

  public dataSource = new MatTableDataSource(this.squadPlayers);

  @Input() balanceValue: number = 0;

  // Epoch ms of the season's first deadline; null while the games are not loaded yet.
  private _firstDeadlineMs: number | null = null;
  @Input() set games(value: GamePredictionDTO[]) {
    this._firstDeadlineMs = this._getFirstDeadlineMs(value);
  }

  @Input() filteredTeamGames: Map<number, TeamGameInformation[]> = new Map<
    number,
    TeamGameInformation[]
  >();
  @Input() teamStats: TeamStatsDTO[] = [];
  @Input() playerGamesOfoMap:
    | Map<number, PlayerExpectedFantasyPointsDTO[]>
    | undefined;

  public substitutionsLeft: number = DEFAULT_SUBSTITUTION_VALUE;
  private substitutionsValue: number = 0;
  @Input() set substitutions(value: number) {
    this.substitutionsLeft =
      this._squadPlayers.length == value
        ? value
        : value + 17 - this._squadPlayers.length;
    this.substitutionsValue = value;
  }

  @Output() sendAvailableSlots: EventEmitter<PositionsAvailableToPick> =
    new EventEmitter<PositionsAvailableToPick>();

  constructor(
    private _playersObservableProxyService: PlayersObservableProxyService,
    private _playerCombinationsService: PlayerCombinationsService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.playerCombinationsSubscription =
      this._playerCombinationsService.$optimalPlayerCombinationsObservable?.subscribe(
        (combinations: OptimalCombinationsResultDto[]) => {
          this._addOptimalPlayerCombinations(combinations)
        }
      );
  }

  public getTotalOFO(): string {
    if (this.squadPlayers == null) {
      return '0';
    }

    const ofoValue: number = this.squadPlayers
      .filter((item) => !item.isRemoved)
      .map((t) => t.expectedFantasyPoints)
      .reduce((acc, value) => acc + (value == null ? 0 : value), 0);

    return Utils.formatNumber(ofoValue);
  }

  public getTotalBalance(includeOptimal: boolean = true): number {
    if (this.squadPlayers == null) {
      return 0;
    }

    const bougthPlayersPrice = this.squadPlayers
    .filter((item) => item.price && item.isNew && (includeOptimal || !item.isOptimal))
    .reduce((sum, current) => sum + current.price, 0);

    const removedPlayersPrice: number = this.squadPlayers
      .filter((item) => item.price && item.isRemoved)
      .reduce((sum, current) => sum + current.price, 0);

    return this.balanceValue - bougthPlayersPrice + removedPlayersPrice;
  }

  public getTotalGames(): number {
    if (this.squadPlayers == null) {
      return 0;
    }

    return this.squadPlayers
      .filter((item) => item.gamesCount && !item.isRemoved)
      .reduce((sum, current) => sum + current.gamesCount, 0);
  }

  /**
   * Returns total sum of the expected fantasy points difference for each new player
   * @returns EFP sum
   */
  protected getTotalExpectedFantasyPointsDifference(): number {
    if (this.squadPlayers == null) {
      return 0;
    }

    return this.squadPlayers
      .filter((item) => item.isNew)
      .map((t) => t.expectedFantasyPointsDifference!)
      .reduce((acc, value) => acc + (value == null ? 0 : value), 0);
  }

  protected getOptimalPlayersCombinations(): void {
    // Каждый запуск решает с нуля: прошлая подсказка оптимизатора не должна занимать слоты и бюджет.
    this._revertOptimalPlayers();

    this._playerCombinationsService.getOptimalPlayersCombinations(
      this.getTotalBalance(false),
      this.squadPlayers,
      this.excludedTeamsControl.value ?? []
    );
  }

  public sendSelectedPlayer(row: PlayerSquadRecord): void {
    this._playersObservableProxyService.triggerShowPlayerInCalendarSubject(
      row.playerObject.playerID
    );
  }

  public removeRestoreRow(row: PlayerSquadRecord): void {
    if (row.isNew) {
      const index = this.squadPlayers.indexOf(row, 0);
      if (index > -1) {
        this.squadPlayers.splice(index, 1);
      }

      this.dataSource = new MatTableDataSource(this.squadPlayers);
      this.substitutionsLeft++;
      this.setSquadPlayersSortOrder();
      this.sendAvailableSlots.emit(this.getAvailableSlots());
      return;
    }

    const availableSlots: PositionsAvailableToPick = this.getAvailableSlots();
    if (
      row.isRemoved &&
      ((availableSlots.defendersAvailable == 0 && row.position == 'З') ||
        (availableSlots.forwardsAvailable == 0 && row.position == 'Н') ||
        (availableSlots.goaliesAvailable == 0 && row.position == 'В'))
    ) {
      this.setSquadPlayersSortOrder();
      return;
    }

    row.isRemoved = !row.isRemoved;
    this.setSquadPlayersSortOrder();

    this.sendAvailableSlots.emit(this.getAvailableSlots());
    this.squadPlayersChange.emit(this.squadPlayers);
  }

  public clearAllSquadChanges() {
    this.squadPlayers = this.squadPlayers.filter((x) => !x.isNew);
    this.squadPlayers
      .filter((x) => x.isRemoved)
      .forEach((x) => (x.isRemoved = false));

    this.playerCombinations = [];

    this.sendAvailableSlots.emit(this.getAvailableSlots());
  }

  /**
   * Убирает из состава всех: добавленные удаляются, текущие помечаются удалёнными.
   * После этого лампочка подбирает все 17 мест с нуля на весь бюджет.
   */
  public resetWholeSquad() {
    this.squadPlayers = this.squadPlayers.filter((x) => !x.isNew);
    this.squadPlayers.forEach((x) => {
      x.isRemoved = true;
      x.isOptimal = false;
    });

    this.playerCombinations = [];

    this.setSquadPlayersSortOrder();
    this.sendAvailableSlots.emit(this.getAvailableSlots());
    this.squadPlayersChange.emit(this.squadPlayers);
  }

  public generateCellToolTip(player: PlayerSquadRecord): string | null {
    return PlayerTooltipBuilder.generatePlayerTooltip(
      player,
      this.filteredTeamGames,
      this.teamStats,
      this.playerGamesOfoMap
    );
  }

  // Lets Angular Material diff rows by player identity instead of rebuilding
  // every row's DOM whenever `dataSource` is reassigned (see docs/perf-notes.md).
  public trackByPlayerId(index: number, item: PlayerSquadRecord): number {
    return item.playerObject.playerID;
  }

  protected clearExcludedTeams(): void {
    this.excludedTeamsControl.setValue([]);
  }

  public isClearAllSquadChangesButtonHidden() {
    return this.squadPlayers.filter((x) => x.isNew || x.isRemoved)?.length == 0;
  }

  /**
   * Whole-squad reset makes sense only before the season starts, so the button lives until the first deadline.
   */
  public isResetSquadAvailable(): boolean {
    return this._firstDeadlineMs !== null && Date.now() < this._firstDeadlineMs;
  }

  /**
   * First deadline of the season: DEADLINE_DELAY_MINS before the earliest game start.
   * Start time is known only for upcoming games (see GamePredictionsService.AttachGameStartTimes),
   * so a game without it (already played, or not matched in the schedule) counts from the beginning of its day.
   */
  private _getFirstDeadlineMs(games: GamePredictionDTO[] | null | undefined): number | null {
    if (!games?.length) {
      return null;
    }

    let firstStartMs: number = Infinity;
    for (const game of games) {
      const startMs: number = game.gameStartTimeMsk
        ? new Date(game.gameStartTimeMsk + MSK_UTC_OFFSET).getTime()
        : new Date(game.gameDate).getTime();
      if (!isNaN(startMs) && startMs < firstStartMs) {
        firstStartMs = startMs;
      }
    }

    return isFinite(firstStartMs)
      ? firstStartMs - DEADLINE_DELAY_MINS * 60 * 1000
      : null;
  }

  private getAvailableSlots(): PositionsAvailableToPick {
    if (this.squadPlayers == null || this.squadPlayers.length == 0) {
      return {
        goaliesAvailable: 0,
        defendersAvailable: 0,
        forwardsAvailable: 0,
        selectedPlayerIds: [],
      };
    }

    const notRemovedPlayers: PlayerSquadRecord[] = this.squadPlayers.filter(
      (item) => !item.isRemoved
    );
    const goaliesAvailable: number =
      2 -
      notRemovedPlayers.filter((item) => item.position == DEFAULT_POSITIONS[0])
        .length;
    const defendersAvailable: number =
      6 -
      notRemovedPlayers.filter((item) => item.position == DEFAULT_POSITIONS[1])
        .length;
    const forwardsAvailable: number =
      9 -
      notRemovedPlayers.filter((item) => item.position == DEFAULT_POSITIONS[2])
        .length;
    const selectedPlayersIds: Array<number> = notRemovedPlayers.map(
      (item) => item.playerObject.playerID
    );

    return {
      goaliesAvailable: goaliesAvailable,
      defendersAvailable: defendersAvailable,
      forwardsAvailable: forwardsAvailable,
      selectedPlayerIds: selectedPlayersIds,
    };
  }

  private setSquadPlayersSortOrder() {
    this.squadPlayers.forEach((existingPlayer, index) => {
      existingPlayer.sortOrder = index * SQUAD_PLAYERS_COUNT;
    });

    const matchingPlayersMap: Map<
      PlayerSquadRecord,
      Map<PlayerSquadRecord, number>
    > = new Map<PlayerSquadRecord, Map<PlayerSquadRecord, number>>();

    this.squadPlayers.forEach((addedPlayer) => {
      if (!addedPlayer.isNew) {
        return;
      }
      matchingPlayersMap.set(addedPlayer, new Map<PlayerSquadRecord, number>());
      this.squadPlayers.forEach((existingPlayer) => {
        if (!existingPlayer.isRemoved) {
          return;
        }
        matchingPlayersMap
          .get(addedPlayer)
          ?.set(
            existingPlayer,
            Math.abs(addedPlayer.price - existingPlayer.price)
          );
      });
    });

    // Initialize variables for finding the optimal pairing
    let addedPlayers = Array.from(matchingPlayersMap.keys());
    let removedPlayers = Array.from(
      new Set(
        addedPlayers.flatMap((addedPlayer) =>
          Array.from(matchingPlayersMap.get(addedPlayer)?.keys() || [])
        )
      )
    );

    const addedGoalies = addedPlayers.filter(
      (item) => item.position == DEFAULT_POSITIONS[0]
    );
    const addedDefenders = addedPlayers.filter(
      (item) => item.position == DEFAULT_POSITIONS[1]
    );
    const addedForwards = addedPlayers.filter(
      (item) => item.position == DEFAULT_POSITIONS[2]
    );

    const removedGoalies = removedPlayers.filter(
      (item) => item.position == DEFAULT_POSITIONS[0]
    );
    const removedDefenders = removedPlayers.filter(
      (item) => item.position == DEFAULT_POSITIONS[1]
    );
    const removedForwards = removedPlayers.filter(
      (item) => item.position == DEFAULT_POSITIONS[2]
    );

    if (addedGoalies.length === removedGoalies.length) {
      this.sortEqualPlayers(addedGoalies, removedGoalies);
      addedPlayers = addedPlayers.filter(
        (x) => x.position !== DEFAULT_POSITIONS[0]
      );
      removedPlayers = removedPlayers.filter(
        (x) => x.position !== DEFAULT_POSITIONS[0]
      );
    }

    if (addedDefenders.length === removedDefenders.length) {
      this.sortEqualPlayers(addedDefenders, removedDefenders);
      addedPlayers = addedPlayers.filter(
        (x) => x.position !== DEFAULT_POSITIONS[1]
      );
      removedPlayers = removedPlayers.filter(
        (x) => x.position !== DEFAULT_POSITIONS[1]
      );
    }

    if (addedForwards.length === removedForwards.length) {
      this.sortEqualPlayers(addedForwards, removedForwards);
      addedPlayers = addedPlayers.filter(
        (x) => x.position !== DEFAULT_POSITIONS[2]
      );
      removedPlayers = removedPlayers.filter(
        (x) => x.position !== DEFAULT_POSITIONS[2]
      );
    }

    // Start backtracking to find the best pairing
    const bestPairing = {
      pairing: [] as {
        addedPlayer: PlayerSquadRecord;
        removedPlayer: PlayerSquadRecord;
      }[],
      totalDifference: Infinity,
    };
    GamesUtils.generatePairings(
      addedPlayers,
      removedPlayers,
      0,
      matchingPlayersMap,
      [],
      bestPairing
    );

    // Set the sortOrder for each added player based on the best pairing
    bestPairing.pairing.forEach(({ addedPlayer, removedPlayer }) => {
      addedPlayer.sortOrder = removedPlayer.sortOrder + 1;
      addedPlayer.expectedFantasyPointsDifference =
        addedPlayer.expectedFantasyPoints - removedPlayer.expectedFantasyPoints;
    });

    this.squadPlayers.sort((a, b) => GamesUtils.sortSquadPlayers(a, b));
    this.dataSource = new MatTableDataSource(this.squadPlayers);
  }

  private sortEqualPlayers(
    addedPlayers: PlayerSquadRecord[],
    removedPlayers: PlayerSquadRecord[]
  ) {
    addedPlayers.sort((a, b) => GamesUtils.sortSquadPlayersByPrice(a, b));
    removedPlayers.sort((a, b) => GamesUtils.sortSquadPlayersByPrice(a, b));

    for (let i = 0, n = addedPlayers.length; i < n; ++i) {
      addedPlayers[i].sortOrder = removedPlayers[i].sortOrder + 1;
      addedPlayers[i].expectedFantasyPointsDifference =
        addedPlayers[i].expectedFantasyPoints -
        removedPlayers[i].expectedFantasyPoints;
    }
  }

  private _addOptimalPlayerCombinations(combinations: OptimalCombinationsResultDto[]) {
    this.playerCombinations.length = 0;

    if (combinations.length > 0 && combinations[0].players.length > 0) {
      const bestCombination: OptimalCombinationsResultDto = combinations[0];

      const shownCombinations: OptimalCombinationsResultDto[] = combinations.slice(1);
      for (const combination of shownCombinations) {
        this.playerCombinations.push(this._describeCombination(combination, bestCombination));
      }

      this._revertOptimalPlayers();
      for (const player of bestCombination.players) {
        // Оптимизатор может вернуть удалённого из состава игрока - тогда он восстанавливается на месте, а не дублируется.
        const removedSquadPlayer: PlayerSquadRecord | undefined = this.squadPlayers.find(
          (x) => x.isRemoved && x.playerObject.playerID === player.id
        );
        if (removedSquadPlayer) {
          removedSquadPlayer.isRemoved = false;
          removedSquadPlayer.isOptimal = true;
          continue;
        }

        const playerChooseRecord: PlayerChooseRecord =
          this._playerCombinationsService.availablePlayers.find((x) => x.playerObject.playerID === player.id)!;

        const playerSquadRecord: PlayerSquadRecord = this._playerCombinationsService.createPlayerSquadRecord(playerChooseRecord, true);
        this.squadPlayers.push(playerSquadRecord);
      }
    }
    
    this.squadPlayers = Object.assign([], this.squadPlayers);
    this.setSquadPlayersSortOrder();

    this.sendAvailableSlots.emit(this.getAvailableSlots());
    this.squadPlayersChange.emit(this.squadPlayers);
    this._changeDetectorRef.detectChanges();
  }

  /**
   * Снимает прошлую подсказку оптимизатора: добавленных им убирает, восстановленных им снова помечает удалёнными.
   */
  private _revertOptimalPlayers() {
    this.squadPlayers = this.squadPlayers.filter((x) => !(x.isNew && x.isOptimal));
    this.squadPlayers
      .filter((x) => x.isOptimal)
      .forEach((x) => {
        x.isRemoved = true;
        x.isOptimal = false;
      });
  }

  /**
   * Короткая альтернатива показывается целиком. Длинная (например, все 17 после сброса состава)
   * отличается от лучшей на одного-двух игроков, поэтому показывается только разница с ней.
   */
  private _describeCombination(
    combination: OptimalCombinationsResultDto,
    bestCombination: OptimalCombinationsResultDto
  ): CombinationView {
    if (combination.players.length <= FULL_COMBINATION_MAX_PLAYERS) {
      return {
        playersIn: combination.players.map((x) => this._toCombinationPlayerView(x)),
        playersOut: [],
        difference: null,
      };
    }

    const bestIds: Set<number> = new Set(bestCombination.players.map((x) => x.id));
    const ids: Set<number> = new Set(combination.players.map((x) => x.id));
    return {
      playersIn: combination.players
        .filter((x) => !bestIds.has(x.id))
        .map((x) => this._toCombinationPlayerView(x)),
      playersOut: bestCombination.players
        .filter((x) => !ids.has(x.id))
        .map((x) => this._toCombinationPlayerView(x)),
      difference: Utils.formatNumber(combination.total - bestCombination.total),
    };
  }

  /**
   * Tooltip is built from the full player record: a candidate from the players table,
   * or a player already in the squad (the optimizer may return a removed one).
   */
  private _toCombinationPlayerView(player: PlayerCombinationsStatsDto): CombinationPlayerView {
    const record: PlayerCommonRecord | undefined =
      this._playerCombinationsService.availablePlayers.find((x) => x.playerObject.playerID === player.id) ??
      this.squadPlayers.find((x) => x.playerObject.playerID === player.id);

    return {
      name: player.name,
      team: player.team,
      tooltip: record
        ? PlayerTooltipBuilder.generatePlayerTooltip(
            record,
            this.filteredTeamGames,
            this.teamStats,
            this.playerGamesOfoMap
          )
        : null,
    };
  }
}
