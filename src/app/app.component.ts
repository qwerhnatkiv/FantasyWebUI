import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { GamePredictionDTO } from './interfaces/game-prediction-dto';
import { GamesUtils } from './common/games-utils';
import { Utils } from './common/utils';
import { GamesDTO } from './interfaces/games-dto';
import { TeamStatsDTO } from './interfaces/team-stats-dto';
import { PlayerStatsDTO } from './interfaces/player-stats-dto';

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

  constructor(http: HttpClient, private ngxLoader: NgxUiLoaderService) {
    this.ngxLoader.start();
    http
      .get<GamesDTO>(
        'https://qwerhnatkiv.bsite.net/predictions/games/get'
      )
      .subscribe({
        next: (result) => {
          console.log(result);
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
        complete: () => this.ngxLoader.stop()
      });
  }

  private setUpFilters() {
    let weeks: number[] = this.games
      ?.map((x) => x.weekNumber)
      .filter(Utils.onlyUnique)
      .sort((n1, n2) => n1 - n2);

    this.setFiltersDefaultDates(weeks, this.games);
  }

  private setFiltersDefaultDates(
    weeks: number[],
    games: GamePredictionDTO[],
  ): void {

    let minDate: Date = GamesUtils.getExtremumDateForGames(games, false);
    let today = new Date();
    this.minFilterDate =
      minDate > today ? new Date(minDate.getTime()) : new Date(today.getTime());

    weeks.forEach((week) => {

      let weekGames: GamePredictionDTO[] = games.filter((game) => game.weekNumber == week);
      let thisWeekMinDate: Date = GamesUtils.getExtremumDateForGames(weekGames, false);
      let thisWeekMaxDate: Date = GamesUtils.getExtremumDateForGames(weekGames, true);

      if (
        thisWeekMinDate.getTime() <= this.minFilterDate?.getTime()! &&
        thisWeekMaxDate.getTime() >= this.minFilterDate?.getTime()!
      ) {
        this.maxFilterDate = GamesUtils.getExtremumDateForGames(
          games.filter((game) => game.weekNumber == week + 1), true
        );
      }

    });
  }
}
