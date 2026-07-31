# Symphone

A Symfony based project to demonstrate the use of pwa-bundle and fw-bundle.
Symphone combines [`spomky-labs/pwa-bundle`](https://github.com/Spomky-Labs/pwa-bundle)
with [Framework7](https://framework7.io/) via `survos/fw-bundle`.

Fork lineage: `Spomky-Labs/phpwa-demo` → `tacman/phpwa-demo` → this repo
(`survos-sites/pwa-bundle-demo-fw7`, `praveen` branch). At this point the app has diverged enough
from the original that it's really its own demo built around `pwa-bundle` + `fw-bundle`, using the
upstream demo mainly as a starting point for feature coverage.

## Stack

- PHP >= 8.4, Symfony 8.1
- `spomky-labs/pwa-bundle` ^1.5
- `survos/fw-bundle` (latest) — Framework7 integration bundle
- Framework7 9.1.x, loaded via AssetMapper (`framework7/bundle`, `framework7/css/bundle`,
  `framework7-icons`), not the old `framework7/framework7-bundle` CDN-min-file import style
- No Tailwind. It was fully removed — see below.

## Architecture

The app is a genuine Framework7 SPA:

- `templates/base.html.twig` renders just the `<div id="app">` shell + `{{ pwa(...) }}` +
  the importmap. Framework7 mounts into `#app` and owns all navigation from there.
- `assets/fw7/js/routes.js` registers every route (the tabbar's routable tabs, plus one entry
  per feature page) as a Framework7 `componentUrl` pointing at the *same* existing Symfony route
  (e.g. `app_feature_offline_support` → `/en_US/offline-support`). No separate `/partials/...`
  endpoints were needed for these — the controllers are unchanged, only what their templates
  render changed.
- Every page template under `templates/features/*.html.twig` (and the shared components under
  `templates/components/*.html.twig` that they use) is a Framework7 "Component" fragment:
  ```twig
  <template>
      <div class="page">
          <div class="navbar">...</div>
          <div class="page-content">...</div>
      </div>
  </template>
  <script>
      export default function(props, {$, $el, $f7, $f7route, $f7router, $h, $on, $store, $theme, $update}) {
          return $render;
      }
  </script>
  ```
  These are fetched by Framework7's router via XHR and mounted as pushed pages — they are **not**
  meant to be visited as standalone full-page loads (a direct browser navigation to e.g.
  `/en_US/offline-support` will just show the raw `<template>` markup, inert, since only
  Framework7's own component loader parses it).

### The one rule that will silently break everything if you forget it

**Every void HTML element must be self-closed:** `<br/>` not `<br>`, `<img .../>` not `<img>`,
`<input .../>` not `<input>`, `<hr/>` not `<hr>`. Also make sure there's always whitespace before
an attribute — `<dd class="x"{{ stimulus_target(...) }}>` (no space) is just as broken as an
unclosed `<br>`.

Framework7's Component template compiler is its own small, strict, regex-based HTML parser — not
the browser's lenient HTML5 parser. Feed it anything malformed like the above and it fails with
**no console error, no network error**. `router.navigate()` just silently no-ops back to whatever
page you were already on. This took a long debugging session to root-cause — don't reintroduce it.
If a new page you add won't navigate to and nothing is logged anywhere, check for an unclosed void
element or a glued attribute first.

## Removing Tailwind

Tailwind's `@tailwind` directives in `assets/styles/app.css` were already commented out and no
template needed its utility classes anymore, so `symfonycasts/tailwind-bundle` was removed
entirely (composer dependency, bundle registration, its config file, and the `tailwind:build` step
in `app.json`'s dokku predeploy script). Styling now comes from Framework7's own CSS
(`block`, `block-title`, `list`, `button button-fill`, etc.) plus the app's own
`assets/fw7/css/{colors,overrides}.css`.

## Installation

```bash
git clone git@github.com:survos-sites/pwa-bundle-demo-fw7.git symphone && cd symphone
composer install
symfony server:start -d
symfony open:local
```

The app uses the shared/global Postgres database convention used across other Survos demo apps —
see `.env` for `DATABASE_URL`. There's no local-sqlite fallback by design.

## License

It is available under the MIT License.
