'use client';

import { cn } from '@mypos/ui';
import { ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { type ReactNode, useMemo, useState } from 'react';
import { useCreateOrder, useWaiterMenu, useWaiterTables } from '@/lib/use-waiter-data';
import { formatUzs, type WaiterTable } from '@/lib/waiter-data';
import { HisobStep } from './order-flow/hisob-step';
import { type FlowMenuItem, MenuStep } from './order-flow/menu-step';
import { ProductSheet } from './order-flow/product-sheet';
import { TableStep } from './order-flow/table-step';
import { ZoneStep } from './order-flow/zone-step';
import { DemoBadge } from './waiter-bits';

type CartLine = { item: FlowMenuItem; qty: number; comment: string };
type Cart = Record<string, CartLine>;
const lineKey = (item: FlowMenuItem) => item.id ?? item.name;

/**
 * Yangi buyurtma — the full order-taking flow, one stateful screen deriving
 * its step from selection: Joy (zone) → stol → hisob → menyu → mahsulot,
 * mirroring screenshots 8→7→6→5→4.png. Deep-linking `?table=` jumps straight
 * to that table's checks (used by the home bill cards).
 */
export function NewOrderView() {
  const t = useTranslations('waiter');
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselect = searchParams?.get('table') ?? null;

  const { tables, isLoading: tablesLoading, live: tablesLive, refetch } = useWaiterTables();
  const { menu, isLoading: menuLoading, live: menuLive } = useWaiterMenu();
  const create = useCreateOrder();

  const [zone, setZone] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(preselect);
  const [checkCount, setCheckCount] = useState(1);
  const [activeCheck, setActiveCheck] = useState(1);
  const [onMenu, setOnMenu] = useState(false);
  const [product, setProduct] = useState<FlowMenuItem | null>(null);
  const [carts, setCarts] = useState<Record<number, Cart>>({});
  const [placedNo, setPlacedNo] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const live = tablesLive && menuLive;
  const table = tables.find((row) => row.id === tableId) ?? null;
  const zoneTables = useMemo(
    () => tables.filter((row) => row.zone === (zone ?? table?.zone)),
    [tables, zone, table],
  );
  const allItems = useMemo<FlowMenuItem[]>(
    () => menu.flatMap((cat) => cat.items.map((item) => ({ ...item, category: cat.name }))),
    [menu],
  );
  const cart = carts[activeCheck] ?? {};
  const lines = Object.values(cart);
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const total = lines.reduce((sum, line) => sum + line.item.price * line.qty, 0);

  const addToCart = (item: FlowMenuItem, qty: number, comment: string) => {
    setCarts((old) => ({
      ...old,
      [activeCheck]: { ...(old[activeCheck] ?? {}), [lineKey(item)]: { item, qty, comment } },
    }));
    setProduct(null);
  };

  const openTable = (id: string) => {
    setTableId(id);
    setActiveCheck(1);
    setCheckCount(1);
    setOnMenu(false);
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const submit = () => {
    if (count === 0 || create.isPending || !live) return;
    create.mutate(
      {
        tableId,
        guests: table?.guests ?? 2,
        items: lines
          .filter((line) => line.item.id)
          .map((line) => ({ menuItemId: line.item.id as string, quantity: line.qty })),
      },
      { onSuccess: (placed) => setPlacedNo(placed.orderNo) },
    );
  };

  if (placedNo) {
    return (
      <SuccessPanel
        orderNo={placedNo}
        table={table}
        locale={locale}
        onReset={() => {
          setPlacedNo(null);
          setCarts({});
          setTableId(null);
          setZone(null);
          setOnMenu(false);
          create.reset();
        }}
      />
    );
  }

  if (product) {
    const existing = cart[lineKey(product)];
    return (
      <ProductSheet
        item={product}
        initialQty={existing?.qty ?? 1}
        initialComment={existing?.comment ?? ''}
        onBack={() => setProduct(null)}
        onAdd={(qty, comment) => addToCart(product, qty, comment)}
      />
    );
  }

  // ── Menu step ──────────────────────────────────────────────────────────────
  if (tableId && onMenu) {
    const crumb = `${table?.zone ?? zone ?? ''}, ${table?.number ?? ''}, ${t('hisob.tab', { n: activeCheck })}`;
    return (
      <>
        <MenuStep
          breadcrumb={crumb}
          onBack={() => setOnMenu(false)}
          categories={menu.map((cat) => cat.name)}
          items={allItems}
          isLoading={menuLoading}
          onOpenProduct={setProduct}
        />
        <BottomBar
          label={t('newOrder.cartCount', { count })}
          total={total}
          faded={count === 0}
          onClick={() => count > 0 && setOnMenu(false)}
        />
      </>
    );
  }

  // ── Hisob step ─────────────────────────────────────────────────────────────
  if (tableId) {
    return (
      <div className="animate-fade-in space-y-3">
        <FlowHeader
          title={t('hisob.header', {
            number: table?.number ?? '',
            zone: table?.zone ?? zone ?? '',
          })}
          onBack={() => (preselect ? router.push(`/${locale}/tables` as Route) : setTableId(null))}
          right={<DemoBadge show={!live} />}
        />
        <HisobStep
          checkCount={checkCount}
          activeCheck={activeCheck}
          lines={lines.map((line) => ({
            key: lineKey(line.item),
            name: line.item.name,
            qty: line.qty,
            price: line.item.price,
          }))}
          onSelectCheck={setActiveCheck}
          onAddCheck={() => {
            const next = Math.min(4, checkCount + 1);
            setCheckCount(next);
            setActiveCheck(next);
          }}
          onAddItems={() => setOnMenu(true)}
          onRefresh={refresh}
          isRefreshing={refreshing}
        />
        {count > 0 ? (
          <BottomBar
            label={t('newOrder.send')}
            total={total}
            disabled={!live || create.isPending}
            hint={!live ? t('newOrder.offline') : create.isError ? t('newOrder.error') : undefined}
            onClick={submit}
          />
        ) : null}
      </div>
    );
  }

  // ── Table step ─────────────────────────────────────────────────────────────
  if (zone) {
    return (
      <div className="animate-fade-in space-y-3">
        <FlowHeader title={zone} onBack={() => setZone(null)} />
        <TableStep tables={zoneTables} isLoading={tablesLoading} onPick={openTable} />
      </div>
    );
  }

  // ── Zone step ──────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in space-y-3">
      <FlowHeader
        title={t('zone.title')}
        onBack={() => router.push(`/${locale}/tables` as Route)}
        right={<DemoBadge show={!live} />}
      />
      <ZoneStep tables={tables} isLoading={tablesLoading} onPick={setZone} />
    </div>
  );
}

/** Centered mobile-style screen title with a leading back chevron. */
function FlowHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack: () => void;
  right?: ReactNode;
}) {
  const t = useTranslations('waiter');
  return (
    <header className="relative flex h-12 items-center justify-center">
      <button
        type="button"
        onClick={onBack}
        aria-label={t('common.back')}
        className="absolute left-0 grid h-10 w-10 place-items-center rounded-full text-ink transition-transform active:scale-90"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="max-w-[70%] truncate text-center text-body-strong text-ink">{title}</h1>
      {right ? <div className="absolute right-0">{right}</div> : null}
    </header>
  );
}

