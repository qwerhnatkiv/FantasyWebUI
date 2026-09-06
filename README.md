# FantasyWebUI

<!-- ПРАВИЛО-ОТЧЁТА-О-МЕТРИКАХ -->
> # ⛔ ПРАВИЛО ОТЧЁТА О МЕТРИКАХ. НАРУШЕНИЮ НЕ ПОДЛЕЖИТ
>
> **КАЖДЫЙ шаг. КАЖДАЯ проверенная гипотеза. КАЖДЫЙ ответ, в котором есть хоть одно число о качестве
> модели — это ТАБЛИЦА. Столбцы строго в этом порядке:**
>
> | метрика | ОФО 1 (справка) | ОФО 2 (справка) | планка | BASELINE (*каким шагом получен*) | проверяемый шаг 1 | проверяемый шаг 2 | … |
> | --- | --- | --- | --- | --- | --- | --- | --- |
> | RMSE (< лучше) | | | | | | | |
> | MAE (< лучше) | | | | | | | |
> | R² (> лучше) | | | | | | | |
> | Спирмен (порядок, > лучше) | | | | | | | |
> | Спирмен (топ-20%, > лучше) | | | | | | | |
>
> **Строк ровно пять, и каждая с указанием направления.** Значения — АБСОЛЮТНЫЕ. Столбец BASELINE
> обязан нести пояснение, каким именно шагом он получен. ОФО 1 и ОФО 2 — замороженные константы, их
> копируют, а не считают.
>
> **ЗАПРЕЩЕНО:** сообщать результат дельтой в тексте вместо таблицы (`MAE −0.0198`, `взято 56%
> потолка`, `+0.0066, из которых +0.0051 контроль` — так писать НЕЛЬЗЯ, это нечитаемо: не видно, от
> чего дельта, и проверить её невозможно). Дельта и счёт по зёрнам допустимы ОДНОЙ строкой ПОСЛЕ
> таблицы, но никогда вместо неё.
>
> **BASELINE ВСЕГДА РОВНО ОДИН — В ЛЮБОЙ МОМЕНТ ВРЕМЕНИ.** Не бывает «baseline утром» и «baseline
> вечером», «baseline до обеда» и «baseline после дождичка в четверг». Есть BASELINE, и есть всё
> остальное — а всё остальное словом «baseline» НЕ НАЗЫВАЕТСЯ ВООБЩЕ, ни с какими уточнениями.
> Снятый с baseline шаг в таблице подписывается тем, чем он является («аффинная прямая», «вероятность
> из ЭЛО»), и пометкой, что он снят. Столбец BASELINE один, и он несёт пояснение, каким шагом получен.
>
> **ТАБЛИЦА ИДЁТ И В ЧАТ, И В ФАЙЛ. Не одно из двух — оба.**
>
> **ЗАКАЗЧИК ТРЕБОВАЛ ЭТОГО БОЛЕЕ ПЯТИДЕСЯТИ РАЗ.** Каждое нарушение он ловил сам и объяснял заново.
> Его терпение исчерпано полностью и окончательно. Исключений НЕТ и быть не может — ни когда результат
> промежуточный, ни когда «и так очевидно», ни когда меняется одна метрика из пяти, ни когда мало
> времени, ни когда на планету исполнителя падает астероид. Не существует обстоятельства, при котором
> ответ с числами публикуется без этой таблицы.
<!-- /ПРАВИЛО-ОТЧЁТА-О-МЕТРИКАХ -->


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
