// src/app/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GamesDTO } from 'src/app/interfaces/games-dto';
import { PlayerExpectedFantasyPointsDTO } from 'src/app/interfaces/player-expected-fantasy-points-dto';
import { USER_ID_NAME } from 'src/constants';
import { SportsSquadDTO } from 'src/app/interfaces/sports-squad-dto';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  /**
   * Returns list of games for a full calendar
   * @param formLength Length of the form for teams stats
   * @returns Observable with games data to subscribe for
   */
  public getGames(formLength: number): Observable<GamesDTO> {
    return this.http.get<GamesDTO>(
      `https://qwerhnatkiv-backend.azurewebsites.net/predictions/games/get?formLength=${formLength}`
    );
  }

  /**
   * Returns list of players and their expected fantasy points
   * @param minDate Min date for a predict
   * @param maxDate Max date for a predict
   * @param formLength Length of the form for player stats
   * @returns Observable with players data to subscribe for
   */
  public getPlayersEFP(
    minDate: string,
    maxDate: string,
    formLength: number
  ): Observable<{ [index: number]: PlayerExpectedFantasyPointsDTO[] }> {
    return this.http.get<{ [index: number]: PlayerExpectedFantasyPointsDTO[] }>(
      `https://qwerhnatkiv-backend.azurewebsites.net/predictions/ofo_predictions/get?lowerBoundDate=${minDate}&upperBoundDate=${maxDate}&formLength=${formLength}`
    );
  }

    /**
   * Returns squad on sports.ru for a specific user
   * @param selectedUsername User's username
   * @returns Observable with squad data to subscribe for
   */
  public getSportsSquad(selectedUsername: string): Observable<SportsSquadDTO> {
    return this.http.get<SportsSquadDTO>(
      `https://qwerhnatkiv-backend.azurewebsites.net/sportsSquad?accountId=${USER_ID_NAME.get(
        selectedUsername
      )}`
    );
  }
}