/** Fixed red action bar at the screen bottom (cart summary / send). */
function BottomBar({
  label,
  total,
  onClick,
  faded,
  disabled,
  hint,
}: {
  label: string;
  total: number;
  onClick: () => void;
  faded?: boolean;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-canvas/85 px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto max-w-[1080px]">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between gap-4 rounded-pill bg-tenant px-5 py-3.5 text-body-strong text-tenant-on-primary transition-transform duration-200 active:scale-[0.98] disabled:active:scale-100',
            (faded || disabled) && 'opacity-45',
          )}
        >
          <span>{label}</span>
          <span className="tabular-nums">{formatUzs(total)}</span>
        </button>
        {hint ? <p className="mt-2 text-center text-fine-print text-warning-text">{hint}</p> : null}
      </div>
    </div>
  );
}

function SuccessPanel({
  orderNo,
  table,
  locale,
  onReset,
}: {
  orderNo: string;
  table: WaiterTable | null;
  locale: string;
  onReset: () => void;
}) {
  const t = useTranslations('waiter');
  return (
    <div className="animate-fade-in flex flex-col items-center gap-4 py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-success-soft text-success-text">
        <CheckCircle className="h-8 w-8" weight="fill" />
      </span>
      <div>
        <p className="text-body-strong text-ink">{t('newOrder.success')}</p>
        <p className="mt-1 text-caption text-ink-muted-80 tabular-nums">
          {orderNo}
          {table ? ` · ${table.label}` : ''}
        </p>
      </div>
      <div className="flex flex-col items-center gap-2 pt-2">
        <Link
          href={`/${locale}/tables` as Route}
          className="rounded-pill bg-tenant px-6 py-3 text-caption-strong text-tenant-on-primary transition-transform active:scale-95"
        >
          {t('newOrder.goToOrders')}
        </Link>
        <button
          type="button"
          onClick={onReset}
          className="rounded-pill px-6 py-2 text-caption-strong text-ink-muted-80 transition-colors hover:text-ink"
        >
          {t('newOrder.oneMore')}
        </button>
      </div>
    </div>
  );
}
