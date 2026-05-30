import Link from 'next/link';

/** Minimal 404 — routes back to the POS screen. */
export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-6 text-center dark:bg-[#0b1120]">
      <p className="text-5xl font-bold text-[#0f766e]">404</p>
      <p className="text-sm text-[#62716d] dark:text-[#94a3b8]">
        Sahifa topilmadi / Страница не найдена
      </p>
      <Link
        href="/uz/pos"
        className="mt-2 rounded-lg bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0c5f58]"
      >
        Kassaga qaytish
      </Link>
    </main>
  );
}
