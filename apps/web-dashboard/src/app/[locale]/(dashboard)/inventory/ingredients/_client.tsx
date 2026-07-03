'use client';

import {
  type CreateIngredientInput,
  type Ingredient,
  inventoryApi,
  type StockMovementReason,
} from '@mypos/api-client';
import {
  Badge,
  Button,
  DataTable,
  EmptyState,
  FilterBar,
  FormField,
  Input,
  Modal,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Switch,
  Textarea,
} from '@mypos/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Box,
  CircleDollarSign,
  Pencil,
  Plus,
  ShoppingBag,
  Trash2,
  TrendingDown,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

interface FormState {
  name_uz: string;
  name_ru: string;
  name_en: string;
  sku: string;
  unit: string;
  cost_per_unit: number;
  current_stock: number;
  min_stock: number;
  reorder_point: number;
  is_active: boolean;
}

const EMPTY: FormState = {
  name_uz: '',
  name_ru: '',
  name_en: '',
  sku: '',
  unit: 'kg',
  cost_per_unit: 0,
  current_stock: 0,
  min_stock: 0,
  reorder_point: 0,
  is_active: true,
};

interface AdjustState {
  delta: number;
  reason: StockMovementReason;
  notes: string;
}

export function IngredientsClient() {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const tSide = useTranslations('sidebar');
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [adjusting, setAdjusting] = useState<Ingredient | null>(null);
  const [adjustState, setAdjustState] = useState<AdjustState>({
    delta: 0,
    reason: 'purchase',
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['ingredients', { search, lowStockOnly, page }],
    queryFn: () =>
      inventoryApi.ingredients.list(apiClient, {
        per_page: 20,
        ...(search ? { q: search } : {}),
        ...(lowStockOnly ? { low_stock: true } : {}),
      }),
  });

  const { data: low } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => inventoryApi.lowStock(apiClient),
  });

  const save = useMutation({
    mutationFn: async (input: CreateIngredientInput) => {
      if (editing) return inventoryApi.ingredients.update(apiClient, editing.id, input);
      return inventoryApi.ingredients.create(apiClient, input);
    },
    onSuccess: () => {
      toast.success(editing ? tCommon('updated') : tCommon('created'));
      qc.invalidateQueries({ queryKey: ['ingredients'] });
      qc.invalidateQueries({ queryKey: ['low-stock'] });
      setEditing(null);
      setCreating(false);
      setForm(EMPTY);
    },
    onError: () => toast.error(tCommon('error')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => inventoryApi.ingredients.delete(apiClient, id),
    onSuccess: () => {
      toast.success(tCommon('deleted'));
      qc.invalidateQueries({ queryKey: ['ingredients'] });
    },
    onError: () => toast.error(tCommon('error')),
  });

  const adjust = useMutation({
    mutationFn: (id: string) =>
      inventoryApi.adjustStock(apiClient, id, {
        delta: Number(adjustState.delta),
        reason: adjustState.reason,
        notes: adjustState.notes || null,
      }),
    onSuccess: () => {
      toast.success(t('adjusted'));
      qc.invalidateQueries({ queryKey: ['ingredients'] });
      qc.invalidateQueries({ queryKey: ['low-stock'] });
      setAdjusting(null);
      setAdjustState({ delta: 0, reason: 'purchase', notes: '' });
    },
    onError: () => toast.error(t('adjust_failed')),
  });

  const openCreate = () => {
    setForm(EMPTY);
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (i: Ingredient) => {
    setForm({
      name_uz: i.name.uz ?? '',
      name_ru: i.name.ru ?? '',
      name_en: i.name.en ?? '',
      sku: i.sku ?? '',
      unit: i.unit,
      cost_per_unit: i.cost_per_unit,
      current_stock: i.current_stock,
      min_stock: i.min_stock ?? 0,
      reorder_point: i.reorder_point ?? 0,
      is_active: i.is_active,
    });
    setEditing(i);
    setCreating(false);
  };

  const handleSave = () => {
    save.mutate({
      name: { uz: form.name_uz, ru: form.name_ru, en: form.name_en },
      sku: form.sku || null,
      unit: form.unit,
      cost_per_unit: Number(form.cost_per_unit) || 0,
      current_stock: Number(form.current_stock) || 0,
      min_stock: Number(form.min_stock) || null,
      reorder_point: Number(form.reorder_point) || null,
      is_active: form.is_active,
    });
  };

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const lowCount = low?.meta?.count ?? 0;
  const open = creating || editing !== null;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={tSide('ingredients')}
        description={t('subtitle')}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            {t('add_ingredient')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard
          label={tSide('ingredients')}
          value={meta?.total?.toString() ?? '—'}
          icon={<Box className="h-5 w-5" />}
        />
        <StatCard
          label={t('low_stock_warning', { count: lowCount })}
          value={lowCount.toString()}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <StatCard
          label={tCommon('active')}
          value={rows.filter((r) => r.is_active).length.toString()}
          icon={<ShoppingBag className="h-5 w-5" />}
        />
      </div>

      <FilterBar>
        <Input
          placeholder={t('search_placeholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <label className="flex items-center gap-2 text-[12px] text-[#16221f] dark:text-white">
          <Switch checked={lowStockOnly} onChange={setLowStockOnly} />
          <span>{t('low')}</span>
        </label>
        {meta ? (
          <div className="ml-auto text-[12px] text-[#62716d] dark:text-[#94a3b8] tabular-nums">
            {meta.total}
          </div>
        ) : null}
      </FilterBar>

      <DataTable
        loading={isLoading}
        columns={[
          {
            id: 'name',
            header: t('cols.name'),
            cell: (i: Ingredient) => (
              <div>
                <p className="font-semibold">{i.name.uz || i.name.en}</p>
                <p className="text-[11px] text-[#62716d] dark:text-[#94a3b8]">{i.sku ?? '—'}</p>
              </div>
            ),
          },
          {
            id: 'unit',
            header: t('cols.unit'),
            cell: (i: Ingredient) => <span>{i.unit}</span>,
          },
          {
            id: 'stock',
            header: t('cols.current'),
            cell: (i: Ingredient) => (
              <span
                className={
                  i.low_stock
                    ? 'text-amber-600 dark:text-amber-400 font-bold tabular-nums'
                    : 'tabular-nums'
                }
              >
                {i.current_stock.toFixed(2)} {i.unit}
              </span>
            ),
            align: 'right',
          },
          {
            id: 'min',
            header: t('cols.min'),
            cell: (i: Ingredient) => (
              <span className="tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                {(i.min_stock ?? 0).toFixed(2)}
              </span>
            ),
            align: 'right',
          },
          {
            id: 'cost',
            header: t('cols.cost'),
            cell: (i: Ingredient) => (
              <span className="tabular-nums">{(i.cost_per_unit ?? 0).toLocaleString('uz-UZ')}</span>
            ),
            align: 'right',
          },
          {
            id: 'status',
            header: '',
            cell: (i: Ingredient) =>
              i.low_stock ? (
                <Badge variant="warning">
                  <TrendingDown className="h-3 w-3 inline mr-1" />
                  {t('low')}
                </Badge>
              ) : i.is_active ? (
                <Badge variant="success">{tCommon('active')}</Badge>
              ) : (
                <Badge variant="secondary">{tCommon('inactive')}</Badge>
              ),
          },
          {
            id: 'actions',
            header: tCommon('actions'),
            cell: (i: Ingredient) => (
              <div className="flex items-center gap-1 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAdjusting(i);
                    setAdjustState({ delta: 0, reason: 'purchase', notes: '' });
                  }}
                >
                  <CircleDollarSign className="h-3.5 w-3.5 mr-1" />
                  {t('adjust')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(i)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(tCommon('confirm'))) remove.mutate(i.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
            align: 'right',
          },
        ]}
        rows={rows}
        rowKey={(i) => i.id}
        empty={
          <EmptyState
            icon={<Box className="h-6 w-6" />}
            title={t('empty_ingredients')}
            action={
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                {t('add_ingredient')}
              </Button>
            }
          />
        }
      />

      {meta ? (
        <Pagination
          page={meta.current_page}
          totalPages={meta.last_page}
          onChange={setPage}
          total={meta.total}
          perPage={meta.per_page}
        />
      ) : null}

      <Modal
        open={open}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? tCommon('edit') : t('add_ingredient')}
        size="lg"
      >
        <div className="grid gap-3">
          <div className="grid grid-cols-3 gap-3">
            <FormField label={t('cols.name')} required>
              <Input
                value={form.name_uz}
                onChange={(e) => setForm({ ...form, name_uz: e.target.value })}
              />
            </FormField>
            <FormField label="RU">
              <Input
                value={form.name_ru}
                onChange={(e) => setForm({ ...form, name_ru: e.target.value })}
              />
            </FormField>
            <FormField label="EN">
              <Input
                value={form.name_en}
                onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="SKU">
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </FormField>
            <FormField label={t('cols.unit')} required>
              <Input
                placeholder="kg, l, pcs"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FormField label={t('cols.cost')}>
              <Input
                type="number"
                value={form.cost_per_unit}
                onChange={(e) => setForm({ ...form, cost_per_unit: Number(e.target.value) })}
              />
            </FormField>
            <FormField label={t('cols.current')}>
              <Input
                type="number"
                value={form.current_stock}
                onChange={(e) => setForm({ ...form, current_stock: Number(e.target.value) })}
              />
            </FormField>
            <FormField label={t('cols.min')}>
              <Input
                type="number"
                value={form.min_stock}
                onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })}
              />
            </FormField>
          </div>
          <FormField label={tCommon('active')}>
            <Switch
              checked={form.is_active}
              onChange={(checked) => setForm({ ...form, is_active: checked })}
            />
          </FormField>
          <div className="flex justify-end gap-2 mt-2">
            <Button
              variant="ghost"
              onClick={() => {
                setCreating(false);
                setEditing(null);
              }}
            >
              {tCommon('cancel')}
            </Button>
            <Button onClick={handleSave} loading={save.isPending}>
              {tCommon('save')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={adjusting !== null}
        onClose={() => setAdjusting(null)}
        title={t('adjust_title')}
        size="md"
      >
        {adjusting ? (
          <div className="grid gap-3">
            <div className="rounded-lg bg-[#eef4f3] dark:bg-[#1a2235] p-3">
              <p className="font-semibold text-[#16221f] dark:text-white">
                {adjusting.name.uz || adjusting.name.en}
              </p>
              <p className="mt-1 text-[12px] text-[#62716d] dark:text-[#94a3b8] tabular-nums">
                {t('current')}: {adjusting.current_stock.toFixed(2)} {adjusting.unit} · {t('min')}:{' '}
                {(adjusting.min_stock ?? 0).toFixed(2)}
              </p>
            </div>
            <FormField label={t('delta')} helper={t('delta_hint')}>
              <Input
                type="number"
                step="any"
                placeholder={t('delta_placeholder')}
                value={adjustState.delta}
                onChange={(e) => setAdjustState({ ...adjustState, delta: Number(e.target.value) })}
              />
            </FormField>
            <FormField label={t('reason')}>
              <Select
                value={adjustState.reason}
                onChange={(v) =>
                  setAdjustState({ ...adjustState, reason: v as StockMovementReason })
                }
                options={[
                  { value: 'purchase', label: t('reasons.purchase') },
                  { value: 'adjust', label: t('reasons.adjust') },
                  { value: 'waste', label: t('reasons.waste') },
                  { value: 'transfer', label: t('reasons.transfer') },
                ]}
              />
            </FormField>
            <FormField label={t('notes')}>
              <Textarea
                value={adjustState.notes}
                onChange={(e) => setAdjustState({ ...adjustState, notes: e.target.value })}
                rows={2}
              />
            </FormField>
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="ghost" onClick={() => setAdjusting(null)}>
                {tCommon('cancel')}
              </Button>
              <Button
                onClick={() => adjusting && adjust.mutate(adjusting.id)}
                loading={adjust.isPending}
              >
                {tCommon('save')}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
