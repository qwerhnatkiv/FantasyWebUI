import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { ViewUrlState } from 'src/app/interfaces/view-url-state';
import {
  DEFAULT_FORM_LENGTH,
  DEFAULT_POSITIONS,
  DEFAULT_POSITIONS_MAP,
  POWER_PLAY_UNITS,
  REMOVE_PLAYERS_WITH_NO_GAMES,
  SHOW_ONLY_PLAYERS_IN_UPSIDE_LINES,
} from 'src/constants';

/** Имена query-параметров. Короткие и латиницей, чтобы ссылку было не стыдно скопировать. */
export const URL_KEYS = {
  dateFrom: 'from',
  dateTo: 'to',
  isCalendarHidden: 'calendar',
  hasPastCalendarGames: 'past',
  isSimplifiedCalendarMode: 'mines',
  isSimplifiedCalendarAdvancedDrawing: 'minesPlus',
  areTeamsEasySeriesEnabled: 'easy',
  areBestPlayersByOfoSelected: 'best',
  pickedPlayerIds: 'picked',
  selectedUser: 'user',
  lowerBoundPrice: 'priceFrom',
  upperBoundPrice: 'priceTo',
  positions: 'pos',
  teams: 'teams',
  powerPlayUnits: 'pp',
  searchedPlayerIds: 'search',
  formLength: 'form',
  playersAreNotPlayedDisabled: 'noGames',
  hideLowGPPlayersEnabled: 'lowGp',
  showOnlyPlayersInUpsideLines: 'upside',
} as const;

/** Значение для мультиселекта, который пользователь очистил полностью. */
const EMPTY_SELECTION: string = 'none';

/** Кириллица позиций и ПП в адресной строке нечитаема, поэтому ходят коды. */
const POWER_PLAY_URL_CODES: string[] = ['NONE', 'PP1', 'PP2'];

const DEFAULT_SELECTED_POSITIONS: string[] = [
  DEFAULT_POSITIONS[1],
  DEFAULT_POSITIONS[2],
];

//#region ЧТЕНИЕ И ЗАПИСЬ ПАРАМЕТРОВ

/**
 * Разбирает строку query-параметров в состояние экрана. Всё, чего в адресе нет,
 * заполняется значениями по умолчанию - теми же, с которыми экран открывается обычно.
 * @param search Строка вида '?from=...&mines=1'
 */
export function parseViewUrlState(search: string): ViewUrlState {
  const params: URLSearchParams = new URLSearchParams(search);

  return {
    dateFrom: parseDate(params.get(URL_KEYS.dateFrom)),
    dateTo: parseDate(params.get(URL_KEYS.dateTo)),

    // calendar=1 - календарь раскрыт, поэтому флаг в состоянии инвертирован
    isCalendarHidden: !parseBoolean(
      params.get(URL_KEYS.isCalendarHidden),
      true
    ),
    hasPastCalendarGames: parseBoolean(
      params.get(URL_KEYS.hasPastCalendarGames),
      false
    ),
    isSimplifiedCalendarMode: parseBoolean(
      params.get(URL_KEYS.isSimplifiedCalendarMode),
      false
    ),
    // Доп. отрисовка включается вместе с режимом сапёра, если её не выключили явно
    isSimplifiedCalendarAdvancedDrawing: parseBoolean(
      params.get(URL_KEYS.isSimplifiedCalendarAdvancedDrawing),
      parseBoolean(params.get(URL_KEYS.isSimplifiedCalendarMode), false)
    ),
    areTeamsEasySeriesEnabled: parseBoolean(
      params.get(URL_KEYS.areTeamsEasySeriesEnabled),
      false
    ),
    areBestPlayersByOfoSelected: parseBoolean(
      params.get(URL_KEYS.areBestPlayersByOfoSelected),
      false
    ),

    pickedPlayerIds: parseNumbers(params.get(URL_KEYS.pickedPlayerIds)),
    selectedUser: params.get(URL_KEYS.selectedUser) ?? undefined,

    lowerBoundPrice: parseNumber(params.get(URL_KEYS.lowerBoundPrice)),
    upperBoundPrice: parseNumber(params.get(URL_KEYS.upperBoundPrice)),
    positions: parseCodes(
      params.get(URL_KEYS.positions),
      positionCodeToName,
      DEFAULT_SELECTED_POSITIONS
    ),
    teams: parseCodes(params.get(URL_KEYS.teams), (code) => code, []),
    powerPlayUnits: parseCodes(
      params.get(URL_KEYS.powerPlayUnits),
      powerPlayCodeToName,
      []
    ),
    searchedPlayerIds: parseNumbers(params.get(URL_KEYS.searchedPlayerIds)),

    formLength:
      parseNumber(params.get(URL_KEYS.formLength)) ?? DEFAULT_FORM_LENGTH,
    playersAreNotPlayedDisabled: parseBoolean(
      params.get(URL_KEYS.playersAreNotPlayedDisabled),
      REMOVE_PLAYERS_WITH_NO_GAMES
    ),
    hideLowGPPlayersEnabled: parseBoolean(
      params.get(URL_KEYS.hideLowGPPlayersEnabled),
      false
    ),
    showOnlyPlayersInUpsideLines: parseBoolean(
      params.get(URL_KEYS.showOnlyPlayersInUpsideLines),
      SHOW_ONLY_PLAYERS_IN_UPSIDE_LINES
    ),
  };
}

