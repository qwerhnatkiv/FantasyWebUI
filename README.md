# FantasyWebUI

Angular 17.3 frontend for the fantasy hockey project: calendar of games, player stats table, squad
builder, and date-range driven expected-fantasy-points ("EFP") projections.

## Running locally

```powershell
npm install
npm start
```

`npm start` runs `ng serve --ssl` with an ASP.NET dev cert and serves on **:4200**. If the cert step
fails, trust it once with `dotnet dev-certs https --trust`.

**Local dev talks to the production backend by default** — the API base URL is hardcoded in
`src/services/api/api.service.ts` rather than read from an environment file. Pointing the app at a
locally running `FantasyWeb` means editing those URLs or wiring up `src/proxy.conf.js`, which is
currently unused.

## Documentation

- [`AGENTS.md`](AGENTS.md) — component/service inventory, data flow, routing and auth, known traps.
- [`docs/perf-notes.md`](docs/perf-notes.md) — the reasoning behind several load-bearing perf patterns.
- [`../AGENTS.md`](../AGENTS.md) — system-wide context across all four repos.

## Deployment

Push to `master` → Vercel builds and deploys automatically to https://fantasy-web-ui.vercel.app. No
manual step, and no safety net.
