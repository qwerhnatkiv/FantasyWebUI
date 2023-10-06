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
import { GamePredictionDTO } from '../interfaces/game-prediction-dto';
import { Utils } from '../common/utils';
import {
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

@Component({
  selector: 'app-players-table',
  templateUrl: './players-table.component.html',
  styleUrls: ['./players-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  @Input() playerGamesOfoMap:
    | Map<number, PlayerExpectedFantasyPointsDTO[]>
    | undefined;

  public selectedPlayers: Map<string, SelectedPlayerModel[]> = new Map<
    string,
    SelectedPlayerModel[]
  >();
  @Output() sendSelectedPlayers: EventEmitter<
    Map<string, SelectedPlayerModel[]>
  > = new EventEmitter<Map<string, SelectedPlayerModel[]>>();

  private pptoiPipe: PPToiPipe = new PPToiPipe();
  private players: PlayerChooseRecord[] = [];
  dataSource = new MatTableDataSource(this.players);

  private numberPipe: DecimalPipe = new DecimalPipe('en-US');
  //#region NG overrides

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes['playerStats']?.previousValue &&
      changes['playerStats']?.currentValue &&
      changes['playerStats'].previousValue.length !=
        changes['playerStats'].currentValue.length
    ) {
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
          powerPlayNumber:
            player.formPowerPlayNumber > 0
              ? `ПП${player.formPowerPlayNumber}`
              : 'нет',
          toi: player.formTOI,
          shotsOnGoal: player.formShotsOnGoal,
          iXG: Math.round(player.formIxG * 100) / 100,
          iCF: player.formICF,
          iHDCF: player.formIHDCF,
          expectedFantasyPoints: '',
          fantasyPointsPerGame: '',
          priceByExpectedFantasyPoints: 0,
          priceByExpectedFantasyPointsPerGame: 0, 
          forecastSources: player.forecastSources.length > 0 ? player.forecastSources : 'NONE',
          teamObject: matchingTeam,
          playerObject: player,
        });
      }
    }

    if (changes['filteredTeamGames']?.currentValue) {
      for (var i = 0, n = this.players.length; i < n; ++i) {
        let player: PlayerChooseRecord = this.players[i];
        let teamGames: TeamGameInformation[] | undefined = this.filteredTeamGames.get(
          player.teamObject.teamID
        );

        player.gamesCount = teamGames?.length!;

        player.b2bGamesCount = GamesUtils.getB2BGamesCount(teamGames!);

        player.easyGamesCount = teamGames?.filter((x) => GamesUtils.isEasyGame(x.winChance))?.length!;

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

        player.expectedFantasyPoints = ofo > 0 ? this.numberPipe.transform(ofo, '1.0-1')! : '0';
        player.fantasyPointsPerGame = ofo > 0 ? this.numberPipe.transform(
          ofo / player.gamesCount,
          '1.0-1'
        )! : '0';
        player.priceByExpectedFantasyPoints = ofo > 0 && player.price > 0 ? player.price / ofo : 999;
        player.priceByExpectedFantasyPointsPerGame = ofo > 0 && player.price > 0 ?  player.price / (ofo / player.gamesCount) : 999;
      }
    }

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

  /** Announce the change in sort state for assistive technology. */
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  public generateCellToolTip(player: PlayerChooseRecord): string | null {
    let header: string = `
      <div style="font-size: 16px; line-height: 19px; text-align: center;">
        ${player.playerName} (${player.position}, ${player.team})
      </div>`;

    let forecastPimColor: string = player.playerObject.forecastPIM! < RED_PIM_LOWER_BOUNDARY ? 'white' : '#ff7e7e';
    let forecastGPColor: string = player.playerObject.forecastGamesPlayed! >= RED_GP_UPPER_BOUNDARY ? 'white' : '#ff7e7e';

    let forecast: string = `
    <div>Прогноз на сезон:<div>
    <table class="tooltip-table">
      <thead>
        <tr>
          <th style="color:${forecastGPColor}">GP</th>
          <th>G</th>
          <th>A</th>
          <th style="color:${forecastPimColor}">PIM</th>
          <th>+-</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center; vertical-align: middle; color:${forecastGPColor}">${
            this.numberPipe.transform(
              player.playerObject.forecastGamesPlayed,
              '1.0-0'
            ) ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            this.numberPipe.transform(
              player.playerObject.forecastGoals,
              '1.0-0'
            ) ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            this.numberPipe.transform(
              player.playerObject.forecastAssists,
              '1.0-0'
            ) ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle; color:${forecastPimColor}">${
            this.numberPipe.transform(
              player.playerObject.forecastPIM,
              '1.0-0'
            ) ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            this.numberPipe.transform(
              player.playerObject.forecastPlusMinus,
              '1.0-0'
            ) ?? '-'
          }</td>
        </tr
      </tbody>
    </table>
    `;

    let form: string = `
    <div>Форма:<div>
    <table class="tooltip-table">
      <thead>
        <tr>
          <th>GP</th>
          <th>G</th>
          <th>A</th>
          <th>PIM</th>
          <th>+-</th>
          <th>ПП</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center; vertical-align: middle;">${
            player.playerObject.formGamesPlayed ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            player.playerObject.formGoals ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            player.playerObject.formAssists ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            player.playerObject.formPIM ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            player.playerObject.formPlusMinus ?? '-'
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            player.powerPlayNumber
          }</td>
        </tr
      </tbody>
    </table>
    `;

    let teamForm: string = `
    <div>Форма команды:<div>
    <table class="tooltip-table">
      <thead>
        <tr>
          <th>%Очк</th>
          <th>СрЗаб</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center; vertical-align: middle;">${player.winPercentage}</td>
          <td style="text-align: center; vertical-align: middle;">${player.teamObject.teamGoalsForm}</td>
        </tr
      </tbody>
    </table>
    `;

    let teamGame: TeamGameInformation = this.filteredTeamGames
      .get(player.teamObject.teamID)
      ?.sort((n1, n2) => Utils.sortTypes(n1.gameDate, n2.gameDate))[0]!;

    let opponentTeam: TeamStatsDTO = this.teamStats.find(
      (x) => x.teamID == teamGame.opponentTeamID
    )!;
    let opponentAcronym: string = teamGame.isHome
      ? `${opponentTeam.teamAcronym}`
      : `@${opponentTeam.teamAcronym}`;

    let teamWinColor: string = this.getTooltipWinChanceSectionClass(
      teamGame.winChance
    );

    let nearestGameOFO: number = this.playerGamesOfoMap
      ?.get(player.playerObject.playerID)
      ?.find((x) => x.gameID == teamGame.gameID)?.playerExpectedFantasyPoints!;

    let opponentInfo: string = `
    <div>Ближайший соперник: ${opponentAcronym}, <span style="color:${teamWinColor}">Поб: ${Math.round(
      teamGame.winChance
    )}%</span><div>
    <table class="tooltip-table">
      <thead>
        <tr>
          <th>%Очк</th>
          <th>СрЗаб</th>
          <th> ОФО Игрока</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center; vertical-align: middle;">${
            opponentTeam.teamFormWinPercentage
          }</td>
          <td style="text-align: center; vertical-align: middle;">${
            opponentTeam.teamGoalsForm
          }</td>
          <td style="text-align: center; vertical-align: middle;"> ${this.numberPipe.transform(
            nearestGameOFO,
            '1.0-1'
          )}</td>
        </tr
      </tbody>
    </table>
    `;

    return `
    <div style="font-family: Inter;
                font-size: 12px;
                font-weight: 500;
                line-height: 15px;
                letter-spacing: 0em;
                text-align: left;"
                >
      ${header} <br>
      ${forecast} <br>
      ${form} <br>
      ${teamForm} <br>
      ${opponentInfo}
    </div>`;
  }

  public selectPlayerRow(player: PlayerChooseRecord) {
    this.selectedPlayers = new Map<string, SelectedPlayerModel[]>(this.selectedPlayers);

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
            playerExpectedFantasyPoints: this.numberPipe.transform(x.playerExpectedFantasyPoints, '1.0-1')!,
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
          playerExpectedFantasyPoints: this.numberPipe.transform(x.playerExpectedFantasyPoints, '1.0-1')!,
          teamName: matchingTeamName,
          gameDate: teamGame.find((game) => game.gameID == x.gameID)?.gameDate!,
        }))!
      );
    }

    this.sendSelectedPlayers.emit(this.selectedPlayers);
  }

  public isPlayerSelected(player: PlayerChooseRecord) {
    let matchingTeamName: string = this.filteredTeamGames.get(
      player.teamObject.teamID
    )![0].teamName;
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

  private getTooltipWinChanceSectionClass(winChance: number) {
    if (winChance >= VERY_GREEN_WIN_LOWER_BOUNDARY) {
      return '#00AA30';
    }

    if (winChance >= GREEN_WIN_LOWER_BOUNDARY) {
      return '#64ff8f';
    }

    if (winChance >= WHITE_WIN_LOWER_BOUNDARY) {
      return 'white';
    }

    return '#ff7e7e';
  }

  //#endregion
}
