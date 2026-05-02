'use client';

import { cn } from '@mypos/ui';
import { motion, useInView, type Variants } from 'framer-motion';
import { type ReactNode, useEffect, useRef, useState } from 'react';

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

type FadeUpProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'span' | 'h2' | 'h3' | 'p';
};

export function FadeUp({ children, delay = 0, className, as = 'div' }: FadeUpProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const Component = motion[as];

  return (
    <Component
      ref={ref}
      variants={fadeUpVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'ul' | 'ol' | 'section';
};

export function StaggerGroup({ children, className, as = 'div' }: StaggerProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const Component = motion[as];

  return (
    <Component
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'article';
};

export function StaggerItem({ children, className, as = 'div' }: StaggerItemProps) {
  const Component = motion[as];

  return (
    <Component
      variants={fadeUpVariants}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(className)}
    >
      {children}
    </Component>
  );
}

type CounterProps = {
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  formatNumber?: (n: number) => string;
};

export function AnimatedCounter({
  to,
  duration = 1.8,
  suffix = '',
  prefix = '',
  formatNumber,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - startTime) / (duration * 1000), 1);
      const eased = 1 - (1 - t) ** 3;
      setValue(eased * to);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);

  const formatted = formatNumber
    ? formatNumber(value)
    : Math.round(value).toLocaleString('en-US').replace(/,/g, ' ');

  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
