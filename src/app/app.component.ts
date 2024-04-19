import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { GamePredictionDTO } from './interfaces/game-prediction-dto';
import { GamesUtils } from './common/games-utils';
import { Utils } from './common/utils';
import { GamesDTO } from './interfaces/games-dto';
import { TeamStatsDTO } from './interfaces/team-stats-dto';
import { PlayerStatsDTO } from './interfaces/player-stats-dto';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { Moment } from 'moment';
import { TeamGameInformation } from './interfaces/team-game-information';
import { PlayerExpectedFantasyPointsDTO } from './interfaces/player-expected-fantasy-points-dto';
import { PlayerExpectedFantasyPointsInfo } from './interfaces/player-efp-info';
import { SelectedPlayerModel } from './interfaces/selected-player-model';
import { SportsSquadDTO } from './interfaces/sports-squad-dto';
import { PlayerSquadRecord } from './interfaces/player-squad-record';
import { DEFAULT_FORM_LENGTH, DEFAULT_POSITIONS, USER_ID_NAME } from 'src/constants';
import { OfoVariant } from './interfaces/ofo-variant';
import { PositionsAvailableToPick } from './interfaces/positions-available-to-pick';
import { UpdateLogInformation } from './interfaces/update-log-information';
import { ObservablesProxyHandlingService } from 'src/services/observables-proxy-handling';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnChanges {
  title = 'Fantasy Web';

  public isCalendarVisible = true;
  public minFilterDate: Date | undefined = undefined;
  public maxFilterDate: Date | undefined = undefined;

  public games: GamePredictionDTO[] = [];
  public teamStats: TeamStatsDTO[] = [];
  public updateLogInfomation: UpdateLogInformation | undefined = undefined;

  public playerStats: PlayerStatsDTO[] = [];
  public squadPlayers: PlayerSquadRecord[] = [];
  public balanceValue: number = 0;
  public substitutionsLeft: number = 0;
  public squadAvailableSlots: PositionsAvailableToPick | undefined;

  public areBestPlayersForEachTeamSelected: boolean = false;
  public showFullCalendar: boolean = false;

  public emitHideShowFullCalendar() {
    this.showFullCalendar = !this.showFullCalendar; 
  }

  public emitHideShowOnlyGamesCount() {
    this._observablesProxyHandlingService.triggerHideShowOnlyGamesCountSubject();
  }

  public emitSelectPlayerById(val: number) {
    this._observablesProxyHandlingService.triggerSelectPlayerByIdSubject(val);
  }

  public emitSelectBestPlayersForEachTeam() {
    this.areBestPlayersForEachTeamSelected = !this.areBestPlayersForEachTeamSelected;
  }

  set addedToSquadPlayer(value: PlayerSquadRecord) {
    if (this.squadPlayers.length <= 0) {
      return;
    }
    let matchedPlayer: PlayerSquadRecord | undefined = this.squadPlayers.find((x) => x.playerObject.playerID == value.playerObject.playerID);
    if (matchedPlayer != null) {
      matchedPlayer.isRemoved = false;
    }
    else {
      this.squadPlayers.push(value);
      this.squadPlayers.sort((a, b) => 
      DEFAULT_POSITIONS.indexOf(a.position) - DEFAULT_POSITIONS.indexOf(b.position) || b.price - a.price);
    }

    this.squadPlayers  = Object.assign([], this.squadPlayers);
  }

  public lowerBoundPrice: number | undefined = undefined;
  public upperBoundPrice: number | undefined = undefined;
  public positions: string[] | undefined = [];
  public teams: string[] | undefined = [];
  public powerPlayUnits: string[] | undefined = [];
  public playersAreNotPlayedDisabled: boolean = true;
  public hideLowGPPlayersEnabled: boolean = false;
  public shouldDeselectAllSelectedPlayers: boolean = false;

  public teamPlayerExpectedOfoMap: Map<number, Map<Date, PlayerExpectedFantasyPointsInfo[]>> = new Map<number, Map<Date, PlayerExpectedFantasyPointsInfo[]>>();

  private formLength: number = DEFAULT_FORM_LENGTH;

  public _selectedUser: string | undefined = undefined;
  set selectedUser(value: string | undefined) {
    this._selectedUser = value;
    this.squadPlayers = [];
    this.getUserSquad();
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

  public selectedPlayers: Map<string, SelectedPlayerModel[]> = new Map<
    string,
    SelectedPlayerModel[]
  >();

  public filteredTeamGames: Map<number, TeamGameInformation[]> = new Map<
    number,
    TeamGameInformation[]
  >();

  constructor(private http: HttpClient, private ngxLoader: NgxUiLoaderService, private _observablesProxyHandlingService: ObservablesProxyHandlingService) {
    this.getCalendarData(true);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedUser']?.currentValue) {
      this.getUserSquad();
    }
  }

  public formLengthChanged(event: any) {
    this.formLength = event;
    this.getCalendarData(false);
  }

  public deselectAllSelectedPlayers() {
    this.shouldDeselectAllSelectedPlayers = !this.shouldDeselectAllSelectedPlayers;
  }

  private getCalendarData(setDefaultDates: boolean) {
    this.ngxLoader.start();
    this.http
      .get<GamesDTO>(
        `https://qwerhnatkiv-backend.azurewebsites.net/predictions/games/get?formLength=${this.formLength}`
      )
      .subscribe({
        next: (result) => {
          this.games = result.gamePredictions.sort(
            (n1, n2) => n1.weekNumber - n2.weekNumber
          );

          this.teamStats = result.teamsStats;
          this.playerStats = result.playerStats;
          this.updateLogInfomation = result.updateLogInformation;
          this.setUpFilters(setDefaultDates);
        },
        error: (err) => {
          console.error(err);
        },
        complete: () => this.ngxLoader.stop(),
      });
  }

  private setUpFilters(setDefaultDates: boolean) {
    let upcomingWeeks: number[] = this.games
      ?.filter((x) => !x.isOldGame)
      .map((x) => x.weekNumber)
      .filter(Utils.onlyUnique)
      .sort((n1, n2) => n1 - n2);

    if (setDefaultDates) {
      this.setFiltersDefaultDates(upcomingWeeks, this.games.filter((x) => !x.isOldGame));
    }
    this.updateFilteredTeamsGamesMap();
    this.setOfoDataForPlayers();
  }

  public handleMinimumDateFilterChange(event: MatDatepickerInputEvent<Moment>) {
    this.minFilterDate = event.value?.toDate();
    this.updateFilteredTeamsGamesMap();
    this.setOfoDataForPlayers();
  }

  public handleMaximumDateFilterChange(event: MatDatepickerInputEvent<Moment>) {
    this.maxFilterDate = event.value?.toDate();
    this.updateFilteredTeamsGamesMap();
    this.setOfoDataForPlayers();
  }

  private setFiltersDefaultDates(
    weeks: number[],
    games: GamePredictionDTO[]
  ): void {
    let minDate: Date = GamesUtils.getExtremumDateForGames(games, false);
    this.minFilterDate = new Date(minDate.getTime());

    if (weeks.length === 0) {
      this.minFilterDate = new Date();
      this.maxFilterDate = new Date();
      return;
    }

    weeks.forEach((week) => {
      let weekGames: GamePredictionDTO[] = games.filter(
        (game) => game.weekNumber == week
      );
      let thisWeekMinDate: Date = GamesUtils.getExtremumDateForGames(
        weekGames,
        false
      );
      let thisWeekMaxDate: Date = GamesUtils.getExtremumDateForGames(
        weekGames,
        true
      );

      if (
        thisWeekMinDate.getTime() <= minDate.getTime()! &&
        thisWeekMaxDate.getTime() >= minDate.getTime()!
      ) {
        let nextWeekGames: GamePredictionDTO[] = games.filter(
          (game) => game.weekNumber == week + 1
        );

        let nextWeekMinDate: Date | undefined =
        nextWeekGames?.length > 0
          ? GamesUtils.getExtremumDateForGames(nextWeekGames, false)
          : undefined;

        let nextWeekMaxDate: Date = nextWeekGames.length > 0 
          ? GamesUtils.getExtremumDateForGames(
            nextWeekGames,
            true
          )
          : thisWeekMaxDate;

        let today: Date = new Date();
        this.minFilterDate = today.getDay() != 0 ? this.minFilterDate : nextWeekMinDate;
        this.maxFilterDate = today.getDay() != 0 ? thisWeekMaxDate : nextWeekMaxDate;
      }
    });
  }

  private updateFilteredTeamsGamesMap() {
    let newMap: Map<number, TeamGameInformation[]> = new Map<
      number,
      TeamGameInformation[]
    >();
    for (var i = 0, n = this.teamStats?.length!; i < n; ++i) {
      let teamStats: TeamStatsDTO = this.teamStats![i];

      let gamesByDateRange: GamePredictionDTO[] = this.games.filter(
        (x) =>
          new Date(x.gameDate).getTime() <= this.maxFilterDate?.getTime()! &&
          new Date(x.gameDate).getTime() >= this.minFilterDate?.getTime()! &&
          (x.awayTeamId == teamStats.teamID || x.homeTeamId == teamStats.teamID)
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
    let minDate: string = this.minFilterDate
      ?.toISOString()
      .replace(':', '%3A')
      .split('.')[0]!;

    let maxDate: string = Utils.addDateDays(this.maxFilterDate!, 1)
      .toISOString()
      .replace(':', '%3A')
      .split('.')[0]!;

    this.http
      .get<{ [index: number]: PlayerExpectedFantasyPointsDTO[] }>(
        `https://qwerhnatkiv-backend.azurewebsites.net/predictions/ofo_predictions/get?lowerBoundDate=${minDate}&upperBoundDate=${maxDate}&formLength=${this.formLength}`
      )
      .subscribe({
        next: (result) => {
          let localOfoMap: Map<number, PlayerExpectedFantasyPointsDTO[]> =
            new Map<number, PlayerExpectedFantasyPointsDTO[]>();

          let keys: string[] = Object.keys(result);
          let key: number;

          this.teamPlayerExpectedOfoMap = new Map<number, Map<Date, PlayerExpectedFantasyPointsInfo[]>>();

          for (var i = 0, n = keys.length; i < n; ++i) {
            key = +keys[i];
            localOfoMap.set(key, result[key]);

            this.setTop3PlayersForEachTeam(key, result[key]);
          }

          for (let [_, gameOfoMap] of this.teamPlayerExpectedOfoMap) {
            for (let [dateKey, value] of gameOfoMap) {
              value = value.sort((n1, n2) => n2.playerExpectedFantasyPoints - n1.playerExpectedFantasyPoints);
              gameOfoMap.set(dateKey, value.splice(0, 3));
            }
          }

          this.playerGamesOfoMap = localOfoMap;
          this.getUserSquad();
        },
        error: (err) => {
          console.error(err);
        },
        complete: () => this.ngxLoader.stop(),
      });
  }

  private getUserSquad() {
    if (this._selectedUser == null || this._selectedUser == "") {
      this.squadPlayers = [];
      this.balanceValue = 0;
      return;
    }

    this.ngxLoader.start();
    this.http
      .get<SportsSquadDTO>(
        `https://qwerhnatkiv-backend.azurewebsites.net/sportsSquad?accountId=${USER_ID_NAME.get(
          this._selectedUser
        )}`
      )
      .subscribe({
        next: (result) => {
          let removedIds: Array<number> = this.squadPlayers.filter((x) => x.isRemoved).map((x) => x.playerObject.playerID);
          let addedIds: Array<number> = this.squadPlayers.filter((x) => x.isNew).map((x) => x.playerObject.playerID);
          this.squadPlayers = []

          this.balanceValue = result.balance;
          this.substitutionsLeft = result.substitutions;
          for (var i = 0, n = result.players.length; i < n; ++i) {
            let matchingPlayerInfo: PlayerStatsDTO = this.playerStats.find(
              (x) => x.playerIdSports == result.players[i].id
            )!;

            let matchingTeam: TeamStatsDTO = this.teamStats?.find(
              (team) => team.teamID == matchingPlayerInfo.teamID
            )!;

            let ofo: number = this.playerGamesOfoMap
              ?.get(matchingPlayerInfo.playerID)
              ?.reduce(
                (partialSum, x) => partialSum + x.playerExpectedFantasyPoints,
                0.0
              )!;

            this.squadPlayers.push({
              playerName: matchingPlayerInfo.playerName,
              position: matchingPlayerInfo.position,
              price: matchingPlayerInfo.price,
              gamesCount: this.filteredTeamGames.get(matchingPlayerInfo.teamID)?.length!,
              expectedFantasyPoints: ofo ?? 0,
              isRemoved: removedIds.includes(matchingPlayerInfo.playerID),
              isNew: addedIds.includes(matchingPlayerInfo.playerID),
              playerObject: matchingPlayerInfo,
              teamObject: matchingTeam,
              powerPlayNumber: GamesUtils.GetPPText(matchingPlayerInfo.formPowerPlayNumber),
            });
          }

          for (var i = 0, n = addedIds.length; i < n; ++i) {
            let matchingPlayerInfo: PlayerStatsDTO = this.playerStats.find(
              (x) => x.playerID == addedIds[i]
            )!;

            let matchingTeam: TeamStatsDTO = this.teamStats?.find(
              (team) => team.teamID == matchingPlayerInfo.teamID
            )!;

            let ofo: number = this.playerGamesOfoMap
              ?.get(matchingPlayerInfo.playerID)
              ?.reduce(
                (partialSum, x) => partialSum + x.playerExpectedFantasyPoints,
                0.0
              )!;

            this.squadPlayers.push({
              playerName: matchingPlayerInfo.playerName,
              position: matchingPlayerInfo.position,
              price: matchingPlayerInfo.price,
              gamesCount: this.filteredTeamGames.get(matchingPlayerInfo.teamID)?.length!,
              expectedFantasyPoints: ofo ?? 0,
              isRemoved: removedIds.includes(matchingPlayerInfo.playerID),
              isNew: addedIds.includes(matchingPlayerInfo.playerID),
              playerObject: matchingPlayerInfo,
              teamObject: matchingTeam,
              powerPlayNumber: GamesUtils.GetPPText(matchingPlayerInfo.formPowerPlayNumber),
            });
          }

          this.squadPlayers.sort((a, b) => 
            DEFAULT_POSITIONS.indexOf(a.position) - DEFAULT_POSITIONS.indexOf(b.position) || b.price - a.price);
        },
        error: (err) => {
          console.error(err);
        },
        complete: () => this.ngxLoader.stop(),
      });
  }

  private setTop3PlayersForEachTeam(playerId: number, playersOfoDataArray: PlayerExpectedFantasyPointsDTO[]) {
    if (playersOfoDataArray.length == 0) {
      return;
    }

    let teamID: number = playersOfoDataArray[0].teamID;

    if (!this.teamPlayerExpectedOfoMap.has(teamID)) {
      this.teamPlayerExpectedOfoMap.set(teamID, new Map<Date, PlayerExpectedFantasyPointsInfo[]>());
    }

    let playerStat: PlayerStatsDTO = this.playerStats.find((y) => playerId == y.playerID)!;
  
    if (playerStat == null) {
      return;
    }

    playersOfoDataArray.forEach((x) => {
      let playerOfoSum = x.playerExpectedFantasyPoints;
      let game: GamePredictionDTO = this.games.find((y) => y.gameId == x.gameID)!;

      let gameOfoMap: Map<Date, PlayerExpectedFantasyPointsInfo[]> = this.teamPlayerExpectedOfoMap.get(teamID)!;
      if (!gameOfoMap.has(game.gameDate)) {
        gameOfoMap.set(game.gameDate, []);
      }
  
      let powerPlayInfo: string = playerStat.formPowerPlayNumber > 0
            ? `ПП${playerStat.formPowerPlayNumber}`
            : 'нет'
  
      let modelInfo: PlayerExpectedFantasyPointsInfo = {
        playerName: playerStat.playerName,
        playerExpectedFantasyPoints: playerOfoSum,
        price: playerStat.price,
        powerPlayNumber: powerPlayInfo,
        isFire: false
      };

      gameOfoMap.get(game.gameDate)?.push(modelInfo);
    });
  }
}
