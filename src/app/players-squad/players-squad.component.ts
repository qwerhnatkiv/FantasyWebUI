import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { PlayerSquadRecord } from '../interfaces/player-squad-record';
import { DEFAULT_SUBSTITUTION_VALUE } from 'src/constants';
import { PositionsAvailableToPick } from '../interfaces/positions-available-to-pick';
import { MatTable, MatTableDataSource } from '@angular/material/table';
@Component({
  selector: 'app-players-squad',
  templateUrl: './players-squad.component.html',
  styleUrls: ['./players-squad.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayersSquadComponent {
  displayedColumns: string[] = [
    'action',
    'position',
    'playerName',
    'price',
    'games',
    'expectedFantasyPoints',
  ];

  @ViewChild(MatTable)
  table!: MatTable<PlayerSquadRecord>;

  private _squadPlayers: PlayerSquadRecord[] = [];
  get squadPlayers(): PlayerSquadRecord[] {
    return this._squadPlayers;
  }
  @Input() set squadPlayers(value: PlayerSquadRecord[]) {
    this._squadPlayers = value;
    this.dataSource = new MatTableDataSource(this.squadPlayers);

    this.sendAvailableSlots.emit(this.getAvailableSlots());
    this.substitutionsLeft =
      value.length == 0 ? 0 : 22 - this._squadPlayers.length;
  }

  public dataSource = new MatTableDataSource(this.squadPlayers);

  @Input() balanceValue: number = 0;
  @Input() substitutionsLeft: number = DEFAULT_SUBSTITUTION_VALUE;

  @Output() sendAvailableSlots: EventEmitter<PositionsAvailableToPick> =
    new EventEmitter<PositionsAvailableToPick>();

  getTotalOFO() {
    if (this.squadPlayers == null) {
      return 0;
    }

    return this.squadPlayers
      .map((t) => t.expectedFantasyPoints)
      .reduce((acc, value) => acc + (value == null ? 0 : value), 0);
  }

  public getTotalBalance(): number {
    if (this.squadPlayers == null) {
      return 0;
    }

    const bougthPlayersPrice: number = this.squadPlayers
      .filter((item) => item.price && item.isNew)
      .reduce((sum, current) => sum + current.price, 0);

    const removedPlayersPrice: number = this.squadPlayers
      .filter((item) => item.price && item.isRemoved)
      .reduce((sum, current) => sum + current.price, 0);

    return this.balanceValue - bougthPlayersPrice + removedPlayersPrice;
  }

  public getTotalGames(): number {
    if (this.squadPlayers == null) {
      return 0;
    }

    return this.squadPlayers
      .filter((item) => item.games)
      .reduce((sum, current) => sum + current.games, 0);
  }

  public removeRestoreRow(row: PlayerSquadRecord): void {
    if (row.isNew) {
      const index = this.squadPlayers.indexOf(row, 0);
      if (index > -1) {
        this.squadPlayers.splice(index, 1);
      }

      this.dataSource = new MatTableDataSource(this.squadPlayers);
      this.substitutionsLeft++;
      let availableSlots: PositionsAvailableToPick = this.getAvailableSlots();
      this.sendAvailableSlots.emit(availableSlots);
      return;
    }

    let availableSlots: PositionsAvailableToPick = this.getAvailableSlots();
    if (
      row.isRemoved &&
      ((availableSlots.defendersAvailable == 0 && row.position == 'З') ||
        (availableSlots.forwardsAvailable == 0 && row.position == 'Н') ||
        (availableSlots.goaliesAvailable == 0 && row.position == 'В'))
    ) {
      return;
    }

    row.isRemoved = !row.isRemoved;
    this.sendAvailableSlots.emit(this.getAvailableSlots());
  }

  private getAvailableSlots(): PositionsAvailableToPick {
    if (this.squadPlayers == null || this.squadPlayers.length == 0) {
      return {
        goaliesAvailable: 0,
        defendersAvailable: 0,
        forwardsAvailable: 0,
        selectedPlayerIds: [],
      };
    }

    const notRemovedPlayers: PlayerSquadRecord[] = this.squadPlayers.filter(
      (item) => !item.isRemoved
    );
    const goaliesAvailable: number =
      2 - notRemovedPlayers.filter((item) => item.position == 'В').length;
    const defendersAvailable: number =
      6 - notRemovedPlayers.filter((item) => item.position == 'З').length;
    const forwardsAvailable: number =
      9 - notRemovedPlayers.filter((item) => item.position == 'Н').length;
    const selectedPlayersIds: Array<number> = notRemovedPlayers.map(
      (item) => item.playerId
    );

    return {
      goaliesAvailable: goaliesAvailable,
      defendersAvailable: defendersAvailable,
      forwardsAvailable: forwardsAvailable,
      selectedPlayerIds: selectedPlayersIds,
    };
  }
}
