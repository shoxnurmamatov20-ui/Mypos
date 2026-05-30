/**
 * Locale-scoped 404. Intentionally **hook-free** so it can be statically
 * generated at build time — Next.js prerenders /404 inside the implicit
 * Pages-Router `_error` shell, which has no React context. Using
 * `useTranslations()` / `useLocale()` here would throw
 * "Cannot read properties of null (reading 'useContext')" during build.
 *
 * Copy is intentionally trilingual (UZ / RU / EN) inline so we don't
 * need the i18n provider just for the error screen.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-[88px] font-black leading-none tracking-tight text-[#0f766e] dark:text-teal-400">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#16221f] dark:text-white">
        Sahifa topilmadi
      </h1>
      <p className="mt-2 max-w-sm text-sm text-[#62716d] dark:text-[#94a3b8]">
        Siz qidirayotgan sahifa mavjud emas yoki ko&apos;chirilgan.
      </p>
      <a
        href="/overview"
        className="mt-7 inline-flex h-10 items-center rounded-md bg-[#0f766e] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0d5e58] dark:bg-[#14b8a6] dark:hover:bg-[#0d9488]"
      >
        Bosh sahifaga qaytish
      </a>
    </div>
  );
}
