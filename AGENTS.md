# FantasyWebUI — AGENTS.md

Angular frontend for the fantasy hockey project. See the root [`../AGENTS.md`](../AGENTS.md) first for system-wide context (data flow, MCP requirements, business domain) — this file only covers what's specific to this repo.

## Stack

Angular 17.3 / TypeScript 5.4, wrapped in a Visual Studio `.esproj` (`angularapp.esproj` — just runs `npm start` / `npm run build` under the hood, you don't need Visual Studio to work on this repo, plain `npm`/`ng` CLI works fine).

## Running locally

```powershell
npm install
npm start
```

`npm start` runs `ng serve --ssl` with a dev cert (`aspnetcore-https.js` generates/uses an ASP.NET dev cert — if this fails, check the dev cert is trusted: `dotnet dev-certs https --trust`). Serves on the Angular CLI default port, **:4200**.

Local dev talks to the **production backend by default** — `src/services/api/api.service.ts` hardcodes full `https://qwerhnatkiv-backend.azurewebsites.net/...` URLs directly (not a relative path). Note `src/proxy.conf.js` also defines an `/api` → prod-backend proxy, but the API service doesn't appear to route through it — it's effectively unused as currently written. Because of this, testing locally against your own locally-running `FantasyWeb` instance requires either changing these URLs temporarily or wiring up the proxy properly; don't assume one or the other without checking what the current task needs.

## Routes / pages

- `/login` — `LoginComponent`, unauthenticated.
- `/main` — `MainViewComponent`, default route, `AuthGuard`-protected.
- `/monitoring` — `MonitoringComponent`, `AuthGuard`-protected. **Known to not be fully working yet** — be extra careful verifying changes here actually render/function rather than assuming.

Auth: JWT bearer token stored in `localStorage` (`access_token` key) via `AuthService` (`src/services/auth/auth.service.ts`), attached by `auth.interceptor.ts`, gated by `auth.guard.ts`.

## Conventions observed in the codebase

- Shared UI atoms live under `src/app/common-components/` (e.g. `cancel-button`, `i-button`, `simple-select`) — check here before building a new small reusable control.
- API response shapes live under `src/app/interfaces/*.model.ts` / `*-dto.ts` — match existing DTO naming when adding a new endpoint's response type.
- Formatting/display logic is pulled into pipes under `src/app/pipes/` (e.g. `pptoi.pipe.ts`, `toi.pipe.ts`, `positions-map.pipe.ts`) rather than inlined in components — follow this pattern for new derived-display values instead of computing in the template or component class.

## Mandatory verification

**A UI change is not done until it's been verified in a real browser via the chrome-devtools or playwright MCP** — run the dev server, navigate to the actual affected page/flow, and confirm it renders and behaves correctly, including checking for regressions in nearby functionality. Passing a build/lint/typecheck is necessary but not sufficient — those verify the code compiles, not that the feature works. This applies especially to `/monitoring` given its current known-broken state — don't assume a fix worked without seeing it render.

## Deployment

Push to `master` on GitHub → Vercel builds and deploys automatically (https://fantasy-web-ui.vercel.app). No manual step, but also no safety net — be as confident in a change before pushing to `master` as you would be with any other auto-deployed frontend.
