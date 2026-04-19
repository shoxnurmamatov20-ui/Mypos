# @mypos/validation

Zod schemas mirroring Laravel FormRequest rules. Used in web/mobile forms for client-side validation + typed inputs.

## Usage

```ts
import { CreateOrderSchema, CreateOrderInput } from '@mypos/validation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm<CreateOrderInput>({
  resolver: zodResolver(CreateOrderSchema),
});
```

## Guidelines

- **Mirror backend exactly** — if Laravel FormRequest requires `min:8` password, Zod does too
- **Localized error messages** in Uzbek (primary)
- **Reuse common schemas** (Email, Phone, Password, etc.) — don't duplicate
- **Regenerate** when backend validation rules change

## Modules

- `common` — Email, Password, Phone (UZ + international), PIN, Translated
- `auth` — Login, Register, Forgot/Reset password, MFA
- `menu` — Menu category + item CRUD
- `order` — Create order, update status

More coming as domains land.
