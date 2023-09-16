import { LiveAnnouncer } from '@angular/cdk/a11y';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PlayerChooseRecord } from '../interfaces/player-choose-record';
import { PlayersFilter } from '../interfaces/players-filter';

const ELEMENT_DATA: PlayerChooseRecord[] = [
  {
    firstChoice: true,
    secondChoice: false,
    playerName: 'Connor McDavid',
    team: 'EDM',
    position: 'Н',
    price: 2345,
    gamesCount: 3,
    easyGamesCount: 2,
    winPercentage: 75,
    powerPlayTime: '3:20(1)',
    powerPlayNumber: 'ПП1',
    toi: 21.02,
    shotsOnGoal: 7,
    iXG: 2.1,
    iCF: 11,
    iHDCF: 7,
    expectedFantasyPoints: 61,
    fantasyPointsPerGame: 12.2,
  },
  {
    firstChoice: false,
    secondChoice: false,
    playerName: 'Auston Matthews',
    team: 'TOR',
    position: 'Н',
    price: 2125,
    gamesCount: 3,
    easyGamesCount: 2,
    winPercentage: 60,
    powerPlayTime: '2:30(2)',
    powerPlayNumber: 'ПП1',
    toi: 18.53,
    shotsOnGoal: 10,
    iXG: 1.5,
    iCF: 12,
    iHDCF: 7,
    expectedFantasyPoints: 57,
    fantasyPointsPerGame: 11.2,
  },
  {
    firstChoice: false,
    secondChoice: true,
    playerName: 'Elias Pettersen',
    team: 'VAN',
    position: 'Н',
    price: 1722,
    gamesCount: 4,
    easyGamesCount: 1,
    winPercentage: 80,
    powerPlayTime: '3:45(4)',
    powerPlayNumber: 'ПП1',
    toi: 18.12,
    shotsOnGoal: 7,
    iXG: 1.7,
    iCF: 8,
    iHDCF: 6,
    expectedFantasyPoints: 49,
    fantasyPointsPerGame: 9.4,
  },
  {
    firstChoice: true,
    secondChoice: false,
    playerName: 'Vitalya',
    team: 'SEA',
    position: 'З',
    price: 1100,
    gamesCount: 3,
    easyGamesCount: 3,
    winPercentage: 100,
    powerPlayTime: '7:45(1)',
    powerPlayNumber: 'ПП2',
    toi: 23.56,
    shotsOnGoal: 69,
    iXG: 2.28,
    iCF: 2,
    iHDCF: 19,
    expectedFantasyPoints: 23,
    fantasyPointsPerGame: 23,
  },
];

@Component({
  selector: 'app-players-table',
  templateUrl: './players-table.component.html',
  styleUrls: ['./players-table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayersTableComponent implements AfterViewInit, OnChanges {
  displayedColumns: string[] = [
    'firstChoice',
    'secondChoice',
    'playerName',
    'team',
    'position',
    'price',
    'gamesCount',
    'easyGamesCount',
    'winPercentage',
    'powerPlayTime',
    'powerPlayNumber',
    'toi',
    'shotsOnGoal',
    'iXG',
    'iCF',
    'iHDCF',
    'expectedFantasyPoints',
    'fantasyPointsPerGame',
  ];
  dataSource = new MatTableDataSource(ELEMENT_DATA);
  constructor(private _liveAnnouncer: LiveAnnouncer) {
    this.dataSource.filterPredicate = this.filter;
  }

  private filterDictionary: Map<string, any> = new Map<string, any>();

  @ViewChild(MatSort) sort: MatSort | undefined;
  @Input() lowerBoundPrice: number | undefined;
  @Input() upperBoundPrice: number | undefined;
  @Input() positions: string[] | undefined = [];
  @Input() teams: string[] | undefined = [];
  @Input() powerPlayUnits: string[] | undefined = [];

  //#region NG overrides

  ngOnChanges() {
    this.applyPlayersFilter({
      name: "lowerBoundPrice",
      value: this.lowerBoundPrice
    });

    this.applyPlayersFilter({
      name: "upperBoundPrice",
      value: this.upperBoundPrice
    });

    this.applyPlayersFilter({
      name: "positions",
      value: this.positions
    });

    this.applyPlayersFilter({
      name: "teams",
      value: this.teams
    });

    this.applyPlayersFilter({
      name: "powerPlayUnits",
      value: this.powerPlayUnits
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort!;
  }

  //#endregion NG overrides

  //#region Public Methods

  getPlayerSelectedIconPath(
    choiceIndex: number,
    firstChoice: boolean,
    secondChoice: boolean
  ): string {
    if (!firstChoice && !secondChoice) {
      return '/assets/images/player-not-selected.png';
    }

    if (
      (choiceIndex == 1 && secondChoice) ||
      (choiceIndex == 2 && firstChoice)
    ) {
      return '/assets/images/player-selected-not-here.png';
    }

    if (choiceIndex == 1 && firstChoice) {
      return '/assets/images/player-selected-first.png';
    }

    if (choiceIndex == 2 && secondChoice) {
      return '/assets/images/player-selected-second.png';
    }

    return '';
  }

  getPlayerSelectedClass(firstChoice: boolean, secondChoice: boolean): string {
    if (firstChoice) {
      return 'first-choice-selected-cell';
    }

    if (secondChoice) {
      return 'second-choice-selected-cell';
    }

    return '';
  }

  /** Announce the change in sort state for assistive technology. */
  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  //#endregion 

  //#region Private methods

  private filter(record: PlayerChooseRecord, filter: string) {
    var map = new Map<string, any>(JSON.parse(filter));
    let isMatch = false;

    for (let [key, value] of map) {

      if (value == null || value.length === 0) {
        isMatch = true;
        continue;
      }

      if (key == "lowerBoundPrice") {
        isMatch = record.price >= value;
      }
      
      if (key == "upperBoundPrice") {
        isMatch = record.price <= value;
      }

      if (key == "positions") {
        isMatch = value.includes(record.position);
      }

      if (key == "teams") {
        isMatch = value.includes(record.team);
      }

      if (key == "powerPlayUnits") {
        isMatch = value.includes(record.powerPlayNumber);
      }

      if (!isMatch) {
        return false;
      }
    }

    return isMatch;
  }

  private applyPlayersFilter(filter: PlayersFilter) {
    this.filterDictionary.set(filter.name, filter.value);
    var jsonString = JSON.stringify(
      Array.from(this.filterDictionary.entries())
    );
    this.dataSource.filter = jsonString;
  }

  //#endregion
}
