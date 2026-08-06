# Frontend performance pass

Why this file exists: the site was slow on first load and on every recalculation
(e.g. changing dates). This pass covers the frontend half of that (see
`FantasyWeb/docs/perf-caching.md` for the backend half, already done). No new
components/files were introduced - all fixes are inside the existing
components/services, with comments at each change site.

## What changed

### 1. `main-view.component.ts` - stopped re-fetching the squad on every date change
This was the single biggest lever. On every date change, `setOfoDataForPlayers()`
fetched updated expected-fantasy-points (OFO) data, and its success callback used
to call `getUserSquad()`, which re-fetched the **entire squad from the server**
(a sports.ru-backed call) just to recompute each player's OFO total. Squad
membership doesn't depend on the date range - only the OFO numbers do.

`getUserSquad()` is now split into:
- `fetchUserSquad()` - the network call, only needed when the selected user
  changes. Caches the raw result in `_sportsSquadResult`.
- `buildSquadPlayers(result)` - pure/local, rebuilds `squadPlayers` from the
  cached result plus current `playerGamesOfoMap`. Called on every date change
  instead of `fetchUserSquad()`, with no network round-trip.

The duplicated "existing squad player" / "newly added player" loops that used
to build `PlayerSquadRecord`s were merged into one shared `createSquadRecord()`
helper to avoid two copies of the same logic drifting apart.

### 2. `main-view.component.ts` - O(1) lookups instead of `.find()` in loops
`playerStats`, `teamStats`, and `games` were repeatedly scanned with `.find()`
inside per-player/per-game loops (in squad building and in
`setTop3PlayersForEachTeam`, which runs once per player in the OFO response on
every date change). Added `playerStatsById`, `playerStatsBySportsId`,
`teamStatsById`, `gamesById` maps, built once whenever `getCalendarData()`
loads fresh games/players/teams, and used everywhere the old `.find()` calls
were on the date-change hot path.

### 3. `main-view.component.ts` - `updateFilteredTeamsGamesMap()` date parsing
Previously re-parsed every game's date with `new Date(...)` twice per team
(O(teams × games) `Date` construction) to check it against the selected range.
Now the date-range filter runs once over all games up front (O(games)), and
each team's loop just filters that already-date-checked list.

### 4. `players-table.component.ts` - one filter pass instead of eight
`ngOnChanges` used to call `applyPlayersFilter()` once per filter field (8
calls), and each call re-stringified the whole filter dictionary and made
`MatTableDataSource` re-run its filter predicate over every row - 8 full-table
passes per date change. Split into `setPlayersFilter()` (just updates the
dictionary) and `refreshPlayersFilter()` (triggers the actual filter pass);
`ngOnChanges` now calls `setPlayersFilter()` 8 times and `refreshPlayersFilter()`
once. `applyPlayersFilter()` still exists as a one-shot convenience for call
sites that only ever change a single filter.

Also: `MatTableDataSource` calls the filter predicate once per row with the
*same* filter string, but `_filterPlayers()` was doing `JSON.parse(filter)` on
every single call - i.e. once per row, every pass. It now caches the parsed
result keyed by the filter string, so it's parsed once per filter pass instead
of once per row.

### 5. `trackBy` added to the two Material tables
`players-table.component.html` and `players-squad.component.html` render
players via `mat-table`. Without `trackBy`, Angular Material can't tell that a
freshly-reassigned array (e.g. `squadPlayers` after `buildSquadPlayers()`)
still mostly contains the same players, and re-renders every row's DOM from
scratch. Added `trackByPlayerId` (keyed on `playerObject.playerID`) to both
components and wired it into both `<table mat-table>` elements.

### 6. `monitoring` route is now lazy-loaded
`MonitoringComponent` was declared in the root `AppModule` alongside
everything else, so its code shipped in the bundle every visitor downloads on
first load, even though most users never open `/monitoring`. Converted it to
a `standalone: true` component (with its own `imports: [...]` for what its
template needs) and changed the route to `loadComponent: () => import(...)`.
This didn't require a separate lazy-loading module file - Angular 17 lazy-loads
a single standalone component directly. Verified with a production build
(`ng build --configuration production`): monitoring now builds as its own
~19 KB lazy chunk instead of being part of `main.js`.

## Not addressed in this pass (documented, not fixed)

- **`GamesUtils.generatePairings`** (`src/app/common/games-utils.ts`), called
  from `players-squad.component.ts`'s `setSquadPlayersSortOrder()` on every
  `squadPlayers` reassignment (i.e. every date change) - a recursive
  backtracking search for the best added/removed player pairing. Same shape of
  problem as the backend's `PlayerCombinationsService.GenerateCombinations`
  (see `FantasyWeb/docs/perf-caching.md`): an algorithmic complexity issue,
  not something a caching/lookup fix addresses safely. Left alone to avoid
  changing sort-order/pairing results without being able to fully verify them.
- **Duplicate date libraries**: both `date-fns` and `moment` (plus
  `@angular/material-moment-adapter`) are bundled; `lodash` (not `lodash-es`)
  is imported in `calendar-table.component.ts`. Both show up as build warnings
  ("CommonJS or AMD dependencies can cause optimization bailouts"). Removing
  either dependency touches call sites across multiple components and is a
  larger, separate refactor - flagged here rather than attempted in this pass.
- **Per-row template method calls** in `players-table.component.html` /
  `calendar-table.component.html` (tooltip/class generation calling component
  methods directly in the template) still recompute on every change-detection
  cycle rather than through a memoized pipe. The bigger cost next to these
  (full-table filtering, per-row `.find()`) is fixed above; converting these to
  pure pipes is a smaller follow-up if the table still feels slow after this
  pass.

## Verification

- `ng build` (dev) and `ng build --configuration production` both succeed,
  including Angular's AOT template type-checking - this exercises every
  template change (`trackBy` bindings, the standalone `MonitoringComponent`'s
  `imports`, etc.).
- Production build output confirms `monitoring` is now a separate lazy chunk
  (`monitoring-monitoring-component`, ~19 KB) instead of part of `main.js`.
- Could not do a full interactive click-through (login → change dates → watch
  network/render) in this session: the dev server requires a local HTTPS dev
  certificate the sandboxed browser tool won't navigate past, and login
  requires real credentials against the live Supabase-backed backend that
  weren't available here. Worth doing manually before/after comparing a date
  change's network waterfall and render time.
