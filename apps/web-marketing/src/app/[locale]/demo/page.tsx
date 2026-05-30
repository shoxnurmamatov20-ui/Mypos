import {
  ArrowRight,
  CalendarBlank,
  Clock,
  Headset,
  Lightning,
  Monitor,
  PlayCircle,
  Star,
  TelegramLogo,
  UserCircle,
  VideoCamera,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';
import { DemoForm } from '@/components/landing/demo-form';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'Demo so\'rash — MyPOS',
  description: "30 daqiqalik shaxsiylashtirilgan demo. Restoraningiz uchun maxsus sozlangan namoyish.",
};

const PERKS: ReadonlyArray<{ Icon: Icon; tint: string; bg: string; title: string; body: string }> = [
  { Icon: UserCircle, tint: 'text-[#5eead4]', bg: 'bg-[rgba(20,184,166,0.15)]',
    title: 'Shaxsiylashtirilgan', body: 'Faqat sizning restoran turingizga mos xususiyatlar' },
  { Icon: Clock, tint: 'text-amber-400', bg: 'bg-amber-500/15',
    title: '30 daqiqa', body: 'Aniq vaqt. Cho\'zilmaydi, savollarga to\'liq javob' },
  { Icon: VideoCamera, tint: 'text-blue-400', bg: 'bg-blue-500/15',
    title: 'Onlayn yoki ofisda', body: 'Zoom/Telegram orqali yoki Toshkent ofisimizda' },
  { Icon: Headset, tint: 'text-[#ff0037]', bg: 'bg-[rgba(255,0,55,0.15)]',
    title: 'Hech qanday majburiyat', body: 'Bepul. Karta kerak emas. Yoqtirsangiz — boshlaymiz' },
];

const AGENDA = [
  { time: '00–05', title: 'Tanishuv', body: 'Sizning restoraningiz, hozirgi tizim, asosiy muammolar' },
  { time: '05–20', title: 'Live demo', body: 'Buyurtma qabul qilish, chek, smena, hisobot — sizning menyu bilan' },
  { time: '20–25', title: 'Savollar', body: 'Click/Payme, narxlar, onboarding muddati — istalgan savol' },
  { time: '25–30', title: 'Keyingi qadam', body: 'Yoqtirsangiz — 14 kun bepul akkaunt darhol yaratiladi' },
] as const;

const SLOTS = [
  { day: 'Ertaga',    date: '12 may', slots: ['10:00', '11:30', '14:00', '16:00'] },
  { day: 'Indinga',   date: '13 may', slots: ['09:00', '10:30', '13:00', '15:30', '17:00'] },
  { day: 'Payshanba', date: '14 may', slots: ['11:00', '14:30', '16:30'] },
] as const;

