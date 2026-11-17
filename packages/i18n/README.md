# `@voltpulse/i18n`

W08 stub: string catalogs + `t()` helper. Package-only — UI wiring lives in `pulse-web` (T230).

## Locales

| Code | Role |
|------|------|
| `en` | Default (English) |
| `hi` | Second locale keyset (Hindi) — same keys as `en` |

## Usage

```js
import { t, listLocales, DEFAULT_LOCALE } from "@voltpulse/i18n";

t("app.name");                    // "VoltPulse"
t("nav.inspections", "hi");       // Hindi string
t("status.planned", "en");        // "Planned"
```

Missing key → returns the key (no throw). Unknown locale → falls back to `en`.

## Tests

```bash
cd packages/i18n && npm test
```

## Anti-leak

Brand string is **VoltPulse** only. No proprietary product names in catalogs.