/**
 * Складывает состояние в набор query-параметров. Значения по умолчанию не пишутся,
 * чтобы ссылка на нетронутый экран оставалась просто /main.
 * @param state Состояние экрана
 */
export function serializeViewUrlState(state: ViewUrlState): {
  [key: string]: string;
} {
  const params: { [key: string]: string } = {};

  if (state.dateFrom != null) {
    params[URL_KEYS.dateFrom] = formatDate(state.dateFrom);
  }

  if (state.dateTo != null) {
    params[URL_KEYS.dateTo] = formatDate(state.dateTo);
  }

  setBoolean(params, URL_KEYS.isCalendarHidden, !state.isCalendarHidden, true);
  setBoolean(
    params,
    URL_KEYS.hasPastCalendarGames,
    state.hasPastCalendarGames,
    false
  );
  setBoolean(
    params,
    URL_KEYS.isSimplifiedCalendarMode,
    state.isSimplifiedCalendarMode,
    false
  );
  setBoolean(
    params,
    URL_KEYS.isSimplifiedCalendarAdvancedDrawing,
    state.isSimplifiedCalendarAdvancedDrawing,
    state.isSimplifiedCalendarMode
  );
  setBoolean(
    params,
    URL_KEYS.areTeamsEasySeriesEnabled,
    state.areTeamsEasySeriesEnabled,
    false
  );
  setBoolean(
    params,
    URL_KEYS.areBestPlayersByOfoSelected,
    state.areBestPlayersByOfoSelected,
    false
  );

  if (state.pickedPlayerIds.length > 0) {
    params[URL_KEYS.pickedPlayerIds] = state.pickedPlayerIds.join(',');
  }

  if (state.selectedUser) {
    params[URL_KEYS.selectedUser] = state.selectedUser;
  }

  if (state.lowerBoundPrice != null) {
    params[URL_KEYS.lowerBoundPrice] = `${state.lowerBoundPrice}`;
  }

  if (state.upperBoundPrice != null) {
    params[URL_KEYS.upperBoundPrice] = `${state.upperBoundPrice}`;
  }

  setCodes(
    params,
    URL_KEYS.positions,
    state.positions,
    positionNameToCode,
    DEFAULT_SELECTED_POSITIONS
  );
  setCodes(params, URL_KEYS.teams, state.teams, (name) => name, []);
  setCodes(
    params,
    URL_KEYS.powerPlayUnits,
    state.powerPlayUnits,
    powerPlayNameToCode,
    []
  );

  if (state.searchedPlayerIds.length > 0) {
    params[URL_KEYS.searchedPlayerIds] = state.searchedPlayerIds.join(',');
  }

  if (state.formLength !== DEFAULT_FORM_LENGTH) {
    params[URL_KEYS.formLength] = `${state.formLength}`;
  }

  setBoolean(
    params,
    URL_KEYS.playersAreNotPlayedDisabled,
    state.playersAreNotPlayedDisabled,
    REMOVE_PLAYERS_WITH_NO_GAMES
  );
  setBoolean(
    params,
    URL_KEYS.hideLowGPPlayersEnabled,
    state.hideLowGPPlayersEnabled,
    false
  );
  setBoolean(
    params,
    URL_KEYS.showOnlyPlayersInUpsideLines,
    state.showOnlyPlayersInUpsideLines,
    SHOW_ONLY_PLAYERS_IN_UPSIDE_LINES
  );

  return params;
}

function setBoolean(
  params: { [key: string]: string },
  key: string,
  value: boolean,
  defaultValue: boolean
): void {
  if (value === defaultValue) {
    return;
  }

  params[key] = value ? '1' : '0';
}

function setCodes(
  params: { [key: string]: string },
  key: string,
  values: string[],
  toCode: (value: string) => string,
  defaultValues: string[]
): void {
  if (areSameSelections(values, defaultValues)) {
    return;
  }

  params[key] =
    values.length === 0 ? EMPTY_SELECTION : values.map(toCode).join(',');
}

function areSameSelections(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((x, i) => x === right[i]);
}

function parseCodes(
  raw: string | null,
  toName: (code: string) => string | undefined,
  defaultValues: string[]
): string[] {
  if (raw == null) {
    return [...defaultValues];
  }

  if (raw === EMPTY_SELECTION || raw === '') {
    return [];
  }

  return raw
    .split(',')
    .map((x) => toName(x.trim()))
    .filter((x): x is string => x != null);
}

function positionNameToCode(name: string): string {
  return DEFAULT_POSITIONS_MAP.get(name) ?? name;
}

