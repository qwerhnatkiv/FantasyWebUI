# FantasyWebUI — Agent Navigation Guide

Angular frontend for the fantasy hockey project. See the root [`../AGENTS.md`](../AGENTS.md) first for system-wide context (data flow, MCP requirements, business domain) — this file only covers what's specific to this repo.

Angular 17.3, NgModule-based (not standalone) except `MonitoringComponent`. Fantasy hockey squad/roster tool: calendar of games, player stats table, squad builder, date-range driven projections ("EFP" = Expected Fantasy Points).

`AppModule` (`src/app/app.module.ts`) declares almost everything. `MainViewComponent` (`src/app/main-view/main-view.component.ts`) is the orchestrator: owns `games`/`playerStats`/`teamStats`/`squadPlayers` state, reacts to date-range changes via `PlayersObservableProxyService.$updatePlayersEfpDataByDateRangeObservable`, and wires `players-table`/`players-squad` purely through `@Input`/`@Output` (see `main-view.component.html`). Recent perf work documented in `docs/perf-notes.md` (read that file for the "why" behind several patterns flagged below — not repeated here).

This file is maintained incrementally: after a task touches an area not reflected below, update just that section rather than re-scanning the whole repo.

## 0. Running locally

The Angular app is wrapped in a Visual Studio `.esproj` (`angularapp.esproj`) that just runs `npm start` / `npm run build` under the hood — **you don't need Visual Studio to work on this repo**, plain `npm`/`ng` CLI works fine.

```powershell
npm install
npm start
```

`npm start` runs `ng serve --ssl` with a dev cert (`aspnetcore-https.js` generates/uses an ASP.NET dev cert — if this fails, check the dev cert is trusted: `dotnet dev-certs https --trust`). Serves on the Angular CLI default port, **:4200**.

**Local dev talks to the production backend by default.** `src/services/api/api.service.ts` hardcodes full `https://qwerhnatkiv-backend.azurewebsites.net/...` URLs directly (not a relative path). Note `src/proxy.conf.js` also defines an `/api` → prod-backend proxy, but the API service doesn't appear to route through it — it's effectively unused as currently written. Testing locally against your own locally-running `FantasyWeb` instance therefore requires either temporarily changing these URLs or wiring up the proxy properly; don't assume one or the other without checking what the current task needs.

## 1. Component inventory

