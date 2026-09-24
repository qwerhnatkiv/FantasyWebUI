import { ViewUrlState } from 'src/app/interfaces/view-url-state';
import {
  parseViewUrlState,
  serializeViewUrlState,
} from './view-state-url.service';
import {
  DEFAULT_FORM_LENGTH,
  REMOVE_PLAYERS_WITH_NO_GAMES,
  SHOW_ONLY_PLAYERS_IN_UPSIDE_LINES,
} from 'src/constants';

describe('view url state', () => {
  it('отдаёт состояние по умолчанию для пустого адреса', () => {
    const state: ViewUrlState = parseViewUrlState('');

    expect(state.dateFrom).toBeUndefined();
    expect(state.dateTo).toBeUndefined();
    expect(state.isCalendarHidden).toBeFalse();
    expect(state.hasPastCalendarGames).toBeFalse();
    expect(state.isSimplifiedCalendarMode).toBeFalse();
    expect(state.isSimplifiedCalendarAdvancedDrawing).toBeFalse();
    expect(state.areTeamsEasySeriesEnabled).toBeFalse();
    expect(state.areBestPlayersByOfoSelected).toBeFalse();
    expect(state.pickedPlayerIds).toEqual([]);
    expect(state.selectedUser).toBeUndefined();
    expect(state.positions).toEqual(['З', 'Н']);
    expect(state.teams).toEqual([]);
    expect(state.powerPlayUnits).toEqual([]);
    expect(state.searchedPlayerIds).toEqual([]);
    expect(state.formLength).toBe(DEFAULT_FORM_LENGTH);
    expect(state.playersAreNotPlayedDisabled).toBe(
      REMOVE_PLAYERS_WITH_NO_GAMES
    );
    expect(state.hideLowGPPlayersEnabled).toBeFalse();
    expect(state.showOnlyPlayersInUpsideLines).toBe(
      SHOW_ONLY_PLAYERS_IN_UPSIDE_LINES
    );
  });

  it('не пишет в адрес ничего, если состояние не трогали', () => {
    expect(serializeViewUrlState(parseViewUrlState(''))).toEqual({});
  });

  it('читает режимы календаря, лучших по ОФО и выбранного пользователя', () => {
    const state: ViewUrlState = parseViewUrlState(
      '?mines=1&easy=1&past=1&best=1&calendar=0&user=RaisingTheBar'
    );

    expect(state.isSimplifiedCalendarMode).toBeTrue();
    expect(state.areTeamsEasySeriesEnabled).toBeTrue();
    expect(state.hasPastCalendarGames).toBeTrue();
    expect(state.areBestPlayersByOfoSelected).toBeTrue();
    expect(state.isCalendarHidden).toBeTrue();
    expect(state.selectedUser).toBe('RaisingTheBar');
  });

  it('включает доп. отрисовку вместе с режимом сапёра и даёт выключить её отдельно', () => {
    expect(
      parseViewUrlState('?mines=1').isSimplifiedCalendarAdvancedDrawing
    ).toBeTrue();
    expect(
      parseViewUrlState('?mines=1&minesPlus=0').isSimplifiedCalendarAdvancedDrawing
    ).toBeFalse();
  });

  it('переводит коды позиций и ПП в игровые обозначения и обратно', () => {
    const state: ViewUrlState = parseViewUrlState('?pos=GK,DF&pp=PP1,NONE');

    expect(state.positions).toEqual(['В', 'З']);
    expect(state.powerPlayUnits).toEqual(['ПП1', 'нет']);

    const params = serializeViewUrlState(state);

    expect(params['pos']).toBe('GK,DF');
    expect(params['pp']).toBe('PP1,NONE');
  });

  it('отличает очищенный мультиселект от отсутствующего параметра', () => {
    expect(parseViewUrlState('?pos=none').positions).toEqual([]);
    expect(parseViewUrlState('').positions).toEqual(['З', 'Н']);

    const cleared: ViewUrlState = parseViewUrlState('');
    cleared.positions = [];

    expect(serializeViewUrlState(cleared)['pos']).toBe('none');
  });

  it('сохраняет время в границах дат и опускает полночь', () => {
    const state: ViewUrlState = parseViewUrlState(
      '?from=2026-09-24T19:30&to=2026-09-30'
    );

    expect(state.dateFrom).toEqual(new Date(2026, 8, 24, 19, 30));
    expect(state.dateTo).toEqual(new Date(2026, 8, 30));

    const params = serializeViewUrlState(state);

    expect(params['from']).toBe('2026-09-24T19:30');
    expect(params['to']).toBe('2026-09-30');
  });

  it('переживает полный круг: адрес - состояние - адрес', () => {
    const search: string =
      '?from=2026-09-24T19:30&to=2026-09-30&mines=1&minesPlus=0&easy=1&past=1' +
      '&best=1&calendar=0&picked=101,202&user=A-N-O%20N-I-M&priceFrom=1500' +
      '&priceTo=2500&pos=GK,DF&teams=ANA,BOS&pp=PP1&search=303&form=10' +
      '&lowGp=1&upside=1';

    const state: ViewUrlState = parseViewUrlState(search);
    const params = serializeViewUrlState(state);

    expect(params).toEqual({
      from: '2026-09-24T19:30',
      to: '2026-09-30',
      calendar: '0',
      past: '1',
      mines: '1',
      minesPlus: '0',
      easy: '1',
      best: '1',
      picked: '101,202',
      user: 'A-N-O N-I-M',
      priceFrom: '1500',
      priceTo: '2500',
      pos: 'GK,DF',
      teams: 'ANA,BOS',
      pp: 'PP1',
      search: '303',
      form: '10',
      lowGp: '1',
      upside: '1',
    });
  });

  it('игнорирует мусор в параметрах вместо того, чтобы ломать экран', () => {
    const state: ViewUrlState = parseViewUrlState(
      '?from=вчера&picked=abc,101&pos=XX&form=&priceFrom=nope'
    );

    expect(state.dateFrom).toBeUndefined();
    expect(state.pickedPlayerIds).toEqual([101]);
    expect(state.positions).toEqual([]);
    expect(state.formLength).toBe(DEFAULT_FORM_LENGTH);
    expect(state.lowerBoundPrice).toBeUndefined();
  });
});
