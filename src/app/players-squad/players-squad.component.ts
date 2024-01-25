import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { PlayerSquadRecord } from '../interfaces/player-squad-record';
import { DEFAULT_POSITIONS, DEFAULT_SUBSTITUTION_VALUE } from 'src/constants';
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
      value.length == this.substitutionsLeft 
      ? this.substitutionsValue 
      : this.substitutionsValue - this._squadPlayers.filter((x) => x.isNew).length;
  }

  public dataSource = new MatTableDataSource(this.squadPlayers);

  @Input() balanceValue: number = 0;

  public substitutionsLeft: number = DEFAULT_SUBSTITUTION_VALUE;
  private substitutionsValue: number = 0;
  @Input() set substitutions(value: number) {
    this.substitutionsLeft =
      this._squadPlayers.length == value ? value : value + 17 - this._squadPlayers.length;
    this.substitutionsValue = value;
  }

  @Output() sendAvailableSlots: EventEmitter<PositionsAvailableToPick> =
    new EventEmitter<PositionsAvailableToPick>();

  getTotalOFO() {
    if (this.squadPlayers == null) {
      return 0;
    }

    return this.squadPlayers
      .filter((item) => !item.isRemoved)
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
      .filter((item) => item.games && !item.isRemoved)
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
      ((availableSlots.defendersAvailable == 0 && row.position == DEFAULT_POSITIONS[1]) ||
        (availableSlots.forwardsAvailable == 0 && row.position == DEFAULT_POSITIONS[2]) ||
        (availableSlots.goaliesAvailable == 0 && row.position == DEFAULT_POSITIONS[0]))
    ) {
      return;
    }

    row.isRemoved = !row.isRemoved;
    this.sendAvailableSlots.emit(this.getAvailableSlots());
  }

  public clearAllSquadChanges() {
    this.squadPlayers = this.squadPlayers.filter((x) => !x.isNew);

    this.squadPlayers.filter((x) => x.isRemoved).forEach((x) => x.isRemoved = false);
    this.sendAvailableSlots.emit(this.getAvailableSlots());
  }

  public isClearAllSquadChangesButtonHidden() {
    return this.squadPlayers.filter((x) => x.isNew || x.isRemoved)?.length == 0;
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
      2 - notRemovedPlayers.filter((item) => item.position == DEFAULT_POSITIONS[0]).length;
    const defendersAvailable: number =
      6 - notRemovedPlayers.filter((item) => item.position == DEFAULT_POSITIONS[1]).length;
    const forwardsAvailable: number =
      9 - notRemovedPlayers.filter((item) => item.position == DEFAULT_POSITIONS[2]).length;
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