| Folder / selector | Renders / does | Key `@Input()` | Key `@Output()` | Used by |
|---|---|---|---|---|
| `src/app/main-view` — `app-main-view` | Top-level orchestrator/state owner for the whole "main" route. Fetches games/players/squad via `ApiService`, computes `filteredTeamGames` and `playerGamesOfoMap`, drives `DateFiltersService` defaults. | — (routed component) | — | `app-routing.module.ts` (route `main`) |
| `src/app/header-menu` — `header-menu` | Top nav bar: calendar expand/collapse, calendar mode toggles (full/simplified/easy-series/advanced-drawing), week back/forward date-range shift, min/max date pickers, logout, username (decoded from JWT). | `updateLogInformation: UpdateLogInformation` | `calendarVisibilityUpdated: boolean` | `main-view.component.html` |
| `src/app/calendar-table` — `app-calendar-table` | Renders the team×week/day games grid (CDK virtual-scroll columns), team/game tooltips, easy-series highlighting, "best players per team" overlay row. Heaviest component; owns most calendar-mode subscriptions. | `games`, `teamStats` (setter triggers easy-series recompute), `teamPlayerExpectedOfoMap` | — | `main-view.component.html` |
| `src/app/players-filters` — `app-players-filters` | Filter bar above the player table: price range, positions, teams, PP units, sports.ru user select, form-length select, player search/multi-select autocomplete, "reset all", "upside lines only" toggle, link to sports.ru profile. | `playerStats`, `playerGamesOfoMap` | `sendLowerBoundPrice`, `sendUpperBoundPrice`, `sendPositions`, `sendTeams`, `sendPowerPlayUnits`, `sendSelectedUser`, `sendPlayersAreNotPlayedDisabled`, `sendHideLowGPPlayersEnabled`, `sendFormLength`, `sendSelectedPlayerIds` | `main-view.component.html` |
| `src/app/players-table` — `app-players-table` | The big sortable/paginated/filterable player stats `MatTable`. Builds `PlayerChooseRecord[]` from `playerStats` + `filteredTeamGames` + `playerGamesOfoMap`; owns comparison "firstChoice/secondChoice" selection; "add to squad" button per row; per-player calendar highlight on row click. | `lowerBoundPrice`, `upperBoundPrice`, `positions`, `teams`, `powerPlayUnits`, `selectedPlayerIds`, `playerStats`, `teamStats`, `filteredTeamGames`, `playerGamesOfoMap`, `formLength`, `playersAreNotPlayedDisabled`, `hideLowGPPlayersEnabled`, `positionsInSquadAvailable` | `sendFirstChoiceOfo`, `sendSecondChoiceOfo`, `sendAddedToSquadPlayer` | `main-view.component.html` |
| `src/app/players-squad` — `app-players-squad` | User's squad table: add/remove/restore players, substitution counter, balance, total EFP/games, "optimal combinations" solver trigger + results list. Owns the `GamesUtils.generatePairings` sort-order backtracking call. | `squadPlayers` (two-way, `[(squadPlayers)]`), `balanceValue`, `substitutions`, `filteredTeamGames`, `teamStats`, `playerGamesOfoMap` | `squadPlayersChange`, `sendAvailableSlots` | `main-view.component.html` |
| `src/app/login` — `app-login` | Username/password form; on submit calls `AuthService.login`, navigates to `/main`. | — | — | `app-routing.module.ts` (route `login`) |
| `src/app/monitoring` — `app-monitoring` | **Standalone** (`standalone: true`) dashboard for backend data-pipeline health: health check status, update logs table, manual "execute DM update" trigger, auto-refreshes every 30s. Only component not declared in `AppModule` — lazy-loaded via `loadComponent`. **Known to not be fully working yet** — see gotchas. | — (routed component) | — | `app-routing.module.ts` (route `monitoring`, lazy) |
| `src/app/common-components/cancel-button` — `cancel-button` | Generic dismiss/cancel icon button. | `isHidden: boolean` | `clickEmitter: void` | reusable, used across forms/filters |
| `src/app/common-components/i-button` — `i-button` | Generic icon button w/ optional active/inactive toggle state and color theming. | `iconPath`, `iconRelativeSize`, `allowActiveState`, `tooltipText`, `removeBackgroundColor` | `clickEmitter: void` | `header-menu`, `players-filters`, `calendar-table` toolbars |
| `src/app/common-components/simple-select` — `app-simple-select` | Thin wrapper around a basic `<select>`-style dropdown. | `options: string[]` | — | filters/misc forms |

Shared UI atoms live under `src/app/common-components/` — **check here before building a new small reusable control.**

Pipes (`src/app/pipes/*`, all declared in `AppModule`): `cell-class.pipe.ts` / `cell-text-class.pipe.ts` (calendar cell CSS classing), `mapkeys.pipe.ts` (iterate `Map` keys in templates), `players-label-by-count.pipe.ts` (pluralization label), `positions-map.pipe.ts` (position code → label), `pptoi.pipe.ts` (power-play TOI formatting), `squad-player.pipe.ts` (squad row formatting), `toi.pipe.ts` (time-on-ice formatting). Formatting/display logic is pulled into pipes here rather than inlined in components — **follow this pattern for new derived-display values** instead of computing in the template or component class.

Classes (`src/app/classes/*`): `table-cell.ts` (`TableCell` — calendar cell value object, constructor-positional, many optional fields — see gotchas), `team-week.ts` (`TeamWeek` — team+week+gamesCount tuple used for "low games week" strikethrough).

`src/app/guards/auth.guard.ts` exports both a `CanActivateFn` (`canActivate`) and the `AuthGuard` (`CanActivateChildFn`) actually used in routing — both call `AuthService.isAuthenticated()`.

## 2. Services inventory (`src/services/*`)

