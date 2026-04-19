# ADR-0001: Use Turborepo + pnpm Monorepo

- **Status:** Accepted
- **Date:** 2026-04-20
- **Deciders:** Solo Founder

## Context

MyPOS has 13+ runnable applications (backend, multiple web apps, multiple mobile apps, Telegram bot) plus shared packages (types, UI, design tokens). We need:

- Shared code without versioning friction
- Atomic cross-app commits (API change + client update)
- Fast incremental builds
- Type-safety across apps

Single repo OR multi-repo? Which monorepo tool?

## Decision

**Use a single monorepo with Turborepo + pnpm workspaces.**

Structure:
```
mypos/
├── apps/       # Runnable applications
├── packages/   # Shared libraries
├── infra/      # Docker, deploy scripts
└── docs/       # Documentation
```

pnpm handles workspace linking; Turborepo handles task orchestration + caching.

## Alternatives Considered

- **Nx**: More features (plugins, generators), but heavier setup and steeper learning curve. Turbo is simpler.
- **Multi-repo**: Forces tedious version bumps, slows cross-app changes. Rejected.
- **Lerna**: Older, less actively maintained for TS-first monorepos.
- **Bun workspaces**: Promising but younger ecosystem; pnpm is battle-tested.

## Consequences

### Positive
- One place to clone, one CI pipeline, one dependency tree
- pnpm is fast and disk-efficient (content-addressable store)
- Turbo cache speeds up repeated builds 10-100x
- Easy cross-app refactoring

### Negative
- Laravel (`apps/api/`) doesn't fit the JS workspace model cleanly
  - Mitigation: exclude `apps/api` from pnpm workspace (`!apps/api` in pnpm-workspace.yaml)
  - Composer manages PHP deps separately
- Initial setup complexity
- Junior devs need to learn Turbo + pnpm

### Neutral
- We commit to one repo forever — splitting later is expensive
