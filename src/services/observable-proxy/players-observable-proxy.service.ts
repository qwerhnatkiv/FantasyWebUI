import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SelectedPlayerModel } from 'src/app/interfaces/selected-player-model';
import { PlayerLineFormatted } from 'src/app/interfaces/sports-squad-dto copy';

@Injectable()
export class PlayersObservableProxyService {
  private _showPlayerInCalendarSubject: Subject<number> = new Subject<number>();
  private _showBestPlayersInCalendarSubject: Subject<void> =
    new Subject<void>();
  private _selectedPlayersSubject: Subject<Map<string, SelectedPlayerModel[]>> =
    new Subject<Map<string, SelectedPlayerModel[]>>();
  private _updatePlayersEfpDataByDateRangeSubject: Subject<void> =
    new Subject<void>();
  private _playerLinesSubject: Subject<Map<number, PlayerLineFormatted[]>> =
    new Subject<Map<number, PlayerLineFormatted[]>>();


  /**
   * Observable for the event of selecting player id and showing him in calendar
   */
  public $showPlayerInCalendarObservable: Observable<number> =
    this._showPlayerInCalendarSubject.asObservable();

  /**
   * Observable for the event of selecting best players and showing them in calendar
   */
  public $showBestPlayersInCalendarObservable: Observable<void> =
    this._showBestPlayersInCalendarSubject.asObservable();

  /**
   * Observable for the subject containing best players for each team
   */
  public $selectedPlayersObservable: Observable<
    Map<string, SelectedPlayerModel[]>
  > = this._selectedPlayersSubject.asObservable();

  /**
   * Observable for the event of updating players expected fantasy points data based on current range
   */
  public $updatePlayersEfpDataByDateRangeObservable: Observable<void> =
    this._updatePlayersEfpDataByDateRangeSubject.asObservable();

    /**
   * Observable for the subject containing list of player lines
   */
  public $playerLinesObservable: Observable<
    Map<number, PlayerLineFormatted[]>
  > = this._playerLinesSubject.asObservable();

  /**
   * Triggers the subject of selecting player id and showing him in calendar
   */
  public triggerShowPlayerInCalendarSubject(value: number): void {
    this._showPlayerInCalendarSubject.next(value);
  }

  /**
   * Triggers the subject of selecting best players and showing them in calendar
   */
  public triggerShowBestPlayersInCalendarEvent(): void {
    this._showBestPlayersInCalendarSubject.next();
  }

  /**
   * Triggers the subject containing best players for each team
   */
  public triggerSendSelectedPlayersToCalendar(
    players: Map<string, SelectedPlayerModel[]>
  ): void {
    this._selectedPlayersSubject.next(players);
  }

  /**
   * Triggers the subject of updating players expected fantasy points data based on current range
   */
  public triggerUpdatePlayersEfpDataByDateRangeEvent(): void {
    this._updatePlayersEfpDataByDateRangeSubject.next();
  }

  /**
   * Triggers the subject containing best players for each team
   */
  public triggerPlayerLinesTransfer(
    players: Map<number, PlayerLineFormatted[]>
  ): void {
    this._playerLinesSubject.next(players);
  }
}