| File | Purpose | Type |
|---|---|---|
| `api/api.service.ts` — `ApiService` | Main HTTP layer: `getGames`, `getPlayersEFP`, `getSportsSquad`, `getPlayerLines`. All hit `qwerhnatkiv-backend.azurewebsites.net` directly (hardcoded base URL, no environment config). | Plain HTTP data service (`providedIn: 'root'`, also redundantly listed in `AppModule.providers`) |
| `api/monitoring.service.ts` — `MonitoringService` | HTTP for the monitoring dashboard: `getMonitoringData`, `getHealthCheck` (treats HTTP 503 as a valid business payload via `catchError`), `getUpdateLogs`, `executeDmUpdate`, `getTableStatus`. Normalizes nullable fields. | Plain HTTP data service (`providedIn: 'root'`) |
| `auth/auth.service.ts` — `AuthService` | `login`/`logout`/`isAuthenticated`/`getToken`, backed by `localStorage` (`access_token` key) + `JwtHelperService` expiry check. | Plain service (`providedIn: 'root'`) |
| `auth/auth.interceptor.ts` — `AuthInterceptor` | `HttpInterceptor` that adds `Authorization: Bearer <token>` to every outgoing request when a token exists. Registered in `AppModule.providers` via `HTTP_INTERCEPTORS` multi-provider. | HTTP interceptor |
| `calendar/calendar-week-games-map.service.ts` — `CalendarWeekGamesMapService` | Computes per-week game counts for teams relative to a "start date" (simplified-calendar mode); maintains `weekMaximumGamesMap`/`weekMinimumGamesMap`. | Stateful filtering/calc logic, used only by `calendar-table` |
| `cdk-components/column-scroll-data-handler.service.ts` — `ColumnScrollDataHandlerService` | Implements `CdkVirtualScrollRepeater<TableColumn>` to virtual-scroll the calendar's columns (not rows). Instantiated manually (`new ColumnScrollDataHandlerService(...)`) inside `calendar-table.component.ts ngOnInit`, not DI-injected. | CDK scrolling glue, not a DI singleton |
| `filtering/date-filters.service.ts` — `DateFiltersService` | Owns the current date-range filter (`$dateFiltersObservable`); `setFiltersDefaultDates` computes initial min/max from upcoming game weeks; `triggerDateFiltersSubjectUpdate` pushes new range. | Stateful filtering logic + event bus |
| `observable-proxy/calendar-observable-proxy.service.ts` — `CalendarObservableProxyService` | Calendar UI-mode toggles: simplified/"minesweeper" mode, full-range mode, advanced drawing mode, simplified-mode start date, easy-series toggle. | Observable-proxy event bus (sibling `header-menu` → `calendar-table`) |
| `observable-proxy/filters-observable-proxy.service.ts` — `FiltersObservableProxyService` | "Deselect players from comparison" + "show only upside-line players" events. | Observable-proxy event bus (`players-filters` → `players-table`) |
| `observable-proxy/players-observable-proxy.service.ts` — `PlayersObservableProxyService` | Player-selection events: show player in calendar, show best players in calendar, send selected players to calendar, and **the date-range refresh trigger** `$updatePlayersEfpDataByDateRangeObservable`. | Observable-proxy event bus (`players-table`/`players-squad` ↔ `calendar-table`, and `header-menu`/`main-view` for date-range refresh) |
| `player-combinations/player-combinations.service.ts` — `PlayerCombinationsService` | Holds `availablePlayers` snapshot (set by `players-table`); `getOptimalPlayersCombinations` POSTs budget+squad to `/player_combinations/find_optimal`; `createPlayerSquadRecord` builds a `PlayerSquadRecord` from a `PlayerChooseRecord`. | Mixed: HTTP call + stateful cache + event bus (`$optimalPlayerCombinationsObservable`) |
| `teams-easy-series/teams-easy-series.service.ts` — `TeamsEasySeriesService` | Fetches "easy series" date ranges per team from `/easy-series`, converts string dates to `Date`, republishes via `$teamsEasySeriesObservable`. | HTTP data service + event bus |

All observable-proxy/filtering/calendar services are registered as explicit singletons in `AppModule.providers` (not `providedIn: 'root'`) — they only work because `AppModule` is the root module; don't assume tree-shakability.

## 3. Data flow

