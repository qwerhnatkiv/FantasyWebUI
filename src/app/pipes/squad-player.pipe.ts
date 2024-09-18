import { Pipe, PipeTransform } from '@angular/core';
import { PlayerSquadRecord } from '../interfaces/player-squad-record';

@Pipe({
  name: 'squadPlayer',
})
export class SquadPlayerPipe implements PipeTransform {
  transform(squadPlayer: PlayerSquadRecord, expectedFantasyPointsDifference?: number): string {
    if (squadPlayer.isNew) {
        if (expectedFantasyPointsDifference != null && expectedFantasyPointsDifference >= 0) {
            return 'green-cell';
        }

        return 'red-cell';
    }

    return 'silver-cell'
  }
}
