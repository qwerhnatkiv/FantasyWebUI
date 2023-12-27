import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { TableColumn } from '../interfaces/table-column';
import { TeamWeek } from '../classes/team-week';
import { GamePredictionDTO } from '../interfaces/game-prediction-dto';
import { GamesUtils } from '../common/games-utils';
import {
  DEFAULT_DATE_FORMAT,
  GREEN_TEAM_GF_BOUNDARY,
  GREEN_WIN_LOWER_BOUNDARY,
  RED_TEAM_GA_BOUNDARY,
  TEAM_NAME_LOGO_PATH_MAP,
  VERY_GREEN_WIN_LOWER_BOUNDARY,
  WHITE_WIN_LOWER_BOUNDARY,
} from 'src/constants';
import { TableCell } from '../classes/table-cell';
import { Utils } from '../common/utils';
import { TeamStatsDTO } from '../interfaces/team-stats-dto';
import { SelectedPlayerModel } from '../interfaces/selected-player-model';

import { cloneDeep } from 'lodash';
import { PlayerExpectedFantasyPointsInfo } from '../interfaces/player-efp-info';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-calendar-table',
  templateUrl: './calendar-table.component.html',
  styleUrls: ['./calendar-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarTableComponent implements OnChanges, OnInit, OnDestroy {
  private dataSourceArray: any[] = [];
  private teamWeeksToStrikethrough: TeamWeek[] = [];
  private datepipe: DatePipe = new DatePipe('en-US');
  private numberPipe: DecimalPipe = new DecimalPipe('en-US');

  public columns: Array<TableColumn> = [];
  public columnsToDisplay: string[] = this.columns.map((x) => x.header).slice();
  public dataSource: MatTableDataSource<any> = new MatTableDataSource(
    this.dataSourceArray
  );

  public teamNameLogoPathMap: any = TEAM_NAME_LOGO_PATH_MAP;
  public showOnlyGamesCount: boolean = false;

  @Input() minFilterDate: Date | undefined;
  @Input() maxFilterDate: Date | undefined;
  @Input() isCalendarVisible: boolean = false;
  @Input() games: GamePredictionDTO[] = [];
  @Input() teamStats: TeamStatsDTO[] = [];

  @Input() teamPlayerExpectedOfoMap: Map<
    number,
    Map<Date, PlayerExpectedFantasyPointsInfo[]>
  > = new Map<number, Map<Date, PlayerExpectedFantasyPointsInfo[]>>();

  @Input() selectedPlayers: Map<string, SelectedPlayerModel[]> = new Map<
    string,
    SelectedPlayerModel[]
  >();

  @Input() events: Observable<void> | undefined;

  private showOnlyGamesCountSubscription: Subscription | undefined;

  private savedCalendarRows: Map<string, any> = new Map<string, any>();

  ngOnInit() {
    this.showOnlyGamesCountSubscription = this.events?.subscribe(
      () => (this.showOnlyGamesCount = !this.showOnlyGamesCount)
    );
  }

  ngOnDestroy() {
    this.showOnlyGamesCountSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['games']?.previousValue &&
      changes['games']?.currentValue &&
      changes['games'].previousValue.length !=
        changes['games'].currentValue.length
    ) {
      this.setUpDataSourceAndColumns(this.games);
    }

    if (changes['selectedPlayers']?.currentValue) {
      for (let [key, valueRow] of this.savedCalendarRows) {
        if (this.selectedPlayers.has(valueRow.team.displayValue)) {
          continue;
        }

        var index = this.dataSourceArray.findIndex(
          (x) => x.team.cellValue == valueRow.team.cellValue
        );
        let concreteRow: any = this.dataSourceArray[index];

        for (const key in valueRow) {
          concreteRow[key].displayValue = valueRow[key].displayValue;
        }
      }

      for (let [key, value] of this.selectedPlayers) {
        let rowToReplace: any = this.dataSourceArray.find(
          (x) => x.team.cellValue == key
        );

        if (!this.savedCalendarRows.has(key)) {
          this.savedCalendarRows.set(key, cloneDeep(rowToReplace));
        }

        rowToReplace.team.displayValue = value[0].playerName + ' (ОФО)';
        for (let game of value) {
          let gameDateStr: string = this.datepipe.transform(
            game.gameDate,
            DEFAULT_DATE_FORMAT
          )!;
          rowToReplace[gameDateStr].displayValue =
            game.playerExpectedFantasyPoints;
        }
      }
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

    this.columns = this.generateTableColumns(weeks, games);

    this.columnsToDisplay = ['team'].concat(
      this.columns.map((x) => x.header).slice()
    );

    for (var i = 0, n = teams.length; i < n; ++i) {
      let teamName: string = teams[i];

      let currentWeekName: string = '';

      let teamSpecificRow: TableCell[] = [new TableCell(teamName, teamName)];

      for (var j = 0, k = this.columns.length; j < k; ++j) {
        let column: TableColumn = this.columns[j];

        let homeGame: GamePredictionDTO | undefined = games.find(
          (x) =>
            x.homeTeamName == teamName &&
            this.datepipe.transform(x.gameDate, 'dd.MM')! == column.header
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
          continue;
        }

        let awayGame: GamePredictionDTO | undefined = games.find(
          (x) =>
            x.awayTeamName == teamName &&
            this.datepipe.transform(x.gameDate, 'dd.MM')! == column.header
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
          continue;
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
          continue;
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
      }

      this.dataSourceArray.push(
        Object.fromEntries(
          this.columnsToDisplay.map((_, i) => [
            this.columnsToDisplay[i],
            teamSpecificRow[i],
          ])
        )
      );
    }
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
    if (
      cell.displayValue != '' &&
      !isNaN(+cell.displayValue) &&
      cell.game == null
    ) {
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

    if (numericValue >= VERY_GREEN_WIN_LOWER_BOUNDARY) {
      return 'calendar-cell-very-green';
    }

    if (numericValue >= GREEN_WIN_LOWER_BOUNDARY) {
      return 'calendar-cell-green';
    }

    if (numericValue >= WHITE_WIN_LOWER_BOUNDARY) {
      return 'calendar-cell-normal';
    }

    return 'calendar-cell-red';
  }

  public isWeekColumn(column: TableColumn): boolean {
    return column.header.includes('w');
  }

  public isPlayerSelectedCell(element: any, cell: TableCell): boolean {
    return (
      element['team'].displayValue.includes('ОФО') &&
      cell.game != null &&
      !isNaN(+cell.displayValue)
    );
  }

  public areOddsFromBookmakers(cell: TableCell): boolean {
    return cell.game != null && cell.game.isFromBookmakers;
  }

  public getSelectedPlayerCellOpponentName(
    element: any,
    cell: TableCell
  ): string {
    let playersTeamName: string = element['team'].cellValue;

    if (playersTeamName == cell.game?.homeTeamName) {
      return cell.game?.awayTeamName!;
    } else {
      return cell.game?.homeTeamName!;
    }
  }

  public generateTeamCellToolTip(teamCell: TableCell): string | null {
    let header: string = `
      <div style="font-size: 20px; line-height: 19px; text-align: center;">
        ${teamCell.displayValue}
      </div>`;
    
    let teamStat: TeamStatsDTO | undefined = this.teamStats.find((x) => x.teamName == teamCell.displayValue);

    if (teamStat == null) {
      return null;
    }

    let gfForecastPimColor: string =
      teamStat.teamGoalsForm! <= GREEN_TEAM_GF_BOUNDARY
        ? 'white'
        : '#64ff8f';
      
    let gaForecastPimColor: string =
      teamStat.teamGoalsAwayForm! <= RED_TEAM_GA_BOUNDARY
        ? 'white'
        : '#ff7e7e';

    let averageTeamStat: string = `
          <div>
            <span style="color:${gfForecastPimColor}">
              ${this.numberPipe.transform(teamStat.teamGoalsForm, '1.0-1')} GF
            </span>
            <span>
            |
            </span>
            <span style="color:${gaForecastPimColor}">
              ${this.numberPipe.transform(teamStat.teamGoalsAwayForm, '1.0-1')} GA
            </span>
            <span>
            |
            </span>
            <span>
              ${this.numberPipe.transform(teamStat.teamFormSF, '1.0-1')} SF
            </span>
            <span>
            |
            </span>
            <span>
              ${this.numberPipe.transform(teamStat.teamFormSA, '1.0-1')} SA
            </span>
            <span>
            |
            </span>
            <span>
              ${this.numberPipe.transform(teamStat.teamFormXGF, '1.0-1')} xGF
            </span>
            <span>
            |
            </span>
            <span>
              ${this.numberPipe.transform(teamStat.teamFormXGA, '1.0-1')} xGA
            </span>
          </div>
          <div> 
            ${teamStat.teamForm}
          </div>
      `;

    return `
      <div>
        ${header} <br>
        ${averageTeamStat}
      </div>`;
  }

  public generateCellToolTip(
    game: GamePredictionDTO,
    opponentTeamAcronym: string
  ): string | null {
    if (game == null) {
      return null;
    }

    let homeTeamStats: TeamStatsDTO = this.teamStats.find(
      (x) => x.teamID == game.homeTeamId
    )!;
    let awayTeamStats: TeamStatsDTO = this.teamStats.find(
      (x) => x.teamID == game.awayTeamId
    )!;

    let currentTeam: TeamStatsDTO = opponentTeamAcronym.endsWith(
      homeTeamStats.teamAcronym
    )
      ? awayTeamStats
      : homeTeamStats;

    let homeTeamColor: string = this.getTooltipWinChanceSectionClass(
      game.homeTeamWinChance
    );
    let awayTeamColor: string = this.getTooltipWinChanceSectionClass(
      game.awayTeamWinChance
    );

    let homeTeamWinChance: string = `<span style="color:${homeTeamColor}">${
      game.homeTeamAcronym
    }: Победа ${Math.round(game.homeTeamWinChance)}%</span>`;
    let awayTeamWinChance: string = `<span style="color:${awayTeamColor}">${
      game.awayTeamAcronym
    }: Победа ${Math.round(game.awayTeamWinChance)}%</span>`;

    let playersMap: PlayerExpectedFantasyPointsInfo[] =
      this.teamPlayerExpectedOfoMap
        .get(currentTeam.teamID)
        ?.get(game.gameDate)!;
    let playersToolTip: string = '';

    if (playersMap != null && playersMap.length > 0) {
      playersToolTip += '<br>Лучшие пики: <br>';
      playersMap.forEach((x) => {
        playersToolTip += `${x.playerName} (${x.price}), ${
          x.powerPlayNumber
        }, ${x.playerExpectedFantasyPoints.toFixed(0)} ОФО <br>`;
      });
    }

    let generatedTooltip: string = `<b>${homeTeamWinChance}</b> | ${homeTeamStats.teamGoalsForm.toFixed(
      1
    )} GF | ${homeTeamStats.teamGoalsAwayForm.toFixed(1)} GA | ${
      homeTeamStats.teamForm
    }<br>
    <b>${awayTeamWinChance}</b> | ${awayTeamStats.teamGoalsForm.toFixed(
      1
    )} GF | ${awayTeamStats.teamGoalsAwayForm.toFixed(1)} GA | ${
      awayTeamStats.teamForm
    }<br>
    ${playersToolTip}
    `;

    return generatedTooltip;
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

  private generateTableColumns(
    weeks: number[],
    games: GamePredictionDTO[]
  ): TableColumn[] {
    let allColumns: TableColumn[] = [];

    weeks.forEach((week) => {
      let weekGames: GamePredictionDTO[] = games.filter(
        (game) => game.weekNumber == week
      );
      let nextWeekGames: GamePredictionDTO[] = games.filter(
        (game) => game.weekNumber == week + 1
      );

      let thisWeekMinDate: Date = GamesUtils.getExtremumDateForGames(
        weekGames,
        false
      );
      let thisWeekMaxDate: Date = GamesUtils.getExtremumDateForGames(
        weekGames,
        true
      );

      let nextWeekMinDate: Date | undefined =
        nextWeekGames?.length > 0
          ? GamesUtils.getExtremumDateForGames(nextWeekGames, false)
          : undefined;

      let newThisWeekMaxDate = new Date();
      newThisWeekMaxDate.setTime(thisWeekMaxDate.getTime());

      if (nextWeekMinDate != null) {
        let dateOffset: number = 24 * 60 * 60 * 1000; //1 day
        newThisWeekMaxDate.setTime(nextWeekMinDate.getTime() - dateOffset);
      }

      let weekDates: Date[] = Utils.getDatesInRange(
        thisWeekMinDate,
        newThisWeekMaxDate
      );

      allColumns.push({
        columnDef: undefined,
        header: `w${week}`,
      });

      weekDates.forEach((date) => {
        allColumns.push({
          columnDef: date,
          header: this.datepipe.transform(date, DEFAULT_DATE_FORMAT)!,
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