**App load:**
- `AppRoutingModule` sends unauthenticated users to `/login`; `AuthGuard` (`src/app/guards/auth.guard.ts`) gates `/main` and `/monitoring`, redirecting to `/login` + `AuthService.logout()` if the token is missing/expired.
- `MainViewComponent` constructor immediately calls `_teamsEasySeriesService.getTeamsEasySeries()` and `getCalendarData(true)` — before `ngOnInit` even fires.
- `getCalendarData(true)` calls `ApiService.getGames(formLength)`; on response, sets `games`/`teamStats`/`playerStats`/`updateLogInformation`, rebuilds the four lookup `Map`s (`playerStatsById`, `playerStatsBySportsId`, `teamStatsById`, `gamesById`), then calls `setUpFilters(true)`.
- `setUpFilters(true)` calls `DateFiltersService.setFiltersDefaultDates(upcomingWeeks, upcomingGames)`, which computes a default min/max date and calls `triggerDateFiltersSubjectUpdate(...)`, firing `$dateFiltersObservable`.
- `$dateFiltersObservable` is subscribed by: `MainViewComponent` (stores `_filterDates`), `HeaderMenuComponent` (stores `filterDates` **and immediately calls** `PlayersObservableProxyService.triggerUpdatePlayersEfpDataByDateRangeEvent()`), `CalendarTableComponent` (stores `filterDates` for display), `PlayersTableComponent` (stores `filterDates`, display-only).
- That trigger fires `$updatePlayersEfpDataByDateRangeObservable`, which `MainViewComponent.ngOnInit` subscribes to → calls `updateFilteredTeamsGamesMap()` (builds `filteredTeamGames: Map<teamID, TeamGameInformation[]>` for the active date range) then `setOfoDataForPlayers()`.
- `setOfoDataForPlayers()` calls `ApiService.getPlayersEFP(minDate, maxDate, formLength, {gameIds, playerIds})`; on response builds `playerGamesOfoMap` (per-player EFP) and `teamPlayerExpectedOfoMap` (top-3-by-team, for calendar tooltips), then either recomputes the squad locally (`buildSquadPlayers`, if `_sportsSquadResult` cached) or calls `fetchUserSquad()`.
- All of the above state (`games`, `teamStats`, `playerGamesOfoMap`, `filteredTeamGames`, `squadPlayers`, filter values) flows down via plain `@Input()` bindings in `main-view.component.html` to `calendar-table`, `players-filters`, `players-table`, `players-squad` — no further proxy involved for this part.

**User changes date range** (via `header-menu` date pickers or week-back/forward buttons):
1. `HeaderMenuComponent._setMinimumCalendarDate`/`_setMaximumCalendarDate`/`_setWeekDateRange` call `DateFiltersService.triggerDateFiltersSubjectUpdate(min, max)`.
2. `$dateFiltersObservable` fires → every subscriber above updates its local `filterDates` copy.
3. `HeaderMenuComponent`'s own subscription additionally calls `PlayersObservableProxyService.triggerUpdatePlayersEfpDataByDateRangeEvent()` — **this is the actual re-fetch trigger**, not the date-filter event itself.
4. `MainViewComponent` re-runs `updateFilteredTeamsGamesMap()` + `setOfoDataForPlayers()` (network call to `/predictions/ofo_predictions/get`), updates `filteredTeamGames`/`playerGamesOfoMap`/`teamPlayerExpectedOfoMap`.
5. Those `@Input()` changes propagate down to `players-table` (recomputes `gamesCount`/`b2bGamesCount`/EFP fields per player in `ngOnChanges`, re-filters), `players-squad` (EFP totals recompute via new `playerGamesOfoMap`), and `calendar-table` (re-renders per-game EFP overlay values).

