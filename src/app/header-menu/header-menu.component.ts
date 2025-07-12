import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import {
  COEFS_UPDATED_LOG_INFO,
  COLLAPSE_CALENDAR,
  DATA_UPDATED_LOG_INFO,
  DEFAULT_DATE_TIME_FORMAT,
  DISABLE_PAST_GAMES_CALENDAR_MODE_LABEL,
  ENABLE_CALENDAR_ADVANCED_DRAWING_MODE_LABEL,
  ENABLE_FULL_CALENDAR_MODE_LABEL,
  ENABLE_PAST_GAMES_CALENDAR_MODE_LABEL,
  ENABLE_SIMPLIFIED_CALENDAR_MODE_LABEL,
  EXPAND_CALENDAR,
  FROM_DATE_CALENDAR_FILTER,
  GAME_DAY_TWEETS_URL,
  HIDE_TEAMS_EASY_SERIES,
  KNOWLEDGE_BASE_URL,
  NEXT_DEADLINE_DATE_LABEL,
  SHOW_BEST_PLAYERS_BY_EFP,
  SHOW_TEAMS_EASY_SERIES,
  START_DATE_CALENDAR_FILTER,
  TO_DATE_CALENDAR_FILTER,
  WEEK_BACK_BUTTON_LABEL,
  WEEK_FORWARD_BUTTON_LABEL,
  YELLOW_COLOR,
  YELLOW_COLOR_ACTIVE,
} from 'src/constants';
import { CalendarObservableProxyService } from 'src/services/observable-proxy/calendar-observable-proxy.service';
import { PlayersObservableProxyService } from 'src/services/observable-proxy/players-observable-proxy.service';
import { UpdateLogInformation } from '../interfaces/update-log-information';
import { DateFiltersService } from 'src/services/filtering/date-filters.service';
import {
  MatDatepickerInputEvent,
} from '@angular/material/datepicker';
import { Moment } from 'moment';
import { DatesRangeModel } from '../interfaces/dates-range.model';
import { Subscription } from 'rxjs';
import { Utils } from '../common/utils';

@Component({
  selector: 'header-menu',
  templateUrl: './header-menu.component.html',
  styleUrl: './header-menu.component.css',
})
export class HeaderMenuComponent implements OnInit, OnDestroy {
  private _filterDatesRangeSubscription?: Subscription;

  @Input() updateLogInformation?: UpdateLogInformation;

  @Output() calendarVisibilityUpdated: EventEmitter<boolean> =
    new EventEmitter<boolean>();

  // LABELS
  protected EXPAND_CALENDAR_LABEL: string = EXPAND_CALENDAR;
  protected COLLAPSE_CALENDAR_LABEL: string = COLLAPSE_CALENDAR;
  protected ENABLE_PAST_GAMES_CALENDAR_MODE_LABEL: string =
    ENABLE_PAST_GAMES_CALENDAR_MODE_LABEL;
  protected DISABLE_PAST_GAMES_CALENDAR_MODE_LABEL: string =
    DISABLE_PAST_GAMES_CALENDAR_MODE_LABEL;
  protected ENABLE_FULL_CALENDAR_MODE_LABEL: string =
    ENABLE_FULL_CALENDAR_MODE_LABEL;
  protected ENABLE_SIMPLIFIED_CALENDAR_MODE_LABEL: string =
    ENABLE_SIMPLIFIED_CALENDAR_MODE_LABEL;
  protected ENABLE_CALENDAR_ADVANCED_DRAWING_MODE_LABEL: string =
    ENABLE_CALENDAR_ADVANCED_DRAWING_MODE_LABEL;
  protected SHOW_BEST_PLAYERS_BY_EFP: string = SHOW_BEST_PLAYERS_BY_EFP;
  protected DATA_UPDATED_LOG_INFO: string = DATA_UPDATED_LOG_INFO;
  protected COEFS_UPDATED_LOG_INFO: string = COEFS_UPDATED_LOG_INFO;
  protected FROM_DATE_CALENDAR_FILTER: string = FROM_DATE_CALENDAR_FILTER;
  protected TO_DATE_CALENDAR_FILTER: string = TO_DATE_CALENDAR_FILTER;
  protected START_DATE_CALENDAR_FILTER: string = START_DATE_CALENDAR_FILTER;
  protected WEEK_BACK_BUTTON_LABEL: string = WEEK_BACK_BUTTON_LABEL;
  protected WEEK_FORWARD_BUTTON_LABEL: string = WEEK_FORWARD_BUTTON_LABEL;
  protected NEXT_DEADLINE_DATE_LABEL: string = NEXT_DEADLINE_DATE_LABEL;
  protected SHOW_TEAMS_EASY_SERIES: string = SHOW_TEAMS_EASY_SERIES;
  protected HIDE_TEAMS_EASY_SERIES: string = HIDE_TEAMS_EASY_SERIES;

