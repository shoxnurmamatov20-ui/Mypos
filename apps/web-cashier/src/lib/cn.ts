import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with conflict resolution. The single styling
 * helper used across the cashier panel.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
