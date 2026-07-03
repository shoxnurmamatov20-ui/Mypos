'use client';

import { ArrowRight, CheckCircle, ForkKnife, UserCircle, VideoCamera } from '@phosphor-icons/react';
import { useState } from 'react';

type Format = 'online' | 'office';

const FORMATS: ReadonlyArray<{ value: Format; label: string; sub: string }> = [
  { value: 'online', label: 'Onlayn', sub: 'Zoom / Telegram' },
  { value: 'office', label: 'Toshkent ofisi', sub: 'Haqiqiy kassada' },
];

export function DemoForm() {
  const [submitted, setSubmitted] = useState(false);
  const [format, setFormat] = useState<Format>('online');

  if (submitted) {
    return (
      <div className="text-center py-6">
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full ring-1 ring-inset ring-emerald-400/30 bg-emerald-500/15">
          <CheckCircle size={28} weight="fill" className="text-emerald-400" />
        </div>
        <h3 className="mt-4 text-[20px] font-extrabold tracking-tight text-white">
          Ariza qabul qilindi
        </h3>
        <p className="mx-auto mt-2 max-w-[28rem] text-[13.5px] leading-relaxed text-white/70">
          Bizning mutaxassis 30 daqiqa ichida sizga qo&apos;ng&apos;iroq qiladi va aniq vaqtni
          belgilaymiz.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="press mt-5 inline-flex h-10 items-center gap-1.5 px-4 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[13px] font-bold hover:bg-white/[0.12] transition-colors"
        >
          Yangi ariza
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="space-y-5"
    >
      {/* Format */}
      <div>
        <label className="block text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#5eead4] mb-2">
          Format
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {FORMATS.map((f) => {
            const sel = format === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFormat(f.value)}
                className={`press group flex flex-col items-start gap-0.5 h-16 px-4 rounded-lg ring-1 ring-inset transition-all ${
                  sel
                    ? 'bg-[rgba(20,184,166,0.12)] ring-[#5eead4]/50'
                    : 'bg-white/[0.04] ring-white/[0.10] hover:ring-white/25'
                }`}
              >
                <span className={`text-[13px] font-bold ${sel ? 'text-white' : 'text-white/85'}`}>
                  {f.label}
                </span>
                <span className="text-[11px] text-white/55">{f.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Name + Phone */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="df-name"
            className="block text-[11.5px] font-semibold text-white/80 mb-1.5"
          >
            Ism Familiya
          </label>
          <div className="relative">
            <UserCircle
              size={14}
              weight="bold"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
            />
            <input
              id="df-name"
              type="text"
              required
              placeholder="Sardor Xolmatov"
              className="w-full h-11 pl-9 pr-3.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13.5px] placeholder:text-white/35 outline-none focus:border-[#5eead4]/60 focus:bg-white/[0.08] transition-colors"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="df-phone"
            className="block text-[11.5px] font-semibold text-white/80 mb-1.5"
          >
            Telefon
          </label>
          <input
            id="df-phone"
            type="tel"
            required
            placeholder="+998 90 123 45 67"
            className="w-full h-11 px-3.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13.5px] placeholder:text-white/35 outline-none focus:border-[#5eead4]/60 focus:bg-white/[0.08] transition-colors tabular"
          />
        </div>
      </div>

      {/* Restaurant */}
      <div>
        <label htmlFor="df-rest" className="block text-[11.5px] font-semibold text-white/80 mb-1.5">
          Restoran nomi
        </label>
        <div className="relative">
          <ForkKnife
            size={14}
            weight="bold"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            id="df-rest"
            type="text"
            required
            placeholder="Osh Markazi"
            className="w-full h-11 pl-9 pr-3.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13.5px] placeholder:text-white/35 outline-none focus:border-[#5eead4]/60 focus:bg-white/[0.08] transition-colors"
          />
        </div>
      </div>

      {/* Question */}
      <div>
        <label htmlFor="df-q" className="block text-[11.5px] font-semibold text-white/80 mb-1.5">
          Demo&apos;da ko&apos;rmoqchi bo&apos;lgan xususiyat{' '}
          <span className="font-normal text-white/40">(ixtiyoriy)</span>
        </label>
        <textarea
          id="df-q"
          rows={3}
          placeholder="Masalan: Click/Payme integratsiyasi, smena hisoboti, AI menyu..."
          className="w-full px-3.5 py-3 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13.5px] placeholder:text-white/35 outline-none focus:border-[#5eead4]/60 focus:bg-white/[0.08] transition-colors resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          type="submit"
          className="press inline-flex h-11 items-center justify-center gap-1.5 px-6 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13.5px] font-bold shadow-[0_10px_28px_-8px_rgba(255,0,55,0.55)] transition-colors"
        >
          <VideoCamera size={14} weight="fill" />
          Demo bron qilish
          <ArrowRight size={13} weight="bold" />
        </button>
        <p className="text-center text-[11px] text-white/45">
          30 daqiqa ichida mutaxassis bog&apos;lanadi
        </p>
      </div>
    </form>
  );
}
