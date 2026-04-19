# @mypos/types

Shared TypeScript types for the MyPOS domain.

## Usage

```ts
import type { Order, Menu, Tenant } from '@mypos/types';
```

## Modules

- `common` — UUID, ISO8601, Locale, Currency, Pagination, MoneyAmount, Address, etc.
- `tenant` — Tenant, TenantPlan, TenantRole, Membership
- `menu` — MenuItem, MenuCategory, Variants, Modifiers
- `table` — Table, TableCategory, TableStatus
- `order` — Order, OrderItem, OrderStatus, PaymentStatus, PaymentMethod
- `employee` — Employee, Shift
- `customer` — Customer, LoyaltyAccount, LoyaltyTier

## Guidelines

- Only **type** definitions here (no runtime code)
- Mirror backend DTOs exactly
- When backend changes a field, update here + regenerate `@mypos/api-client`
- `Translated` fields follow the `Record<Locale, string>` shape for UZ/RU/EN

## Future

As the domain expands, add modules for: inventory, payment, reservation, delivery, loyalty, analytics, etc.
