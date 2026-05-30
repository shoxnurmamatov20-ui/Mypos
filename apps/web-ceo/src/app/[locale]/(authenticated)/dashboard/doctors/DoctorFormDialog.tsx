'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import {
  type Clinic,
  type ClinicDepartmentLite,
  type ClinicDepartmentsResponse,
  type DoctorListItem,
  type DoctorMutationResponse,
  type DoctorPayload,
  ApiError,
  ceoFetch,
  ceoMutate,
} from '@/lib/api';
import { cn } from '@/lib/cn';

type Props = {
  clinics: Clinic[];
  doctor?: DoctorListItem;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  clinic_id: number | '';
  department_id: number | '';
  name: string;
  specialty: string;
  is_active: boolean;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
  clinic_id: '',
  department_id: '',
  name: '',
  specialty: '',
  is_active: true,
};

export function DoctorFormDialog({ clinics, doctor, onClose, onSaved }: Props) {
  const t = useTranslations('doctors');
  const editing = doctor !== undefined;

  const [form, setForm] = useState<FormState>(() =>
    doctor
      ? {
          clinic_id: doctor.clinic?.id ?? '',
          department_id: doctor.department?.id ?? '',
          name: doctor.name,
          specialty: doctor.specialty ?? '',
          is_active: doctor.is_active,
        }
      : EMPTY,
  );
  const [departments, setDepartments] = useState<ClinicDepartmentLite[]>([]);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [topError, setTopError] = useState<string | null>(null);

  // Load departments whenever the clinic changes.
  useEffect(() => {
    if (form.clinic_id === '') {
      setDepartments([]);
      return;
    }
    let cancelled = false;
    ceoFetch<ClinicDepartmentsResponse>(`/api/v1/ceo/clinics/${form.clinic_id}/departments`)
      .then((res) => {
        if (cancelled) return;
        setDepartments(res.data);
        // If the loaded department list no longer contains our current
        // selection, clear it so the dropdown reflects reality.
        if (form.department_id !== '' && !res.data.some((d) => d.id === form.department_id)) {
          setForm((prev) => ({ ...prev, department_id: '' }));
        }
      })
      .catch(() => setDepartments([]));
    return () => {
      cancelled = true;
    };
  }, [form.clinic_id, form.department_id]);

  // Lock the page scroll while the modal is open.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setTopError(null);

    if (form.clinic_id === '') {
      setErrors({ clinic_id: t('error_clinic_required') });
      return;
    }
    if (form.name.trim().length < 2) {
      setErrors({ name: t('error_name_required') });
      return;
    }

    const payload: DoctorPayload = {
      clinic_id: Number(form.clinic_id),
      department_id: form.department_id === '' ? null : Number(form.department_id),
      name: form.name.trim(),
      specialty: form.specialty.trim() || null,
      is_active: form.is_active,
    };

    setBusy(true);
    try {
      if (editing && doctor) {
        await ceoMutate<DoctorMutationResponse>(
          `/api/v1/ceo/doctors/${doctor.id}`,
          'PATCH',
          payload as unknown as Record<string, unknown>,
        );
      } else {
        await ceoMutate<DoctorMutationResponse>(
          '/api/v1/ceo/doctors',
          'POST',
          payload as unknown as Record<string, unknown>,
        );
      }
      onSaved();
    } catch (e) {
      const err = e as ApiError;
      const body = err.body as
        | { message?: string; errors?: Record<string, string[]> }
        | null;
      if (body?.errors) {
        const next: FieldErrors = {};
        for (const [k, msgs] of Object.entries(body.errors)) {
          (next as Record<string, string>)[k] = msgs[0] ?? '';
        }
        setErrors(next);
      }
      setTopError(body?.message ?? t('error_save'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#111827] shadow-2xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-[15px] font-bold text-[#16221f] dark:text-white">
            {editing ? t('edit_title') : t('add_title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#62716d] hover:text-[#16221f] dark:text-[#94a3b8] dark:hover:text-white p-1 -m-1 rounded"
            aria-label={t('close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {topError ? (
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-3 py-2.5 text-[12px] text-[#b42318] dark:text-red-300">
              {topError}
            </div>
          ) : null}

          <Field
            label={t('field_clinic')}
            error={errors.clinic_id}
            required
          >
            <select
              value={form.clinic_id}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  clinic_id: e.target.value === '' ? '' : Number(e.target.value),
                  department_id: '',
                }))
              }
              className={inputClass(!!errors.clinic_id)}
              required
            >
              <option value="">{t('field_clinic_placeholder')}</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('field_department')} error={errors.department_id}>
            <select
              value={form.department_id}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  department_id: e.target.value === '' ? '' : Number(e.target.value),
                }))
              }
              disabled={form.clinic_id === '' || departments.length === 0}
              className={inputClass(!!errors.department_id)}
            >
              <option value="">{t('field_department_placeholder')}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('field_name')} error={errors.name} required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass(!!errors.name)}
              required
              minLength={2}
              maxLength={255}
              placeholder={t('field_name_placeholder')}
            />
          </Field>

          <Field label={t('field_specialty')} error={errors.specialty}>
            <input
              type="text"
              value={form.specialty}
              onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
              className={inputClass(!!errors.specialty)}
              maxLength={255}
              placeholder={t('field_specialty_placeholder')}
            />
          </Field>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-[13px] text-[#16221f] dark:text-white">{t('field_active')}</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-9 px-3.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0b1120] text-[13px] font-semibold text-[#16221f] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-colors disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={busy}
            className={cn(
              'h-9 px-4 rounded-lg text-[13px] font-semibold transition-colors active:scale-95',
              'bg-emerald-600 text-white hover:bg-emerald-700',
              busy && 'opacity-60 cursor-wait',
            )}
          >
            {busy ? t('saving') : editing ? t('save') : t('create')}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8] mb-1.5">
        {label}
        {required ? <span className="text-red-500 ml-0.5">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[11px] text-[#b42318] dark:text-red-300">{error}</p>
      ) : null}
    </div>
  );
}

function inputClass(hasError: boolean): string {
  return cn(
    'w-full h-9 px-3 rounded-lg border bg-white dark:bg-[#0b1120] text-[13px] text-[#16221f] dark:text-white placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed',
    hasError
      ? 'border-red-300 dark:border-red-700 focus:ring-red-500/40'
      : 'border-gray-200 dark:border-gray-700 focus:ring-emerald-500/40',
  );
}
