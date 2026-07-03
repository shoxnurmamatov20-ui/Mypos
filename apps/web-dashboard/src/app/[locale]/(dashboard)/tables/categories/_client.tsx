'use client';

import { type CreateTableCategoryInput, type TableCategory, tablesApi } from '@mypos/api-client';
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
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

interface FormState {
  name_uz: string;
  name_ru: string;
  name_en: string;
  sort_order: number;
  is_active: boolean;
}

const EMPTY: FormState = {
  name_uz: '',
  name_ru: '',
  name_en: '',
  sort_order: 0,
  is_active: true,
};

export function TableCategoriesClient() {
  const t = useTranslations('tables');
  const tCommon = useTranslations('common');
  const tSide = useTranslations('sidebar');
  const qc = useQueryClient();
  const [editing, setEditing] = useState<TableCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ['table-categories'],
    queryFn: () => tablesApi.categories.list(apiClient),
  });

  const save = useMutation({
    mutationFn: async (input: CreateTableCategoryInput) => {
      if (editing) return tablesApi.categories.update(apiClient, editing.id, input);
      return tablesApi.categories.create(apiClient, input);
    },
    onSuccess: () => {
      toast.success(editing ? t('updated') : t('created'));
      qc.invalidateQueries({ queryKey: ['table-categories'] });
      setEditing(null);
      setCreating(false);
      setForm(EMPTY);
    },
    onError: () => toast.error(t('save_failed')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => tablesApi.categories.delete(apiClient, id),
    onSuccess: () => {
      toast.success(t('deleted'));
      qc.invalidateQueries({ queryKey: ['table-categories'] });
    },
    onError: () => toast.error(t('delete_failed')),
  });

  const openCreate = () => {
    setForm(EMPTY);
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (c: TableCategory) => {
    setForm({
      name_uz: c.name.uz ?? '',
      name_ru: c.name.ru ?? '',
      name_en: c.name.en ?? '',
      sort_order: c.sort_order ?? 0,
      is_active: c.is_active,
    });
    setEditing(c);
    setCreating(false);
  };

  const handleSave = () =>
    save.mutate({
      name: { uz: form.name_uz, ru: form.name_ru, en: form.name_en },
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    });

  const handleDelete = (c: TableCategory) => {
    if (window.confirm(t('confirm_delete_category', { name: c.name.uz || c.name.en }))) {
      remove.mutate(c.id);
    }
  };

  const rows = data?.data ?? [];
  const open = creating || editing !== null;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={tSide('table_categories')}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            {t('add_category')}
          </Button>
        }
      />

      <FilterBar>
        <div className="ml-auto text-[12px] text-[#62716d] dark:text-[#94a3b8] tabular-nums">
          {rows.length}
        </div>
      </FilterBar>

      <DataTable
        loading={isLoading}
        columns={[
          {
            id: 'name',
            header: t('name_uz'),
            cell: (c: TableCategory) => (
              <div>
                <p className="font-semibold">{c.name.uz || c.name.en}</p>
                <p className="text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                  {c.name.ru} / {c.name.en}
                </p>
              </div>
            ),
          },
          {
            id: 'tables',
            header: t('tables_count_suffix'),
            cell: (c: TableCategory) => (
              <span className="tabular-nums">{c.tables_count ?? '—'}</span>
            ),
            align: 'right',
          },
          {
            id: 'sort',
            header: t('sort_order'),
            cell: (c: TableCategory) => <span className="tabular-nums">{c.sort_order}</span>,
            align: 'right',
          },
          {
            id: 'status',
            header: t('is_active'),
            cell: (c: TableCategory) => (
              <Badge variant={c.is_active ? 'success' : 'secondary'}>
                {c.is_active ? tCommon('active') : tCommon('inactive')}
              </Badge>
            ),
          },
          {
            id: 'actions',
            header: tCommon('actions'),
            cell: (c: TableCategory) => (
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
            <Input
              value={form.name_uz}
              onChange={(e) => setForm({ ...form, name_uz: e.target.value })}
            />
          </FormField>
          <FormField label={t('name_ru')}>
            <Input
              value={form.name_ru}
              onChange={(e) => setForm({ ...form, name_ru: e.target.value })}
            />
          </FormField>
          <FormField label={t('name_en')}>
            <Input
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
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
            <Button onClick={handleSave} loading={save.isPending}>
              {tCommon('save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