  // CONSTS
  protected DEFAULT_DATE_TIME_FORMAT: string = DEFAULT_DATE_TIME_FORMAT;
  protected YELLOW_COLOR: string = YELLOW_COLOR;
  protected YELLOW_COLOR_ACTIVE: string = YELLOW_COLOR_ACTIVE;
  protected GAME_DAY_TWEETS_URL: string = GAME_DAY_TWEETS_URL;
  protected KNOWLEDGE_BASE_URL: string = KNOWLEDGE_BASE_URL;

  // FIELDS FOR HTML
  protected isSecondLevelSubMenuHidden: boolean = true;
  protected isCalendarHidden: boolean = false;
  protected hasPastCalendarGames: boolean = false;
  protected isCalendarSimplifiedModeEnabled: boolean = false;
  protected isSimplifiedCalendarAdvancedDrawingModeEnabled: boolean = false;
  protected filterDates: DatesRangeModel = {
    minDate: new Date(),
    maxDate: new Date(),
  };
  protected areTeamsEasySeriesEnabled: boolean = false;

  //#region CTOR

  constructor(
    private _calendarObservableProxyService: CalendarObservableProxyService,
    private _playersObservableProxyService: PlayersObservableProxyService,
    private _dateFiltersService: DateFiltersService
  ) {}

  //#endregion CTOR

  //#region LIFECYCLE HOOKS

  ngOnInit(): void {
    this._filterDatesRangeSubscription =
      this._dateFiltersService.$dateFiltersObservable.subscribe(
        (value: DatesRangeModel) => {
          this.filterDates = value;
          this._playersObservableProxyService.triggerUpdatePlayersEfpDataByDateRangeEvent();
        }
      );
  }

  ngOnDestroy(): void {
    this._filterDatesRangeSubscription?.unsubscribe();
  }

  //#endregion LIFECYCLE HOOKS

  //#region Protected Methods for HTML Template

  /**
   * Updates calendar visibility (expand/collapse)
   */
  protected updateCalendarVisibility(): void {
    this.isCalendarHidden = !this.isCalendarHidden;
    this.calendarVisibilityUpdated.emit(this.isCalendarHidden);
  }

  /**
   * Shows/Hides calendar past games
   */
  protected updateCalendarGamesRangeMode(): void {
    this.hasPastCalendarGames = !this.hasPastCalendarGames;
    this._calendarObservableProxyService.triggerCalendarGamesRangeSubject(
      this.hasPastCalendarGames
    );
  }

  /**
   * Switches calendar mode between normal and "simplified"/"minesweeper" where only weeks remain
   */
  protected updateCalendarSimplifiedMode(): void {
    this.isCalendarSimplifiedModeEnabled =
      !this.isCalendarSimplifiedModeEnabled;
    this.isSimplifiedCalendarAdvancedDrawingModeEnabled = this.isCalendarSimplifiedModeEnabled;

    this._calendarObservableProxyService.triggerCalendarInSimplifiedModeSubject(
      this.isCalendarSimplifiedModeEnabled
    );
  }

  /**
   * Switches modes of "minesweeper" calendar mode between normal and extended
   */
  protected updateSimplifiedCalendarDrawingMode(): void {
    this.isSimplifiedCalendarAdvancedDrawingModeEnabled =
      !this.isSimplifiedCalendarAdvancedDrawingModeEnabled;

    this._calendarObservableProxyService.triggerSimplifiedCalendarDrawingModeSubject(
      this.isSimplifiedCalendarAdvancedDrawingModeEnabled
    );
  }

  /**
   * Triggers event of showing most valuable player for each team in the calendar
   */
  protected showMostValuablePlayersInCalendar(): void {
    this._playersObservableProxyService.triggerShowBestPlayersInCalendarEvent();
  }

