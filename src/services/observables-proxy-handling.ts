import { Injectable } from '@angular/core'
import { Observable, Subject } from 'rxjs'

@Injectable()
export class ObservablesProxyHandlingService {
    private _hideShowOnlyGamesCountSubject: Subject<void> = new Subject<void>();
    private _selectPlayerByIdSubject: Subject<number> = new Subject<number>();

    public $hideShowOnlyGamesCountSubject: Observable<void> = this._hideShowOnlyGamesCountSubject.asObservable();
    public $selectPlayerByIdSubject: Observable<number> = this._selectPlayerByIdSubject.asObservable();
  
    triggerHideShowOnlyGamesCountSubject(){
        this._hideShowOnlyGamesCountSubject.next();
    }

    triggerSelectPlayerByIdSubject(value: number){
        this._selectPlayerByIdSubject.next(value);
    }
}
