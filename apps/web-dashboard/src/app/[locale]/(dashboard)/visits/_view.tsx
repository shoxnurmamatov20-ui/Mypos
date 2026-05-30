'use client';

import { customersApi } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';

export function VisitsView() {
  const t = useTranslations('sidebar');
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: ['customers', 'visits', search],
    queryFn: () =>
      customersApi.list(apiClient, {
        q: search.trim() || undefined,
        per_page: 100,
      }),
    refetchInterval: 60_000,
  });

  const customers = query.data?.data ?? [];
  const total = customers.length;
  const loyaltyTotal = customers.reduce(
    (sum, c) => sum + (c.loyalty_account?.points_balance ?? 0),
    0,
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-semibold tracking-tight text-[#16221f] dark:text-white">
          {t('visits')}
        </h1>
        <p className="mt-1 text-[13px] text-[#62716d] dark:text-[#94a3b8]">
          {t('staff_descriptions.visits')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Jami mehmonlar" value={total.toString()} />
        <StatCard label="Loyalty balansi" value={formatUZS(loyaltyTotal)} />
        <StatCard
          label="Telefon bilan"
          value={customers.filter((c) => c.phone).length.toString()}
        />
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
        <p className="text-sm text-[#62716d] dark:text-[#94a3b8]">Yuklanmoqda…</p>
      ) : customers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[rgba(22,34,31,0.09)] bg-white py-12 text-center dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
          <p className="text-sm text-[#62716d] dark:text-[#94a3b8]">
            Hozircha tashrif buyurgan mijoz yo'q
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[rgba(22,34,31,0.09)] bg-white dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
          <table className="w-full text-sm">
            <thead className="bg-[#f5f8f7] text-left text-xs text-[#62716d] dark:bg-[#0d1424] dark:text-[#94a3b8]">
              <tr>
                <th className="px-4 py-2.5 font-medium">Mehmon</th>
                <th className="px-4 py-2.5 font-medium">Telefon</th>
                <th className="px-4 py-2.5 font-medium text-right">Tashriflar</th>
                <th className="px-4 py-2.5 font-medium text-right">Loyalty</th>
                <th className="px-4 py-2.5 font-medium">Oxirgi tashrif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-[#fafcfb] dark:hover:bg-[#0b1120]/40">
                  <td className="px-4 py-2.5 text-[#16221f] dark:text-white">
                    <span className="font-medium">
                      {[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8] tabular-nums">
                    {c.phone ?? '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                    {c.total_orders ?? 0}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#16221f] dark:text-white">
                    {formatUZS(c.loyalty_account?.points_balance ?? 0)}
                  </td>
                  <td className="px-4 py-2.5 text-[#62716d] dark:text-[#94a3b8]">
                    {c.last_visit_at
                      ? new Date(c.last_visit_at).toLocaleDateString('ru-RU')
                      : '—'}
                  </td>
                </tr>
              ))}
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
