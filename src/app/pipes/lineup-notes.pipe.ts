import { Pipe, PipeTransform } from '@angular/core';
import { PlayerStatsDTO } from '../interfaces/player-stats-dto';

export interface LineupNote {
  text: string;
  // 'out' - predicted outside the lineup (loud), 'up'/'down' - a move for better/worse
  kind: 'out' | 'up' | 'down';
}

const OUT_REASON_TEXT: Record<string, string> = {
  scratch: 'ВНЕ СОСТАВА',
  injured: 'ТРАВМА',
  backup: 'ЗАПАСНОЙ',
};

// PP unit 0 = on neither; for "better/worse" it ranks below unit 2
const ppRank = (unit: number): number => (unit === 0 ? 3 : unit);

const ppText = (unit: number): string => (unit === 0 ? 'нет' : String(unit));

/**
 * Daily Faceoff notes for a player's next game: out of the lineup, and a changed line / pair / power
 * play unit against his previous game. Empty when nothing changed (or DFO has nothing for the club).
 */
@Pipe({
  name: 'lineupNotes',
})
export class LineupNotesPipe implements PipeTransform {
  transform(player: PlayerStatsDTO | undefined): LineupNote[] {
    if (!player) {
      return [];
    }

    if (player.dfoOutReason) {
      return [
        {
          text: OUT_REASON_TEXT[player.dfoOutReason] ?? 'ВНЕ СОСТАВА',
          kind: 'out',
        },
      ];
    }

    const notes: LineupNote[] = [];

    if (
      player.position !== 'GK' &&
      player.dfoLine != null &&
      player.dfoPrevLine != null &&
      player.dfoLine !== player.dfoPrevLine
    ) {
      notes.push({
        text: `${player.position === 'DF' ? 'пара' : 'звено'} ${player.dfoPrevLine}→${player.dfoLine}`,
        kind: player.dfoLine < player.dfoPrevLine ? 'up' : 'down',
      });
    }

    if (
      player.position !== 'GK' &&
      player.dfoPpUnit != null &&
      player.dfoPrevPpUnit != null &&
      player.dfoPpUnit !== player.dfoPrevPpUnit
    ) {
      notes.push({
        text: `ПП ${ppText(player.dfoPrevPpUnit)}→${ppText(player.dfoPpUnit)}`,
        kind:
          ppRank(player.dfoPpUnit) < ppRank(player.dfoPrevPpUnit)
            ? 'up'
            : 'down',
      });
    }

    return notes;
  }
}
