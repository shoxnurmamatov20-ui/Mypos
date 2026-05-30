import { cn } from '@mypos/ui';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Tailwind shape utility — defaults to a rounded card. */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
};

const ROUND: Record<NonNullable<SkeletonProps['rounded']>, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

/**
 * Single skeleton block. Compose multiple to form list/card placeholders.
 *
 * Usage:
 *   <Skeleton className="h-12 w-full" />
 *   <Skeleton className="h-32" rounded="3xl" />
 */
export function Skeleton({ className, rounded = 'xl', ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse bg-neutral-200/70', ROUND[rounded], className)}
      {...rest}
    />
  );
}

/** Restaurant card skeleton — matches the card grid used on home / restaurants. */
export function RestaurantCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white">
      <Skeleton className="h-44 w-full" rounded="none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" rounded="md" />
        <Skeleton className="h-4 w-1/2" rounded="md" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-16" rounded="full" />
          <Skeleton className="h-6 w-20" rounded="full" />
        </div>
      </div>
    </div>
  );
}

/** Grid of restaurant skeletons. Renders `count` placeholders. */
export function RestaurantGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
        <RestaurantCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Menu item row skeleton — for restaurant detail menu list. */
export function MenuItemRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
      <Skeleton className="h-20 w-20 shrink-0" rounded="2xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" rounded="md" />
        <Skeleton className="h-3 w-1/2" rounded="md" />
        <Skeleton className="h-5 w-20" rounded="md" />
      </div>
    </div>
  );
}

/** Cart line skeleton. */
export function CartLineSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-4">
      <Skeleton className="h-14 w-14 shrink-0" rounded="xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" rounded="md" />
        <Skeleton className="h-3 w-1/3" rounded="md" />
      </div>
      <Skeleton className="h-9 w-24" rounded="full" />
    </div>
  );
}

/** Order list item skeleton. */
export function OrderRowSkeleton() {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" rounded="md" />
        <Skeleton className="h-3 w-1/2" rounded="md" />
        <Skeleton className="h-3 w-1/4" rounded="md" />
      </div>
      <Skeleton className="h-8 w-20" rounded="full" />
    </div>
  );
}

/** Generic vertical list skeleton. */
export function ListSkeleton({
  count = 4,
  itemClassName = 'h-16',
}: {
  count?: number;
  itemClassName?: string;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholders
        <Skeleton key={i} className={itemClassName} rounded="2xl" />
      ))}
    </div>
  );
}
