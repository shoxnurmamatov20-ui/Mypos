'use client';

import { type EmployeePosition, employeesApi } from '@mypos/api-client';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';

const STATUS_TONE: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  on_leave: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  terminated: 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400',
};

type Props = {
  title: string;
  description: string;
  position: EmployeePosition;
};

export function StaffPositionView({ title, description, position }: Props) {
  const t = useTranslations('inventory'); // reuse simple labels (loading, empty)
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: ['employees', 'list', position, search],
    queryFn: () =>
      employeesApi.list(apiClient, {
        position,
        q: search.trim() || undefined,
        per_page: 100,
      }),
    refetchInterval: 60_000,
  });

  const employees = query.data?.data ?? [];
  const activeCount = employees.filter((e) => e.status?.value === 'active').length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-[#16221f] dark:text-white">
          {title}
        </h1>
        <p className="mt-1 text-[13px] text-[#62716d] dark:text-[#94a3b8]">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Jami" value={employees.length.toString()} />
        <StatCard label="Faol" value={activeCount.toString()} />
        <StatCard label="Faol emas" value={(employees.length - activeCount).toString()} />
      </div>

      <div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Qidirish — ism, telefon, email…"
          className="w-full max-w-sm rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-3 py-2 text-sm text-[#16221f] outline-none transition-colors focus:border-[#0f766e] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white"
        />
      </div>

      {query.isLoading ? (
        <p className="text-sm text-[#62716d] dark:text-[#94a3b8]">{t('coming_soon')}…</p>
      ) : employees.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[rgba(22,34,31,0.09)] bg-white py-12 text-center dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
          <p className="text-sm text-[#62716d] dark:text-[#94a3b8]">
            Bu lavozimda hozircha xodim yo'q
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[rgba(22,34,31,0.09)] bg-white dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Xodim</th>
                <th className="px-4 py-2.5 font-medium">Telefon</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
              {employees.map((emp) => {
                const status = emp.status?.value ?? 'active';
                const tone = STATUS_TONE[status] ?? STATUS_TONE.terminated;
                return (
                  <tr key={emp.id} className="hover:bg-[#fafcfb] dark:hover:bg-[#0b1120]/40">
                    <td className="px-4 py-2.5 text-[#16221f] dark:text-white">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-[#eef4f3] text-xs font-semibold text-[#0f766e] dark:bg-[#1a2235] dark:text-teal-400">
                          {initials(emp.user?.name ?? '?')}
                        </div>
                        <span className="font-medium">{emp.user?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8] tabular-nums">
                      {emp.user?.phone ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">
                      {emp.user?.email ?? '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
                        {emp.status?.label ?? status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[rgba(22,34,31,0.09)] bg-white px-4 py-3 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      <p className="text-xs text-[#62716d] dark:text-[#94a3b8]">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-[#16221f] dark:text-white">
        {value}
      </p>
    </div>
  );
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
