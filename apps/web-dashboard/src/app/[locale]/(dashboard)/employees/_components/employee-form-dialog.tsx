'use client';

import {
  ApiError,
  employeesApi,
  type Employee,
  type EmployeePosition,
  type EmployeeStatus,
} from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

const POSITIONS: EmployeePosition[] = ['manager', 'cashier', 'waiter', 'chef', 'courier'];
const STATUSES: EmployeeStatus[] = ['active', 'on_leave', 'terminated'];

export function EmployeeFormDialog({
  employee,
  onClose,
  onSaved,
}: {
  employee: Employee | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('employees');
  const isEdit = employee !== null;

  const [name, setName] = useState(employee?.user?.name ?? '');
  const [email, setEmail] = useState(employee?.user?.email ?? '');
  const [phone, setPhone] = useState(employee?.user?.phone ?? '');
  const [password, setPassword] = useState('');
  const [employeeCode, setEmployeeCode] = useState(employee?.employee_code ?? '');
  const [position, setPosition] = useState<EmployeePosition>(
    (employee?.position.value as EmployeePosition | undefined) ?? 'cashier',
  );
  const [hireDate, setHireDate] = useState(
    employee?.hire_date ?? new Date().toISOString().slice(0, 10),
  );
  const [status, setStatus] = useState<EmployeeStatus>(
    employee?.status.value ?? 'active',
  );
  const [baseSalary, setBaseSalary] = useState<number>(employee?.base_salary ?? 0);
  const [hourlyRate, setHourlyRate] = useState<number>(employee?.hourly_rate ?? 0);
  const [notes, setNotes] = useState(employee?.notes ?? '');
  const [emergencyContact, setEmergencyContact] = useState(employee?.emergency_contact ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit && employee) {
        await employeesApi.update(apiClient, employee.id, {
          employee_code: employeeCode || undefined,
          position,
          hire_date: hireDate,
          status,
          base_salary: baseSalary || null,
          hourly_rate: hourlyRate || null,
          notes: notes || null,
          emergency_contact: emergencyContact || null,
          user_data: {
            name: name || undefined,
            phone: phone || null,
          },
        });
        toast.success(t('updated'));
      } else {
        await employeesApi.create(apiClient, {
          user_data: {
            name,
            email,
            phone: phone || null,
            password,
          },
          employee_code: employeeCode || null,
          position,
          hire_date: hireDate,
          status,
          base_salary: baseSalary || null,
          hourly_rate: hourlyRate || null,
          notes: notes || null,
          emergency_contact: emergencyContact || null,
        });
        toast.success(t('created'));
      }
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        toast.error(body?.message ?? t('save_failed'));
      } else {
        toast.error(t('save_failed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-neutral-900">
          {isEdit ? t('edit_employee') : t('add_employee')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('fields.name')}>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                required maxLength={128}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
            </Field>
            <Field label={t('fields.email')}>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                required={!isEdit} disabled={isEdit} maxLength={128}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 disabled:bg-neutral-50" />
            </Field>
            <Field label={t('fields.phone')}>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                maxLength={32}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
            </Field>
            {!isEdit && (
              <Field label={t('fields.password')}>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required minLength={8} maxLength={128}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
              </Field>
            )}
            <Field label={t('fields.employee_code')}>
              <input type="text" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)}
                maxLength={32} placeholder={t('fields.employee_code_auto')}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
            </Field>
            <Field label={t('fields.position')}>
              <select value={position} onChange={(e) => setPosition(e.target.value as EmployeePosition)}
                required
                className="w-full rounded-lg border border-neutral-300 px-3 py-2">
                {POSITIONS.map((p) => (
                  <option key={p} value={p}>{t(`position.${p}`)}</option>
                ))}
              </select>
            </Field>
            <Field label={t('fields.hire_date')}>
              <input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)}
                required
                className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
            </Field>
            <Field label={t('fields.status')}>
              <select value={status} onChange={(e) => setStatus(e.target.value as EmployeeStatus)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{t(`status.${s}`)}</option>
                ))}
              </select>
            </Field>
            <Field label={t('fields.base_salary')}>
              <input type="number" value={baseSalary} onChange={(e) => setBaseSalary(Number(e.target.value))}
                min={0} step={1000}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
            </Field>
            <Field label={t('fields.hourly_rate')}>
              <input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))}
                min={0} step={1000}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
            </Field>
            <Field label={t('fields.emergency_contact')}>
              <input type="text" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)}
                maxLength={128}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
            </Field>
          </div>
          <Field label={t('fields.notes')}>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={2} maxLength={2000}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2" />
          </Field>
          <div className="flex justify-end gap-2 border-t border-neutral-200 pt-4">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              {t('cancel')}
            </button>
            <button type="submit" disabled={submitting}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
              {submitting ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  );
}
