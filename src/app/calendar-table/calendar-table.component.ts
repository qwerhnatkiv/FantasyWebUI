import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { TableColumn } from '../interfaces/table-column';
import { TeamWeek } from '../classes/team-week';
import { GamePredictionDTO } from '../interfaces/game-prediction-dto';
import { GamesUtils } from '../common/games-utils';
import { DEFAULT_DATE_FORMAT } from 'src/constants';
import { TableCell } from '../classes/table-cell';
import { Utils } from '../common/utils';

@Component({
  selector: 'app-calendar-table',
  templateUrl: './calendar-table.component.html',
  styleUrls: ['./calendar-table.component.css'],
})
export class CalendarTableComponent implements OnChanges {
  private dataSourceArray: any[] = [];
  private teamWeeksToStrikethrough: TeamWeek[] = [];

  public columns: Array<TableColumn> = [];
  public columnsToDisplay: string[] = this.columns.map((x) => x.header).slice();
  public dataSource: MatTableDataSource<any> = new MatTableDataSource(
    this.dataSourceArray
  );

  @Input() minFilterDate: Date | undefined;
  @Input() maxFilterDate: Date | undefined;
  @Input() isCalendarVisible: boolean = false;
  @Input() games: GamePredictionDTO[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['games'].previousValue &&
      changes['games'].currentValue &&
      changes['games'].previousValue.length !=
        changes['games'].currentValue.length
    ) {
      this.setUpDataSourceAndColumns(this.games);
    }
  }

  public setUpDataSourceAndColumns(games: GamePredictionDTO[]) {
    let teams: string[] = games
      ?.map((x) => x.homeTeamName)
      .filter(Utils.onlyUnique)
      .sort((n1, n2) => Utils.sortTypes(n1, n2));

    let weeks: number[] = games
      ?.map((x) => x.weekNumber)
      .filter(Utils.onlyUnique)
      .sort((n1, n2) => n1 - n2);

    this.setTeamWeeksToStrike(games, weeks, teams);

    const datepipe: DatePipe = new DatePipe('en-US');
    this.columns = this.generateTableColumns(weeks, games, datepipe);

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

  private generateTableColumns(
    weeks: number[],
    games: GamePredictionDTO[],
    datepipe: DatePipe
  ): TableColumn[] {
    let allColumns: TableColumn[] = [];

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

      let weekDates: Date[] = Utils.getDatesInRange(
        thisWeekMinDate,
        thisWeekMaxDate
      );

      allColumns.push({
        columnDef: undefined,
        header: `w${week}`,
      });

      weekDates.forEach((date) => {
        allColumns.push({
          columnDef: date,
          header: datepipe.transform(date, DEFAULT_DATE_FORMAT)!,
        });
      });
    });

    return allColumns;
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
}
