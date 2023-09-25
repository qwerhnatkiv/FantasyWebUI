import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component } from '@angular/core';
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

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'Fantasy Web';

  public isCalendarVisible = true;
  public minFilterDate: Date | undefined = undefined;
  public maxFilterDate: Date | undefined = undefined;

  public games: GamePredictionDTO[] = [];
  public teamStats: TeamStatsDTO[] = [];

  public playerStats: PlayerStatsDTO[] = [];

  public lowerBoundPrice: number | undefined = undefined;
  public upperBoundPrice: number | undefined = undefined;
  public positions: string[] | undefined = [];
  public teams: string[] | undefined = [];
  public powerPlayUnits: string[] | undefined = [];
  public playerGamesOfoMap:
    | Map<number, PlayerExpectedFantasyPointsDTO[]>
    | undefined;

  public filteredTeamGames: Map<number, TeamGameInformation[]> = new Map<
    number,
    TeamGameInformation[]
  >();

  constructor(private http: HttpClient, private ngxLoader: NgxUiLoaderService) {
    this.ngxLoader.start();
    http
      .get<GamesDTO>('https://qwerhnatkiv.bsite.net/predictions/games/get')
      .subscribe({
        next: (result) => {
          this.games = result.gamePredictions.sort(
            (n1, n2) => n1.weekNumber - n2.weekNumber
          );

          this.teamStats = result.teamsStats;
          this.playerStats = result.playerStats;
          this.setUpFilters();
        },
        error: (err) => {
          console.error(err);
        },
        complete: () => this.ngxLoader.stop(),
      });
  }

  private setUpFilters() {
    let weeks: number[] = this.games
      ?.map((x) => x.weekNumber)
      .filter(Utils.onlyUnique)
      .sort((n1, n2) => n1 - n2);

    this.setFiltersDefaultDates(weeks, this.games);
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
    this.minFilterDate =
      minDate > today ? new Date(minDate.getTime()) : new Date(today.getTime());

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
            opponentTeamID: game.awayTeamId,
            winChance: game.homeTeamWinChance,
            isHome: true,
            gameDate: game.gameDate,
          });
        } else {
          teamGameInformation.push({
            teamID: game.awayTeamId,
            opponentTeamID: game.homeTeamId,
            winChance: game.awayTeamWinChance,
            isHome: false,
            gameDate: game.gameDate,
          });
        }
      }

      newMap.set(teamStats.teamID, teamGameInformation);
    }

    this.filteredTeamGames = newMap;
  }

  private setOfoDataForPlayers() {
    this.ngxLoader.start();
    let minDate: string = this.minFilterDate?.toISOString().replace(":", "%3A").split('.')[0]!

    let maxDate: string = Utils.addDateDays(this.maxFilterDate!, 1).toISOString().replace(":", "%3A").split('.')[0]!

    this.http
      .get<{[index: number]: PlayerExpectedFantasyPointsDTO[]}>(
        `https://qwerhnatkiv.bsite.net/predictions/ofo_predictions/get?lowerBoundDate=${minDate}&upperBoundDate=${maxDate}`
      )
      .subscribe({
        next: (result) => {
          let localOfoMap: Map<number, PlayerExpectedFantasyPointsDTO[]> = new Map<number, PlayerExpectedFantasyPointsDTO[]>();

          let keys: string[] = Object.keys(result);
          let key: number;

          for (var i = 0, n = keys.length; i < n; ++i) {
            key = +keys[i];
            localOfoMap.set(key, result[key])
          }

          this.playerGamesOfoMap = localOfoMap;
        },
        error: (err) => {
          console.error(err);
        },
        complete: () => this.ngxLoader.stop(),
      });
  }

  private setTopPlayersForEachTeam() {
    let topPlayersMap: Map<string, Map<number, PlayerExpectedFantasyPointsInfo>> = 
      new Map<string, Map<number, PlayerExpectedFantasyPointsInfo>>();

      // mp.forEach((values, keys) => {
      //   console.log(values, keys)
      // )

  }
}
