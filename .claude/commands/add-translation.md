---
name: add-translation
description: Add a translation key across Laravel, Next.js, and Expo apps in UZ/RU/EN.
---

Add new i18n keys to all 3 languages (UZ, RU, EN) across backend + web + mobile.

Usage: `/add-translation <domain>.<section>.<key>` with English source text.

Invokes `i18n-translator` which:
1. Adds to `apps/api/lang/{uz,ru,en}/<domain>.php`
2. Adds to `apps/web-dashboard/messages/{uz,ru,en}.json` (and other web apps using the key)
3. Adds to `apps/mobile-staff/src/i18n/{uz,ru,en}.json` (and other mobile apps)
4. Validates ICU syntax if plurals/variables used
5. Returns a diff preview for review

## UZ translation guidance

- Standard Lotin alphabet
- Formal "siz" in UI
- Restaurant terms: ofitsiant, oshxona, menyu, buyurtma, stol, chek
- Currency: "so'm" (UZS), thousand separator comma

## RU translation guidance

- Formal "Вы" in UI
- Currency: "сум", thousand separator space

## EN translation guidance

- American English
- Currency: "UZS 1,500" prefix
