import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PlayerChooseRecord } from '../interfaces/player-choose-record';
import { PlayersFilter } from '../interfaces/players-filter';
import { PlayerStatsDTO } from '../interfaces/player-stats-dto';
import { TeamStatsDTO } from '../interfaces/team-stats-dto';
import { PPToiPipe } from '../pipes/pptoi.pipe';
import { GamesUtils } from '../common/games-utils';
import { TeamGameInformation } from '../interfaces/team-game-information';
import { Utils } from '../common/utils';
import {
  DEFAULT_POSITIONS,
  GREEN_WIN_LOWER_BOUNDARY,
  RED_GP_UPPER_BOUNDARY,
  RED_PIM_LOWER_BOUNDARY,
  VERY_GREEN_WIN_LOWER_BOUNDARY,
  WHITE_WIN_LOWER_BOUNDARY,
} from 'src/constants';
import { PlayerExpectedFantasyPointsDTO } from '../interfaces/player-expected-fantasy-points-dto';
import { DecimalPipe } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { SelectedPlayerModel } from '../interfaces/selected-player-model';
import { OfoVariant } from '../interfaces/ofo-variant';
import { PositionsAvailableToPick } from '../interfaces/positions-available-to-pick';
import { PlayerSquadRecord } from '../interfaces/player-squad-record';
import { PlayerTooltipBuilder } from '../common/player-tooltip-builder';

