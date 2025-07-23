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
  ViewChild,
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
  EFP_LABEL,
  GREEN_TEAM_GF_BOUNDARY,
  GREEN_WIN_LOWER_BOUNDARY,
  LOW_GAMES_WEEK_BOUNDARY,
  RED_TEAM_GA_BOUNDARY,
  TEAM_NAME_LOGO_PATH_MAP,
  ONE_DIGIT_NUMBER_FORMAT,
  VERY_GREEN_WIN_LOWER_BOUNDARY,
  WHITE_WIN_LOWER_BOUNDARY,
  DAY_CHANGE_HOUR,
} from 'src/constants';
import { TableCell } from '../classes/table-cell';
import { Utils } from '../common/utils';
import { TeamStatsDTO } from '../interfaces/team-stats-dto';
import { SelectedPlayerModel } from '../interfaces/selected-player-model';

import { cloneDeep } from 'lodash';
import { PlayerExpectedFantasyPointsInfo } from '../interfaces/player-efp-info';
import {
  combineLatestWith,
  concatWith,
  distinctUntilChanged,
  Observable,
  Subject,
  Subscription,
} from 'rxjs';
import { CdkHeaderCell } from '@angular/cdk/table';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { CalendarObservableProxyService } from 'src/services/observable-proxy/calendar-observable-proxy.service';
import { PlayersObservableProxyService } from 'src/services/observable-proxy/players-observable-proxy.service';
import { ColumnScrollDataHandlerService } from 'src/services/cdk-components/column-scroll-data-handler.service';
import { DateFiltersService } from 'src/services/filtering/date-filters.service';
import { DatesRangeModel } from '../interfaces/dates-range.model';
import { CalendarWeekGamesMapService } from 'src/services/calendar/calendar-week-games-map.service';
import { TeamsEasySeriesService } from 'src/services/teams-easy-series/teams-easy-series.service';
import { TeamsEasySeriesDto } from '../interfaces/teams-easy-series/teams-easy-series.model';
import { EasySeriesDateType } from '../interfaces/teams-easy-series/easy-series-date-type.enum';

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
  private _easySeriesByTeamMap: Map<string, TeamsEasySeriesDto[]> = new Map();
  private _teamStats: TeamStatsDTO[] = [];
  private _teamsEasySeries: TeamsEasySeriesDto[] = [];
  private _isCalendarDataUpdated: boolean = false;

  private _startCalendarDataExecutionSubject: Subject<void> =
    new Subject<void>();
  private _startCalendarDataExecutionObservable: Observable<void> =
    this._startCalendarDataExecutionSubject.asObservable();

  private _calendarGamesRangeSubscription?: Subscription;
  private _calendarSimplifiedModeSubscription?: Subscription;
  private _simplifiedCalendarDrawingModeSubscription?: Subscription;
  private _simplifiedCalendarModeStartDateSubscription?: Subscription;
  private _selectedPlayersSubscription?: Subscription;
  private _filterDatesRangeSubscription?: Subscription;
  private _teamsEasySeriesToggleSubscription?: Subscription;
  private _teamsEasySeriesDataSubscription?: Subscription;
  private _startCalendarDataExecutionSubscription?: Subscription;

  public columns: Array<TableColumn> = [];
  public columnsToDisplay: string[] = [];
  public dataSource: MatTableDataSource<any> = new MatTableDataSource(
    this.dataSourceArray
  );

  public teamNameLogoPathMap: any = TEAM_NAME_LOGO_PATH_MAP;

  protected isSimplifiedCalendarModeEnabled: boolean = false;
  protected isSimplifiedCalendarAdvancedDrawingModeEnabled: boolean = false;
  protected isTeamsEasySeriesModeEnabled: boolean = false;

  protected EFP_LABEL: string = EFP_LABEL;

  protected weekMaximumGamesMap: Map<number, number> = new Map<
    number,
    number
  >();
  protected weekMinimumGamesMap: Map<number, number> = new Map<
    number,
    number
  >();

  private _showFullCalendar: boolean = false;
  protected set showFullCalendar(value: boolean) {
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
  protected get showFullCalendar(): boolean {
    return this._showFullCalendar;
  }

  protected filterDates: DatesRangeModel = {
    minDate: new Date(),
    maxDate: new Date(),
  };

  @Input()
  set teamStats(value: TeamStatsDTO[]) {
    this._teamStats = value;
    this._setEasySeriesForTeams();
  }

  get teamStats(): TeamStatsDTO[] {
    return this._teamStats;
  }

  @Input() games: GamePredictionDTO[] = [];

  @Input() teamPlayerExpectedOfoMap: Map<
    number,
    Map<Date, PlayerExpectedFantasyPointsInfo[]>
  > = new Map<number, Map<Date, PlayerExpectedFantasyPointsInfo[]>>();

  private savedCalendarRows: Map<string, any> = new Map<string, any>();
  public yesterdayDate: Date = new Date();
  public yesterdayDateStart: Date = new Date();

  @ViewChildren(CdkHeaderCell, { read: ElementRef }) cells!: QueryList<
    ElementRef<HTMLTableRowElement>
  >;

  @ViewChild(CdkVirtualScrollViewport, { static: true })
  _viewPort!: CdkVirtualScrollViewport;

  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _calendarObservableProxyService: CalendarObservableProxyService,
    private _playersObservableProxyService: PlayersObservableProxyService,
    private _dateFiltersService: DateFiltersService,
    private _calendarWeekGamesMapService: CalendarWeekGamesMapService,
    private _teamsEasySeriesService: TeamsEasySeriesService
  ) {}

  ngOnInit() {
    this._subscribeToDataObservables();
    this._subscribeToCalendarModeObservables();
    this._subscribeToPlayerObservables();

    this._startCalendarDataExecutionSubscription =
      this._startCalendarDataExecutionObservable.subscribe(() => {
        if (this._isCalendarReadyForDisplaying()) {
          this.setUpDataSourceAndColumns(this.games);
        }
      });

    this.yesterdayDate.setTime(new Date().getTime() - 24 * 60 * 60 * 1000);
    this.yesterdayDate.setHours(0, 0, 0, 0);

    const handler = new ColumnScrollDataHandlerService(
      this.columns,
      this._viewPort
    );
    handler.columnsToDisplayStream.subscribe(
      (columns) => (this.columnsToDisplay = columns.map((x) => x.header))
    );
  }

  ngOnDestroy(): void {
    this._calendarGamesRangeSubscription?.unsubscribe();
    this._calendarSimplifiedModeSubscription?.unsubscribe();
    this._simplifiedCalendarDrawingModeSubscription?.unsubscribe();
    this._selectedPlayersSubscription?.unsubscribe();
    this._filterDatesRangeSubscription?.unsubscribe();
    this._simplifiedCalendarModeStartDateSubscription?.unsubscribe();
    this._teamsEasySeriesToggleSubscription?.unsubscribe();
    this._teamsEasySeriesDataSubscription?.unsubscribe();
    this._startCalendarDataExecutionSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['games']?.previousValue &&
      changes['games']?.currentValue &&
      changes['games'].previousValue.length !=
        changes['games'].currentValue.length
    ) {
      this._isCalendarDataUpdated = true;
      this._startCalendarDataExecutionSubject.next();
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

    const displayColumns: string[] = ['team'];
    const allColumns: TableColumn[] = [];

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

        const allGamesPriorToWeekCount: number =
          this._calendarWeekGamesMapService.getGamesCountForTeamAndWeekFromStartDate(
            games,
            teamName,
            week,
            new Date()
          );
        this.weekMaximumGamesMap =
          this._calendarWeekGamesMapService.weekMaximumGamesMap;
        this.weekMinimumGamesMap =
          this._calendarWeekGamesMapService.weekMinimumGamesMap;

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

          if (displayColumns.findIndex((x) => x == column.header) === -1) {
            allColumns.push(column);
            displayColumns.push(column.header);
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
            allGamesPriorToWeekCount
          );

          if (calendarTableCell != null) {
            teamSpecificRow.push(calendarTableCell);
            continue;
          }

          teamSpecificRow.push(
            this.getEmptyCalendarCell(
              lowGamesTeamWeek?.gamesCount,
              column.header,
              teamName
            )
          );
        }
      }

      this.dataSourceArray.push(
        Object.fromEntries(
          displayColumns.map((_, i) => [displayColumns[i], teamSpecificRow[i]])
        )
      );
    }

    this.columns = allColumns;
    this.columnsToDisplay = displayColumns;

    this._isCalendarDataUpdated = false;
  }

  public isPlayerSelectedCell(element: any, cell: TableCell): boolean {
    return (
      element['team'].displayValue.includes(EFP_LABEL) &&
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
    const playersTeamName: string = element['team'].cellValue;

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
      teamStat?.teamGoalsForm! <= GREEN_TEAM_GF_BOUNDARY ? 'white' : '#64ff8f';

    let gaForecastPimColor: string =
      teamStat?.teamGoalsAwayForm! <= RED_TEAM_GA_BOUNDARY
        ? 'white'
        : '#ff7e7e';

    let averageTeamStat: string = `
          <div>
            <span style="color:${gfForecastPimColor}">
              ${this.numberPipe.transform(teamStat?.teamGoalsForm, '1.0-1')} GF
            </span>
            <span>
            |
            </span>
            <span style="color:${gaForecastPimColor}">
              ${this.numberPipe.transform(
                teamStat?.teamGoalsAwayForm,
                '1.0-1'
              )} GA
            </span>
            <span>
            |
            </span>
            <span>
              ${this.numberPipe.transform(teamStat?.teamFormSF, '1.0-1')} SF
            </span>
            <span>
            |
            </span>
            <span>
              ${this.numberPipe.transform(teamStat?.teamFormSA, '1.0-1')} SA
            </span>
            <span>
            |
            </span>
            <span>
              ${this.numberPipe.transform(teamStat?.teamFormXGF, '1.0-1')} xGF
            </span>
            <span>
            |
            </span>
            <span>
              ${this.numberPipe.transform(teamStat?.teamFormXGA, '1.0-1')} xGA
            </span>
          </div>
          <div> 
            ${teamStat?.teamForm}
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

    const currentTeam: TeamStatsDTO = opponentTeamAcronym.endsWith(
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
        }, ${x.playerExpectedFantasyPoints.toFixed(0)} ${EFP_LABEL} <br>`;
      });
    }

    if (game.isOldGame) {
      return `<b>${homeTeamWinChance}</b><br>
      <b>${awayTeamWinChance}</b><br><br>
      ${homeTeamStats.teamAcronym} ${game.homeTeamGoals}:${game.awayTeamGoals} ${awayTeamStats.teamAcronym}
      `;
    }

    return `<b>${homeTeamWinChance}</b> | ${homeTeamStats.teamGoalsForm.toFixed(
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

  protected deselectPlayerRow(teamNameCell: TableCell) {
    if (!teamNameCell.displayValue.includes(EFP_LABEL)) {
      return;
    }

    this._playersObservableProxyService.triggerShowPlayerInCalendarSubject(
      teamNameCell.playerId!
    );
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
    const weekColumns: Array<TableColumn> = [
      {
        columnDef: thisWeekMaxDate,
        header: `${DEFAULT_WEEK_HEADER_PREFIX}${week}`,
        isWeekColumn: true,
        isOldDate: GamesUtils.isCalendarDateOld(
          thisWeekMaxDate,
          this.yesterdayDate
        ),
        week,
      },
    ];

    // Set all other columns with specific week dates
    weekDates.forEach((date) => {
      weekColumns.push({
        columnDef: date,
        header: this.datepipe.transform(date, DEFAULT_DATE_FORMAT)!,
        isWeekColumn: false,
        isOldDate: GamesUtils.isCalendarDateOld(date, this.yesterdayDate),
        week,
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
      let displayValue: string = homeGame.awayTeamAcronym;
      if (homeGame.isOldGame) {
        displayValue = `${homeGame.homeTeamGoals ?? '-'}:${
          homeGame.awayTeamGoals ?? '-'
        }`;
      }

      const easySeriesGameType: EasySeriesDateType | undefined =
        this._getEasySeriesDateType(new Date(homeGame.gameDate), teamName);

      return new TableCell(
        displayValue,
        homeGame.homeTeamWinChance,
        weekGamesCount,
        homeGame,
        undefined,
        undefined,
        homeGame.awayTeamAcronym,
        undefined,
        this._belongsToEasySeries(new Date(homeGame.gameDate), teamName),
        easySeriesGameType === EasySeriesDateType.Start,
        easySeriesGameType === EasySeriesDateType.End
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
      let displayValue: string =
        DEFAULT_AWAY_GAME_TEAM_PREFIX + awayGame.homeTeamAcronym;
      if (awayGame.isOldGame) {
        displayValue = `${awayGame.homeTeamGoals ?? '-'}:${
          awayGame.awayTeamGoals ?? '-'
        }`;
      }

      const easySeriesGameType: EasySeriesDateType | undefined =
        this._getEasySeriesDateType(new Date(awayGame.gameDate), teamName);

      return new TableCell(
        displayValue,
        awayGame.awayTeamWinChance,
        weekGamesCount,
        awayGame,
        undefined,
        undefined,
        awayGame.homeTeamAcronym,
        undefined,
        this._belongsToEasySeries(new Date(awayGame.gameDate), teamName),
        easySeriesGameType === EasySeriesDateType.Start,
        easySeriesGameType === EasySeriesDateType.End
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
    allGamesPriorToWeekCount: number
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
    const cellTextValue: string =
      activeGamesForWeekCount == allGamesPriorToWeekCount
        ? activeGamesForWeekCount.toString()
        : GamesUtils.getSimplifiedCalendarViewCellText(
            activeGamesForWeekCount,
            allGamesPriorToWeekCount
          );

    // Create table cell
    return new TableCell(
      cellTextValue,
      activeGamesForWeekCount,
      weekTeamGames.length,
      undefined,
      true,
      allGamesPriorToWeekCount
    );
  }

  /**
   * Gets empty calendar cell in case if this is not game cell or week cell
   * @param weekGamesCount Amount of games in a week for a team that cell coresponds to
   * @returns TableCell object with empty data
   */
  private getEmptyCalendarCell(
    weekGamesCount: number | undefined,
    columnHeaderText: string,
    teamName: string
  ): TableCell {
    const gameDate: Date = GamesUtils.toDateFromShortFormat(columnHeaderText);
    const easySeriesGameType: EasySeriesDateType | undefined =
      this._getEasySeriesDateType(new Date(gameDate), teamName);

    return new TableCell(
      '',
      -1,
      weekGamesCount,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      this._belongsToEasySeries(gameDate, teamName),
      easySeriesGameType === EasySeriesDateType.Start,
      easySeriesGameType === EasySeriesDateType.End
    );
  }

  private _belongsToEasySeries(gameDate: Date, teamName: string): boolean {
    const easySeriesByTeam: TeamsEasySeriesDto[] =
      this._easySeriesByTeamMap.get(teamName)!;
    if (easySeriesByTeam == null) {
      return false;
    }
    for (const easySeries of easySeriesByTeam) {
      if (gameDate >= easySeries.startDt && gameDate <= easySeries.endDt) {
        return true;
      }
    }

    return false;
  }

  private _getEasySeriesDateType(
    gameDate: Date,
    teamName: string
  ): EasySeriesDateType | undefined {
    const easySeriesByTeam: TeamsEasySeriesDto[] =
      this._easySeriesByTeamMap.get(teamName)!;
    if (easySeriesByTeam == null) {
      return undefined;
    }

    for (const easySeries of easySeriesByTeam) {
      if (gameDate.getTime() === easySeries.startDt.getTime()) {
        return EasySeriesDateType.Start;
      }

      if (gameDate.getTime() === easySeries.endDt.getTime()) {
        return EasySeriesDateType.End;
      }
    }

    return EasySeriesDateType.None;
  }

  private _subscribeToCalendarModeObservables(): void {
    this._calendarGamesRangeSubscription =
      this._calendarObservableProxyService.$calendarGamesRangeObservable?.subscribe(
        (value: boolean) => {
          this.showFullCalendar = value;
          this._changeDetectorRef.detectChanges();
        }
      );

    this._calendarSimplifiedModeSubscription =
      this._calendarObservableProxyService.$calendarSimplifiedModeObservable?.subscribe(
        (value: boolean) => {
          this.isSimplifiedCalendarModeEnabled = value;
          this.isSimplifiedCalendarAdvancedDrawingModeEnabled = value;
          this._changeDetectorRef.detectChanges();
        }
      );

    this._simplifiedCalendarDrawingModeSubscription =
      this._calendarObservableProxyService.$simplifiedCalendarDrawingModeObservable?.subscribe(
        (value: boolean) => {
          this.isSimplifiedCalendarAdvancedDrawingModeEnabled = value;
          this._changeDetectorRef.detectChanges();
        }
      );
    this._filterDatesRangeSubscription =
      this._dateFiltersService.$dateFiltersObservable.subscribe(
        (value: DatesRangeModel) => {
          this.filterDates = value;
          this._changeDetectorRef.detectChanges();
        }
      );

    this._simplifiedCalendarModeStartDateSubscription =
      this._calendarObservableProxyService.$simplifiedCalendarModeStartDateObservable?.subscribe(
        (value: Date | undefined) => {
          this._calendarWeekGamesMapService.setUpdatedWeeksGamesCount(
            this.dataSourceArray,
            this.games,
            value
          );
          this.weekMaximumGamesMap =
            this._calendarWeekGamesMapService.weekMaximumGamesMap;
          this.weekMinimumGamesMap =
            this._calendarWeekGamesMapService.weekMinimumGamesMap;
          this._changeDetectorRef.detectChanges();
        }
      );

    this._teamsEasySeriesToggleSubscription =
      this._calendarObservableProxyService.$teamsEasySeriesObservable?.subscribe(
        (value: boolean) => {
          this.isTeamsEasySeriesModeEnabled = value;
          this._changeDetectorRef.detectChanges();
        }
      );
  }

  private _subscribeToPlayerObservables() {
    this._selectedPlayersSubscription =
      this._playersObservableProxyService.$selectedPlayersObservable?.subscribe(
        (playersMap: Map<string, SelectedPlayerModel[]>) => {
          for (const [_, valueRow] of this.savedCalendarRows) {
            if (playersMap.has(valueRow.team.displayValue)) {
              continue;
            }

            const index = this.dataSourceArray.findIndex(
              (x) => x.team.cellValue == valueRow.team.cellValue
            );
            const concreteRow: any = this.dataSourceArray[index];

            for (const key in valueRow) {
              concreteRow[key].displayValue = valueRow[key].displayValue;
            }
          }

          for (const [key, value] of playersMap) {
            const rowToReplace: any = this.dataSourceArray.find(
              (x) => x.team.cellValue == key
            );

            if (!this.savedCalendarRows.has(key)) {
              this.savedCalendarRows.set(key, cloneDeep(rowToReplace));
            }

            const playerEfpSum: number = value.reduce(
              (sum, x) => sum + x.playerExpectedFantasyPoints,
              0
            );
            rowToReplace.team.displayValue =
              value[0].playerName +
              `: ${Utils.formatNumber(playerEfpSum)} ${EFP_LABEL}`;
            rowToReplace.team.playerId = value[0].playerID;

            for (const game of value) {
              const gameDateStr: string = this.datepipe.transform(
                game.gameDate,
                DEFAULT_DATE_FORMAT
              )!;
              rowToReplace[gameDateStr].displayValue =
                game.playerExpectedFantasyPointsFormatted;
            }
          }
          this._changeDetectorRef.detectChanges();
        }
      );
  }

  private _subscribeToDataObservables(): void {
    this._teamsEasySeriesDataSubscription =
      this._teamsEasySeriesService.$teamsEasySeriesObservable?.subscribe(
        (teamsEasySeries: TeamsEasySeriesDto[]) => {
          this._teamsEasySeries = teamsEasySeries;
          this._setEasySeriesForTeams();
        }
      );
  }

  private _setEasySeriesForTeams() {
    this._easySeriesByTeamMap = new Map<string, TeamsEasySeriesDto[]>();
    for (const team of this.teamStats) {
      const easySeriesForTeam: TeamsEasySeriesDto[] =
        this._teamsEasySeries.filter((x) => x.teamId === team.teamID);
      this._easySeriesByTeamMap.set(team.teamName, easySeriesForTeam);
      this._changeDetectorRef.detectChanges();
    }

    if (this._isCalendarReadyForDisplaying()) {
      this.setUpDataSourceAndColumns(this.games);
    }
  }

  private _isCalendarReadyForDisplaying() {
    return (
      this._easySeriesByTeamMap.size > 0 &&
      this._isCalendarDataUpdated &&
      this._teamStats.length > 0
    );
  }
}