function positionCodeToName(code: string): string | undefined {
  return DEFAULT_POSITIONS.find(
    (name) => DEFAULT_POSITIONS_MAP.get(name) === code
  );
}

function powerPlayNameToCode(name: string): string {
  const index: number = POWER_PLAY_UNITS.indexOf(name);
  return index < 0 ? name : POWER_PLAY_URL_CODES[index];
}

function powerPlayCodeToName(code: string): string | undefined {
  const index: number = POWER_PLAY_URL_CODES.indexOf(code);
  return index < 0 ? undefined : POWER_PLAY_UNITS[index];
}

function parseBoolean(raw: string | null, defaultValue: boolean): boolean {
  if (raw == null) {
    return defaultValue;
  }

  return raw === '1' || raw.toLowerCase() === 'true';
}

function parseNumber(raw: string | null): number | undefined {
  if (raw == null || raw === '') {
    return undefined;
  }

  const value: number = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function parseNumbers(raw: string | null): number[] {
  if (raw == null || raw === '') {
    return [];
  }

  return raw
    .split(',')
    .map((x) => Number(x.trim()))
    .filter((x) => Number.isFinite(x));
}

/**
 * Разбирает yyyy-MM-dd и yyyy-MM-ddTHH:mm как местное время: даты фильтра
 * сравниваются с датами матчей, а те тоже местные.
 */
function parseDate(raw: string | null): Date | undefined {
  if (raw == null) {
    return undefined;
  }

  const parts: RegExpExecArray | null =
    /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/.exec(raw);

  if (parts == null) {
    return undefined;
  }

  const date: Date = new Date(
    +parts[1],
    +parts[2] - 1,
    +parts[3],
    parts[4] != null ? +parts[4] : 0,
    parts[5] != null ? +parts[5] : 0
  );

  return isNaN(date.getTime()) ? undefined : date;
}

/**
 * Время в адрес попадает, только если оно не полночь: границы фильтра по умолчанию
 * берутся от времени первого матча, и округление до суток меняло бы выборку игр.
 */
function formatDate(value: Date): string {
  const day: string = `${value.getFullYear()}-${padTwo(
    value.getMonth() + 1
  )}-${padTwo(value.getDate())}`;

  if (value.getHours() === 0 && value.getMinutes() === 0) {
    return day;
  }

  return `${day}T${padTwo(value.getHours())}:${padTwo(value.getMinutes())}`;
}

function padTwo(value: number): string {
  return `${value}`.padStart(2, '0');
}

//#endregion ЧТЕНИЕ И ЗАПИСЬ ПАРАМЕТРОВ

/**
 * Держит всё состояние главного экрана в query-параметрах, чтобы ссылку можно было
 * скопировать и открыть ровно тот же вид.
 *
 * Читает параметры ОДИН раз при создании сервиса (`initialState`) - компоненты и сервисы
 * разбирают из снимка свою часть при инициализации. Дальше адресная строка только пишется:
 * реакции на её изменение нет, поэтому лишних перерисовок и запросов от записи не будет.
 */
@Injectable()
export class ViewStateUrlService {
  private readonly _initialState: ViewUrlState;
  private readonly _state: ViewUrlState;

  private _isWriteScheduled: boolean = false;

  constructor(private _router: Router, private _location: Location) {
    // Снимок берётся из window.location, а не из роутера: на момент создания сервиса
    // роутер ещё может не разобрать адрес, а редирект с ** на /main - уже случиться.
    this._initialState = parseViewUrlState(window.location.search);
    this._state = { ...this._initialState };
  }

  /**
   * Состояние, с которым страницу открыли. Не меняется за время жизни приложения,
   * так что восстанавливаться из него можно в любой момент инициализации.
   */
  public get initialState(): Readonly<ViewUrlState> {
    return this._initialState;
  }

  /** Текущее состояние, уже с учётом всех действий пользователя */
  public get state(): Readonly<ViewUrlState> {
    return this._state;
  }

  /**
   * Обновляет часть состояния и переписывает адресную строку
   * @param patch Поля состояния, которые изменились
   */
  public patch(patch: Partial<ViewUrlState>): void {
    Object.assign(this._state, patch);
    this._scheduleWrite();
  }

  /**
   * Сводит записи от нескольких компонентов за один тик в одну перезапись адреса:
   * на старте и при сбросе фильтров patch прилетает подряд десяток раз.
   */
  private _scheduleWrite(): void {
    if (this._isWriteScheduled) {
      return;
    }

    this._isWriteScheduled = true;
    queueMicrotask(() => {
      this._isWriteScheduled = false;
      this._write();
    });
  }

  private _write(): void {
    const urlTree: UrlTree = this._router.parseUrl(this._router.url);
    urlTree.queryParams = serializeViewUrlState(this._state);

    // Именно replaceState, а не router.navigate: адрес нужно обновить, не трогая
    // ни историю (иначе "назад" отматывает каждое переключение тумблера), ни роутер.
    this._location.replaceState(urlTree.toString());
  }
}
