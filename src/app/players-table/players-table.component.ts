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
import { PlayerStatsDTO } from '../interfaces/player-stats-dto';
import { TeamStatsDTO } from '../interfaces/team-stats-dto';
import { PPToiPipe } from '../pipes/pptoi.pipe';

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
  constructor(private _liveAnnouncer: LiveAnnouncer) {
    this.dataSource.filterPredicate = this.filter;
  }

  private filterDictionary: Map<string, any> = new Map<string, any>();

  @ViewChild(MatSort) sort: MatSort | undefined;
  @Input() lowerBoundPrice: number | undefined;
  @Input() upperBoundPrice: number | undefined;
  @Input() positions: string[] | undefined = [];
  @Input() teams: string[] | undefined = [];
  @Input() teamIdAcronymMap: Map<number, string> | undefined = undefined;
  @Input() powerPlayUnits: string[] | undefined = [];
  @Input() playerStats: PlayerStatsDTO[] = [];
  @Input() teamStats: TeamStatsDTO[] = [];

  private pptoiPipe: PPToiPipe = new PPToiPipe();
  private players: PlayerChooseRecord[] = [];
  dataSource = new MatTableDataSource(this.players);
  //#region NG overrides

  ngOnChanges(changes: SimpleChanges) {

    if (
      changes['playerStats']?.previousValue &&
      changes['playerStats']?.currentValue &&
      changes['playerStats'].previousValue.length !=
        changes['playerStats'].currentValue.length
    ) {
      this.playerStats.forEach((x) => this.players.push((
        {
          firstChoice: false,
          secondChoice: false,
          playerName: x.playerName,
          team: this.teamStats?.find((team) => team.teamID == x.teamID)?.teamAcronym!,
          position: x.position,
          price: x.price,
          gamesCount: 0,
          easyGamesCount: 0,
          winPercentage: 0,
          powerPlayTime: this.pptoiPipe.transform(x.formPowerPlayTime, x.formPowerPlayTeamPosition),
          powerPlayNumber: `ПП${x.formPowerPlayNumber}`,
          toi: x.formTOI,
          shotsOnGoal: x.formShotsOnGoal,
          iXG: Math.round(x.formIxG * 100) / 100,
          iCF: x.formICF,
          iHDCF: x.formIHDCF,
          expectedFantasyPoints: 0,
          fantasyPointsPerGame: 0,
        }
      )));
    }

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

  public generateCellToolTip(player: PlayerChooseRecord): string | null {
    return `<div>
      <div class="tooltip-title">${player.playerName} (${player.position}, ${player.team})</div>
    </div>`
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