**User edits squad** (adding a player from the player table):
1. `PlayersTableComponent.addPlayerToSquad(player)` calls `PlayerCombinationsService.createPlayerSquadRecord(player, false)` and emits `sendAddedToSquadPlayer`.
2. `main-view.component.html` binds this to the `addedToSquadPlayer` setter on `MainViewComponent`, which either un-marks an existing squad player's `isRemoved` flag or pushes the new `PlayerSquadRecord`, then reassigns `squadPlayers` to a new array reference (`Object.assign([], ...)`) to trigger change detection.
3. `squadPlayers` flows down via the two-way `[(squadPlayers)]` binding into `PlayersSquadComponent`'s setter, which calls `setSquadPlayersSortOrder()` (uses `GamesUtils.generatePairings` — the exponential backtracking hotspot — to pair newly-added players against removed ones for a stable sort position) and emits `sendAvailableSlots` back up to `MainViewComponent.squadAvailableSlots`, which flows back down into `players-table`'s `positionsInSquadAvailable` input (controls whether the "add to squad" button is hidden per player/position).
4. Removing/restoring a squad player (`PlayersSquadComponent.removeRestoreRow`) is entirely local to `players-squad` + re-emits `squadPlayersChange`/`sendAvailableSlots` — no `MainViewComponent` involvement beyond the two-way binding sync.
5. "Optimal combinations" (`getOptimalPlayersCombinations`) is a separate flow: `players-squad` → `PlayerCombinationsService.getOptimalPlayersCombinations()` (POST `/player_combinations/find_optimal`) → response pushed through `$optimalPlayerCombinationsObservable` → `players-squad`'s own subscription (`_addOptimalPlayerCombinations`) merges the best combination into `squadPlayers`.
6. Selecting a player row in `players-table`/`players-squad` (not adding to squad) instead calls `PlayersObservableProxyService.triggerSendSelectedPlayersToCalendar`/`triggerShowPlayerInCalendarSubject`, which `calendar-table` subscribes to in order to overlay that player's per-game EFP onto their team's calendar row — a completely separate observable-proxy channel from the squad-edit flow.

## 4. Interfaces/DTOs

All in `src/app/interfaces/` (plus subfolders `player-combinations/`, `teams-easy-series/`). API response shapes live in `*.model.ts` / `*-dto.ts` — match existing DTO naming when adding a new endpoint's response type. Most central to cross-component flow:

- **`player-stats-dto.ts` (`PlayerStatsDTO`)** — raw per-player stats as returned by the backend (`GamesDTO.playerStats`). The source-of-truth player record; everything else derives from it.
- **`player-common-record.ts` (`PlayerCommonRecord`)** — shared base fields (`playerName`, `position`, `price`, `gamesCount`, `expectedFantasyPoints`, `playerObject: PlayerStatsDTO`, `teamObject: TeamStatsDTO`, `tooltipLines`) extended by both choose/squad records.
- **`player-choose-record.ts` (`PlayerChooseRecord`)** extends `PlayerCommonRecord` — the row shape used in `players-table`'s `MatTableDataSource`; adds comparison flags (`firstChoice`/`secondChoice`), per-column display fields (`toi`, `iXG`, `linemates`, etc). Built in `players-table.component.ts ngOnChanges` from `PlayerStatsDTO` + `TeamStatsDTO` + `filteredTeamGames`.
- **`player-squad-record.ts` (`PlayerSquadRecord`)** extends `PlayerCommonRecord` — the row shape used in `players-squad`; adds `isRemoved`/`isNew`/`isOptimal`/`sortOrder`/`expectedFantasyPointsDifference`. Created from a `PlayerChooseRecord` via `PlayerCombinationsService.createPlayerSquadRecord`, **not** built independently — so `PlayerChooseRecord` → `PlayerSquadRecord` is a one-way conversion at "add to squad" time.
- **`game-prediction-dto.ts` (`GamePredictionDTO`)** — one game (teams, date, week number, win chances, score if played, `isOldGame`). Backbone of `calendar-table` and `GamesUtils`.
- **`games-dto.ts` (`GamesDTO`)** — the `getGames()` response envelope: `{ gamePredictions, teamsStats, playerStats, updateLogInformation }`.
- **`player-expected-fantasy-points-dto.ts` (`PlayerExpectedFantasyPointsDTO`)** — per-player-per-game EFP from `getPlayersEFP()`, keyed by `playerID`/`gameID`/`teamID`. Aggregated (summed per player) into `MainViewComponent.playerGamesOfoMap`.
- **`player-efp-info.ts` (`PlayerExpectedFantasyPointsInfo`)** — a *display-formatted*, team-day-scoped, top-3-only projection used for calendar tooltips (`MainViewComponent.teamPlayerExpectedOfoMap: Map<teamID, Map<gameDate, PlayerExpectedFantasyPointsInfo[]>>`). Easy to confuse with `PlayerExpectedFantasyPointsDTO` — the DTO is the raw per-game API value; the "Info" interface is the derived, pre-sorted/trimmed subset actually rendered in tooltips.
- **`selected-player-model.ts` (`SelectedPlayerModel`)** — the shape sent through `PlayersObservableProxyService.$selectedPlayersObservable` (player highlighted on the calendar), keyed by team name in a `Map<string, SelectedPlayerModel[]>`. Different again from both EFP interfaces above — this one is per-selection-event, not per-data-load.
- **`team-stats-dto.ts` (`TeamStatsDTO`)** / **`team-game-information.ts` (`TeamGameInformation`)** / **`team-game-stat-dto.ts` (`TeamGameStatDTO`)** — team-level aggregate stats, a single game's per-team info (derived per date range in `updateFilteredTeamsGamesMap`), and a single historical game's box score (used in calendar tooltip game history), respectively.
- **`dates-range.model.ts` (`DatesRangeModel`)** — `{minDate?, maxDate?}`, the payload of `DateFiltersService.$dateFiltersObservable`.
- **`ofo-variant.ts` (`OfoVariant`)** — aggregate totals (price/EFP sums + count) for the first/second "choice" comparison tool in `players-table`/`players-filters`.
- **`sports-squad-dto.ts`/`sports-squad-player-dto.ts`** — raw `getSportsSquad()` response (sports.ru-backed); `SportsSquadPlayerDTO` is just `{id}` (a sports.ru player id, matched via `playerStatsBySportsId`, **not** the internal `playerID`).
- **`player-combinations/*`** — DTOs for the `/player_combinations/find_optimal` POST/response (request shape, per-player summary shape, result shape with `players`/`total`/`cost`).
- **`teams-easy-series/*`** — `TeamsEasySeriesDto` (team + start/end date of an "easy" stretch) and `EasySeriesDateType` enum (`Start`/`End`/`None`), used only by `calendar-table` + `TeamsEasySeriesService`.
- **`monitoring-status.ts`** — DTOs for the monitoring dashboard only (`MonitoringDataDTO`, `HealthCheckDTO`, `UpdateLogEntryDTO`, `TableStatusDTO`, `ExecuteDmUpdateResponseDTO`); isolated from the rest of the app's data model.

