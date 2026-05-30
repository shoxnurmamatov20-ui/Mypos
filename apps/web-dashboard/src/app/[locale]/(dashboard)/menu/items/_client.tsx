'use client';

import {
  menuApi,
  type CreateMenuItemInput,
  type MenuCategory,
  type MenuItem,
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
  Switch,
  Textarea,
} from '@mypos/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

interface FormState {
  category_id: string;
  name_uz: string;
  name_ru: string;
  name_en: string;
  description_uz: string;
  description_ru: string;
  description_en: string;
  price_amount: number;
  sku: string;
  image_url: string;
  is_active: boolean;
  is_featured: boolean;
  is_new: boolean;
  has_discount: boolean;
  discount_percent: number;
  sort_order: number;
}

const EMPTY: FormState = {
  category_id: '',
  name_uz: '',
  name_ru: '',
  name_en: '',
  description_uz: '',
  description_ru: '',
  description_en: '',
  price_amount: 0,
  sku: '',
  image_url: '',
  is_active: true,
  is_featured: false,
  is_new: false,
  has_discount: false,
  discount_percent: 0,
  sort_order: 0,
};

export function MenuItemsClient() {
  const t = useTranslations('menu');
  const tCommon = useTranslations('common');
  const tSide = useTranslations('sidebar');
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const { data: catData } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: () => menuApi.categories.list(apiClient),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['menu-items', { search, categoryId, page }],
    queryFn: () =>
      menuApi.items.list(apiClient, {
        per_page: 20,
        ...(search ? { q: search } : {}),
        ...(categoryId ? { category_id: categoryId } : {}),
      }),
  });

  const create = useMutation({
    mutationFn: (input: CreateMenuItemInput) => menuApi.items.create(apiClient, input),
    onSuccess: () => {
      toast.success(t('created'));
      qc.invalidateQueries({ queryKey: ['menu-items'] });
      setCreating(false);
      setForm(EMPTY);
    },
    onError: () => toast.error(t('save_failed')),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateMenuItemInput }) =>
      menuApi.items.update(apiClient, id, input),
    onSuccess: () => {
      toast.success(t('updated'));
      qc.invalidateQueries({ queryKey: ['menu-items'] });
      setEditing(null);
      setForm(EMPTY);
    },
    onError: () => toast.error(t('save_failed')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => menuApi.items.delete(apiClient, id),
    onSuccess: () => {
      toast.success(t('deleted'));
      qc.invalidateQueries({ queryKey: ['menu-items'] });
    },
    onError: () => toast.error(t('delete_failed')),
  });

  const categories = catData?.data ?? [];
  const items = data?.data ?? [];
  const meta = data?.meta;

  const catOptions = useMemo(
    () => [
      { value: '', label: t('category') },
      ...categories.map((c: MenuCategory) => ({
        value: c.id,
        label: c.name.uz || c.name.en || c.slug,
      })),
    ],
    [categories, t],
  );

  const openCreate = () => {
    setForm({ ...EMPTY, category_id: categories[0]?.id ?? '' });
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (item: MenuItem) => {
    setForm({
      category_id: item.category_id,
      name_uz: item.name.uz ?? '',
      name_ru: item.name.ru ?? '',
      name_en: item.name.en ?? '',
      description_uz: item.description?.uz ?? '',
      description_ru: item.description?.ru ?? '',
      description_en: item.description?.en ?? '',
      price_amount: item.price.amount,
      sku: item.sku ?? '',
      image_url: item.image_url ?? '',
      is_active: item.is_active,
      is_featured: item.is_featured,
      is_new: item.is_new,
      has_discount: item.has_discount,
      discount_percent: item.discount_percent ?? 0,
      sort_order: item.sort_order ?? 0,
    });
    setEditing(item);
    setCreating(false);
  };

  const handleSave = () => {
    const input: CreateMenuItemInput = {
      category_id: form.category_id,
      name: { uz: form.name_uz, ru: form.name_ru, en: form.name_en },
      description: form.description_uz || form.description_en
        ? { uz: form.description_uz, ru: form.description_ru, en: form.description_en }
        : null,
      price_amount: Number(form.price_amount) || 0,
      sku: form.sku || null,
      image_url: form.image_url || null,
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_new: form.is_new,
      has_discount: form.has_discount,
      discount_percent: form.has_discount ? Number(form.discount_percent) || 0 : null,
      sort_order: Number(form.sort_order) || 0,
    };
    if (editing) update.mutate({ id: editing.id, input });
    else create.mutate(input);
  };

  const handleDelete = (item: MenuItem) => {
    if (window.confirm(t('confirm_delete_item', { name: item.name.uz || item.name.en }))) {
      remove.mutate(item.id);
    }
  };

  const open = creating || editing !== null;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={tSide('menu_items')}
        description={t('subtitle')}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            {t('add_item')}
          </Button>
        }
      />

      <FilterBar>
        <Input
          placeholder={tCommon('search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select
          value={categoryId}
          onChange={setCategoryId}
          options={catOptions}
          className="max-w-xs"
        />
        {meta ? (
          <div className="ml-auto text-[12px] text-[#62716d] dark:text-[#94a3b8] tabular-nums">
            {meta.total} {t('items_count_suffix')}
          </div>
        ) : null}
      </FilterBar>

      <DataTable
        loading={isLoading}
        columns={[
          {
            id: 'image',
            header: '',
            cell: (m: MenuItem) =>
              m.thumbnail_url || m.image_url ? (
                <img
                  src={m.thumbnail_url || m.image_url || ''}
                  alt=""
                  className="h-9 w-9 rounded-md object-cover"
                />
              ) : (
                <div className="h-9 w-9 rounded-md bg-[#eef4f3] dark:bg-[#1a2235] flex items-center justify-center text-[#62716d] dark:text-[#94a3b8]">
                  <UtensilsCrossed className="h-4 w-4" />
                </div>
              ),
            width: '60px',
          },
          {
            id: 'name',
            header: t('name_uz'),
            cell: (m: MenuItem) => (
              <div>
                <p className="font-semibold">{m.name.uz || m.name.en}</p>
                <p className="text-[11px] text-[#62716d] dark:text-[#94a3b8]">{m.sku ?? '—'}</p>
              </div>
            ),
          },
          {
            id: 'category',
            header: t('category'),
            cell: (m: MenuItem) => {
              const c = categories.find((cat) => cat.id === m.category_id);
              return <span className="text-[12px]">{c?.name.uz || c?.name.en || '—'}</span>;
            },
          },
          {
            id: 'price',
            header: t('price_uzs'),
            cell: (m: MenuItem) => (
              <span className="tabular-nums font-semibold">
                {m.price.effective_amount.toLocaleString('uz-UZ')}
              </span>
            ),
            align: 'right',
          },
          {
            id: 'flags',
            header: '',
            cell: (m: MenuItem) => (
              <div className="flex gap-1">
                {m.is_new && <Badge variant="info">{t('new')}</Badge>}
                {m.is_featured && <Badge variant="teal">★</Badge>}
                {m.has_discount && <Badge variant="warning">-{m.discount_percent}%</Badge>}
              </div>
            ),
          },
          {
            id: 'status',
            header: t('is_active'),
            cell: (m: MenuItem) => (
              <Badge variant={m.is_active ? 'success' : 'secondary'}>
                {m.is_active ? tCommon('active') : tCommon('inactive')}
              </Badge>
            ),
          },
          {
            id: 'actions',
            header: tCommon('actions'),
            cell: (m: MenuItem) => (
              <div className="flex items-center gap-1 justify-end">
                <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(m)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
            align: 'right',
          },
        ]}
        rows={items}
        rowKey={(m) => m.id}
        empty={
          <EmptyState
            icon={<UtensilsCrossed className="h-6 w-6" />}
            title={t('empty_items')}
            description={categories.length === 0 ? t('need_category_first') : undefined}
            action={
              categories.length > 0 ? (
                <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                  {t('add_item')}
                </Button>
              ) : null
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
        title={editing ? t('edit_item') : t('add_item')}
        size="lg"
      >
        <div className="grid gap-3">
          <FormField label={t('category')} required>
            <Select
              value={form.category_id}
              onChange={(v) => setForm({ ...form, category_id: v })}
              options={categories.map((c) => ({
                value: c.id,
                label: c.name.uz || c.name.en || c.slug,
              }))}
            />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label={t('name_uz')} required>
              <Input value={form.name_uz} onChange={(e) => setForm({ ...form, name_uz: e.target.value })} />
            </FormField>
            <FormField label={t('name_ru')}>
              <Input value={form.name_ru} onChange={(e) => setForm({ ...form, name_ru: e.target.value })} />
            </FormField>
            <FormField label={t('name_en')}>
              <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
            </FormField>
          </div>
          <FormField label={t('description_uz')}>
            <Textarea
              value={form.description_uz}
              onChange={(e) => setForm({ ...form, description_uz: e.target.value })}
              rows={2}
            />
          </FormField>
          <div className="grid grid-cols-3 gap-3">
            <FormField label={t('price_uzs')} required>
              <Input
                type="number"
                value={form.price_amount}
                onChange={(e) => setForm({ ...form, price_amount: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="SKU">
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </FormField>
            <FormField label={t('sort_order')}>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </FormField>
          </div>
          <FormField label={t('image_url')}>
            <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('is_active')}>
              <Switch
                checked={form.is_active}
                onChange={(checked) => setForm({ ...form, is_active: checked })}
              />
            </FormField>
            <FormField label={t('is_featured')}>
              <Switch
                checked={form.is_featured}
                onChange={(checked) => setForm({ ...form, is_featured: checked })}
              />
            </FormField>
            <FormField label={t('is_new')}>
              <Switch
                checked={form.is_new}
                onChange={(checked) => setForm({ ...form, is_new: checked })}
              />
            </FormField>
            <FormField label={t('has_discount')}>
              <Switch
                checked={form.has_discount}
                onChange={(checked) => setForm({ ...form, has_discount: checked })}
              />
            </FormField>
          </div>
          {form.has_discount && (
            <FormField label="%">
              <Input
                type="number"
                value={form.discount_percent}
                onChange={(e) => setForm({ ...form, discount_percent: Number(e.target.value) })}
              />
            </FormField>
          )}
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
            <Button onClick={handleSave} loading={create.isPending || update.isPending}>
              {tCommon('save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
