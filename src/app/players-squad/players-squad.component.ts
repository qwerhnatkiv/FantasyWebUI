import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { PlayerSquadRecord } from '../interfaces/player-squad-record';
import {
  DEFAULT_POSITIONS,
  DEFAULT_SUBSTITUTION_VALUE,
  ONE_DIGIT_NUMBER_FORMAT,
  POSITIONS_SORT_MAP,
  SQUAD_PLAYERS_COUNT,
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
@Component({
  selector: 'app-players-squad',
  templateUrl: './players-squad.component.html',
  styleUrls: ['./players-squad.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayersSquadComponent {
  displayedColumns: string[] = [
    'action',
    'position',
    'playerName',
    'price',
    'gamesCount',
    'expectedFantasyPoints',
    'expectedFantasyPointsDifference',
  ];

  protected UTILS = Utils;

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
    private _playerCombinationsService: PlayerCombinationsService
  ) {}

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

  public getTotalBalance(includeNewPlayers: boolean = true): number {
    if (this.squadPlayers == null) {
      return 0;
    }

    let bougthPlayersPrice: number = 0;
    if (includeNewPlayers) {
      bougthPlayersPrice = this.squadPlayers
        .filter((item) => item.price && item.isNew)
        .reduce((sum, current) => sum + current.price, 0);
    }

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

  protected getOptimalPlayersCombinations() {
    const result =
      this._playerCombinationsService.getOptimalPlayersCombinations(
        this.getTotalBalance(false),
        this.squadPlayers
      );

    console.log(result);
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

    this.sendAvailableSlots.emit(this.getAvailableSlots());
  }

  public generateCellToolTip(player: PlayerSquadRecord): string | null {
    return PlayerTooltipBuilder.generatePlayerTooltip(
      player,
      this.filteredTeamGames,
      this.teamStats,
      this.playerGamesOfoMap
    );
  }

  public isClearAllSquadChangesButtonHidden() {
    return this.squadPlayers.filter((x) => x.isNew || x.isRemoved)?.length == 0;
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
}
