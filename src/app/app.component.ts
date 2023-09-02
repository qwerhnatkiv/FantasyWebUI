import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  columns: Array<TableColumn> = [];
  columnsToDisplay: string[] = this.columns.map((x) => x.columnDef).slice();
  dataSourceArray: any[] = [];
  dataSource: MatTableDataSource<any> = new MatTableDataSource(this.dataSourceArray);

  isCalendarVisible = true;

  constructor(http: HttpClient, private ngxLoader: NgxUiLoaderService) {
    this.ngxLoader.start();
    http
      .get<GamePredictionDTO[]>(
        'https://qwerhnatkiv.bsite.net/predictions/games/get'
      )
      .subscribe({
        next: (result) => {
          let games: GamePredictionDTO[] = result.sort(
            (n1, n2) => n1.weekNumber - n2.weekNumber
          );

          this.setUpDataSourceAndColumns(games);
          this.ngxLoader.stop();
        },
        error: (err) => {
          console.error(err);
          this.ngxLoader.stop();
        },
      });
  }

  private setUpDataSourceAndColumns(games: GamePredictionDTO[]) {
    let teams: string[] = games
      ?.map((x) => x.homeTeamName)
      .filter(this.onlyUnique)
      .sort((n1, n2) => this.sortTypes(n1, n2));

    let dates: Date[] = games
      ?.map((x) => x.gameDate)
      .filter(this.onlyUnique)
      .sort((n1, n2) => this.sortTypes(n1, n2));

    this.columns = [];

    const datepipe: DatePipe = new DatePipe('en-US');
    dates.forEach((x) =>
      this.columns.push({
        columnDef: datepipe.transform(x, 'dd.MM')!,
        header: datepipe.transform(x, 'dd.MM')!,
      })
    );

    this.columnsToDisplay = ['team'].concat(
      this.columns.map((x) => x.columnDef).slice()
    );
    teams.forEach((teamName) => {
      let teamSpecificRow: string[] = [teamName];
      dates.forEach((date) => {
        let homeGame: GamePredictionDTO | undefined = games.find(
          (x) => x.homeTeamName == teamName && x.gameDate == date
        );
        if (homeGame != null) {
          teamSpecificRow.push(homeGame.awayTeamAcronym);
          return;
        }

        let awayGame: GamePredictionDTO | undefined = games.find(
          (x) => x.awayTeamName == teamName && x.gameDate == date
        );
        if (awayGame != null) {
          teamSpecificRow.push('@' + awayGame.homeTeamAcronym);
          return;
        }

        teamSpecificRow.push('');
      });

      this.dataSourceArray.push(
        Object.fromEntries(
          this.columnsToDisplay.map((_, i) => [
            this.columnsToDisplay[i],
            teamSpecificRow[i],
          ])
        )
      );
    });
    console.log(this.dataSource);
  }

  private sortTypes(n1: any, n2: any) {
    if (n1 > n2) {
      return 1;
    }

    if (n1 < n2) {
      return -1;
    }

    return 0;
  }

  private onlyUnique(value: any, index: number, array: any[]) {
    return array.indexOf(value) === index;
  }
}

interface GamePredictionDTO {
  homeTeamName: string;
  homeTeamAcronym: string;
  awayTeamName: string;
  awayTeamAcronym: string;
  gameDate: Date;
  homeTeamWinChance: number;
  awayTeamWinChance: number;
  drawChance: number;
  weekNumber: number;
}

export interface TableColumn {
  columnDef: string;
  header: string;
}
