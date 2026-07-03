'use client';

import { type IngredientCategory, inventoryApi } from '@mypos/api-client';
import {
  Button,
  DataTable,
  EmptyState,
  FilterBar,
  FormField,
  Input,
  Modal,
  PageHeader,
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
}

const EMPTY: FormState = { name_uz: '', name_ru: '', name_en: '', sort_order: 0 };

export function InventoryCategoriesClient() {
  const tCommon = useTranslations('common');
  const tSide = useTranslations('sidebar');
  const qc = useQueryClient();
  const [editing, setEditing] = useState<IngredientCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);

  const { data, isLoading } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: () => inventoryApi.categories.list(apiClient),
  });

  const save = useMutation({
    mutationFn: async () => {
      const input = {
        name: { uz: form.name_uz, ru: form.name_ru, en: form.name_en },
        sort_order: Number(form.sort_order) || 0,
      };
      if (editing) return inventoryApi.categories.update(apiClient, editing.id, input);
      return inventoryApi.categories.create(apiClient, input);
    },
    onSuccess: () => {
      toast.success(editing ? tCommon('updated') : tCommon('created'));
      qc.invalidateQueries({ queryKey: ['inventory-categories'] });
      setEditing(null);
      setCreating(false);
      setForm(EMPTY);
    },
    onError: () => toast.error(tCommon('error')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => inventoryApi.categories.delete(apiClient, id),
    onSuccess: () => {
      toast.success(tCommon('deleted'));
      qc.invalidateQueries({ queryKey: ['inventory-categories'] });
    },
    onError: () => toast.error(tCommon('error')),
  });

  const openEdit = (c: IngredientCategory) => {
    setForm({
      name_uz: c.name.uz ?? '',
      name_ru: c.name.ru ?? '',
      name_en: c.name.en ?? '',
      sort_order: c.sort_order ?? 0,
    });
    setEditing(c);
  };

  const rows = data?.data ?? [];
  const open = creating || editing !== null;

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title={tSide('inventory_categories')}
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setForm(EMPTY);
              setCreating(true);
            }}
          >
            {tCommon('new')}
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
            header: 'Name',
            cell: (c: IngredientCategory) => (
              <div>
                <p className="font-semibold">{c.name.uz || c.name.en}</p>
                <p className="text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                  {c.name.ru} / {c.name.en}
                </p>
              </div>
            ),
          },
          {
            id: 'sort',
            header: 'Sort',
            cell: (c: IngredientCategory) => <span className="tabular-nums">{c.sort_order}</span>,
            align: 'right',
          },
          {
            id: 'actions',
            header: tCommon('actions'),
            cell: (c: IngredientCategory) => (
              <div className="flex items-center gap-1 justify-end">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (window.confirm(tCommon('confirm'))) remove.mutate(c.id);
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
        rowKey={(c) => c.id}
        empty={<EmptyState icon={<Tag className="h-6 w-6" />} title="No categories" />}
      />

      <Modal
        open={open}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? tCommon('edit') : tCommon('new')}
        size="md"
      >
        <div className="grid gap-3">
          <FormField label="Name (UZ)" required>
            <Input
              value={form.name_uz}
              onChange={(e) => setForm({ ...form, name_uz: e.target.value })}
            />
          </FormField>
          <FormField label="Name (RU)">
            <Input
              value={form.name_ru}
              onChange={(e) => setForm({ ...form, name_ru: e.target.value })}
            />
          </FormField>
          <FormField label="Name (EN)">
            <Input
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
            />
          </FormField>
          <FormField label="Sort order">
            <Input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
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
            <Button onClick={() => save.mutate()} loading={save.isPending}>
              {tCommon('save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
