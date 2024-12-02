import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class CalendarObservableProxyService {
  private _calendarSimplifiedModeSubject: Subject<boolean> =
    new Subject<boolean>();
  private _calendarGamesRangeSubject: Subject<boolean> = new Subject<boolean>();
  private _simplifiedCalendarDrawingModeSubject: Subject<boolean> =
    new Subject<boolean>();
  private _simplifiedCalendarModeStartDateSubject: Subject<Date | undefined> = new Subject<Date | undefined>();

  /**
   * Observable for the event of clicking on "minesweeper" button.
   * This will result in updating the calendar DOM to show only weeks in calendar instead of all game days
   */
  public $calendarSimplifiedModeObservable: Observable<boolean> =
    this._calendarSimplifiedModeSubject.asObservable();

  /**
   * Observable for the event of clicking on "expand full calendar" button.
   * This will result in opening past games in addition to future games
   */
  public $calendarGamesRangeObservable: Observable<boolean> =
    this._calendarGamesRangeSubject.asObservable();

  /**
   * Observable for the event of clicking on "Update drawing mode for minesweeper calendar mode" button.
   * This will result in another set of rules for week cells painting
   */
  public $simplifiedCalendarDrawingModeObservable: Observable<boolean> =
    this._simplifiedCalendarDrawingModeSubject.asObservable();

  /**
   * Observable for the event of changing the start date of simplified calendar mode button.
   * This will result in another set of rules for week cells painting and calculation
   */
  public $simplifiedCalendarModeStartDateObservable: Observable<Date | undefined> =
    this._simplifiedCalendarModeStartDateSubject.asObservable();

  /**
   * Triggers the subject for "minesweeper" calendar mode
   * @param value Determines whether "minesweeper" calendar mode is enabled or disabled
   */
  public triggerCalendarInSimplifiedModeSubject(value: boolean): void {
    this._calendarSimplifiedModeSubject.next(value);
  }

  /**
   * Triggers the subject for "full" calendar mode with past games included
   * @param value Determines whether "full" calendar mode is enabled or disabled
   */
  public triggerCalendarGamesRangeSubject(value: boolean): void {
    this._calendarGamesRangeSubject.next(value);
  }

  /**
   * Triggers the subject for "extended" drawing mode in "minesweeper" calendar mode
   * @param value Determines whether "extended" mode is enabled or disabled
   */
  public triggerSimplifiedCalendarDrawingModeSubject(value: boolean): void {
    this._simplifiedCalendarDrawingModeSubject.next(value);
  }

  /**
   * Triggers the subject of changing the start date of simplified calendar mode button
   * @param value New filter start date
   */
  public triggerSimplifiedCalendarModeStartDateSubject(value: Date | undefined): void {
    this._simplifiedCalendarModeStartDateSubject.next(value);
  }
}
