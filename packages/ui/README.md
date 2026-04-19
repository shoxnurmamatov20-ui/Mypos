# @mypos/ui

Cross-platform UI components for MyPOS — React + React Native via NativeWind.

## Current state

Skeleton package with `cn()` helper. Components land incrementally.

## Planned primitives

- Button, IconButton
- Input, Textarea, Select, Combobox
- Checkbox, Radio, Switch
- Card, Modal, Dialog, Drawer
- Popover, Tooltip, Toast
- Badge, Chip, Tag, Avatar
- Skeleton, Spinner, Progress
- Tabs, Accordion, Breadcrumb
- Table, Pagination
- Menu, Dropdown

## Planned composed

- ProductCard, OrderCard, TableCard, EmployeeCard
- StatsCard, ChartCard
- CategoryPill, PaymentMethodCard
- ReceiptView, OrderItemRow

## Design principles

1. **Works on web + native** — use NativeWind (Tailwind classes)
2. **Accessible by default** — proper ARIA, keyboard nav
3. **Themable** — light + dark + high-contrast via design-tokens
4. **Composable** — small building blocks, not god-components
5. **Typed props** — no `any`

## Usage

```tsx
import { cn } from '@mypos/ui';

function MyButton({ className, ...props }: ButtonProps) {
  return (
    <button
      className={cn('px-4 py-2 bg-brand-500 text-white rounded-lg', className)}
      {...props}
    />
  );
}
```
