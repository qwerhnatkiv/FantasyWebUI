import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ViewStateUrlService } from '../url-state/view-state-url.service';

@Injectable()
export class CalendarObservableProxyService {
  // Режимы календаря - BehaviorSubject, а не Subject: шапка успевает отдать начальное
  // состояние из адресной строки раньше, чем таблица календаря подпишется в своём ngOnInit,
  // и обычный Subject такую отправку терял бы.
  private _calendarSimplifiedModeSubject: BehaviorSubject<boolean>;
  private _calendarGamesRangeSubject: BehaviorSubject<boolean>;
  private _simplifiedCalendarDrawingModeSubject: BehaviorSubject<boolean>;
  private _teamsEasySeriesSubject: BehaviorSubject<boolean>;

  private _simplifiedCalendarModeStartDateSubject: Subject<Date | undefined> =
    new Subject<Date | undefined>();

  /**
   * Observable for the event of clicking on "minesweeper" button.
   * This will result in updating the calendar DOM to show only weeks in calendar instead of all game days
   */
  public $calendarSimplifiedModeObservable: Observable<boolean>;

  /**
   * Observable for the event of clicking on "expand full calendar" button.
   * This will result in opening past games in addition to future games
   */
  public $calendarGamesRangeObservable: Observable<boolean>;

  /**
   * Observable for the event of clicking on "Update drawing mode for minesweeper calendar mode" button.
   * This will result in another set of rules for week cells painting
   */
  public $simplifiedCalendarDrawingModeObservable: Observable<boolean>;

  /**
   * Observable for the event of clicking on "show / hide teams easy series" button.
   * This will result in highlighting teams easy series on calendar
   */
  public $teamsEasySeriesObservable: Observable<boolean>;

  /**
   * Observable for the event of changing the start date of simplified calendar mode button.
   * This will result in another set of rules for week cells painting and calculation
   */
  public $simplifiedCalendarModeStartDateObservable: Observable<
    Date | undefined
  > = this._simplifiedCalendarModeStartDateSubject.asObservable();

  constructor(private _viewStateUrlService: ViewStateUrlService) {
    const initialState = this._viewStateUrlService.initialState;

    this._calendarSimplifiedModeSubject = new BehaviorSubject<boolean>(
      initialState.isSimplifiedCalendarMode
    );
    this._calendarGamesRangeSubject = new BehaviorSubject<boolean>(
      initialState.hasPastCalendarGames
    );
    this._simplifiedCalendarDrawingModeSubject = new BehaviorSubject<boolean>(
      initialState.isSimplifiedCalendarAdvancedDrawing
    );
    this._teamsEasySeriesSubject = new BehaviorSubject<boolean>(
      initialState.areTeamsEasySeriesEnabled
    );

    this.$calendarSimplifiedModeObservable =
      this._calendarSimplifiedModeSubject.asObservable();
    this.$calendarGamesRangeObservable =
      this._calendarGamesRangeSubject.asObservable();
    this.$simplifiedCalendarDrawingModeObservable =
      this._simplifiedCalendarDrawingModeSubject.asObservable();
    this.$teamsEasySeriesObservable =
      this._teamsEasySeriesSubject.asObservable();
  }

  /** Текущее состояние режима сапёра */
  public get isCalendarInSimplifiedMode(): boolean {
    return this._calendarSimplifiedModeSubject.value;
  }

  /** Текущее состояние показа прошедших игр */
  public get hasPastCalendarGames(): boolean {
    return this._calendarGamesRangeSubject.value;
  }

  /** Текущее состояние доп. режима отрисовки в режиме сапёра */
  public get isSimplifiedCalendarAdvancedDrawingEnabled(): boolean {
    return this._simplifiedCalendarDrawingModeSubject.value;
  }

  /** Текущее состояние подсветки лёгких серий */
  public get areTeamsEasySeriesEnabled(): boolean {
    return this._teamsEasySeriesSubject.value;
  }

  /**
   * Triggers the subject for "minesweeper" calendar mode
   * @param value Determines whether "minesweeper" calendar mode is enabled or disabled
   */
  public triggerCalendarInSimplifiedModeSubject(value: boolean): void {
    // Переключение режима сапёра заодно сбрасывает доп. отрисовку в то же значение -
    // так делают и шапка, и таблица календаря, поэтому состояние обновляется вместе с ними.
    this._viewStateUrlService.patch({
      isSimplifiedCalendarMode: value,
      isSimplifiedCalendarAdvancedDrawing: value,
    });
    this._calendarSimplifiedModeSubject.next(value);
    this._simplifiedCalendarDrawingModeSubject.next(value);
  }

  /**
   * Triggers the subject for "full" calendar mode with past games included
   * @param value Determines whether "full" calendar mode is enabled or disabled
   */
  public triggerCalendarGamesRangeSubject(value: boolean): void {
    this._viewStateUrlService.patch({ hasPastCalendarGames: value });
    this._calendarGamesRangeSubject.next(value);
  }

  /**
   * Triggers the subject for "extended" drawing mode in "minesweeper" calendar mode
   * @param value Determines whether "extended" mode is enabled or disabled
   */
  public triggerSimplifiedCalendarDrawingModeSubject(value: boolean): void {
    this._viewStateUrlService.patch({
      isSimplifiedCalendarAdvancedDrawing: value,
    });
    this._simplifiedCalendarDrawingModeSubject.next(value);
  }

  /**
   * Triggers the subject of changing the start date of simplified calendar mode button
   * @param value New filter start date
   */
  public triggerSimplifiedCalendarModeStartDateSubject(
    value: Date | undefined
  ): void {
    this._simplifiedCalendarModeStartDateSubject.next(value);
  }

  /**
   * Triggers the subject for for the event of clicking on "show / hide teams easy series"
   * @param value Determines whether teams easy series highlighting is enabled or disabled
   */
  public triggerTeamsEasySeriesSubject(value: boolean): void {
    this._viewStateUrlService.patch({ areTeamsEasySeriesEnabled: value });
    this._teamsEasySeriesSubject.next(value);
  }
}
