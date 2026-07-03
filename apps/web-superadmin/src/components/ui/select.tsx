'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
};

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  id?: string;
};

/**
 * Custom dark-themed Select dropdown.
 *
 * Native `<select>` does not allow consistent dark styling across browsers,
 * so we render a button + animated panel using Framer Motion. The component
 * is fully keyboard accessible (Esc closes, click outside closes).
 */
export function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  label,
  className,
  disabled = false,
  size = 'md',
  id,
}: Props<T>) {
  const tSelect = useTranslations('select');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const current = options.find((o) => o.value === value);
  const placeholderText = placeholder ?? tSelect('placeholder');
  const displayLabel = current?.label ?? placeholderText;

  const heightCls = size === 'sm' ? 'h-9 text-sm' : 'h-10 text-sm';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label ? (
        <label
          htmlFor={id}
          className="mb-1.5 block text-[12px] font-bold text-[#16221f] dark:text-[#e2e8f0]"
        >
          {label}
        </label>
      ) : null}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-md border px-3 font-semibold transition-colors',
          'border-[rgba(22,34,31,0.09)] bg-[#eef4f3] text-[#16221f]',
          'dark:border-[rgba(255,255,255,0.07)] dark:bg-[#1a2235] dark:text-white',
          heightCls,
          'hover:border-[#0f766e] dark:hover:border-[#14b8a6]',
          'focus:border-[#0f766e] dark:focus:border-[#14b8a6] focus:outline-none focus:ring-2 focus:ring-[rgba(15,118,110,0.15)] dark:focus:ring-[rgba(20,184,166,0.18)]',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <span className={cn('truncate', !current && 'text-[#62716d] dark:text-[#94a3b8]')}>
          {displayLabel}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-[#62716d] dark:text-[#94a3b8] transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 right-0 z-50 mt-1.5 max-h-72 overflow-auto rounded-[10px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-1 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-[13px] transition-colors',
                    isSelected
                      ? 'bg-[rgba(15,118,110,0.1)] dark:bg-[rgba(20,184,166,0.18)] text-[#0f766e] dark:text-[#14b8a6] font-semibold'
                      : 'text-[#16221f] dark:text-[#e2e8f0] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]',
                  )}
                >
                  <span className="flex flex-col">
                    <span className="font-semibold">{opt.label}</span>
                    {opt.hint ? (
                      <span className="text-[11px] text-[#62716d] dark:text-[#94a3b8] font-normal">
                        {opt.hint}
                      </span>
                    ) : null}
                  </span>
                  {isSelected ? (
                    <Check
                      className="h-3.5 w-3.5 text-[#0f766e] dark:text-[#14b8a6]"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
