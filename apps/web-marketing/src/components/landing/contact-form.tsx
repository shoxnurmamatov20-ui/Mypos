'use client';

import { ArrowRight, CheckCircle, ForkKnife } from '@phosphor-icons/react';
import { useState } from 'react';

type Topic = 'demo' | 'pricing' | 'support' | 'partnership' | 'other';

const TOPICS: ReadonlyArray<{ value: Topic; label: string }> = [
  { value: 'demo', label: "Demo so'rash" },
  { value: 'pricing', label: 'Narxlar' },
  { value: 'support', label: 'Texnik yordam' },
  { value: 'partnership', label: 'Hamkorlik' },
  { value: 'other', label: 'Boshqa savol' },
];

const RESTAURANT_TYPES = [
  '1-2 ta filial',
  '3-5 ta filial',
  '6-15 ta filial',
  '15+ ta filial (tarmoq)',
] as const;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [topic, setTopic] = useState<Topic>('demo');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="glass-card rounded-2xl px-6 py-12 text-center">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full ring-1 ring-inset ring-emerald-400/30 bg-emerald-500/15">
          <CheckCircle size={28} weight="fill" className="text-emerald-400" />
        </div>
        <h3 className="mt-4 text-[20px] font-extrabold tracking-tight text-white">
          Xabaringiz qabul qilindi
        </h3>
        <p className="mx-auto mt-2 max-w-[28rem] text-[13.5px] leading-relaxed text-white/70">
          Bizning jamoa sizga eng kech 4 ish soatida bog&apos;lanadi. Tezroq javob kerakmi?{' '}
          <a
            href="https://t.me/mypos_uz"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#5eead4] hover:text-white transition-colors"
          >
            Telegramga yozing →
          </a>
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="press mt-6 inline-flex h-10 items-center gap-1.5 px-4 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[13px] font-bold hover:bg-white/[0.12] transition-colors"
        >
          Yangi xabar yuborish
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="glass-card rounded-2xl p-6 sm:p-7 space-y-5">
      {/* Topic chips */}
      <div>
        <label className="block text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#5eead4] mb-2.5">
          Murojaat mavzusi
        </label>
        <div className="flex flex-wrap gap-1.5">
          {TOPICS.map((tp) => (
            <button
              key={tp.value}
              type="button"
              onClick={() => setTopic(tp.value)}
              className={`press inline-flex h-8 items-center px-3 rounded-full text-[12px] font-semibold transition-colors ${
                topic === tp.value
                  ? 'bg-white text-[#001B1B]'
                  : 'border border-white/[0.10] bg-white/[0.04] text-white/70 hover:text-white hover:border-white/25'
              }`}
            >
              {tp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Name + Phone */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="cf-name"
            className="block text-[11.5px] font-semibold text-white/80 mb-1.5"
          >
            Ism Familiya
          </label>
          <input
            id="cf-name"
            type="text"
            required
            placeholder="Sardor Xolmatov"
            className="w-full h-11 px-3.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13.5px] placeholder:text-white/35 outline-none focus:border-[#5eead4]/60 focus:bg-white/[0.08] transition-colors"
          />
        </div>
        <div>
          <label
            htmlFor="cf-phone"
            className="block text-[11.5px] font-semibold text-white/80 mb-1.5"
          >
            Telefon raqam
          </label>
          <input
            id="cf-phone"
            type="tel"
            required
            placeholder="+998 90 123 45 67"
            className="w-full h-11 px-3.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13.5px] placeholder:text-white/35 outline-none focus:border-[#5eead4]/60 focus:bg-white/[0.08] transition-colors tabular"
          />
        </div>
      </div>

      {/* Email + Restaurant */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="cf-email"
            className="block text-[11.5px] font-semibold text-white/80 mb-1.5"
          >
            Email
          </label>
          <input
            id="cf-email"
            type="email"
            placeholder="sardor@restoran.uz"
            className="w-full h-11 px-3.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13.5px] placeholder:text-white/35 outline-none focus:border-[#5eead4]/60 focus:bg-white/[0.08] transition-colors"
          />
        </div>
        <div>
          <label
            htmlFor="cf-rest"
            className="block text-[11.5px] font-semibold text-white/80 mb-1.5"
          >
            Restoran nomi
          </label>
          <div className="relative">
            <ForkKnife
              size={14}
              weight="bold"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              aria-hidden="true"
            />
            <input
              id="cf-rest"
              type="text"
              placeholder="Osh Markazi"
              className="w-full h-11 pl-9 pr-3.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13.5px] placeholder:text-white/35 outline-none focus:border-[#5eead4]/60 focus:bg-white/[0.08] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Restaurant size */}
      <div>
        <label className="block text-[11.5px] font-semibold text-white/80 mb-2">
          Restoraningiz hajmi
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {RESTAURANT_TYPES.map((rt) => (
            <label
              key={rt}
              className="press flex items-center gap-2 px-3 h-10 rounded-lg border border-white/[0.10] bg-white/[0.04] text-white/75 text-[12.5px] font-semibold cursor-pointer hover:border-white/25 hover:text-white transition-colors has-[:checked]:bg-[rgba(20,184,166,0.12)] has-[:checked]:border-[#5eead4]/45 has-[:checked]:text-white"
            >
              <input type="radio" name="size" value={rt} className="sr-only" />
              <span
                className="h-3 w-3 rounded-full ring-1 ring-inset ring-white/25 shrink-0"
                aria-hidden="true"
              />
              {rt}
            </label>
          ))}
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="cf-msg" className="block text-[11.5px] font-semibold text-white/80 mb-1.5">
          Xabar
        </label>
        <textarea
          id="cf-msg"
          rows={4}
          placeholder="Sizga qanday yordam bera olamiz? Restoraningiz haqida qisqacha aytib bering..."
          className="w-full px-3.5 py-3 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13.5px] placeholder:text-white/35 outline-none focus:border-[#5eead4]/60 focus:bg-white/[0.08] transition-colors resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <p className="text-[11px] text-white/45">
          Yuborish bilan{' '}
          <a
            href="#"
            className="font-semibold text-white/65 hover:text-[#5eead4] transition-colors"
          >
            Maxfiylik siyosati
          </a>
          ga rozisiz
        </p>
        <button
          type="submit"
          className="press inline-flex h-11 items-center justify-center gap-1.5 px-6 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13.5px] font-bold shadow-[0_10px_28px_-8px_rgba(255,0,55,0.55)] transition-colors"
        >
          Xabar yuborish
          <ArrowRight size={13} weight="bold" />
        </button>
      </div>
    </form>
  );
}
