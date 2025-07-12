import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { TeamsEasySeriesDto } from 'src/app/interfaces/teams-easy-series/teams-easy-series.model';

@Injectable()
export class TeamsEasySeriesService {
  private _teamsEasySeriesSubject: Subject<
    TeamsEasySeriesDto[]
  > = new Subject<TeamsEasySeriesDto[]>();

  public $teamsEasySeriesObservable: Observable<
    TeamsEasySeriesDto[]
  > = this._teamsEasySeriesSubject.asObservable();

  constructor(private http: HttpClient) {}

  //#region PUBLIC METHODS

  public getTeamsEasySeries(
  ): void {
    this.http
      .get<TeamsEasySeriesDto[]>(
        `https://qwerhnatkiv-backend.azurewebsites.net/easy-series`,
      )
      .subscribe({
        next: (result) => {
          result = result.map(x => {
            x.startDt = new Date(x.startDt);
            x.endDt = new Date(x.endDt);
            return x;
          })
          this._teamsEasySeriesSubject.next(result);
        },
        error: (err) => {
          console.error(err);
          return {
            total: 0,
            cost: 0,
            players: [],
          };
        },
      });
  }

  //#endregion PUBLIC METHODS
}
