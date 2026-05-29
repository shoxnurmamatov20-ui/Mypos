# Contributing to MyPOS

## Commit convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat` — new feature
- `fix` — bug fix
- `chore` — tooling, deps, non-code
- `docs` — documentation only
- `refactor` — code change, no behavior
- `test` — adding tests
- `perf` — performance improvement
- `ci` — CI/CD changes
- `build` — build system

### Scopes

Prefer domain names: `orders`, `menu`, `auth`, `payments`, `tables`, `reports`, etc. Or app names: `api`, `web-dashboard`, `web-cashier`.

### Examples

```
feat(orders): add split check support
fix(payments): handle Click webhook retry idempotently
chore(deps): bump laravel to 12.3
docs(adr): record decision on multi-tenancy strategy
refactor(menu): extract PriceCalculator service
test(reservations): add edge case for overlap detection
```

## Branch naming

- `feat/<short-name>` — new feature
- `fix/<short-name>` — bug fix
- `chore/<short-name>` — maintenance

## PR process

1. Fork or branch from `main`
2. Make changes following [CLAUDE.md](./CLAUDE.md) conventions
3. Add/update tests
4. Run full CI locally: `pnpm lint && pnpm typecheck && pnpm test`
5. For Laravel: `cd apps/api && vendor/bin/pest && vendor/bin/phpstan`
6. Open PR using `PULL_REQUEST_TEMPLATE.md`
7. Request review
8. Squash merge (PR title becomes commit message)

## Code style

- TypeScript: Biome enforces. `pnpm lint:fix` to auto-fix.
- PHP: Laravel Pint enforces. `cd apps/api && vendor/bin/pint`.
- No opinions beyond the linters — if it passes, it's fine.

## Questions

Ask in team chat or GitHub Discussions. Or tag the relevant `CODEOWNERS`.
