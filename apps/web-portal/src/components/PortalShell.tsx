import type { ReactNode } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';

type PortalShellProps = {
  children: ReactNode;
  /** Layout variant. `centered` (default) = vertically centred card. */
  variant?: 'centered' | 'topless';
};

/**
 * Pure white background, black text. Centred card. No gradients, no
 * decorative effects — strictly classic.
 */
export function PortalShell({ children, variant = 'centered' }: PortalShellProps) {
  const alignClass = variant === 'topless' ? 'items-start pt-section' : 'items-center';
  return (
    <main className={`relative min-h-screen flex justify-center px-md py-section bg-white text-black ${alignClass}`}>
      <div className="absolute top-md right-md z-10">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-[440px]">{children}</div>
    </main>
  );
}
