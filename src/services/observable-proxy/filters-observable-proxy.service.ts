import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ViewStateUrlService } from '../url-state/view-state-url.service';

@Injectable()
export class FiltersObservableProxyService {
  private _deselectPlayersFromComparisonSubject: Subject<void> =
    new Subject<void>();

  // BehaviorSubject, а не Subject: фильтры отдают состояние из адресной строки в своём
  // ngOnInit, а таблица игроков подписывается позже - обычный Subject терял бы эту отправку.
  private _selectOnlyFromUpsideLinesSubject: BehaviorSubject<boolean>;

  /**
   * Observable for the event of removing selected players from comparison tool in filters component
   */
  public $deselectPlayersFromComparisonObservable: Observable<void> =
    this._deselectPlayersFromComparisonSubject.asObservable();

  /**
   * Observable for the event of selecting only players that are in good (upside, elite) lines
   */
  public $selectOnlyFromUpsideLinesObservable: Observable<boolean>;

  constructor(private _viewStateUrlService: ViewStateUrlService) {
    this._selectOnlyFromUpsideLinesSubject = new BehaviorSubject<boolean>(
      this._viewStateUrlService.initialState.showOnlyPlayersInUpsideLines
    );

    this.$selectOnlyFromUpsideLinesObservable =
      this._selectOnlyFromUpsideLinesSubject.asObservable();
  }

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
    this._viewStateUrlService.patch({ showOnlyPlayersInUpsideLines: value });
    this._selectOnlyFromUpsideLinesSubject.next(value);
  }
}
