# ADR-0002: Laravel 12 as Backend Framework

- **Status:** Accepted
- **Date:** 2026-04-20
- **Deciders:** Solo Founder

## Context

MyPOS backend must serve 13+ clients (web, mobile, bots, KDS) with complex domain (orders, payments, inventory, multi-tenancy, fiscal compliance). We need a framework that enables:

- Solo dev productivity (AI-assisted)
- Mature ecosystem for SaaS (auth, queues, billing, admin)
- Strong typing / static analysis
- Good real-time story
- Self-hostable (UZ data sovereignty)

## Decision

**Use Laravel 12 (PHP 8.5) as the primary backend framework.**

Key packages:
- `laravel/sanctum` — API tokens
- `laravel/reverb` — self-hosted WebSocket
- `laravel/horizon` — queue monitoring
- `laravel/scout` + Meilisearch — search
- `filament/filament` — admin panel
- Spatie suite (permission, multitenancy, data, medialibrary, activitylog, translatable)
- `pestphp/pest` — tests
- `larastan/larastan` — static analysis

## Alternatives Considered

- **NestJS + TypeScript**: Single-language stack (aligns with Next.js + Expo), better real-time, stronger type safety end-to-end. Rejected because founder prefers PHP/Laravel DX, and Filament's auto-CRUD saves weeks on admin.
- **Ruby on Rails**: Similar productivity, but smaller ecosystem in UZ; Laravel wins on hosting and dev pool.
- **Django**: Good admin out of the box, but async story weaker for real-time.

## Consequences

### Positive
- Filament delivers super admin CRUD in days instead of weeks
- Spatie ecosystem covers 80% of SaaS needs out of the box
- Reverb = official self-hostable WebSocket (no Pusher dependency)
- Larger UZ developer pool for future hiring
- PHP 8.5 is genuinely modern (typed properties, enums, readonly, first-class callables)

### Negative
- Language split: PHP backend vs TypeScript frontend/mobile
  - Shared types disappear — must regenerate via OpenAPI → TS SDK pipeline
  - Zod schemas can't be shared with Laravel FormRequest (must write twice)
  - Mitigation: Scribe + openapi-typescript + strict contract-keeper agent
- Claude Code agents switch mental models between PHP ↔ TS
  - Mitigation: domain-per-folder structure limits context switches
- Real-time throughput lower than Node.js equivalents
  - Mitigation: Octane + RoadRunner for persistent PHP; Reverb runs on Node workers anyway

### Neutral
- Commit to PHP ecosystem (can't easily switch to Node in future)
