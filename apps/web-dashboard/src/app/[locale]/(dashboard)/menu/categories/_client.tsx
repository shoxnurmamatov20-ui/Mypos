'use client';

import { menuApi, type CreateMenuCategoryInput, type MenuCategory } from '@mypos/api-client';
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
  Switch,
} from '@mypos/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

interface FormState {
  name_uz: string;
  name_ru: string;
  name_en: string;
  color: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

const EMPTY: FormState = {
  name_uz: '',
  name_ru: '',
  name_en: '',
  color: '',
  icon: '',
  sort_order: 0,
  is_active: true,
};

export function MenuCategoriesClient() {
  const t = useTranslations('menu');
  const tCommon = useTranslations('common');
  const tSide = useTranslations('sidebar');
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<MenuCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ['menu-categories'],
    queryFn: () => menuApi.categories.list(apiClient),
  });

  const create = useMutation({
    mutationFn: (input: CreateMenuCategoryInput) => menuApi.categories.create(apiClient, input),
    onSuccess: () => {
      toast.success(t('created'));
      qc.invalidateQueries({ queryKey: ['menu-categories'] });
      setCreating(false);
      setForm(EMPTY);
    },
    onError: () => toast.error(t('save_failed')),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CreateMenuCategoryInput }) =>
      menuApi.categories.update(apiClient, id, input),
    onSuccess: () => {
      toast.success(t('updated'));
      qc.invalidateQueries({ queryKey: ['menu-categories'] });
      setEditing(null);
      setForm(EMPTY);
    },
    onError: () => toast.error(t('save_failed')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => menuApi.categories.delete(apiClient, id),
    onSuccess: () => {
      toast.success(t('deleted'));
      qc.invalidateQueries({ queryKey: ['menu-categories'] });
    },
    onError: () => toast.error(t('delete_failed')),
  });

  const rows = useMemo(() => {
    const all = data?.data ?? [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(
      (c) =>
        c.name.uz?.toLowerCase().includes(q) ||
        c.name.ru?.toLowerCase().includes(q) ||
        c.name.en?.toLowerCase().includes(q),
    );
  }, [data?.data, search]);

  const openCreate = () => {
    setForm(EMPTY);
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (cat: MenuCategory) => {
    setForm({
      name_uz: cat.name.uz ?? '',
      name_ru: cat.name.ru ?? '',
      name_en: cat.name.en ?? '',
      color: cat.color ?? '',
      icon: cat.icon ?? '',
      sort_order: cat.sort_order ?? 0,
      is_active: cat.is_active,
    });
    setEditing(cat);
    setCreating(false);
  };

  const handleSave = () => {
    const input: CreateMenuCategoryInput = {
      name: { uz: form.name_uz, ru: form.name_ru, en: form.name_en },
      color: form.color || null,
      icon: form.icon || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };
    if (editing) {
      update.mutate({ id: editing.id, input });
    } else {
      create.mutate(input);
    }
  };

  const handleDelete = (cat: MenuCategory) => {
    if (window.confirm(t('confirm_delete_category', { name: cat.name.uz || cat.name.en }))) {
      remove.mutate(cat.id);
    }
  };

  const open = creating || editing !== null;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={tSide('menu_categories')}
        description={t('subtitle')}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            {t('add_category')}
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
        <div className="ml-auto text-[12px] text-[#62716d] dark:text-[#94a3b8] tabular-nums">
          {rows.length} / {data?.data.length ?? 0}
        </div>
      </FilterBar>

      <DataTable
        loading={isLoading}
        columns={[
          {
            id: 'color',
            header: '',
            cell: (c: MenuCategory) => (
              <span
                aria-hidden
                className="inline-block h-6 w-6 rounded-md"
                style={{ background: c.color ?? '#0f766e' }}
              />
            ),
            width: '40px',
          },
          {
            id: 'name',
            header: t('name_uz'),
            cell: (c: MenuCategory) => (
              <div>
                <p className="font-semibold">{c.name.uz || c.name.en}</p>
                <p className="text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                  {c.name.ru} / {c.name.en}
                </p>
              </div>
            ),
          },
          {
            id: 'items',
            header: t('items_count_suffix'),
            cell: (c: MenuCategory) => (
              <span className="tabular-nums">{c.items_count ?? '—'}</span>
            ),
            align: 'right',
          },
          {
            id: 'sort',
            header: t('sort_order'),
            cell: (c: MenuCategory) => <span className="tabular-nums">{c.sort_order}</span>,
            align: 'right',
          },
          {
            id: 'status',
            header: t('is_active'),
            cell: (c: MenuCategory) => (
              <Badge variant={c.is_active ? 'success' : 'secondary'}>
                {c.is_active ? tCommon('active') : tCommon('inactive')}
              </Badge>
            ),
          },
          {
            id: 'actions',
            header: tCommon('actions'),
            cell: (c: MenuCategory) => (
              <div className="flex items-center gap-1 justify-end">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(c)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
            align: 'right',
          },
        ]}
        rows={rows}
        rowKey={(c) => c.id}
        empty={
          <EmptyState
            icon={<Tag className="h-6 w-6" />}
            title={t('empty_categories')}
            action={
              <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
                {t('add_category')}
              </Button>
            }
          />
        }
      />

      <Modal
        open={open}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? t('edit_category') : t('add_category')}
        size="md"
      >
        <div className="grid gap-3">
          <FormField label={t('name_uz')} required>
            <Input value={form.name_uz} onChange={(e) => setForm({ ...form, name_uz: e.target.value })} />
          </FormField>
          <FormField label={t('name_ru')}>
            <Input value={form.name_ru} onChange={(e) => setForm({ ...form, name_ru: e.target.value })} />
          </FormField>
          <FormField label={t('name_en')}>
            <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('color')}>
              <Input
                type="color"
                value={form.color || '#0f766e'}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-9 p-1"
              />
            </FormField>
            <FormField label={t('icon')}>
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-3 items-end">
            <FormField label={t('sort_order')}>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </FormField>
            <FormField label={t('is_active')}>
              <Switch
                checked={form.is_active}
                onChange={(checked) => setForm({ ...form, is_active: checked })}
              />
            </FormField>
          </div>
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
