import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class FiltersObservableProxyService {
  private _deselectPlayersFromComparisonSubject: Subject<void> =
    new Subject<void>();

  private _selectOnlyFromUpsideLinesSubject: Subject<boolean> =
    new Subject<boolean>();

  /**
   * Observable for the event of removing selected players from comparison tool in filters component
   */
  public $deselectPlayersFromComparisonObservable: Observable<void> =
    this._deselectPlayersFromComparisonSubject.asObservable();

  /**
   * Observable for the event of selecting only players that are in good (upside, elite) lines
   */
  public $selectOnlyFromUpsideLinesObservable: Observable<boolean> =
    this._selectOnlyFromUpsideLinesSubject.asObservable();  

  /**
   * Triggers the subject of removing selected players from comparison tool in filters component
   */
  public triggerDeselectPlayersFromComparisonSubject() {
    this._deselectPlayersFromComparisonSubject.next();
  }

  /**
   * Triggers the subject of removing selected players from comparison tool in filters component
   */
  public triggerSelectOnlyFromUpsideLinesSubject(value: boolean) {
    this._selectOnlyFromUpsideLinesSubject.next(value);
  }
}
