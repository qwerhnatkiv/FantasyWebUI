import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DEFAULT_PRICES, DEFAULT_POSITIONS, TEAMS, POWER_PLAY_UNITS, USER_ID_NAME, DEFAULT_FORM_LENGTH, DEFAULT_FORM_LENGTH_COUNT, REMOVE_PLAYERS_WITH_NO_GAMES } from 'src/constants';
import { OfoVariant } from '../interfaces/ofo-variant';
import { MatSelectChange } from '@angular/material/select';
import { RED_GP_UPPER_BOUNDARY } from '../../constants'
import { MatOptionSelectionChange } from '@angular/material/core';
import { FiltersObservableProxyService } from 'src/services/observable-proxy/filters-observable-proxy.service';
import { Utils } from '../common/utils';

@Component({
  selector: 'app-players-filters',
  templateUrl: './players-filters.component.html',
  styleUrls: ['./players-filters.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlayersFiltersComponent implements AfterViewInit {
  protected UTILS = Utils;

  prices: number[] = DEFAULT_PRICES.sort((n1,n2) => n1 - n2);
  selectPositions: string[] = DEFAULT_POSITIONS;
  selectTeams: string[] = TEAMS;
  selectPP: string[] = POWER_PLAY_UNITS;
  selectUsers: string[] = Array.from( USER_ID_NAME.keys() );
  RED_GP_UPPER_BOUNDARY: number = RED_GP_UPPER_BOUNDARY;
  lowerBoundPrice: number | undefined = undefined;
  upperBoundPrice: number | undefined = undefined;
  positionsFormControl = new FormControl<string[]>([]);
  teamsFormControl = new FormControl<string[]>([]);
  powerPlayFormControl = new FormControl<string[]>([]);
  selectedUser: string | null = null;
  selectedUserId: number | undefined = undefined;

  playersAreNotPlayedDisabled: boolean = REMOVE_PLAYERS_WITH_NO_GAMES;
  hideLowGPPlayersEnabled: boolean = false;
  public formLength: number = DEFAULT_FORM_LENGTH;
  public formLengthCount: Array<number> = new Array(DEFAULT_FORM_LENGTH_COUNT);

  @Output() sendLowerBoundPrice: EventEmitter<number | undefined> = new EventEmitter<number | undefined>();
  @Output() sendUpperBoundPrice: EventEmitter<number | undefined> = new EventEmitter<number | undefined>();
  @Output() sendPositions: EventEmitter<string[]> = new EventEmitter<string[]>();
  @Output() sendTeams: EventEmitter<string[]> = new EventEmitter<string[]>();
  @Output() sendPowerPlayUnits: EventEmitter<string[]> = new EventEmitter<string[]>();
  @Output() sendSelectedUser: EventEmitter<string | undefined> = new EventEmitter<string | undefined>();
  @Output() sendPlayersAreNotPlayedDisabled: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() sendHideLowGPPlayersEnabled: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Output() sendFormLength: EventEmitter<number> = new EventEmitter<number>();

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

  constructor(
    private _filtersObservableProxyService: FiltersObservableProxyService,
  ) {
  }

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

  playersAreNotPlayedDisabledChanged() {
    this.sendPlayersAreNotPlayedDisabled.emit(this.playersAreNotPlayedDisabled);
  }

  hideLowGPPlayersEnabledChanged() {
    this.sendHideLowGPPlayersEnabled.emit(this.hideLowGPPlayersEnabled);
  }

  positionsChanged() {
    this.sendPositions.emit(this.positionsFormControl.value!);
  }

  positionOnClick(event: MatOptionSelectionChange) {
    if (event.source.value == DEFAULT_POSITIONS[0]) {
      if (event.source.selected) {
        const GK_Position: any[] = [
          DEFAULT_POSITIONS[0]
        ];
  
        this.positionsFormControl.setValue(GK_Position);
        this.positionsChanged();
        
        this.playersAreNotPlayedDisabled = false;
        this.playersAreNotPlayedDisabledChanged();
      }
      else {
        this.playersAreNotPlayedDisabled = REMOVE_PLAYERS_WITH_NO_GAMES;
        this.playersAreNotPlayedDisabledChanged();
      }
    }
  }

  formLengthChanged(event: MatSelectChange) {
    this.sendFormLength.emit(event.value);
  }

  selectedUserChanged() {
    this.sendSelectedUser.emit(this.selectedUser!);

    if (this.selectedUser == null) {
      this.selectedUserId = undefined;
      return;
    }

    this.selectedUserId = USER_ID_NAME.get(
      this.selectedUser!
    );
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

  public resetLowerBoundPriceFilter() {
    this.lowerBoundPrice = undefined; 
    this.lowerBoundPriceChanged();
  }

  public resetUpperBoundPriceFilter() {
    this.upperBoundPrice = undefined; 
    this.upperBoundPriceChanged();
  }

  public resetPowerPlayFilter() {
    this.powerPlayFormControl.setValue([]); 
    this.powerPlayUnitsChanged()
  }

  public resetSelectedUserFilter() {
    this.selectedUser = null; 
    this.selectedUserChanged()
  }

  public resetAllFilters() {
    this.resetLowerBoundPriceFilter();
    this.resetUpperBoundPriceFilter();
    this.setDefaultPositions();
    this.deselectAllTeams();
    this.resetPowerPlayFilter();
    this.resetSelectedUserFilter();

    if (this.formLength != DEFAULT_FORM_LENGTH) {
      this.formLength = DEFAULT_FORM_LENGTH;
      this.sendFormLength.emit(this.formLength);
    }

    this.clearAllPlayersSelection();

    this.playersAreNotPlayedDisabled = REMOVE_PLAYERS_WITH_NO_GAMES;
    this.playersAreNotPlayedDisabledChanged();

    this.hideLowGPPlayersEnabled = false;
    this.hideLowGPPlayersEnabledChanged();
  }

  protected clearAllPlayersSelection() {
    this._filtersObservableProxyService.triggerDeselectPlayersFromComparisonSubject();
  }

  /**
   * Opens user's profile on SPORTS.RU resource
   */
  public openSportsRuProfile(): void {
    window.open(`https://www.sports.ru/fantasy/hockey/team/${this.selectedUserId}.html`);
  }
}
