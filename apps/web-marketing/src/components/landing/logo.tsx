import { Storefront } from '@phosphor-icons/react/dist/ssr';

/**
 * MyPOS wordmark. 28×28 teal-gradient tile with a storefront glyph,
 * then "MyPOS" in extrabold ink. Light/dark adaptive.
 */
export function Logo() {
  return (
    <span className="inline-flex items-center gap-2" aria-label="MyPOS">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#0f766e] to-[#14b8a6] shadow-[0_2px_8px_-2px_rgba(15,118,110,0.55)]">
        <Storefront size={15} weight="bold" className="text-white" />
      </span>
      <span className="text-[17px] font-extrabold tracking-tight text-[#0f172a] dark:text-white [.dark_&]:text-white">
        MyPOS
      </span>
    </span>
  );
}