export default async function DemoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="bg-[#001B1B]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[500px]" />
        <div className="relative mx-auto max-w-3xl px-5 pt-20 sm:pt-24 pb-8 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-[#5eead4] text-[11px] font-bold uppercase tracking-[0.08em]">
            <PlayCircle size={11} weight="fill" />
            BEPUL DEMO
          </span>
          <h1 className="mt-5 text-[32px] sm:text-[44px] lg:text-[52px] font-extrabold leading-[1.05] tracking-tight text-white">
            30 daqiqada{' '}
            <span className="gradient-teal">o&apos;z ko&apos;zingiz bilan ko&apos;ring</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[14.5px] sm:text-[16px] leading-relaxed text-white/70">
            Restoraningiz uchun maxsus sozlangan namoyish. Sizning menyu va biznes shartlaringiz bilan ishlaydi.
          </p>
        </div>
      </section>

      {/* Perks */}
      <section className="pb-6">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PERKS.map((p) => (
              <article key={p.title} className="glass-card glass-card-hover rounded-2xl p-5">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${p.bg}`}>
                  <p.Icon size={20} weight="bold" className={p.tint} />
                </span>
                <h3 className="mt-3.5 text-[14px] font-bold text-white">{p.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Slots */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-5 grid gap-5 lg:grid-cols-[3fr_2fr]">
          {/* Form */}
          <div className="glass-card rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                <CalendarBlank size={20} weight="bold" className="text-[#5eead4]" />
              </span>
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#5eead4]">
                  Demo bron qiling
                </p>
                <h2 className="text-[22px] font-extrabold tracking-tight text-white">
                  Sizga qulay vaqtni tanlang
                </h2>
              </div>
            </div>
            <DemoForm />
          </div>

          {/* Sidebar */}
          <aside className="space-y-3">
            {/* Quick slots */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                  <Lightning size={15} weight="bold" className="text-[#5eead4]" />
                </span>
                <h3 className="text-[14px] font-bold text-white">Tezkor vaqtlar</h3>
              </div>
              <p className="mt-2 text-[11.5px] text-white/55">
                Bo&apos;sh slotlardan birini tanlang — darhol tasdiqlanadi
              </p>
              <div className="mt-3.5 space-y-3">
                {SLOTS.map((s) => (
                  <div key={s.day}>
                    <div className="flex items-baseline justify-between text-[11.5px]">
                      <span className="font-bold text-white">{s.day}</span>
                      <span className="tabular text-white/50">{s.date}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {s.slots.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className="press tabular inline-flex h-7 items-center px-2.5 rounded-md border border-white/[0.10] bg-white/[0.04] text-white/75 text-[11px] font-semibold hover:bg-[rgba(20,184,166,0.12)] hover:border-[#5eead4]/40 hover:text-white transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Agenda */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-amber-500/15">
                  <Monitor size={15} weight="bold" className="text-amber-400" />
                </span>
                <h3 className="text-[14px] font-bold text-white">30 daqiqa nima bo&apos;ladi</h3>
              </div>
              <ol className="mt-3.5 space-y-2">
                {AGENDA.map((a) => (
                  <li key={a.time} className="flex items-start gap-2.5">
                    <span className="tabular shrink-0 text-[10px] font-bold text-[#5eead4] bg-[rgba(20,184,166,0.12)] ring-1 ring-inset ring-[#5eead4]/25 rounded px-1.5 py-0.5">
                      {a.time}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-bold text-white">{a.title}</div>
                      <div className="text-[11px] text-white/55 leading-snug">{a.body}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Testimonial */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-1 text-amber-400 text-[12px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={11} weight="fill" />
                ))}
              </div>
              <p className="mt-2.5 text-[12px] leading-relaxed text-white/80 italic">
                &ldquo;Demo'dan keyin shu kuni qaror qildim. Mutaxassis butun jarayonni — bizning menyu bilan — ko&apos;rsatdi.&rdquo;
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-inset ring-white/15 bg-[rgba(20,184,166,0.18)] text-[#5eead4] text-[10px] font-bold">
                  MK
                </span>
                <div className="leading-tight">
                  <div className="text-[11.5px] font-bold text-white">Madina Karimova</div>
                  <div className="text-[10px] text-white/50">Cafe Aroma, Samarqand</div>
                </div>
              </div>
            </div>

            {/* Direct */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-[13px] font-bold text-white">Forma to&apos;ldirgingiz kelmayaptimi?</h3>
              <p className="mt-1 text-[11.5px] text-white/55">
                Telegramda yozing — 5 daqiqada slot tanlaymiz.
              </p>
              <a
                href="https://t.me/mypos_uz"
                target="_blank"
                rel="noopener noreferrer"
                className="press mt-3 inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg bg-[#26A5E4] hover:bg-[#1d8fc7] text-white text-[12px] font-bold transition-colors"
              >
                <TelegramLogo size={12} weight="fill" />
                @mypos_uz
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card rounded-2xl p-6 sm:p-7">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              {[
                { v: '500+', l: 'demo o\'tkazilgan' },
                { v: '94%',  l: 'demo → mijoz' },
                { v: '30',   l: 'daqiqa o\'rtacha' },
                { v: '4.9',  l: 'demo reytingi' },
              ].map((s) => (
                <div key={s.l}>
                  <div className="tabular text-[24px] font-extrabold text-white">{s.v}</div>
                  <div className="text-[11px] text-white/55 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-5">
          <div className="text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Demo haqida
            </p>
            <h2 className="mt-2 text-[24px] sm:text-[28px] font-extrabold tracking-tight text-white">
              Tez-tez beriladigan savollar
            </h2>
          </div>
          <div className="mt-8 space-y-2.5">
            {[
              { q: 'Demo haqiqatan bepulmi?', a: "Ha, 100% bepul. Hech qanday karta yoki to'lov ma'lumotini so'ramaymiz." },
              { q: "Demo'dan keyin majburiyat bormi?", a: "Yo'q. Yoqtirsangiz 14 kun bepul akkaunt yaratamiz. Yoqtirmasangiz — hech narsa bo'lmaydi." },
              { q: "Demo'ni qaysi tilda o'tkaziladi?", a: "O'zbek (lotin/kirill), rus yoki ingliz tillarida — siz tanlaysiz." },
              { q: 'Texnik bilim talab qilinadimi?', a: "Mutlaqo yo'q. Mutaxassis hammasini oddiy tilda tushuntiradi." },
              { q: 'Kompaniyamiz katta — maxsus demo mumkinmi?', a: "Ha. 5+ filial uchun maxsus 60 daqiqalik enterprise demo o'tkazamiz — tarmoq xususiyatlari va integratsiyalar bilan." },
            ].map((f, idx) => (
              <details key={f.q} className="glass-card rounded-2xl group" open={idx === 0}>
                <summary className="press flex cursor-pointer items-center gap-3 px-5 py-4 list-none">
                  <span className="min-w-0 flex-1 text-[14px] font-bold text-white">{f.q}</span>
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-white/15 bg-white/[0.05] text-white/70 group-open:bg-[#5eead4]/15 group-open:text-[#5eead4] group-open:ring-[#5eead4]/30 transition-colors">
                    <ArrowRight size={11} weight="bold" className="group-open:rotate-90 transition-transform" />
                  </span>
                </summary>
                <div className="px-5 pb-5 -mt-1 text-[13px] leading-relaxed text-white/70">
                  {f.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}
