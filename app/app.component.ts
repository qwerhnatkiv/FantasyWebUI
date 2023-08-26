import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  public games?: GamePredictionDTO[];

  constructor(http: HttpClient) {
    http.get<GamePredictionDTO[]>('https://qwerhnatkiv.bsite.net/predictions/games/get').subscribe(result => {
      this.games = result.sort((n1, n2) => {
        if (n1.weekNumber > n2.weekNumber) {
          return 1;
        }

        if (n1.weekNumber < n2.weekNumber) {
          return -1;
        }

        return 0;
      });
    }, error => console.error(error));
  }

  title = 'angularapp';
}

interface GamePredictionDTO {
  homeTeamName: string;
  homeTeamAcronym: string;
  awayTeamName: string;
  awayTeamAcronym: string;
  gameDate: Date;
  homeTeamWinChance: number;
  awayTeamWinChance: number;
  drawChance: number;
  weekNumber: number;
}