  /**
   * Sets date range to the previous week of the current selection
   */
  protected goToPreviousWeek(): void {
    const today = new Date();
    const minDateWeekMonday: Date = Utils.getMonday(this.filterDates.minDate!, 0);
    const todayWeekMonday: Date = Utils.getMonday(today, 0);
    if (minDateWeekMonday.getTime() === todayWeekMonday.getTime()) {
      return;
    }

    const areDatesOnTheSameWeek: boolean = Utils.areOnTheSameWeek(this.filterDates.minDate!, this.filterDates.maxDate!);
    const startDay: number = this.filterDates.minDate!.getDay();

    if (areDatesOnTheSameWeek || startDay <= 4) {
      this._setWeekDateRange(this.filterDates.minDate!, 1);
      return;
    }

    this._setWeekDateRange(this.filterDates.minDate!, 0);
  }

  /**
   * Sets date range to the mext week of the current selection
   */
  protected goToNextWeek(): void {
    const areDatesOnTheSameWeek: boolean = Utils.areOnTheSameWeek(this.filterDates.minDate!, this.filterDates.maxDate!);
    const endDay: number = this.filterDates.maxDate!.getDay();

    if (areDatesOnTheSameWeek || endDay >= 4) {
      this._setWeekDateRange(this.filterDates.maxDate!, -1);
      return;
    }

    this._setWeekDateRange(this.filterDates.maxDate!, 0);
  }

  /**
   * Enables/Disables teams easy series
   */
  protected setTeamsEasySeriesState(): void {
    this.areTeamsEasySeriesEnabled = !this.areTeamsEasySeriesEnabled;
    this._calendarObservableProxyService.triggerTeamsEasySeriesSubject(
      this.areTeamsEasySeriesEnabled
    );
  }

  /**
   * Reacts to MatDatepickerInputEvent for lower bound filter and sends the update to dependent components
   * @param event DatePicker value change event
   */
  protected handleMinimumDateFilterChange(
    event: MatDatepickerInputEvent<Moment>
  ): void {
    const minFilterDate: Date | undefined = event.value?.toDate();
    this._setMinimumCalendarDate(minFilterDate);
  }

  /**
   * Reacts to MatDatepickerInputEvent for upper bound date filter and sends the update to dependent components
   * @param event DatePicker value change event
   */
  protected handleMaximumDateFilterChange(
    event: MatDatepickerInputEvent<Moment>
  ): void {
    const maxFilterDate: Date | undefined = event.value?.toDate();
    this._setMaximumCalendarDate(maxFilterDate);
  }

  /**
   * Reacts to MatDatepickerInputEvent for simplified mode start date filter
   * @param event DatePicker value change event
   */
  protected updateSimplifiedModeStartDateFilterValue(
    startDate: Date | undefined
  ): void {
    this._calendarObservableProxyService.triggerSimplifiedCalendarModeStartDateSubject(startDate);
  }

  //#endregion PROTECTED METHODS for HTML Template

  //#region PRIVATE METHODS

  /**
   * Updates minimum filter date value for the calendar
   * @param value Value for minFilterDate
   */
  private _setMinimumCalendarDate(value: Date | undefined): void {
    this._dateFiltersService.triggerDateFiltersSubjectUpdate(
      value,
      this.filterDates.maxDate
    );

    this.updateSimplifiedModeStartDateFilterValue(value);
  }

  /**
   * Updates maximum filter date value for the calendar
   * @param value Value for maxFilterDate
   */
  private _setMaximumCalendarDate(value: Date | undefined): void {
    this._dateFiltersService.triggerDateFiltersSubjectUpdate(
      this.filterDates.minDate,
      value
    );
  }

  /**
   * Sets week-long date range for a specific amount of weeks back/forward from the sourceDate
   * @param sourceDate Date that is a relative source for week shift
   * @param weeksBefore Amount of weeks before of the day to get shifted
   */
  private _setWeekDateRange(sourceDate: Date, weeksBefore: number) {
    const today: Date = new Date();
    const weekStartDate: Date = Utils.getMonday(sourceDate, weeksBefore);
    const weekEndDate: Date = Utils.addDateDays(weekStartDate, 6);

    if (today.getTime() > weekStartDate.getTime()) {
      this._setMinimumCalendarDate(this._dateFiltersService.minDefaultDate);
    }
    else {
      this._setMinimumCalendarDate(weekStartDate);
    }
    this._setMaximumCalendarDate(weekEndDate);
  }

  //#endregion PRIVATE METHODS

}
