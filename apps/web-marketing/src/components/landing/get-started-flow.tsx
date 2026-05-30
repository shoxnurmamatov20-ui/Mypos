'use client';

import {
  ArrowLeft,
  ArrowRight,
  Buildings,
  CalendarBlank,
  ChatCircleDots,
  CheckCircle,
  Coffee,
  Confetti,
  CreditCard,
  CrownSimple,
  ForkKnife,
  Hamburger,
  Headset,
  Lightning,
  Pizza,
  Question,
  Rocket,
  ShieldCheck,
  Sparkle,
  Star,
  Storefront,
  TelegramLogo,
  UserCircle,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import Link from 'next/link';
import { useState } from 'react';

type RestaurantType = 'restaurant' | 'cafe' | 'fast-food' | 'osh-markazi' | 'pizzeria';
type BranchCount = '1' | '2-5' | '6-15' | '15+';
type Plan = 'free' | 'starter' | 'pro' | 'business';

type FormData = {
  restaurantName: string;
  type: RestaurantType | '';
  city: string;
  branches: BranchCount | '';
  fullName: string;
  phone: string;
  email: string;
  plan: Plan;
};

const INITIAL: FormData = {
  restaurantName: '',
  type: '',
  city: '',
  branches: '',
  fullName: '',
  phone: '',
  email: '',
  plan: 'starter',
};

const TYPES: ReadonlyArray<{ value: RestaurantType; label: string; Icon: Icon }> = [
  { value: 'restaurant',  label: 'Restoran',     Icon: ForkKnife },
  { value: 'cafe',        label: 'Kafe',         Icon: Coffee },
  { value: 'fast-food',   label: 'Fast food',    Icon: Hamburger },
  { value: 'osh-markazi', label: 'Osh markazi',  Icon: Storefront },
  { value: 'pizzeria',    label: 'Pizzeria',     Icon: Pizza },
];

const CITIES = [
  'Toshkent', 'Samarqand', 'Buxoro', 'Andijon', 'Namangan',
  "Farg'ona", 'Qarshi', 'Nukus', 'Termiz', 'Urganch', "Navoiy", 'Jizzax',
] as const;

const BRANCH_OPTIONS: ReadonlyArray<{ value: BranchCount; label: string }> = [
  { value: '1',    label: '1 ta filial' },
  { value: '2-5',  label: '2–5 ta filial' },
  { value: '6-15', label: '6–15 ta filial' },
  { value: '15+',  label: '15+ ta filial' },
];

const PLANS: ReadonlyArray<{
  value: Plan; label: string; price: string; period: string; tag?: string;
  Icon: Icon; tint: string; bg: string;
  features: ReadonlyArray<string>;
  popular?: boolean;
}> = [
  {
    value: 'free', label: 'Bepul', price: '0', period: "doim",
    Icon: Sparkle, tint: 'text-[#5eead4]', bg: 'bg-[rgba(20,184,166,0.15)]',
    features: ['1 ta kassa', '100 buyurtma/oy', 'Asosiy hisobotlar'],
  },
  {
    value: 'starter', label: 'Starter', price: '199,000', period: 'oyiga',
    tag: 'Eng mashhur',
    Icon: Rocket, tint: 'text-amber-400', bg: 'bg-amber-500/15',
    features: ['Cheksiz buyurtma', '2 ta kassa', 'Click + Payme', 'Telegram bot'],
    popular: true,
  },
  {
    value: 'pro', label: 'Pro', price: '499,000', period: 'oyiga',
    Icon: CrownSimple, tint: 'text-[#ff0037]', bg: 'bg-[rgba(255,0,55,0.15)]',
    features: ['Hammasi + AI', "5 ta kassa", 'Inventar', 'Yandex/Wolt'],
  },
  {
    value: 'business', label: 'Business', price: '1,499,000', period: 'oyiga',
    Icon: Buildings, tint: 'text-blue-400', bg: 'bg-blue-500/15',
    features: ['Cheksiz filial', 'Dedicated manager', 'SLA 99.99%', 'White-label'],
  },
];

const BENEFITS = [
  { Icon: Sparkle,     title: '14 kun bepul',         body: 'Karta kerak emas' },
  { Icon: Lightning,   title: '5 daqiqada',            body: "Bugun ishga tushadi" },
  { Icon: ShieldCheck, title: "Bekor qilish — bemalol", body: 'Hech qanday majburiyat' },
  { Icon: Headset,     title: 'Onboarding bepul',     body: 'Mutaxassis yordami' },
] as const;

const FAQ = [
  { q: "14 kun tugagandan keyin nima bo'ladi?", a: "Hech narsa avtomatik to'lov olinmaydi. Sizdan tarifni tanlashingiz so'raladi. Tanlamasangiz — bepul tarif faollashadi." },
  { q: "Bepul tariflda buyurtma soni cheklanganmi?", a: "Ha, oyiga 100 ta buyurtma. Ko'proq kerak bo'lsa — Starter tarifga o'tasiz (199,000 so'm/oy)." },
  { q: "Onboarding qancha vaqt oladi?", a: "O'rtacha 1–3 kun: menyu kiritish, kassani sozlash, xodimlarni o'qitish. Bizning mutaxassis butun jarayonni boshqaradi — bepul." },
  { q: "Eski POS'imdan ma'lumotlarni o'tkaza olamanmi?", a: "Ha — menyu, mijozlar, hisobotlar. Excel/CSV import qilamiz yoki API orqali to'g'ridan-to'g'ri o'tkazamiz." },
] as const;

function StepIndicator({ current }: { current: number }) {
  const steps = ['Restoran', "Shaxsiy ma'lumot", 'Tarif', 'Tayyor'];
  return (
    <div className="mx-auto max-w-[28rem] mb-8">
      <div className="flex items-center justify-between gap-2">
        {steps.map((label, idx) => {
          const num = idx + 1;
          const done = num < current;
          const active = num === current;
          return (
            <div key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <span
                  className={`tabular inline-flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-inset text-[12px] font-bold transition-colors ${
                    done
                      ? 'bg-[#5eead4] ring-[#5eead4] text-[#001B1B]'
                      : active
                      ? 'bg-[#ff0037] ring-[#ff0037] text-white shadow-[0_8px_22px_-6px_rgba(255,0,55,0.5)]'
                      : 'bg-white/[0.04] ring-white/15 text-white/50'
                  }`}
                >
                  {done ? <CheckCircle size={14} weight="fill" /> : num}
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${active ? 'text-white' : done ? 'text-[#5eead4]' : 'text-white/40'}`}>
                  {label}
                </span>
              </div>
              {idx < steps.length - 1 ? (
                <div className={`h-px flex-1 -mt-4 transition-colors ${done ? 'bg-[#5eead4]/40' : 'bg-white/[0.08]'}`} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GetStartedFlow({ locale }: { locale: string }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [data, setData] = useState<FormData>(INITIAL);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setData((d) => ({ ...d, [key]: value }));

  const canNext1 = data.restaurantName.trim() && data.type && data.city && data.branches;
  const canNext2 = data.fullName.trim() && data.phone.trim().length >= 9;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[500px]" />
        <div className="relative mx-auto max-w-3xl px-5 pt-20 sm:pt-24 pb-8 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-[#5eead4] text-[11px] font-bold uppercase tracking-[0.08em]">
            <Rocket size={11} weight="fill" />
            BEPUL BOSHLASH
          </span>
          <h1 className="mt-5 text-[32px] sm:text-[44px] lg:text-[52px] font-extrabold leading-[1.05] tracking-tight text-white">
            5 daqiqada{' '}
            <span className="gradient-teal">ishga tushiring</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[14.5px] sm:text-[16px] leading-relaxed text-white/70">
            14 kun bepul · Karta kerak emas · Hozir ariza qoldiring va bugun mutaxassisimiz siz bilan bog&apos;lansin.
          </p>
        </div>
      </section>

      {/* Form + Sidebar */}
      <section className="pb-14">
        <div className="mx-auto max-w-5xl px-5 grid gap-5 lg:grid-cols-[3fr_2fr]">
          {/* Form card */}
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            {step < 4 ? <StepIndicator current={step} /> : null}

            {/* Step 1: Restaurant */}
            {step === 1 ? (
              <div>
                <h2 className="text-[20px] sm:text-[24px] font-extrabold tracking-tight text-white">
                  Restoraningiz haqida
                </h2>
                <p className="mt-1.5 text-[13px] text-white/65">
                  Qisqacha ma&apos;lumot bering — tarifni mos taklif qilamiz.
                </p>

                <div className="mt-6 space-y-5">
                  {/* Name */}
                  <div>
                    <label htmlFor="gs-rest" className="block text-[11.5px] font-semibold text-white/80 mb-1.5">
                      Restoran nomi
                    </label>
                    <div className="relative">
                      <ForkKnife size={14} weight="bold" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        id="gs-rest"
                        type="text"
                        value={data.restaurantName}
                        onChange={(e) => update('restaurantName', e.target.value)}
                        placeholder="Osh Markazi"
                        className="w-full h-11 pl-9 pr-3.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13.5px] placeholder:text-white/35 outline-none focus:border-[#5eead4]/60 focus:bg-white/[0.08] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-[11.5px] font-semibold text-white/80 mb-2">
                      Restoran turi
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                      {TYPES.map((t) => {
                        const sel = data.type === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            onClick={() => update('type', t.value)}
                            className={`press group flex flex-col items-center justify-center gap-1.5 h-20 rounded-xl ring-1 ring-inset transition-all ${
                              sel
                                ? 'bg-[rgba(20,184,166,0.12)] ring-[#5eead4]/50 text-white'
                                : 'bg-white/[0.04] ring-white/[0.10] text-white/70 hover:ring-white/25 hover:text-white'
                            }`}
                          >
                            <t.Icon size={20} weight={sel ? 'fill' : 'bold'} className={sel ? 'text-[#5eead4]' : 'text-white/55 group-hover:text-white/80'} />
                            <span className="text-[11px] font-semibold text-center leading-tight">{t.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label htmlFor="gs-city" className="block text-[11.5px] font-semibold text-white/80 mb-1.5">
                      Shahar
                    </label>
                    <select
                      id="gs-city"
                      value={data.city}
                      onChange={(e) => update('city', e.target.value)}
                      className="w-full h-11 px-3.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13.5px] outline-none focus:border-[#5eead4]/60 transition-colors appearance-none"
                      style={{
                        backgroundImage:
                          'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 12 12\' fill=\'%2394a3b8\'%3E%3Cpath d=\'M6 8.5L1.5 4h9z\'/%3E%3C/svg%3E")',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.85rem center',
                        backgroundSize: '12px',
                        paddingRight: '2.25rem',
                      }}
                    >
                      <option value="" className="bg-[#001B1B]">Tanlang...</option>
                      {CITIES.map((c) => (
                        <option key={c} value={c} className="bg-[#001B1B]">{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Branches */}
                  <div>
                    <label className="block text-[11.5px] font-semibold text-white/80 mb-2">
                      Filiallar soni
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {BRANCH_OPTIONS.map((b) => {
                        const sel = data.branches === b.value;
                        return (
                          <button
                            key={b.value}
                            type="button"
                            onClick={() => update('branches', b.value)}
                            className={`press h-10 rounded-lg ring-1 ring-inset text-[12.5px] font-semibold transition-all ${
                              sel
                                ? 'bg-[rgba(20,184,166,0.12)] ring-[#5eead4]/50 text-white'
                                : 'bg-white/[0.04] ring-white/[0.10] text-white/70 hover:ring-white/25 hover:text-white'
                            }`}
                          >
                            {b.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-7 flex items-center justify-between gap-3">
                  <Link
                    href={`/${locale}`}
                    className="press inline-flex h-11 items-center gap-1.5 px-4 rounded-lg text-white/65 hover:text-white text-[13px] font-semibold transition-colors"
                  >
                    <ArrowLeft size={13} weight="bold" />
                    Asosiyga
                  </Link>
                  <button
                    type="button"
                    disabled={!canNext1}
                    onClick={() => setStep(2)}
                    className="press inline-flex h-11 items-center gap-1.5 px-5 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13.5px] font-bold shadow-[0_10px_28px_-8px_rgba(255,0,55,0.55)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Davom etish
                    <ArrowRight size={13} weight="bold" />
                  </button>
                </div>
              </div>
            ) : null}

            {/* Step 2: Personal */}
            {step === 2 ? (
              <div>
                <h2 className="text-[20px] sm:text-[24px] font-extrabold tracking-tight text-white">
                  Sizning ma&apos;lumotingiz
                </h2>
                <p className="mt-1.5 text-[13px] text-white/65">
                  Bog&apos;lanish uchun — bizning mutaxassis ariza topshirilgandan keyin 30 daqiqada bog&apos;lanadi.
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="gs-name" className="block text-[11.5px] font-semibold text-white/80 mb-1.5">
                      Ism Familiya
                    </label>
                    <div className="relative">
                      <UserCircle size={14} weight="bold" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        id="gs-name"
                        type="text"
                        value={data.fullName}
                        onChange={(e) => update('fullName', e.target.value)}
                        placeholder="Sardor Xolmatov"
                        className="w-full h-11 pl-9 pr-3.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13.5px] placeholder:text-white/35 outline-none focus:border-[#5eead4]/60 focus:bg-white/[0.08] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="gs-phone" className="block text-[11.5px] font-semibold text-white/80 mb-1.5">
                      Telefon raqam
                    </label>
                    <input
                      id="gs-phone"
                      type="tel"
                      value={data.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full h-11 px-3.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13.5px] placeholder:text-white/35 outline-none focus:border-[#5eead4]/60 focus:bg-white/[0.08] transition-colors tabular"
                    />
                  </div>
                  <div>
                    <label htmlFor="gs-email" className="block text-[11.5px] font-semibold text-white/80 mb-1.5">
                      Email <span className="font-normal text-white/40">(ixtiyoriy)</span>
                    </label>
                    <input
                      id="gs-email"
                      type="email"
                      value={data.email}
                      onChange={(e) => update('email', e.target.value)}
                      placeholder="sardor@restoran.uz"
                      className="w-full h-11 px-3.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13.5px] placeholder:text-white/35 outline-none focus:border-[#5eead4]/60 focus:bg-white/[0.08] transition-colors"
                    />
                  </div>
                </div>

                <div className="mt-7 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="press inline-flex h-11 items-center gap-1.5 px-4 rounded-lg text-white/65 hover:text-white text-[13px] font-semibold transition-colors"
                  >
                    <ArrowLeft size={13} weight="bold" />
                    Orqaga
                  </button>
                  <button
                    type="button"
                    disabled={!canNext2}
                    onClick={() => setStep(3)}
                    className="press inline-flex h-11 items-center gap-1.5 px-5 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13.5px] font-bold shadow-[0_10px_28px_-8px_rgba(255,0,55,0.55)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    Davom etish
                    <ArrowRight size={13} weight="bold" />
                  </button>
                </div>
              </div>
            ) : null}

            {/* Step 3: Plan */}
            {step === 3 ? (
              <div>
                <h2 className="text-[20px] sm:text-[24px] font-extrabold tracking-tight text-white">
                  Tarifni tanlang
                </h2>
                <p className="mt-1.5 text-[13px] text-white/65">
                  Hozir tanlamasangiz — Bepul tarif faollashadi. Istalgan vaqtda o&apos;zgartirsangiz bo&apos;ladi.
                </p>

                <div className="mt-6 space-y-2.5">
                  {PLANS.map((pl) => {
                    const sel = data.plan === pl.value;
                    return (
                      <button
                        key={pl.value}
                        type="button"
                        onClick={() => update('plan', pl.value)}
                        className={`press group w-full text-left rounded-2xl ring-1 ring-inset px-4 py-4 transition-all relative ${
                          sel
                            ? 'bg-[rgba(20,184,166,0.10)] ring-[#5eead4]/45'
                            : 'bg-white/[0.03] ring-white/[0.10] hover:ring-white/25'
                        }`}
                      >
                        {pl.tag ? (
                          <span className="absolute -top-2 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ff0037] text-white text-[9.5px] font-bold uppercase tracking-[0.06em]">
                            <Star size={9} weight="fill" />
                            {pl.tag}
                          </span>
                        ) : null}

                        <div className="flex items-center gap-3">
                          <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${pl.bg}`}>
                            <pl.Icon size={18} weight="bold" className={pl.tint} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-[15px] font-bold text-white">{pl.label}</span>
                              <span className="tabular text-[13px] font-bold text-white">
                                {pl.price === '0' ? '0' : `${pl.price} so'm`}
                              </span>
                              <span className="text-[11px] text-white/50">{pl.period}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/60">
                              {pl.features.map((f, i) => (
                                <span key={f} className="inline-flex items-center gap-1">
                                  {i > 0 ? <span className="text-white/25">·</span> : null}
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 h-5 w-5 rounded-full ring-1 ring-inset transition-all ${
                              sel
                                ? 'bg-[#5eead4] ring-[#5eead4] flex items-center justify-center'
                                : 'bg-white/[0.04] ring-white/20'
                            }`}
                          >
                            {sel ? <CheckCircle size={11} weight="fill" className="text-[#001B1B]" /> : null}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center gap-2.5 px-4 py-3 rounded-xl ring-1 ring-inset ring-[#5eead4]/20 bg-[rgba(20,184,166,0.06)]">
                  <ShieldCheck size={14} weight="fill" className="text-[#5eead4] shrink-0" />
                  <p className="text-[12px] leading-relaxed text-white/80">
                    <strong className="text-white">Hammasi: 14 kun bepul.</strong> Karta kerak emas. Tugashidan oldin sizdan so&apos;raymiz.
                  </p>
                </div>

                <div className="mt-7 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="press inline-flex h-11 items-center gap-1.5 px-4 rounded-lg text-white/65 hover:text-white text-[13px] font-semibold transition-colors"
                  >
                    <ArrowLeft size={13} weight="bold" />
                    Orqaga
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="press inline-flex h-11 items-center gap-1.5 px-5 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13.5px] font-bold shadow-[0_10px_28px_-8px_rgba(255,0,55,0.55)] transition-all"
                  >
                    Akkaunt yaratish
                    <ArrowRight size={13} weight="bold" />
                  </button>
                </div>
              </div>
            ) : null}

            {/* Step 4: Success */}
            {step === 4 ? (
              <div className="text-center py-4">
                <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full ring-1 ring-inset ring-emerald-400/30 bg-emerald-500/15 relative">
                  <Confetti size={32} weight="fill" className="text-emerald-400" />
                  <span className="absolute -top-1 -right-1 text-2xl">🎉</span>
                </div>
                <h2 className="mt-5 text-[24px] sm:text-[28px] font-extrabold tracking-tight text-white">
                  Tabriklaymiz, {data.fullName.split(' ')[0] || 'Hamkor'}!
                </h2>
                <p className="mx-auto mt-3 max-w-[28rem] text-[13.5px] leading-relaxed text-white/70">
                  Sizning arizangiz qabul qilindi. Bizning mutaxassis{' '}
                  <strong className="text-white">{data.phone || 'telefoningiz'}</strong> orqali{' '}
                  <span className="text-[#5eead4] font-bold">30 daqiqa ichida</span> bog&apos;lanadi.
                </p>

                {/* Application summary */}
                <div className="mt-6 mx-auto max-w-[28rem] rounded-2xl ring-1 ring-inset ring-white/[0.08] bg-white/[0.02] divide-y divide-white/[0.06] text-left text-[12.5px]">
                  <div className="grid grid-cols-[auto_1fr] gap-3 px-4 py-2.5 items-center">
                    <Storefront size={14} weight="bold" className="text-[#5eead4]" />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white/55">Restoran</span>
                      <span className="font-bold text-white truncate">{data.restaurantName}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-3 px-4 py-2.5 items-center">
                    <Buildings size={14} weight="bold" className="text-[#5eead4]" />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white/55">Shahar</span>
                      <span className="font-bold text-white">{data.city}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-3 px-4 py-2.5 items-center">
                    <CreditCard size={14} weight="bold" className="text-[#5eead4]" />
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-white/55">Tarif</span>
                      <span className="font-bold text-white capitalize">
                        {PLANS.find((p) => p.value === data.plan)?.label} · 14 kun bepul
                      </span>
                    </div>
                  </div>
                </div>

                {/* Next steps */}
                <div className="mt-7">
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#5eead4]">
                    Keyingi qadamlar
                  </p>
                  <ol className="mt-3 space-y-2 max-w-[28rem] mx-auto text-left">
                    {[
                      { Icon: ChatCircleDots, t: 'Mutaxassis qo\'ng\'iroq qiladi',  body: '30 daqiqa ichida · Demo va savol-javob' },
                      { Icon: CalendarBlank,  t: 'Onboarding rejasi',                body: '1–3 kun · Menyu, kassa, xodimlar' },
                      { Icon: Rocket,         t: 'Restoraningiz ishga tushadi',     body: "Mijozlar bilan ishlash boshlanadi" },
                    ].map((s, i) => (
                      <li key={s.t} className="flex items-start gap-3 rounded-xl ring-1 ring-inset ring-white/[0.08] bg-white/[0.02] px-3.5 py-2.5">
                        <span className="tabular inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(20,184,166,0.15)] ring-1 ring-inset ring-[#5eead4]/30 text-[#5eead4] text-[11px] font-bold">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-bold text-white">{s.t}</div>
                          <div className="text-[11.5px] text-white/55">{s.body}</div>
                        </div>
                        <s.Icon size={14} weight="bold" className="text-[#5eead4] mt-1 shrink-0" />
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Telegram CTA */}
                <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
                  <a
                    href="https://t.me/mypos_uz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="press inline-flex h-11 items-center gap-1.5 px-5 rounded-lg bg-[#26A5E4] hover:bg-[#1d8fc7] text-white text-[13.5px] font-bold transition-colors"
                  >
                    <TelegramLogo size={14} weight="fill" />
                    Telegramda kuzating
                  </a>
                  <Link
                    href={`/${locale}/docs`}
                    className="press inline-flex h-11 items-center gap-1.5 px-5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[13.5px] font-bold hover:bg-white/[0.12] transition-colors"
                  >
                    Hujjatlar
                    <ArrowRight size={13} weight="bold" />
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside className="space-y-3">
            {/* Benefits */}
            <div className="glass-card rounded-2xl p-5">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#5eead4]">
                Nima olasiz
              </div>
              <ul className="mt-3 space-y-3">
                {BENEFITS.map((b) => (
                  <li key={b.title} className="flex items-start gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                      <b.Icon size={15} weight="bold" className="text-[#5eead4]" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-white">{b.title}</div>
                      <div className="text-[11.5px] text-white/55">{b.body}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonial */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-1 text-amber-400 text-[13px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13} weight="fill" />
                ))}
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-white/80 italic">
                &ldquo;3 kunda ishga tushdik. Bizning eski POS dan ma&apos;lumotni o&apos;tkazdilar, xodimlarni o&apos;qitdilar. 1 oyda foydamiz 18% oshdi.&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-inset ring-white/15 bg-[rgba(20,184,166,0.18)] text-[#5eead4] text-[11px] font-bold">
                  AR
                </span>
                <div className="leading-tight">
                  <div className="text-[12px] font-bold text-white">Aziz Rahimov</div>
                  <div className="text-[10.5px] text-white/50">Osh Markazi, Toshkent</div>
                </div>
              </div>
            </div>

            {/* Trust */}
            <div className="glass-card rounded-2xl p-5">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#5eead4]">
                Ishonish uchun sabab
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="tabular text-[20px] font-extrabold text-white">500+</div>
                  <div className="text-[10.5px] text-white/55">restoran</div>
                </div>
                <div>
                  <div className="tabular text-[20px] font-extrabold text-white">12</div>
                  <div className="text-[10.5px] text-white/55">shahar</div>
                </div>
                <div>
                  <div className="tabular text-[20px] font-extrabold text-emerald-300">99.99%</div>
                  <div className="text-[10.5px] text-white/55">uptime</div>
                </div>
                <div>
                  <div className="tabular text-[20px] font-extrabold text-amber-300">4.9</div>
                  <div className="text-[10.5px] text-white/55">reyting</div>
                </div>
              </div>
            </div>

            {/* Direct contact */}
            <div className="glass-card rounded-2xl p-5">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#5eead4]">
                To&apos;g&apos;ridan-to&apos;g&apos;ri
              </div>
              <p className="mt-2 text-[12px] text-white/65 leading-relaxed">
                Forma to&apos;ldirmasdan gaplashmoqchimisiz?
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <a
                  href="tel:+998712006060"
                  className="press inline-flex h-9 items-center gap-1 px-3 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[11.5px] font-bold hover:bg-white/[0.12] transition-colors tabular"
                >
                  +998 71 200 60 60
                </a>
                <a
                  href="https://t.me/mypos_uz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press inline-flex h-9 items-center gap-1 px-3 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[11.5px] font-bold hover:bg-white/[0.12] transition-colors"
                >
                  <TelegramLogo size={11} weight="fill" className="text-[#26A5E4]" />
                  Telegram
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-14">
        <div className="mx-auto max-w-3xl px-5">
          <div className="text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              FAQ
            </p>
            <h2 className="mt-2 text-[24px] sm:text-[28px] font-extrabold tracking-tight text-white">
              Tez-tez beriladigan savollar
            </h2>
          </div>

          <div className="mt-8 space-y-2.5">
            {FAQ.map((f, idx) => (
              <details key={f.q} className="glass-card rounded-2xl group" open={idx === 0}>
                <summary className="press flex cursor-pointer items-center gap-3 px-5 py-4 list-none">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                    <Question size={13} weight="bold" className="text-[#5eead4]" />
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] font-bold text-white">{f.q}</span>
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-white/15 bg-white/[0.05] text-white/70 group-open:bg-[#5eead4]/15 group-open:text-[#5eead4] group-open:ring-[#5eead4]/30 transition-colors">
                    <ArrowRight size={11} weight="bold" className="group-open:rotate-90 transition-transform" />
                  </span>
                </summary>
                <div className="px-5 pb-5 pl-[62px] -mt-1 text-[13px] leading-relaxed text-white/70">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
