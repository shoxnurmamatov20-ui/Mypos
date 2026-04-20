import Link from 'next/link';

type Props = {
  locale: string;
  className?: string;
};

/**
 * MyPOS wordmark. Renders an inline SVG mark so the logo works offline and in SSG.
 */
export function Logo({ locale, className }: Props) {
  return (
    <Link
      href={`/${locale}`}
      className={`inline-flex items-center gap-2 font-display font-extrabold text-neutral-900 ${className ?? ''}`}
      aria-label="MyPOS"
    >
      <span
        aria-hidden="true"
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>MyPOS mark</title>
          <path
            d="M4 6.5C4 5.12 5.12 4 6.5 4h11C18.88 4 20 5.12 20 6.5v8A5.5 5.5 0 0 1 14.5 20h-8A2.5 2.5 0 0 1 4 17.5v-11Z"
            fill="currentColor"
            opacity="0.2"
          />
          <path
            d="M8 9h8M8 13h5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="text-lg tracking-tight">MyPOS</span>
    </Link>
  );
}
