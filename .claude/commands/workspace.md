---
name: workspace
description: Print Claude's personal workspace TOC and quick context refresh.
---

Print a quick TOC of `.claude/workspace/` and refresh cold-start context.

## Steps

1. List files in `.claude/workspace/` with one-line summary each
2. Read `BOOTLOADER.md` (60-second context primer)
3. Read `SESSION.md` (current focus)
4. Glance `DECISIONS.md` last 5 entries
5. Report state in tabular form

## Output format

Reply in Uzbek with this structure:

```
**Workspace** (.claude/workspace/) — 15 fayl, ~4200 qator

**Tezkor kontekst** (BOOTLOADER + SESSION + DECISIONS):
- Loyiha: ...
- Hozirgi fokus: ...
- So'nggi locked decision: ...

**Mavjud fayllar**:
| Fayl | Maqsad |
|---|---|
| BOOTLOADER.md | 60s cold-start |
| ... | ... |

**Keyingi qadam taklifi**: ...
```

## When to use

- Start of new session — to refresh context
- When user asks "claude o'zing nima qilyapsan?" / "workspace'da nima bor?"
- When stuck — to re-orient

## Files in workspace (read order)

1. `BOOTLOADER.md` — ultra-condensed primer
2. `README.md` — index
3. `PROJECT.md` — MyPOS overview
4. `SESSION.md` — current focus (overwrite per session)
5. `DECISIONS.md` — append-only decision log
6. `DESIGN.md` — Apple-only rules
7. `STRUCTURE.md` — folder map
8. `COMMANDS.md` — cheatsheet
9. `DICTIONARY.md` — UZ↔EN glossary
10. `GOTCHAS.md` — known traps
11. `ANTI-PATTERNS.md` — forbidden code
12. `PATTERNS.md` — code library
13. `PLAYBOOKS.md` — step workflows
14. `TEMPLATES.md` — code scaffolds
15. `CHEATSHEETS.md` — per-domain refs
