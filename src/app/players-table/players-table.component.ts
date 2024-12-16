import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PlayerChooseRecord } from '../interfaces/player-choose-record';
import { PlayersFilter } from '../interfaces/players-filter';
import { PlayerStatsDTO } from '../interfaces/player-stats-dto';
import { TeamStatsDTO } from '../interfaces/team-stats-dto';
import { PPToiPipe } from '../pipes/pptoi.pipe';
import { GamesUtils } from '../common/games-utils';
import { TeamGameInformation } from '../interfaces/team-game-information';
import { DEFAULT_POSITIONS, RED_GP_UPPER_BOUNDARY, REMOVE_PLAYERS_WITH_NO_GAMES, SQUAD_PLAYERS_COUNT } from 'src/constants';
import { PlayerExpectedFantasyPointsDTO } from '../interfaces/player-expected-fantasy-points-dto';
import { MatPaginator } from '@angular/material/paginator';
import { SelectedPlayerModel } from '../interfaces/selected-player-model';
import { OfoVariant } from '../interfaces/ofo-variant';
import { PositionsAvailableToPick } from '../interfaces/positions-available-to-pick';
import { PlayerSquadRecord } from '../interfaces/player-squad-record';
import { PlayerTooltipBuilder } from '../common/player-tooltip-builder';
import { Subscription } from 'rxjs';
import { PlayersObservableProxyService } from 'src/services/observable-proxy/players-observable-proxy.service';
import { FiltersObservableProxyService } from 'src/services/observable-proxy/filters-observable-proxy.service';
import { DatesRangeModel } from '../interfaces/dates-range.model';
import { DateFiltersService } from 'src/services/filtering/date-filters.service';
import { Utils } from '../common/utils';

