/**
 * Полное состояние главного экрана, которое переживает копирование ссылки:
 * даты, режимы календаря, выбор игроков кликами, фильтры и выбранный пользователь.
 *
 * Состояние читается один раз при старте приложения и дальше только дописывается
 * в адресную строку - см. `ViewStateUrlService`.
 */
export interface ViewUrlState {
  /** Нижняя граница фильтра дат */
  dateFrom?: Date;

  /** Верхняя граница фильтра дат */
  dateTo?: Date;

  /** Календарь свёрнут */
  isCalendarHidden: boolean;

  /** В календаре показаны прошедшие игры */
  hasPastCalendarGames: boolean;

  /** Режим сапёра (только число игр по неделям) */
  isSimplifiedCalendarMode: boolean;

  /** Доп. режим отрисовки клеток в режиме сапёра */
  isSimplifiedCalendarAdvancedDrawing: boolean;

  /** Подсветка лёгких серий команд */
  areTeamsEasySeriesEnabled: boolean;

  /** Кнопка "лучшие по ОФО" нажата */
  areBestPlayersByOfoSelected: boolean;

  /** Игроки, выбранные кликом по строке и показанные в календаре */
  pickedPlayerIds: number[];

  /** Выбранная учётная запись (УЗ), чей состав подгружается */
  selectedUser?: string;

  //#region Фильтры игроков

  lowerBoundPrice?: number;
  upperBoundPrice?: number;
  positions: string[];
  teams: string[];
  powerPlayUnits: string[];

  /** Игроки, добавленные через поиск по имени */
  searchedPlayerIds: number[];

  formLength: number;
  playersAreNotPlayedDisabled: boolean;
  hideLowGPPlayersEnabled: boolean;
  showOnlyPlayersInUpsideLines: boolean;

  //#endregion Фильтры игроков
}
