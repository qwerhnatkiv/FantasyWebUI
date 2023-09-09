export class TeamWeek {
  public teamName: string;
  public week: number;
  public gamesCount: number;

  constructor(teamName: string, week: number, gamesCount: number) {
    this.teamName = teamName;
    this.week = week;
    this.gamesCount = gamesCount;
  }
}