@Component({
  selector: 'app-players-table',
  templateUrl: './players-table.component.html',
  styleUrls: ['./players-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayersTableComponent
  implements AfterViewInit, OnChanges, OnInit, OnDestroy
{
  displayedColumns: string[] = [
    'firstChoice',
    'secondChoice',
    '№',
    'playerName',
    'projectedGamesCount',
    'team',
    'position',
    'price',
    'expectedFantasyPoints',
    'priceByExpectedFantasyPoints',
    'gamesCount',
    'easyGamesCount',
    'winPercentage',
    'powerPlayTime',
    'powerPlayNumber',
    'toi',
    'shotsOnGoal',
    'iXG',
    'iCF',
    'iHDCF',
    'fantasyPointsPerGame',
    'priceByExpectedFantasyPointsPerGame',
    'sources',
    'addPlayerToSquad',
  ];

  private selectPlayerByIdSubscription?: Subscription;
  private showBestPlayersInCalendarEventSubscription?: Subscription;
  private deselectPlayersFromComparisonComponentSubscription?: Subscription;
  private _filterDatesRangeSubscription?: Subscription;
  private filterDictionary: Map<string, any> = new Map<string, any>();

  protected UTILS = Utils;

  @ViewChild(MatSort) sort: MatSort | undefined;
  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;
  @Input() lowerBoundPrice: number | undefined;
  @Input() upperBoundPrice: number | undefined;
  @Input() positions: string[] | undefined = [];
  @Input() teams: string[] | undefined = [];
  @Input() teamIdAcronymMap: Map<number, string> | undefined = undefined;
  @Input() powerPlayUnits: string[] | undefined = [];
  @Input() playerStats: PlayerStatsDTO[] = [];
  @Input() teamStats: TeamStatsDTO[] = [];
  @Input() filteredTeamGames: Map<number, TeamGameInformation[]> = new Map<
    number,
    TeamGameInformation[]
  >();

  @Input() formLength: number = 0;

  @Input() playersAreNotPlayedDisabled: boolean = REMOVE_PLAYERS_WITH_NO_GAMES;
  @Input() hideLowGPPlayersEnabled: boolean = false;

  @Input() playerGamesOfoMap:
    | Map<number, PlayerExpectedFantasyPointsDTO[]>
    | undefined;

  private _positionsInSquadAvailable: PositionsAvailableToPick | undefined;
  get positionsInSquadAvailable(): PositionsAvailableToPick {
    return this._positionsInSquadAvailable!;
  }
  @Input() set positionsInSquadAvailable(value: PositionsAvailableToPick) {
    this._positionsInSquadAvailable = value;
  }

  public selectedPlayers: Map<string, SelectedPlayerModel[]> = new Map<
    string,
    SelectedPlayerModel[]
  >();

  @Output() sendFirstChoiceOfo: EventEmitter<OfoVariant> =
    new EventEmitter<OfoVariant>();
  @Output() sendSecondChoiceOfo: EventEmitter<OfoVariant> =
    new EventEmitter<OfoVariant>();
  @Output() sendAddedToSquadPlayer: EventEmitter<PlayerSquadRecord> =
    new EventEmitter<PlayerSquadRecord>();

  private pptoiPipe: PPToiPipe = new PPToiPipe();
  private players: PlayerChooseRecord[] = [];
  dataSource = new MatTableDataSource(this.players);
  private clickedOnCheckboxOrButton: boolean = false;

  protected filterDates: DatesRangeModel = {
    minDate: new Date(),
    maxDate: new Date(),
  };

  constructor(
    private _playersObservableProxyService: PlayersObservableProxyService,
    private _filtersObservableProxyService: FiltersObservableProxyService,
    private _changeDetectorRef: ChangeDetectorRef,
    private _dateFiltersService: DateFiltersService
  ) {
    this.dataSource.filterPredicate = this.filter;
  }

  //#region LIFECYCLE HOOKS

  ngOnInit() {
    this.selectPlayerByIdSubscription =
      this._playersObservableProxyService.$showPlayerInCalendarObservable?.subscribe(
        (playerId) => {
          const player: PlayerChooseRecord = this.players.find(
            (x) => x.playerObject.playerID == playerId
          )!;
          this.selectPlayerRow(player);
          this._changeDetectorRef.detectChanges();
        }
      );

    this.showBestPlayersInCalendarEventSubscription =
      this._playersObservableProxyService.$showBestPlayersInCalendarObservable?.subscribe(
        () => {
          this._selectBestPlayersForEachTeamInCalendar();
        }
      );

    this.deselectPlayersFromComparisonComponentSubscription =
      this._filtersObservableProxyService.$deselectPlayersFromComparisonObservable?.subscribe(
        () => {
          this._deselectAllPlayersInComparison();
        }
      );

    this._filterDatesRangeSubscription =
      this._dateFiltersService.$dateFiltersObservable.subscribe(
        (value: DatesRangeModel) => {
          this.filterDates = value;
        }
      );
  }

  ngOnDestroy(): void {
    this.selectPlayerByIdSubscription?.unsubscribe();
    this.showBestPlayersInCalendarEventSubscription?.unsubscribe();
    this.deselectPlayersFromComparisonComponentSubscription?.unsubscribe();
    this._filterDatesRangeSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['playerStats']?.previousValue &&
      changes['playerStats']?.currentValue &&
      changes['playerStats']?.currentValue?.length! > 0
    ) {
      this.players.length = 0;
      for (var i = 0, n = this.playerStats.length; i < n; ++i) {
        let player: PlayerStatsDTO = this.playerStats[i];
        let matchingTeam: TeamStatsDTO = this.teamStats?.find(
          (team) => team.teamID == player.teamID
        )!;

        const teamGames: TeamGameInformation[] | undefined = this.filteredTeamGames.get(player.teamID);

        this.players.push({
          firstChoice: false,
          secondChoice: false,
          playerName: player.playerName,
          team: matchingTeam.teamAcronym,
          position: player.position,
          price: player.price,
          gamesCount: teamGames?.length!,
          projectedGamesCount: player.forecastGamesPlayed != null ? player.forecastGamesPlayed : 0,
          b2bGamesCount: 0,
          easyGamesCount: teamGames?.filter((x) =>
            GamesUtils.isEasyGame(x.winChance)
          )?.length!,
          b2bEasyGamesCount: 0,
          winPercentage: matchingTeam.teamFormWinPercentage,
          powerPlayTime: this.pptoiPipe.transform(
            player.formPowerPlayTime,
            player.formPowerPlayTeamPosition
          ),
          powerPlayNumber: GamesUtils.GetPPText(player.formPowerPlayNumber),
          toi: player.formTOI,
          shotsOnGoal: player.formShotsOnGoal,
          iXG: Math.round(player.formIxG * 100) / 100,
          iCF: player.formICF,
          iHDCF: player.formIHDCF,
          expectedFantasyPoints: 0,
          fantasyPointsPerGame: '',
          priceByExpectedFantasyPoints: 0,
          priceByExpectedFantasyPointsPerGame: 0,
          forecastSources:
            player.forecastSources.length > 0 ? player.forecastSources : 'NONE',
          teamObject: matchingTeam,
          playerObject: player,
        });
      }
    }

    if (changes['filteredTeamGames']?.currentValue) {
      for (var i = 0, n = this.players.length; i < n; ++i) {
        let player: PlayerChooseRecord = this.players[i];
        let teamGames: TeamGameInformation[] | undefined =
          this.filteredTeamGames.get(player.teamObject.teamID);

        player.gamesCount = teamGames?.length!;

        player.b2bGamesCount = GamesUtils.getB2BGamesCount(teamGames!);

        player.easyGamesCount = teamGames?.filter((x) =>
          GamesUtils.isEasyGame(x.winChance)
        )?.length!;

        player.b2bEasyGamesCount = GamesUtils.getB2BEasyGamesCount(teamGames!);
      }
    }

    if (changes['playerGamesOfoMap']?.currentValue) {
      for (var i = 0, n = this.players.length; i < n; ++i) {
        let player: PlayerChooseRecord = this.players[i];

        let ofo: number = this.playerGamesOfoMap
          ?.get(player.playerObject.playerID)
          ?.reduce(
            (partialSum, x) => partialSum + x.playerExpectedFantasyPoints,
            0.0
          )!;

        player.expectedFantasyPoints = ofo;
        player.fantasyPointsPerGame =
          ofo > 0
            ? Utils.formatNumber(ofo / player.gamesCount)
            : '0';
        player.priceByExpectedFantasyPoints =
          ofo > 0 && player.price > 0 ? player.price / ofo : 999;
        player.priceByExpectedFantasyPointsPerGame =
          ofo > 0 && player.price > 0
            ? player.price / (ofo / player.gamesCount)
            : 999;
      }
    }

    this.applyPlayersFilter({
      name: 'playersAreNotPlayedDisabled',
      value: this.playersAreNotPlayedDisabled,
    });

    this.applyPlayersFilter({
      name: 'hideLowGPPlayersEnabled',
      value: this.hideLowGPPlayersEnabled,
    });

    this.applyPlayersFilter({
      name: 'lowerBoundPrice',
      value: this.lowerBoundPrice,
    });

    this.applyPlayersFilter({
      name: 'upperBoundPrice',
      value: this.upperBoundPrice,
    });

    this.applyPlayersFilter({
      name: 'positions',
      value: this.positions,
    });

    this.applyPlayersFilter({
      name: 'teams',
      value: this.teams,
    });

    this.applyPlayersFilter({
      name: 'powerPlayUnits',
      value: this.powerPlayUnits,
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort!;
    this.dataSource.paginator = this.paginator!;
  }

  //#endregion NG overrides

  //#region Public Methods

  public addPlayerToSquad(player: PlayerChooseRecord) {
    this.clickedOnCheckboxOrButton = true;

    const playerSquadRecord: PlayerSquadRecord = {
      playerName: player.playerObject.playerName,
      position: player.playerObject.position,
      price: player.playerObject.price,
      gamesCount: player.gamesCount,
      expectedFantasyPoints: player.expectedFantasyPoints,
      isRemoved: false,
      isNew: true,
      playerObject: player.playerObject,
      teamObject: player.teamObject,
      powerPlayNumber: player.powerPlayNumber,
      sortOrder: 0
    };

    this.sendAddedToSquadPlayer.emit(playerSquadRecord);
  }

  public isAddPlayerToSquadButtonHidden(player: PlayerChooseRecord): boolean {
    return (
      this.positionsInSquadAvailable == null ||
      (this.positionsInSquadAvailable?.defendersAvailable == 0 &&
        player.position == 'З') ||
      (this.positionsInSquadAvailable?.forwardsAvailable == 0 &&
        player.position == 'Н') ||
      (this.positionsInSquadAvailable?.goaliesAvailable == 0 &&
        player.position == 'В') ||
      (this.positionsInSquadAvailable?.selectedPlayerIds.length! > 0 &&
        this.positionsInSquadAvailable?.selectedPlayerIds.indexOf(
          player.playerObject.playerID
        )! > -1)
    );
  }

  public deselectAllPlayersInCalendar() {
    this.selectedPlayers = new Map<string, SelectedPlayerModel[]>();
    this._playersObservableProxyService.triggerSendSelectedPlayersToCalendar(
      this.selectedPlayers
    );
  }

  private _deselectAllPlayersInComparison(): void {
    this.players.forEach((x) => {
      x.firstChoice = false;
      x.secondChoice = false;
    });

    const ofoChoice: OfoVariant = {
      priceSum: 0,
      expectedFantasyPointsSum: 0,
      priceByExpectedFantasyPointsSum: 0,
      playersCount: 0,
    };

    this.sendFirstChoiceOfo.emit(ofoChoice);
    this.sendSecondChoiceOfo.emit(ofoChoice);
  }

  ofoPlayersFirstChoiceChanged(player: PlayerChooseRecord) {
    this.clickedOnCheckboxOrButton = true;
    let playersWithFirstChoice: PlayerChooseRecord[] = this.players.filter(
      (x) => x.firstChoice
    );

    let ofoFirstChoice: OfoVariant = {
      priceSum: playersWithFirstChoice.reduce((n, { price }) => n + price, 0),
      expectedFantasyPointsSum: playersWithFirstChoice.reduce(
        (n, { expectedFantasyPoints }) => n + +expectedFantasyPoints,
        0
      ),
      priceByExpectedFantasyPointsSum: playersWithFirstChoice.reduce(
        (n, { priceByExpectedFantasyPoints }) =>
          n + priceByExpectedFantasyPoints,
        0
      ),
      playersCount: playersWithFirstChoice.length,
    };

    this.sendFirstChoiceOfo.emit(ofoFirstChoice);

    if (player.firstChoice) {
      player.secondChoice = false;
      this.ofoPlayersSecondChoiceChanged(player);
    }
  }

  ofoPlayersSecondChoiceChanged(player: PlayerChooseRecord) {
    this.clickedOnCheckboxOrButton = true;
    let playersWithSecondChoice: PlayerChooseRecord[] = this.players.filter(
      (x) => x.secondChoice
    );

    let ofoSecondChoice: OfoVariant = {
      priceSum: playersWithSecondChoice.reduce((n, { price }) => n + price, 0),
      expectedFantasyPointsSum: playersWithSecondChoice.reduce(
        (n, { expectedFantasyPoints }) => n + +expectedFantasyPoints,
        0
      ),
      priceByExpectedFantasyPointsSum: playersWithSecondChoice.reduce(
        (n, { priceByExpectedFantasyPoints }) =>
          n + priceByExpectedFantasyPoints,
        0
      ),
      playersCount: playersWithSecondChoice.length,
    };

    this.sendSecondChoiceOfo.emit(ofoSecondChoice);

    if (player.secondChoice) {
      player.firstChoice = false;
      this.ofoPlayersFirstChoiceChanged(player);
    }
  }

  getPlayerSelectedIconPath(
    choiceIndex: number,
    firstChoice: boolean,
    secondChoice: boolean
  ): string {
    if (!firstChoice && !secondChoice) {
      return '/assets/images/player-not-selected.png';
    }

    if (
      (choiceIndex == 1 && secondChoice) ||
      (choiceIndex == 2 && firstChoice)
    ) {
      return '/assets/images/player-selected-not-here.png';
    }

    if (choiceIndex == 1 && firstChoice) {
      return '/assets/images/player-selected-first.png';
    }

    if (choiceIndex == 2 && secondChoice) {
      return '/assets/images/player-selected-second.png';
    }

    return '';
  }

  getPlayerSelectedClass(firstChoice: boolean, secondChoice: boolean): string {
    if (firstChoice) {
      return 'first-choice-selected-cell';
    }

    if (secondChoice) {
      return 'second-choice-selected-cell';
    }

    return '';
  }

  getPlayerSelectedClassByRow(row: PlayerChooseRecord): string {
    let cellClass: string = '';
    if (row.playerObject.formGamesPlayed < this.formLength) {
      cellClass = 'inactive-player-cell ';
    }

    if (row.firstChoice) {
      cellClass += 'first-choice-selected-cell';
      return cellClass;
    }

    if (row.secondChoice) {
      cellClass += 'second-choice-selected-cell';
      return cellClass;
    }

    if (this.isPlayerSelected(row)) {
      cellClass += 'player-is-selected';
      return cellClass;
    }

    return cellClass;
  }

  public generateCellToolTip(player: PlayerChooseRecord): string | null {
    return PlayerTooltipBuilder.generatePlayerTooltip(
      player,
      this.filteredTeamGames,
      this.teamStats,
      this.playerGamesOfoMap
    );
  }

  protected selectPlayerRow(player: PlayerChooseRecord): void {
    if (this.clickedOnCheckboxOrButton) {
      this.clickedOnCheckboxOrButton = false;
      return;
    }
    this.selectedPlayers = new Map<string, SelectedPlayerModel[]>(
      this.selectedPlayers
    );

    const teamName: string = this.filteredTeamGames.get(
      player.teamObject.teamID
    )![0].teamName;
    const playerInfo: PlayerExpectedFantasyPointsDTO[] | undefined =
      this.playerGamesOfoMap?.get(player.playerObject.playerID);
    const currentSelectedPlayerForTeam: SelectedPlayerModel[] | undefined =
      this.selectedPlayers.get(teamName);

    if (currentSelectedPlayerForTeam != null) {
      this.selectedPlayers.delete(teamName);

      if (
        currentSelectedPlayerForTeam[0].playerID ===
        player.playerObject.playerID
      ) {
        this._playersObservableProxyService.triggerSendSelectedPlayersToCalendar(
          this.selectedPlayers
        );
        return;
      }
    }

    const teamGame: TeamGameInformation[] = this.filteredTeamGames.get(
      player.teamObject.teamID
    )!;

    this.selectedPlayers.set(
      teamName,
      playerInfo?.map((x) => ({
        playerName: player.playerObject.playerName,
        playerID: player.playerObject.playerID,
        playerExpectedFantasyPointsFormatted: Utils.formatNumber(x.playerExpectedFantasyPoints),
        playerExpectedFantasyPoints: x.playerExpectedFantasyPoints,
        teamName: teamName,
        gameDate: teamGame.find((game) => game.gameID == x.gameID)?.gameDate!,
      }))!
    );

    this._playersObservableProxyService.triggerSendSelectedPlayersToCalendar(
      this.selectedPlayers
    );
  }

  public isPlayerSelected(player: PlayerChooseRecord) {
    let teamGames: TeamGameInformation[] = this.filteredTeamGames.get(
      player.teamObject.teamID
    )!;

    if (teamGames.length < 1) {
      return false;
    }

    let matchingTeamName: string = teamGames[0].teamName;
    let currentSelectedPlayerForTeam: SelectedPlayerModel[] | undefined =
      this.selectedPlayers.get(matchingTeamName);

    if (currentSelectedPlayerForTeam == null) {
      return false;
    }

    return (
      currentSelectedPlayerForTeam[0].playerID == player.playerObject.playerID
    );
  }

  public isSelectedOnlyGoalies() {
    return this.positions?.length === 1 && this.positions[0] == 'В';
  }

  //#endregion

  //#region Private methods

  private _selectBestPlayersForEachTeamInCalendar() {
    for (const teamStat of this.teamStats) {
      const teamPlayers: PlayerChooseRecord[] = this.players.filter(
        (x) =>
          x.teamObject.teamID == teamStat.teamID &&
          x.position != DEFAULT_POSITIONS[0] &&
          x.expectedFantasyPoints != null
      );

      const bestTeamPlayer: PlayerChooseRecord = teamPlayers.sort(
        (n1, n2) => n2.expectedFantasyPoints - n1.expectedFantasyPoints
      )[0];

      if (bestTeamPlayer == null || bestTeamPlayer.gamesCount == 0) {
        continue;
      }

      this.selectPlayerRow(bestTeamPlayer);
    }
  }

  private filter(record: PlayerChooseRecord, filter: string) {
    var map = new Map<string, any>(JSON.parse(filter));
    let isMatch = false;

    for (let [key, value] of map) {
      if (value == null || value.length === 0) {
        isMatch = true;
        continue;
      }

      if (key == 'lowerBoundPrice') {
        isMatch = record.price >= value;
      }

      if (key == 'upperBoundPrice') {
        isMatch = record.price <= value;
      }

      if (key == 'positions') {
        isMatch = value.includes(record.position);
      }

      if (key == 'teams') {
        isMatch = value.includes(record.team);
      }

      if (key == 'powerPlayUnits') {
        isMatch = value.includes(record.powerPlayNumber);
      }

      if (key == 'playersAreNotPlayedDisabled') {
        isMatch = !value || record.toi > 0;
      }

      if (key == 'hideLowGPPlayersEnabled') {
        isMatch =
          !value ||
          record.playerObject?.forecastGamesPlayed! > RED_GP_UPPER_BOUNDARY;
      }

      if (!isMatch) {
        return false;
      }
    }
    return isMatch;
  }

  private applyPlayersFilter(filter: PlayersFilter) {
    this.filterDictionary.set(filter.name, filter.value);
    var jsonString = JSON.stringify(
      Array.from(this.filterDictionary.entries())
    );
    this.dataSource.filter = jsonString;
  }

  //#endregion
}
