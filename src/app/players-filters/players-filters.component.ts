import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DEFAULT_PRICES, DEFAULT_POSITIONS } from 'src/constants';

@Component({
  selector: 'app-players-filters',
  templateUrl: './players-filters.component.html',
  styleUrls: ['./players-filters.component.css'],
})
export class PlayersFiltersComponent {
  prices: number[] = DEFAULT_PRICES.sort((n1,n2) => n2 - n1);
  selectPositions: string[] = DEFAULT_POSITIONS;

  lowerBoundPrice: number | undefined = undefined;
  upperBoundPrice: number | undefined = undefined;
  positionsFormControl = new FormControl<string[]>([]);

  @Output() sendLowerBoundPrice: EventEmitter<number | undefined> = new EventEmitter<number | undefined>();
  @Output() sendUpperBoundPrice: EventEmitter<number | undefined> = new EventEmitter<number | undefined>();
  @Output() sendPositions: EventEmitter<string[]> = new EventEmitter<string[]>();

  lowerBoundPriceChanged() {
    this.sendLowerBoundPrice.emit(this.lowerBoundPrice);
  }

  upperBoundPriceChanged() {
    this.sendUpperBoundPrice.emit(this.upperBoundPrice);
  }

  positionsChanged() {
    this.sendPositions.emit(this.positionsFormControl.value!);
  }
}
