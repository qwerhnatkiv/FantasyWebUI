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
  dataSource: MatTableDataSource<any> = new MatTableDataSource(
    this.dataSourceArray
  );

  title = "Fantasy Web";

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

    let minDate: Date = new Date(games.reduce((min, game) => game.gameDate < min ? game.gameDate : min, games[0].gameDate));
    let maxDate: Date = new Date(games.reduce((max, game) => game.gameDate > max ? game.gameDate : max, games[0].gameDate));

    const datepipe: DatePipe = new DatePipe('en-US');
    let dates: Date[] = this.getDates(minDate, maxDate, datepipe);

    this.columns = [];

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
      let teamSpecificRow: TableCell[] = [new TableCell(teamName, teamName)];
      dates.forEach((date) => {
        let formattedGameDate: string | null = datepipe.transform(date, 'dd.MM');

        let homeGame: GamePredictionDTO | undefined = games.find(
          (x) => x.homeTeamName == teamName && datepipe.transform(x.gameDate, 'dd.MM')! == formattedGameDate!
        );
        if (homeGame != null) {
          teamSpecificRow.push(new TableCell(homeGame.awayTeamAcronym, homeGame.homeTeamWinChance, homeGame));
          return;
        }

        let awayGame: GamePredictionDTO | undefined = games.find(
          (x) => x.awayTeamName == teamName && datepipe.transform(x.gameDate, 'dd.MM')! == formattedGameDate!
        );
        if (awayGame != null) {
          teamSpecificRow.push(new TableCell('@' + awayGame.homeTeamAcronym, awayGame.awayTeamWinChance, awayGame));
          return;
        }

        teamSpecificRow.push(new TableCell( '', -1));
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
  }

  public getCellClass(value: any) {
    let numericValue = Number(value);

    if (numericValue < 0) {
      return "calendar-cell-empty";
    }

    if (numericValue >= 49) {
      return "calendar-cell-green";
    }

    if (numericValue >= 30) {
      return "calendar-cell-normal";
    }

    return "calendar-cell-red";
  }

  public generateCellToolTip(game: GamePredictionDTO): string {

    if (game == null) {
      return '';
    }

    let generatedTooltip: string = 
    `${game.homeTeamAcronym}: Победа ${Math.round(game.homeTeamWinChance)}% |
    ${game.awayTeamAcronym}: Победа ${Math.round(game.awayTeamWinChance)}% |
    `;

    return generatedTooltip;
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

  private getDates(startDate: Date, endDate: Date, datepipe: DatePipe): Date[] {
    var dateArray = new Array<Date>();
    var currentDate = startDate;
    while (currentDate <= endDate) {
      dateArray.push(new Date(currentDate));
      currentDate = this.addDateDays(currentDate, 1);
    }
    return dateArray;
  }

  private addDateDays(date: Date, days: number): Date {
    if (!days) return date;
    let newDate: Date = date;
    newDate.setDate(newDate.getDate() + days);
 
    return newDate;
 };

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

export class TableCell {
  public displayValue: string = '';
  public cellValue: any;
  public game: GamePredictionDTO | undefined;

  constructor(pDisplayValue: string, pCellValue: any, pGame: GamePredictionDTO | undefined = undefined) {
    this.displayValue = pDisplayValue;
    this.cellValue = pCellValue;
    this.game = pGame;
  }
}
