# @mypos/utils

Pure helper functions used across web, mobile, and backend glue.

## Modules

- `currency` — `formatMoney`, `formatUZS`, `parseUZS`
- `date` — `formatDate`, `formatDateTime`, `formatTime`, `minutesSince`, `startOfToday` (Asia/Tashkent TZ)
- `phone` — `normalizeUZPhone`, `formatUZPhone`, `isValidUZPhone`
- `string` — `initials`, `truncate`, `slug`, `capitalize`

## Guidelines

- **Pure functions** — no side effects, no state
- **No external services** — no fetch, no storage
- **Fully tested** — every helper has unit tests
- **Locale-aware** — respect UZ/RU/EN conventions (UZS "so'm", not "$")
- **Time zones** — everything in `Asia/Tashkent` unless explicit

## Testing

Tests use Vitest. Run from repo root:

```bash
pnpm --filter @mypos/utils test
```
