import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { PlayerSquadRecord } from '../interfaces/player-squad-record';
@Component({
  selector: 'app-players-squad',
  templateUrl: './players-squad.component.html',
  styleUrls: ['./players-squad.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayersSquadComponent {
  displayedColumns: string[] = [
    'position',
    'playerName',
    'price',
    'expectedFantasyPoints'
  ];

  @Input() squadPlayers: PlayerSquadRecord[] = [];

  getTotalOFO() {
    if (this.squadPlayers == null) {
      return 0;
    }

    return this.squadPlayers.map(t => t.expectedFantasyPoints).reduce((acc, value) => acc + (value == null ? 0 : value), 0);
  }

  getTotalPrice() {
    if (this.squadPlayers == null) {
      return 0;
    }

    return this.squadPlayers.map(t => t.price).reduce((acc, value) => acc + value, 0);
  }
}