## 5. Routing & auth

`src/app/app-routing.module.ts`:

| Path | Component | Guard |
|---|---|---|
| `login` | `LoginComponent` | none |
| `main` | `MainViewComponent` | `AuthGuard` (`canActivate`) |
| `monitoring` | `MonitoringComponent` (lazy via `loadComponent`, standalone) | `AuthGuard` |
| `**` | redirect → `main` | — |

- `src/app/guards/auth.guard.ts` — `AuthGuard` (a `CanActivateChildFn` wrapper around the `canActivate` `CanActivateFn`) calls `AuthService.isAuthenticated()`; on failure, calls `authService.logout()` then `router.navigate(['/login'])`.
- `src/services/auth/auth.service.ts` — `AuthService`: token stored under `localStorage['access_token']`; `isAuthenticated()` uses `JwtHelperService.isTokenExpired`.
- `src/services/auth/auth.interceptor.ts` — `AuthInterceptor`: attaches `Authorization: Bearer <token>` to **every** outgoing HTTP request (no URL allowlist/denylist — applies even to unauthenticated endpoints like login itself, though login doesn't have a token yet so it's a no-op there).

## 6. Known gotchas / traps

- **`/monitoring` is known to not be fully working yet.** Be extra careful verifying changes there actually render/function rather than assuming — don't treat a clean build as evidence the page works.
- **Observable-proxy pattern is load-bearing, not decorative.** Sibling components (`header-menu` ↔ `calendar-table`/`players-table`, `players-table` ↔ `players-squad` ↔ `calendar-table`) never talk to each other directly or through `MainViewComponent` — they go through the `*ObservableProxyService`s in `src/services/observable-proxy/`. If a UI action doesn't seem to do anything when traced through `@Input`/`@Output`, search for the relevant `trigger*`/`$*Observable` pair next.
- **Two separate "date changed" signals that look similar but aren't**: `DateFiltersService.$dateFiltersObservable` (fires whenever the date range *value* changes, several components just mirror it for display) vs `PlayersObservableProxyService.$updatePlayersEfpDataByDateRangeObservable` (the actual "go refetch EFP data" trigger, fired explicitly by `HeaderMenuComponent` after it receives a date-filter update, and also fired manually from `MainViewComponent.formLengthChanged`). Don't assume changing `DateFiltersService` state alone triggers a refetch.
- **`GamesUtils.generatePairings`** (`src/app/common/games-utils.ts`) — exponential recursive backtracking over all added/removed squad player pairings within a position group. Fine for typical single-digit substitution counts; a known complexity hotspot if that count ever grows.
- **Duplicate date libraries**: both `date-fns` and `moment` are dependencies; `moment`/`@angular/material-moment-adapter` is what's actually wired into the Material datepicker (`CustomDateAdapter` in `src/app/common/custom-date-adapter.ts`, `MY_FORMATS` in `custom-date-format.ts`) and used in `header-menu.component.ts`. Most date math elsewhere is hand-rolled native `Date` logic in `src/app/common/utils.ts` (`Utils.getMonday`, `addDateDays`, `getDatesInRange`, etc.) and `games-utils.ts`, not either library.
- **Non-tree-shaken `lodash` import**: `calendar-table.component.ts` does `import { cloneDeep } from 'lodash'` (not `lodash-es` / per-function import), pulling in the full library.
- **`MonitoringComponent` is the only standalone component**, converted specifically to enable `loadComponent` lazy-loading on the `/monitoring` route (see comment in `monitoring.component.ts`). Every other component must stay `AppModule`-declared unless you're deliberately repeating this pattern for another rarely-visited route.
- **`ApiService` is registered twice** — `providedIn: 'root'` on the `@Injectable`, and also explicitly listed in `AppModule.providers`. Harmless here (single root injector) but don't copy this pattern for a new service without checking.
- **Backend base URL is hardcoded** (`https://qwerhnatkiv-backend.azurewebsites.net`) and repeated as a string literal in `api.service.ts`, `monitoring.service.ts`, `player-combinations.service.ts`, `teams-easy-series.service.ts`, `auth.service.ts` — no shared `environment.ts` constant. Changing the backend host means a multi-file find/replace. This is also why local dev hits production by default (see "Running locally").
- **`PlayerExpectedFantasyPointsDTO` vs `PlayerExpectedFantasyPointsInfo`**: near-identical names, different shapes/purposes (raw per-game DTO vs. tooltip-display-formatted top-3 struct) — see Interfaces section above. Easy to grab the wrong one.
- **`squadPlayers` mutation pattern**: `MainViewComponent.addedToSquadPlayer` setter and `PlayersSquadComponent` both mutate the `squadPlayers` array in place in some paths (`splice`) and reassign a new array reference in others (`Object.assign([], ...)`) to force `OnPush` change detection — when editing squad logic, check whether the surrounding code expects a fresh reference.
- **`players-table`'s filter pipeline is intentionally batched**: `setPlayersFilter()` just records into `filterDictionary`; only `refreshPlayersFilter()` actually re-runs `MatTableDataSource`'s (expensive) filter predicate. `ngOnChanges` calls `setPlayersFilter` 8× then `refreshPlayersFilter()` once at the end — adding a 9th filter without following this pattern will silently reintroduce the perf regression `docs/perf-notes.md` fixed.
- **`TableCell`** (`src/app/classes/table-cell.ts`) is constructed with many *positional* optional constructor args (see call sites in `calendar-table.component.ts`) — easy to pass args in the wrong slot; check the class definition before adding a new field rather than trusting call-site order.
- **`header-menu` selector has no `app-` prefix** (`header-menu`, not `app-header-menu`) — inconsistent with every other top-level component's selector convention.
- **`positionsInSquadAvailable` on `players-table`** is `squadAvailableSlots!` (non-null asserted) in `main-view.component.html` even though it's `undefined` until `players-squad` first emits `sendAvailableSlots` — relies on Angular's initial-undefined-input handling inside `isAddPlayerToSquadButtonHidden`'s null check rather than the type system.

## 7. Mandatory verification

**A UI change is not done until it's been verified in a real browser via the chrome-devtools or playwright MCP** — run the dev server, navigate to the actual affected page/flow, and confirm it renders and behaves correctly, including checking for regressions in nearby functionality. Passing a build/lint/typecheck is necessary but not sufficient — those verify the code compiles, not that the feature works. This applies especially to `/monitoring` given its current known-broken state — don't assume a fix worked without seeing it render.

## 8. Deployment

Push to `master` on GitHub → Vercel builds and deploys automatically (https://fantasy-web-ui.vercel.app). No manual step, but also no safety net — be as confident in a change before pushing to `master` as you would be with any other auto-deployed frontend.
