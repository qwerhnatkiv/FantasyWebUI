import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { GamesUtils } from 'src/app/common/games-utils';
import { Utils } from 'src/app/common/utils';
import { DatesRangeModel } from 'src/app/interfaces/dates-range.model';
import { GamePredictionDTO } from 'src/app/interfaces/game-prediction-dto';

@Injectable()
export class DateFiltersService {
  private _dateFiltersSubject: Subject<DatesRangeModel> =
    new Subject<DatesRangeModel>();

  public minDefaultDate: Date | undefined = undefined;

  /**
   * Observable for the event of changing the date filters (one of the min and max).
   */
  public $dateFiltersObservable: Observable<DatesRangeModel> =
    this._dateFiltersSubject.asObservable();

  /**
   * Sets default dates to the filters and sends the update for all dependent components
   * @param weeks Weeks that are used for dates range choose
   * @param games Games to manipulate game weeks
   */
  public setFiltersDefaultDates(
    weeks: number[],
    games: GamePredictionDTO[]
  ): void {
    const minDate: Date = GamesUtils.getExtremumDateForGames(games, false);

    let minFilterDate: Date | undefined = new Date(minDate.getTime());
    let maxFilterDate: Date | undefined;

    if (weeks.length === 0) {
      minFilterDate = new Date();
      maxFilterDate = new Date();

      this.triggerDateFiltersSubjectUpdate(minFilterDate, maxFilterDate);
      return;
    }

    for (const week of weeks) {
      const weekGames: GamePredictionDTO[] = games.filter(
        (game) => game.weekNumber == week
      );

      const nextWeekGames: GamePredictionDTO[] = games.filter(
        (game) => game.weekNumber == week + 1
      );

      const thisWeekMinDate: Date = Utils.getMonday(
        GamesUtils.getExtremumDateForGames(weekGames, false),
        0
      );

      const nextWeekMinDate: Date | undefined =
        nextWeekGames?.length > 0
          ? Utils.getMonday(
              GamesUtils.getExtremumDateForGames(nextWeekGames, false),
              0
            )
          : undefined;

      const thisWeekMaxDate =
        nextWeekMinDate != null
          ? Utils.addDateDays(nextWeekMinDate, -1)
          : GamesUtils.getExtremumDateForGames(weekGames, true);

      const nextWeekMaxDate: Date =
        nextWeekGames.length > 0
          ? GamesUtils.getExtremumDateForGames(nextWeekGames, true)
          : thisWeekMaxDate;

      if (
        thisWeekMinDate.getTime() <= minDate.getTime()! &&
        thisWeekMaxDate.getTime() >= minDate.getTime()!
      ) {
        const today: Date = new Date();
        maxFilterDate =
          today.getDay() != 0 || today.getTime() < minFilterDate?.getTime()!
            ? thisWeekMaxDate
            : nextWeekMaxDate;

        minFilterDate =
          today.getDay() != 0 || today.getTime() < minFilterDate?.getTime()!
            ? minFilterDate
            : nextWeekMinDate;
        break;
      }
    }

    this.minDefaultDate = minFilterDate;
    this.triggerDateFiltersSubjectUpdate(minFilterDate, maxFilterDate);
  }

  /**
   * Sends an update of date filters to all dependent components
   * @param minDate Lower boundary date
   * @param maxDate Upper boundary date
   */
  public triggerDateFiltersSubjectUpdate(
    minDate: Date | undefined,
    maxDate: Date | undefined
  ): void {
    this._dateFiltersSubject.next({
      minDate: minDate,
      maxDate: maxDate,
    });
  }
}
