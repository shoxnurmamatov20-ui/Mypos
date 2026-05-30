'use client';

import { ApiError, customersApi, type Customer } from '@mypos/api-client';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api';

export function CustomerFormDialog({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations('customers');
  const isEdit = customer !== null;

  const [firstName, setFirstName] = useState(customer?.first_name ?? '');
  const [lastName, setLastName] = useState(customer?.last_name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '+998');
  const [email, setEmail] = useState(customer?.email ?? '');
  const [birthday, setBirthday] = useState(customer?.birthday ?? '');
  const [locale, setLocale] = useState<'uz' | 'ru' | 'en'>((customer?.locale as 'uz' | 'ru' | 'en') ?? 'uz');
  const [gender, setGender] = useState<'' | 'male' | 'female' | 'other'>(
    (customer?.gender as 'male' | 'female' | 'other' | null) ?? '',
  );
  const [tagsText, setTagsText] = useState(customer?.tags.join(', ') ?? '');
  const [notes, setNotes] = useState(customer?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tags = tagsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        phone: phone.trim(),
        email: email.trim() || null,
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        birthday: birthday || null,
        locale,
        gender: gender || null,
        tags,
        notes: notes.trim() || null,
      };
      if (isEdit && customer) {
        await customersApi.update(apiClient, customer.id, payload);
        toast.success(t('updated'));
      } else {
        await customersApi.create(apiClient, payload);
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
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white dark:bg-[#111827] p-6 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-semibold text-[#16221f] dark:text-white">
          {isEdit ? t('edit_customer') : t('add_customer')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('first_name')}>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                maxLength={64}
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2"
              />
            </Field>
            <Field label={t('last_name')}>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={64}
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('phone')}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                maxLength={32}
                placeholder="+998901234567"
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2"
              />
            </Field>
            <Field label={t('email')}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={128}
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2"
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label={t('birthday')}>
              <input
                type="date"
                value={birthday ?? ''}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2"
              />
            </Field>
            <Field label={t('locale')}>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as 'uz' | 'ru' | 'en')}
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2"
              >
                <option value="uz">O&apos;zbek</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </Field>
            <Field label={t('gender')}>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other' | '')}
                className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2"
              >
                <option value="">—</option>
                <option value="male">{t('gender_male')}</option>
                <option value="female">{t('gender_female')}</option>
                <option value="other">{t('gender_other')}</option>
              </select>
            </Field>
          </div>
          <Field label={t('tags')}>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="VIP, regular"
              className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2"
            />
          </Field>
          <Field label={t('notes')}>
            <textarea
              value={notes ?? ''}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              className="w-full rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[#16221f] dark:text-white px-3 py-2"
            />
          </Field>
          <div className="flex justify-end gap-2 border-t border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] px-4 py-2 text-sm font-medium text-[#16221f] dark:text-[#e2e8f0] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-[#0f766e] hover:bg-[#0d5e58] dark:bg-[#14b8a6] dark:hover:bg-[#0d9488] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
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
      <span className="mb-1 block text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">{label}</span>
      {children}
    </label>
  );
}
