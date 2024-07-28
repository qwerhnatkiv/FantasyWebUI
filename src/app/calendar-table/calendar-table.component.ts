import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  QueryList,
  SimpleChanges,
  ViewChildren,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { TableColumn } from '../interfaces/table-column';
import { TeamWeek } from '../classes/team-week';
import { GamePredictionDTO } from '../interfaces/game-prediction-dto';
import { GamesUtils } from '../common/games-utils';
import {
  DEFAULT_AWAY_GAME_TEAM_PREFIX,
  DEFAULT_DATE_FORMAT,
  DEFAULT_WEEK_HEADER_PREFIX,
  GREEN_TEAM_GF_BOUNDARY,
  GREEN_WIN_LOWER_BOUNDARY,
  LOW_GAMES_WEEK_BOUNDARY,
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
import { CdkCell, CdkHeaderCell } from '@angular/cdk/table';
import { ObservablesProxyHandlingService } from 'src/services/observables-proxy-handling';
import { ja } from 'date-fns/locale';

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

  private _showOnlyGamesCount: boolean = false;
  get showOnlyGamesCount(): boolean {
    return this._showOnlyGamesCount;
  }
  set showOnlyGamesCount(val: boolean) {
    this._showOnlyGamesCount = val;
  }

  private _showFullCalendar: boolean = false;
  @Input() set showFullCalendar(value: boolean) {
    this._showFullCalendar = value;

    let dayOfScrolling: Date = Utils.addDateDays(
      Utils.getMonday(new Date(), 1),
      -2
    );
    let dayOfScrollingStr = this.datepipe.transform(
      dayOfScrolling,
      DEFAULT_DATE_FORMAT
    )!;

    if (this.cells != null) {
      setTimeout(() => {
        let dayOfScrollingCell = this.cells.find(
          (cell) => cell.nativeElement.innerText == dayOfScrollingStr
        );

        if (dayOfScrollingCell != null) {
          dayOfScrollingCell?.nativeElement.scrollIntoView({
            inline: 'start',
            behavior: 'smooth',
          });
        }
      }, 300);
    }
  }
  get showFullCalendar(): boolean {
    return this._showFullCalendar;
  }

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

  private showOnlyGamesCountSubscription: Subscription | undefined;

  private savedCalendarRows: Map<string, any> = new Map<string, any>();
  private yesterdayDate: Date = new Date();

  @ViewChildren(CdkHeaderCell, { read: ElementRef }) cells!: QueryList<
    ElementRef<HTMLTableRowElement>
  >;

  constructor(
    private _observablesProxyHandlingService: ObservablesProxyHandlingService,
    private _changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.showOnlyGamesCountSubscription =
      this._observablesProxyHandlingService.$hideShowOnlyGamesCountSubject?.subscribe(
        () => {
          this.showOnlyGamesCount = !this.showOnlyGamesCount;
          this._changeDetectorRef.detectChanges();
        }
      );
    this.yesterdayDate.setTime(new Date().getTime() - 24 * 60 * 60 * 1000);
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
    const teams: string[] = games
      ?.map((x) => x.homeTeamName)
      .filter(Utils.onlyUnique)
      .sort((n1, n2) => Utils.sortTypes(n1, n2));

    const weeks: number[] = games
      ?.map((x) => x.weekNumber)
      .filter(Utils.onlyUnique)
      .sort((n1, n2) => n1 - n2);

    this.columnsToDisplay = ['team'];

    for (let i = 0, n = teams.length; i < n; ++i) {
      const teamName: string = teams[i];
      const teamGames: GamePredictionDTO[] = games.filter(
        (game) =>
          teamName === game.homeTeamName || teamName === game.awayTeamName
      );
      const teamSpecificRow: TableCell[] = [new TableCell(teamName, teamName)];

      for (let j = 0, m = weeks.length; j < m; ++j) {
        const week: number = weeks[j];
        const weekTeamGames: GamePredictionDTO[] = teamGames.filter(
          (game) => game.weekNumber == week
        );

        const allGamesPriorToWeek: GamePredictionDTO[] = games.filter(
          (game) =>
            (game.homeTeamName == teamName || game.awayTeamName == teamName) &&
            !game.isOldGame &&
            game.weekNumber <= week
        );

        const lowGamesTeamWeek: TeamWeek | null = this.setLowGamesWeekForTeam(
          weekTeamGames,
          teamName,
          week
        );

        const nextWeekMinDate: Date | null = this.getNextWeekMinDate(
          games,
          week
        );
        const weekColumns: Array<TableColumn> = this.getWeekColumns(
          games.filter((game) => game.weekNumber === week),
          week,
          nextWeekMinDate
        );

        for (let k = 0, l = weekColumns.length; k < l; ++k) {
          const column: TableColumn = weekColumns[k];

          if (
            this.columnsToDisplay.findIndex((x) => x == column.header) === -1
          ) {
            this.columns.push(column);
            this.columnsToDisplay.push(column.header);
          }

          const gameTableCell: TableCell | null = this.getGameCalendarCell(
            weekTeamGames,
            teamName,
            column.header,
            lowGamesTeamWeek?.gamesCount
          );

          if (gameTableCell != null) {
            teamSpecificRow.push(gameTableCell);
            continue;
          }

          const calendarTableCell: TableCell | null = this.getWeekCalendarCell(
            column.header,
            weekTeamGames,
            allGamesPriorToWeek
          );

          if (calendarTableCell != null) {
            teamSpecificRow.push(calendarTableCell);
            continue;
          }

          teamSpecificRow.push(
            this.getEmptyCalendarCell(lowGamesTeamWeek?.gamesCount)
          );
        }
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
    if (this.isOldDate(column)) {
      let className = 'calendar-cell-old';

      return className;
    }

    let classStatement: string =
      this.minFilterDate != null &&
      this.maxFilterDate != null &&
      column.columnDef != null &&
      column.columnDef! >= this.minFilterDate &&
      column.columnDef! <= this.maxFilterDate
        ? 'calendar-cell-selected'
        : 'calendar-cell-not-selected';

    if (cell.weekGames! <= 1 && !cell.isWeekCell) {
      classStatement += ' strike';
    }

    return classStatement;
  }

  public getCellTextClass(cell: TableCell) {
    let numericValue: number = Number(cell.cellValue);

    if (cell.isWeekCell) {
      if (this.showFullCalendar ? cell.weekGames! > 3 : cell.cellValue > 3) {
        return 'calendar-cell-week-green';
      }

      if (this.showFullCalendar ? cell.weekGames! < 2 : cell.cellValue < 2) {
        return 'calendar-cell-week-red';
      }

      return 'calendar-cell-week';
    }

    if (cell.game?.isOldGame) {
      return 'calendar-cell-old-content';
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

  public isOldDate(column: TableColumn): boolean {
    return column.columnDef?.getTime()! < this.yesterdayDate.getTime();
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

    let teamStat: TeamStatsDTO | undefined = this.teamStats.find(
      (x) => x.teamName == teamCell.displayValue
    );

    if (teamStat == null) {
      return null;
    }

    let gfForecastPimColor: string =
      teamStat.teamGoalsForm! <= GREEN_TEAM_GF_BOUNDARY ? 'white' : '#64ff8f';

    let gaForecastPimColor: string =
      teamStat.teamGoalsAwayForm! <= RED_TEAM_GA_BOUNDARY ? 'white' : '#ff7e7e';

    let averageTeamStat: string = `
          <div>
            <span style="color:${gfForecastPimColor}">
              ${this.numberPipe.transform(teamStat.teamGoalsForm, '1.0-1')} GF
            </span>
            <span>
            |
            </span>
            <span style="color:${gaForecastPimColor}">
              ${this.numberPipe.transform(
                teamStat.teamGoalsAwayForm,
                '1.0-1'
              )} GA
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

    if (game.isOldGame) {
      generatedTooltip += `<br>${homeTeamStats.teamAcronym} ${game.homeTeamGoals}:${game.awayTeamGoals} ${awayTeamStats.teamAcronym}`;
    }

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

  /**
   * Returns all columns for specific game week in calendar
   * @param weekGames All games for specific week
   * @param week Week number
   * @param nextWeekMinDate Min date for next week
   * @returns Array of calendar columns
   */
  private getWeekColumns(
    weekGames: Array<GamePredictionDTO>,
    week: number,
    nextWeekMinDate: Date | null
  ): Array<TableColumn> {
    const thisWeekMinDate: Date = Utils.getMonday(
      GamesUtils.getExtremumDateForGames(weekGames, false),
      0
    );

    // Set latest date if that's latest week
    // Otherwise, set the day before next week first day
    const thisWeekMaxDate =
      nextWeekMinDate != null
        ? Utils.addDateDays(nextWeekMinDate, -1)
        : GamesUtils.getExtremumDateForGames(weekGames, true);

    const weekDates: Date[] = Utils.getDatesInRange(
      thisWeekMinDate,
      thisWeekMaxDate
    );

    // Set initial column value with just week and it's number
    const weekColumns: Array<TableColumn> = [{
      columnDef: thisWeekMaxDate,
      header: `${DEFAULT_WEEK_HEADER_PREFIX}${week}`,
    }];

    // Set all other columns with specific week dates
    weekDates.forEach((date) => {
      weekColumns.push({
        columnDef: date,
        header: this.datepipe.transform(date, DEFAULT_DATE_FORMAT)!,
      });
    });

    return weekColumns;
  }

  /**
   * Returns min date for next week
   * @param games All Games
   * @param week Current week number
   * @returns Min date for next week, or null if there is no next week
   */
  private getNextWeekMinDate(
    games: GamePredictionDTO[],
    week: number
  ): Date | null {
    const nextWeekTeamGames: GamePredictionDTO[] = games.filter(
      (game) => game.weekNumber == week + 1
    );

    return nextWeekTeamGames?.length > 0
      ? Utils.getMonday(
          GamesUtils.getExtremumDateForGames(nextWeekTeamGames, false),
          0
        )
      : null;
  }

  /**
   * Determines whether specific week is considered to be
   * with low amount of games or not.
   * If so, function adds this team-week combination to array of those combinations.
   * @param teamWeekGames All games for specific team and week for that team
   * @param teamName Team Name
   * @param week Week number
   * @returns Team-week combination
   */
  private setLowGamesWeekForTeam(
    teamWeekGames: GamePredictionDTO[],
    teamName: string,
    week: number
  ): TeamWeek | null {
    const gamesCount: number = Utils.count(
      teamWeekGames,
      (game) => !game.isOldGame
    );

    if (gamesCount <= LOW_GAMES_WEEK_BOUNDARY) {
      const teamWeek: TeamWeek = new TeamWeek(teamName, week, gamesCount);
      this.teamWeeksToStrikethrough.push(teamWeek);

      return teamWeek;
    }

    return null;
  }

  /**
   * Gets calendar cell object that contains data about team game on specific date
   * @param weekTeamGames All games for team at specific week
   * @param teamName Team name
   * @param columnHeaderText Column header text (date)
   * @param weekGamesCount Amount of games in a week for a team that cell coresponds to
   * @returns Game calendar cell
   */
  private getGameCalendarCell(
    weekTeamGames: GamePredictionDTO[],
    teamName: string,
    columnHeaderText: string,
    weekGamesCount: number | undefined
  ): TableCell | null {

    // get home game based on column date value
    const homeGame: GamePredictionDTO | undefined = weekTeamGames.find(
      (x) =>
        x.homeTeamName == teamName &&
        this.datepipe.transform(x.gameDate, DEFAULT_DATE_FORMAT)! ==
          columnHeaderText
    );

    // if it's home game for team -> return new cell object
    if (homeGame != null) {
      return new TableCell(
        homeGame.awayTeamAcronym,
        homeGame.homeTeamWinChance,
        weekGamesCount,
        homeGame
      );
    }

    // get away game based on column date value
    const awayGame: GamePredictionDTO | undefined = weekTeamGames.find(
      (x) =>
        x.awayTeamName == teamName &&
        this.datepipe.transform(x.gameDate, DEFAULT_DATE_FORMAT)! ==
          columnHeaderText
    );

    // if it's away game for team -> return new cell object
    if (awayGame != null) {
      return new TableCell(
        DEFAULT_AWAY_GAME_TEAM_PREFIX + awayGame.homeTeamAcronym,
        awayGame.awayTeamWinChance,
        weekGamesCount,
        awayGame
      );
    }

    // return null if it's not home or away game for team.
    // Then it should be either week cell, or empty cell with no games
    return null;
  }

  /**
   * Gets calendar cell object that contains data about week
   * @param columnHeaderText Text of column header
   * @param weekTeamGames Games specifically for current week
   * @param allGamesPriorToWeek All games that are scheduled prior to current week
   * @returns Week calendar cell
   */
  private getWeekCalendarCell(
    columnHeaderText: string,
    weekTeamGames: GamePredictionDTO[],
    allGamesPriorToWeek: GamePredictionDTO[]
  ): TableCell | null {

    // If it's not week column -> return null
    if (!columnHeaderText.includes(DEFAULT_WEEK_HEADER_PREFIX)) {
      return null;
    }

    // Consider only games that are left in current week
    const activeGamesForWeekCount: number = weekTeamGames.filter(
      (game) => !game.isOldGame
    ).length;

    // Choose between normal and simplified calendar view
    const cellTextValue = activeGamesForWeekCount == allGamesPriorToWeek.length 
      ? activeGamesForWeekCount.toString()
      : GamesUtils.getSimplifiedCalendarViewCellText(activeGamesForWeekCount, allGamesPriorToWeek.length);

    // Create table cell
    return new TableCell(
      cellTextValue,
      activeGamesForWeekCount,
      weekTeamGames.length,
      undefined,
      true
    );
  }

  /**
   * Gets empty calendar cell in case if this is not game cell or week cell
   * @param weekGamesCount Amount of games in a week for a team that cell coresponds to
   * @returns TableCell object with empty data
   */
  private getEmptyCalendarCell(weekGamesCount: number | undefined): TableCell {
    return new TableCell('', -1, weekGamesCount);
  }
}
