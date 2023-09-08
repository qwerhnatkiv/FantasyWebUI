import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MatTableDataSource } from '@angular/material/table';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { parse } from 'date-fns';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  columns: Array<TableColumn> = [];
  columnsToDisplay: string[] = this.columns.map((x) => x.header).slice();
  dataSourceArray: any[] = [];
  dataSource: MatTableDataSource<any> = new MatTableDataSource(
    this.dataSourceArray
  );

  title = 'Fantasy Web';

  isCalendarVisible = true;
  maxFilterDate: Date | undefined = undefined;
  minFilterDate: Date | undefined = undefined;

  private teamWeeksToStrikethrough: TeamWeek[] = [];

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

    let weeks: number[] = games
      ?.map((x) => x.weekNumber)
      .filter(this.onlyUnique)
      .sort((n1, n2) => n1 - n2);

    this.setTeamWeeksToStrike(games, weeks, teams);

    const datepipe: DatePipe = new DatePipe('en-US');
    this.columns = this.generateAllColumns(weeks, games, datepipe);

    this.columnsToDisplay = ['team'].concat(
      this.columns.map((x) => x.header).slice()
    );

    teams.forEach((teamName) => {
      let currentWeekName: string = '';

      let teamSpecificRow: TableCell[] = [new TableCell(teamName, teamName)];
      this.columns.forEach((column) => {
        let homeGame: GamePredictionDTO | undefined = games.find(
          (x) =>
            x.homeTeamName == teamName &&
            datepipe.transform(x.gameDate, 'dd.MM')! == column.header
        );
        if (homeGame != null) {
          teamSpecificRow.push(
            new TableCell(
              homeGame.awayTeamAcronym,
              homeGame.homeTeamWinChance,
              this.teamWeeksToStrikethrough.find(
                (item) =>
                  teamName == item.teamName && homeGame?.weekNumber == item.week
              )?.gamesCount,
              homeGame
            )
          );
          return;
        }

        let awayGame: GamePredictionDTO | undefined = games.find(
          (x) =>
            x.awayTeamName == teamName &&
            datepipe.transform(x.gameDate, 'dd.MM')! == column.header
        );
        if (awayGame != null) {
          teamSpecificRow.push(
            new TableCell(
              '@' + awayGame.homeTeamAcronym,
              awayGame.awayTeamWinChance,
              this.teamWeeksToStrikethrough.find(
                (item) =>
                  teamName == item.teamName && awayGame?.weekNumber == item.week
              )?.gamesCount,
              awayGame
            )
          );
          return;
        }

        if (column.header.includes('w')) {
          let gamesForWeekCount: number = games.filter(
            (game) =>
              (game.homeTeamName == teamName ||
                game.awayTeamName == teamName) &&
              `w${game.weekNumber}` === column.header
          ).length;

          teamSpecificRow.push(
            new TableCell(gamesForWeekCount.toString(), gamesForWeekCount)
          );
          currentWeekName = column.header;
          return;
        }
        teamSpecificRow.push(
          new TableCell(
            '',
            -1,
            this.teamWeeksToStrikethrough.find(
              (item) =>
                teamName == item.teamName && `w${item.week}` === currentWeekName
            )?.gamesCount
          )
        );
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

  private setTeamWeeksToStrike(
    games: GamePredictionDTO[],
    weeks: number[],
    teams: string[]
  ) {
    teams.forEach((team) => {
      weeks.forEach((week) => {
        let gamesCount = games.filter(
          (game) =>
            game.weekNumber === week &&
            (team == game.homeTeamName || team == game.awayTeamName)
        ).length;

        if (gamesCount <= 1) {
          this.teamWeeksToStrikethrough.push(
            new TeamWeek(team, week, gamesCount)
          );
        }
      });
    });
  }

  public onMinDateChanged(event: MatDatepickerInputEvent<Date>): void {
    this.minFilterDate = event.value!;
  }

  public onMaxDateChanged(event: MatDatepickerInputEvent<Date>): void {
    this.maxFilterDate = event.value!;
  }

  public getCellClass(cell: TableCell, column: TableColumn) {
    let classStatement: string =
      this.minFilterDate != null &&
      this.maxFilterDate != null &&
      column.columnDef != null &&
      column.columnDef! >= this.minFilterDate &&
      column.columnDef! <= this.maxFilterDate
        ? 'calendar-cell-selected'
        : 'calendar-cell-not-selected';

    if (cell.weekGames! <= 1) {
      classStatement += ' strike';
    }

    return classStatement;
  }

  public getCellTextClass(cell: TableCell) {
    let numericValue: number = Number(cell.cellValue);

    // If not NaN when parsed to number, then it's week count cell
    if (cell.displayValue != '' && !isNaN(+cell.displayValue)) {
      if (cell.cellValue > 3) {
        return 'calendar-cell-week-green';
      }

      if (cell.cellValue < 2) {
        return 'calendar-cell-week-red';
      }

      return 'calendar-cell-week';
    }

    if (numericValue < 0) {
      return 'calendar-cell-empty';
    }

    if (numericValue >= 49) {
      return 'calendar-cell-green';
    }

    if (numericValue >= 30) {
      return 'calendar-cell-normal';
    }

    return 'calendar-cell-red';
  }

  public generateCellToolTip(game: GamePredictionDTO): string {
    if (game == null) {
      return '';
    }

    let generatedTooltip: string = `${
      game.homeTeamAcronym
    }: Победа ${Math.round(game.homeTeamWinChance)}% |
    ${game.awayTeamAcronym}: Победа ${Math.round(game.awayTeamWinChance)}% |
    `;

    return generatedTooltip;
  }

  public convertToDate(dateStr: string): Date {
    return parse(dateStr, 'dd.MM', new Date());
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

  private getDates(startDate: Date, endDate: Date): Date[] {
    var dateArray = new Array<Date>();
    var currentDate = startDate;
    while (currentDate <= endDate) {
      dateArray.push(new Date(currentDate));
      currentDate = this.addDateDays(currentDate, 1);
    }
    return dateArray;
  }

  private generateAllColumns(
    weeks: number[],
    games: GamePredictionDTO[],
    datepipe: DatePipe
  ): TableColumn[] {
    let minDate: Date = this.getMinDateForGames(games);
    let maxDate: Date = this.getMaxDateForGames(games);

    let today = new Date();
    this.minFilterDate =
      minDate > today ? new Date(minDate.getTime()) : new Date(today.getTime());

    let dates: Date[] = this.getDates(minDate, maxDate);

    let allColumns: TableColumn[] = [];
    weeks.forEach((week) => {
      let thisWeekMinDate: Date = this.getMinDateForGames(
        games.filter((game) => game.weekNumber == week)
      );
      let nextWeekMinDate: Date = this.getMinDateForGames(
        games.filter((game) => game.weekNumber == week + 1)
      );

      if (
        thisWeekMinDate.getTime() <= this.minFilterDate?.getTime()! &&
        nextWeekMinDate.getTime() >= this.minFilterDate?.getTime()!
      ) {
        this.maxFilterDate = this.getMaxDateForGames(
          games.filter((game) => game.weekNumber == week + 1)
        );
      }

      allColumns.push({
        columnDef: undefined,
        header: `w${week}`,
      });
      dates.forEach((date) => {
        if (date >= thisWeekMinDate && date < nextWeekMinDate) {
          allColumns.push({
            columnDef: date,
            header: datepipe.transform(date, 'dd.MM')!,
          });
        }
      });
    });

    return allColumns;
  }

  private addDateDays(date: Date, days: number): Date {
    if (!days) return date;
    let newDate: Date = date;
    newDate.setDate(newDate.getDate() + days);

    return newDate;
  }

  private getMinDateForGames(games: GamePredictionDTO[]): Date {
    if (games === undefined || games.length == 0) {
      return new Date(3000, 1, 1);
    }
    return new Date(
      games.reduce(
        (min, game) => (game.gameDate < min ? game.gameDate : min),
        games[0].gameDate
      )
    );
  }

  private getMaxDateForGames(games: GamePredictionDTO[]): Date {
    return new Date(
      games.reduce(
        (max, game) => (game.gameDate > max ? game.gameDate : max),
        games[0].gameDate
      )
    );
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
  columnDef: Date | undefined;
  header: string;
}

export class TableCell {
  public displayValue: string = '';
  public cellValue: any;
  public game: GamePredictionDTO | undefined;
  public weekGames: number | undefined;

  constructor(
    pDisplayValue: string,
    pCellValue: any,
    weekGames: number | undefined = undefined,
    pGame: GamePredictionDTO | undefined = undefined
  ) {
    this.displayValue = pDisplayValue;
    this.cellValue = pCellValue;
    this.game = pGame;
    this.weekGames = weekGames;
  }
}

export class TeamWeek {
  public teamName: string;
  public week: number;
  public gamesCount: number;

  constructor(teamName: string, week: number, gamesCount: number) {
    this.teamName = teamName;
    this.week = week;
    this.gamesCount = gamesCount;
  }
}
