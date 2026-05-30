import { cn } from '@/lib/cn';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
}

/**
 * Himoya-style badge. Tinted pill, no border, all-caps not enforced —
 * keep it readable. Variants map to common status colours.
 */
export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  const variants = {
    default:     'bg-blue-100 text-blue-800',
    secondary:   'bg-gray-100 text-gray-800',
    success:     'bg-emerald-100 text-emerald-800',
    warning:     'bg-amber-100 text-amber-800',
    destructive: 'bg-red-100 text-red-800',
    outline:     'border border-gray-300 text-gray-700 bg-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
