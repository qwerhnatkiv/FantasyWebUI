import {LiveAnnouncer} from '@angular/cdk/a11y';
import {AfterViewInit, Component, ViewChild} from '@angular/core';
import {MatSort, Sort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';

export interface PlayerChooseRecord {
  firstChoice: boolean;
  secondChoice: boolean;
  playerName: string;
  team: string;
  position: string;
  price: number;
  gamesCount: number;
  easyGamesCount: number;
  winPercentage: number;
  powerPlayTime: string;
  powerPlayNumber: string;
  toi: number;
  shotsOnGoal: number;
  iXG: number;
  iCF: number;
  iHDCF: number;
  expectedFantasyPoints: number;
  fantasyPointsPerGame: number;
}

const ELEMENT_DATA: PlayerChooseRecord[] = [
  {
    firstChoice: true,
    secondChoice: false,
    playerName: "Connor McDavid",
    team: "EDM",
    position: "Н",
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
    playerName: "Auston Matthews",
    team: "TOR",
    position: "Н",
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
    playerName: "Elias Pettersen",
    team: "VAN",
    position: "Н",
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
  }
];

@Component({
  selector: 'app-players-table',
  templateUrl: './players-table.component.html',
  styleUrls: ['./players-table.component.css'],
})
export class PlayersTableComponent implements AfterViewInit {
  displayedColumns: string[] = [  'firstChoice',
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
    'fantasyPointsPerGame']
  dataSource = new MatTableDataSource(ELEMENT_DATA);
  constructor(private _liveAnnouncer: LiveAnnouncer) {}

  @ViewChild(MatSort) sort: MatSort | undefined;

  ngAfterViewInit() {
    this.dataSource.sort = this.sort!;
  }

  getPlayerSelectedIconPath(choiceIndex: number, firstChoice: boolean, secondChoice: boolean): string {
    if (!firstChoice && !secondChoice) {
      return "/assets/images/player-not-selected.png";
    }

    if (choiceIndex == 1 && secondChoice || choiceIndex == 2 && firstChoice) {
      return "/assets/images/player-selected-not-here.png";
    }

    if (choiceIndex == 1 && firstChoice) {
      return "/assets/images/player-selected-first.png";
    }

    if (choiceIndex == 2 && secondChoice) {
      return "/assets/images/player-selected-second.png";
    }

    return "";
  }

  getPlayerSelectedClass(firstChoice: boolean, secondChoice: boolean): string {
    if (firstChoice) {
      return "first-choice-selected-cell";
    }

    if (secondChoice) {
      return "second-choice-selected-cell";
    }

    return "";
  }

    /** Announce the change in sort state for assistive technology. */
    announceSortChange(sortState: Sort) {
      if (sortState.direction) {
        this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
      } else {
        this._liveAnnouncer.announce('Sorting cleared');
      }
    }
}
