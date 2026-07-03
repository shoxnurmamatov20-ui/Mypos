/**
 * Synthetic feedback / sentiment / event datasets for the dashboard
 * charts. Replace with real API responses once the backend exposes
 * `/api/v1/super-admin/feedback/*`.
 */

const dayKey = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  return d.toISOString().slice(0, 10);
};

export type FeedbackPoint = {
  date: string;
  /** Display label e.g. "5 may". */
  label: string;
  /** Total feedback received that day. */
  count: number;
  /** Average 1–5 star rating. */
  rating: number;
};

const MONTHS_UZ = [
  'yan',
  'fev',
  'mar',
  'apr',
  'may',
  'iyun',
  'iyul',
  'avg',
  'sen',
  'okt',
  'noy',
  'dek',
];

function makeLabel(date: string): string {
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS_UZ[d.getMonth()]}`;
}

/** Last 14 days — for the Feedback dinamikasi line chart. */
export const MOCK_FEEDBACK_DYNAMICS: FeedbackPoint[] = [
  { count: 12, rating: 4.1 },
  { count: 18, rating: 4.3 },
  { count: 14, rating: 4.0 },
  { count: 22, rating: 4.4 },
  { count: 19, rating: 4.2 },
  { count: 26, rating: 4.5 },
  { count: 31, rating: 4.6 },
  { count: 24, rating: 4.3 },
  { count: 28, rating: 4.4 },
  { count: 35, rating: 4.7 },
  { count: 29, rating: 4.5 },
  { count: 33, rating: 4.6 },
  { count: 38, rating: 4.7 },
  { count: 42, rating: 4.8 },
].map((point, idx, arr) => {
  const date = dayKey(arr.length - 1 - idx);
  return { date, label: makeLabel(date), ...point };
});

/** Sentiment — for the Sentiment donut. Same shape, just totals. */
export const MOCK_SENTIMENT = [
  { key: 'positive', label: 'Ijobiy', count: 248, color: '#059669' },
  { key: 'neutral', label: 'Neytral', count: 76, color: '#94a3b8' },
  { key: 'negative', label: 'Salbiy', count: 32, color: '#e11d48' },
] as const;

/** Hodisa turi — system event severity counts (last 30d). */
export const MOCK_EVENT_TYPES = [
  { key: 'info', label: "Ma'lumot", count: 412, color: '#2563eb' },
  { key: 'warning', label: 'Ogohlantirish', count: 87, color: '#d97706' },
  { key: 'error', label: 'Xato', count: 24, color: '#ea580c' },
  { key: 'critical', label: 'Kritik', count: 6, color: '#e11d48' },
] as const;

/** Last 7 days — fresh sign-ups / new tenants. */
export const MOCK_LAST_7_DAYS: ReadonlyArray<{
  date: string;
  label: string;
  signups: number;
  orders: number;
}> = [
  { signups: 4, orders: 142 },
  { signups: 7, orders: 168 },
  { signups: 3, orders: 154 },
  { signups: 9, orders: 191 },
  { signups: 6, orders: 178 },
  { signups: 11, orders: 215 },
  { signups: 14, orders: 241 },
].map((point, idx, arr) => {
  const date = dayKey(arr.length - 1 - idx);
  return { date, label: makeLabel(date), ...point };
});