@Component({
  selector: 'app-players-table',
  templateUrl: './players-table.component.html',
  styleUrls: ['./players-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayersTableComponent implements AfterViewInit, OnChanges {
  displayedColumns: string[] = [
    'firstChoice',
    'secondChoice',
    '№',
    'playerName',
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
  constructor(private _liveAnnouncer: LiveAnnouncer) {
    this.dataSource.filterPredicate = this.filter;
  }

  private filterDictionary: Map<string, any> = new Map<string, any>();

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

  @Input() playersAreNotPlayedDisabled: boolean = true;
  @Input() hideLowGPPlayersEnabled: boolean = false;

  private _shouldDeselectAllSelectedPlayers: boolean = false;
  @Input() set shouldDeselectAllSelectedPlayers(value: boolean) {
    this._shouldDeselectAllSelectedPlayers = value;
    this.deselectAllPlayersInComparison();
  }

  @Input() playerGamesOfoMap:
    | Map<number, PlayerExpectedFantasyPointsDTO[]>
    | undefined;

  @Input() minFilterDate: Date | undefined;
  @Input() maxFilterDate: Date | undefined;

  private _positionsInSquadAvailable: PositionsAvailableToPick | undefined;
  get positionsInSquadAvailable(): PositionsAvailableToPick {
    return this._positionsInSquadAvailable!;
  }
  @Input() set positionsInSquadAvailable(value: PositionsAvailableToPick) {
    this._positionsInSquadAvailable = value;
  }

  @Input() set areBestPlayersForEachTeamSelected(value: boolean) {
    if (value) {
      this.selectBestPlayersForEachTeamInCalendar();
    }
    else {
      this.deselectAllPlayersInCalendar();
    }
  }

  public selectedPlayers: Map<string, SelectedPlayerModel[]> = new Map<
    string,
    SelectedPlayerModel[]
  >();


  @Output() sendSelectedPlayers: EventEmitter<
    Map<string, SelectedPlayerModel[]>
  > = new EventEmitter<Map<string, SelectedPlayerModel[]>>();

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

  private numberPipe: DecimalPipe = new DecimalPipe('en-US');
  //#region NG overrides

  ngOnChanges(changes: SimpleChanges) {
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

        this.players.push({
          firstChoice: false,
          secondChoice: false,
          playerName: player.playerName,
          team: matchingTeam.teamAcronym,
          position: player.position,
          price: player.price,
          gamesCount: this.filteredTeamGames.get(player.teamID)?.length!,
          b2bGamesCount: 0,
          easyGamesCount: this.filteredTeamGames.get(player.teamID)?.length!,
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
          //ofo > 0 ? this.numberPipe.transform(ofo, '1.0-1')! : '0';
        player.fantasyPointsPerGame =
          ofo > 0
            ? this.numberPipe.transform(ofo / player.gamesCount, '1.0-1')!
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

    let playerSquadRecord: PlayerSquadRecord = {
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
    };

    this.sendAddedToSquadPlayer.emit(playerSquadRecord);
  }

  public isAddPlayerToSquadButtonHidden(player: PlayerChooseRecord): boolean {
    return (
      (this.positionsInSquadAvailable == null) ||
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
    this.sendSelectedPlayers.emit(this.selectedPlayers);
  }

  public deselectAllPlayersInComparison() {
    this.players.forEach((x) => {
      x.firstChoice = false;
      x.secondChoice = false;
    });

    let ofoChoice: OfoVariant = {
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
    if (row.firstChoice) {
      return 'first-choice-selected-cell';
    }

    if (row.secondChoice) {
      return 'second-choice-selected-cell';
    }

    if (this.isPlayerSelected(row)) {
      return 'player-is-selected';
    }

    return '';
  }

  /** Announce the change in sort state for assistive technology. */
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  public generateCellToolTip(player: PlayerChooseRecord): string | null {
    return PlayerTooltipBuilder.generatePlayerTooltip(player, this.filteredTeamGames, this.teamStats, this.playerGamesOfoMap);
  }

  public selectPlayerRow(player: PlayerChooseRecord) {
    if (this.clickedOnCheckboxOrButton) {
      this.clickedOnCheckboxOrButton = false;
      return;
    }
    this.selectedPlayers = new Map<string, SelectedPlayerModel[]>(
      this.selectedPlayers
    );

    let matchingTeamName: string = this.filteredTeamGames.get(
      player.teamObject.teamID
    )![0].teamName;
    let matchingPlayersInfo: PlayerExpectedFantasyPointsDTO[] | undefined =
      this.playerGamesOfoMap?.get(player.playerObject.playerID);

    let currentSelectedPlayerForTeam: SelectedPlayerModel[] | undefined =
      this.selectedPlayers.get(matchingTeamName);

    if (currentSelectedPlayerForTeam != null) {
      this.selectedPlayers.delete(matchingTeamName);

      if (
        currentSelectedPlayerForTeam[0].playerID != player.playerObject.playerID
      ) {
        let teamGame: TeamGameInformation[] = this.filteredTeamGames.get(
          player.teamObject.teamID
        )!;

        this.selectedPlayers.set(
          matchingTeamName,
          matchingPlayersInfo?.map((x) => ({
            playerName: player.playerObject.playerName,
            playerID: player.playerObject.playerID,
            playerExpectedFantasyPoints: this.numberPipe.transform(
              x.playerExpectedFantasyPoints,
              '1.0-1'
            )!,
            teamName: matchingTeamName,
            gameDate: teamGame.find((game) => game.gameID == x.gameID)
              ?.gameDate!,
          }))!
        );
      }
    } else {
      let teamGame: TeamGameInformation[] = this.filteredTeamGames.get(
        player.teamObject.teamID
      )!;

      this.selectedPlayers.set(
        matchingTeamName,
        matchingPlayersInfo?.map((x) => ({
          playerName: player.playerObject.playerName,
          playerID: player.playerObject.playerID,
          playerExpectedFantasyPoints: this.numberPipe.transform(
            x.playerExpectedFantasyPoints,
            '1.0-1'
          )!,
          teamName: matchingTeamName,
          gameDate: teamGame.find((game) => game.gameID == x.gameID)?.gameDate!,
        }))!
      );
    }

    this.sendSelectedPlayers.emit(this.selectedPlayers);
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

  private selectBestPlayersForEachTeamInCalendar() {
    for (let teamStat of this.teamStats) {
      let teamPlayers: PlayerChooseRecord[] = 
        this.players.filter((x) => x.teamObject.teamID == teamStat.teamID && x.position != DEFAULT_POSITIONS[0] && x.expectedFantasyPoints != null);
      
      let bestTeamPlayer: PlayerChooseRecord = 
        teamPlayers.sort((n1, n2) => n2.expectedFantasyPoints - n1.expectedFantasyPoints)[0];
      
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
