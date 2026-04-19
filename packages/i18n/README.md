# @mypos/i18n

Shared translation keys for MyPOS — common UI strings used across apps.

App-specific strings live inside each app's own i18n files (`apps/web-dashboard/messages/`, etc.).
This package is for cross-app common strings (validation, actions, errors).

## Structure

```
src/
├── uz/
│   ├── common.json
│   └── index.ts
├── ru/
│   └── ...
├── en/
│   └── ...
└── index.ts
```

## Usage

```ts
import { uzMessages, locales, defaultLocale } from '@mypos/i18n';

const t = uzMessages.common.actions.save; // "Saqlash"
```

## Guidelines

- **Every key in all 3 languages** — never add to just one
- **Dot-notation keys** — `actions.save`, `errors.network`
- **ICU format** for plurals and variables
- **App-specific strings** stay in the app, not here
