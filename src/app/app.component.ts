import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  SimpleChanges,
  ViewChild,
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
import { DEFAULT_FORM_LENGTH, USER_ID_NAME } from 'src/constants';
import { OfoVariant } from './interfaces/ofo-variant';
import { PlayersTableComponent } from './players-table/players-table.component';

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

  public playerStats: PlayerStatsDTO[] = [];
  public squadPlayers: PlayerSquadRecord[] = [];

  public lowerBoundPrice: number | undefined = undefined;
  public upperBoundPrice: number | undefined = undefined;
  public positions: string[] | undefined = [];
  public teams: string[] | undefined = [];
  public powerPlayUnits: string[] | undefined = [];
  public playersAreNotPlayedDisabled: boolean = true;
  public hideLowGPPlayersEnabled: boolean = true;
  public shouldDeselectAllSelectedPlayers: boolean = false;

  public teamPlayerExpectedOfoMap: Map<number, Map<Date, PlayerExpectedFantasyPointsInfo[]>> = new Map<number, Map<Date, PlayerExpectedFantasyPointsInfo[]>>();

  private formLength: number = DEFAULT_FORM_LENGTH;

  public _selectedUser: string | undefined = undefined;
  set selectedUser(value: string | undefined) {
    this._selectedUser = value;
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

  constructor(private http: HttpClient, private ngxLoader: NgxUiLoaderService) {
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
          this.setUpFilters(setDefaultDates);
        },
        error: (err) => {
          console.error(err);
        },
        complete: () => this.ngxLoader.stop(),
      });
  }

  private setUpFilters(setDefaultDates: boolean) {
    let weeks: number[] = this.games
      ?.map((x) => x.weekNumber)
      .filter(Utils.onlyUnique)
      .sort((n1, n2) => n1 - n2);

    if (setDefaultDates) {
      this.setFiltersDefaultDates(weeks, this.games);
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
    let today = new Date();
    this.minFilterDate = new Date(minDate.getTime());
    // minDate > today ? new Date(minDate.getTime()) : new Date(today.getTime());

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
        thisWeekMinDate.getTime() <= this.minFilterDate?.getTime()! &&
        thisWeekMaxDate.getTime() >= this.minFilterDate?.getTime()!
      ) {
        this.maxFilterDate = GamesUtils.getExtremumDateForGames(
          games.filter((game) => game.weekNumber == week + 1),
          true
        );
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
          this.squadPlayers = [];

          for (var i = 0, n = result.players.length; i < n; ++i) {
            let matchingPlayerInfo: PlayerStatsDTO = this.playerStats.find(
              (x) => x.playerIdSports == result.players[i].id
            )!;

            let ofo: number = this.playerGamesOfoMap
              ?.get(matchingPlayerInfo.playerID)
              ?.reduce(
                (partialSum, x) => partialSum + x.playerExpectedFantasyPoints,
                0.0
              )!;

            let gamesCount: number = this.playerGamesOfoMap?.get(
              matchingPlayerInfo.playerID
            )?.length!;

            this.squadPlayers.push({
              playerId: matchingPlayerInfo.playerID,
              playerName: matchingPlayerInfo.playerName,
              position: matchingPlayerInfo.position,
              price: matchingPlayerInfo.price,
              games: gamesCount,
              expectedFantasyPoints: ofo,
            });
          }
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
