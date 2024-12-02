import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable()
export class FiltersObservableProxyService {
  private _deselectPlayersFromComparisonSubject: Subject<void> =
    new Subject<void>();

  /**
   * Observable for the event of removing selected players from comparison tool in filters component
   */
  public $deselectPlayersFromComparisonObservable: Observable<void> =
    this._deselectPlayersFromComparisonSubject.asObservable();

  /**
   * Triggers the subject of removing selected players from comparison tool in filters component
   */
  public triggerDeselectPlayersFromComparisonSubject() {
    this._deselectPlayersFromComparisonSubject.next();
  }
}
