import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DEFAULT_PRICES, DEFAULT_POSITIONS, TEAMS, POWER_PLAY_UNITS, USER_ID_NAME } from 'src/constants';
import { OfoVariant } from '../interfaces/ofo-variant';

@Component({
  selector: 'app-players-filters',
  templateUrl: './players-filters.component.html',
  styleUrls: ['./players-filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayersFiltersComponent implements AfterViewInit {
  prices: number[] = DEFAULT_PRICES.sort((n1,n2) => n1 - n2);
  selectPositions: string[] = DEFAULT_POSITIONS;
  selectTeams: string[] = TEAMS;
  selectPP: string[] = POWER_PLAY_UNITS;
  selectUsers: string[] = Array.from( USER_ID_NAME.keys() );

  lowerBoundPrice: number | undefined = undefined;
  upperBoundPrice: number | undefined = undefined;
  positionsFormControl = new FormControl<string[]>([]);
  teamsFormControl = new FormControl<string[]>([]);
  powerPlayFormControl = new FormControl<string[]>([]);
  selectedUser: string | undefined = undefined;

  @Output() sendLowerBoundPrice: EventEmitter<number | undefined> = new EventEmitter<number | undefined>();
  @Output() sendUpperBoundPrice: EventEmitter<number | undefined> = new EventEmitter<number | undefined>();
  @Output() sendPositions: EventEmitter<string[]> = new EventEmitter<string[]>();
  @Output() sendTeams: EventEmitter<string[]> = new EventEmitter<string[]>();
  @Output() sendPowerPlayUnits: EventEmitter<string[]> = new EventEmitter<string[]>();
  @Output() sendSelectedUser: EventEmitter<string | undefined> = new EventEmitter<string | undefined>();

  @Input() firstChoiceOfo: OfoVariant = {
    priceByExpectedFantasyPointsSum:0,
    priceSum:0,
    expectedFantasyPointsSum:0,
    playersCount: 0
  };

  @Input() secondChoiceOfo: OfoVariant = {
    priceByExpectedFantasyPointsSum:0,
    priceSum:0,
    expectedFantasyPointsSum: 0,
    playersCount: 0
  };

  ngAfterViewInit() {
    this.setDefaultPositions();
  }

  lowerBoundPriceChanged() {
    if (this.lowerBoundPrice! > this.upperBoundPrice!) {
      this.upperBoundPrice = undefined;
      this.upperBoundPriceChanged();
    }

    this.sendLowerBoundPrice.emit(this.lowerBoundPrice);
  }

  upperBoundPriceChanged() {
    this.sendUpperBoundPrice.emit(this.upperBoundPrice);
  }

  positionsChanged() {
    this.sendPositions.emit(this.positionsFormControl.value!);
  }

  selectedUserChanged() {
    this.sendSelectedUser.emit(this.selectedUser!);
  }

  teamsChanged() {
    this.sendTeams.emit(this.teamsFormControl.value!);
  }

  powerPlayUnitsChanged() {
    this.sendPowerPlayUnits.emit(this.powerPlayFormControl.value!);
  }

  
  public selectAllTeams() {
    this.teamsFormControl.setValue(this.selectTeams); 
    this.teamsChanged();
  }

  public deselectAllTeams() {
    this.teamsFormControl.setValue([]); 
    this.teamsChanged();
  }

  public setDefaultPositions() {
    const defaultPositions: any[] = [
      DEFAULT_POSITIONS[1],
      DEFAULT_POSITIONS[2]
    ]

    this.positionsFormControl.setValue(defaultPositions);
    this.positionsChanged();
  }
}
