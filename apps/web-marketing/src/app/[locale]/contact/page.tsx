import {
  ArrowRight,
  Buildings,
  ChatCircleDots,
  Clock,
  EnvelopeSimple,
  FacebookLogo,
  Handshake,
  Headset,
  Heart,
  InstagramLogo,
  LinkedinLogo,
  MapPin,
  Phone,
  Sparkle,
  Storefront,
  TelegramLogo,
  YoutubeLogo,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ContactForm } from '@/components/landing/contact-form';
import { CtaSection } from '@/components/landing/cta-section';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: "Bog'lanish — MyPOS",
  description: "MyPOS jamoasi bilan bog'laning. Telegram, telefon, email yoki ofisga tashrif. 24/7 yordam.",
};

type Channel = {
  Icon: Icon;
  tint: string;
  bg: string;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
  badge?: string;
};

const CHANNELS: ReadonlyArray<Channel> = [
  {
    Icon: TelegramLogo, tint: 'text-[#26A5E4]', bg: 'bg-[rgba(38,165,228,0.15)]',
    label: 'Telegram (eng tez)', value: '@mypos_uz',
    href: 'https://t.me/mypos_uz', external: true, badge: 'Onlayn',
  },
  {
    Icon: Phone, tint: 'text-emerald-400', bg: 'bg-emerald-500/15',
    label: 'Qo\'ng\'iroq qiling', value: '+998 71 200 60 60',
    href: 'tel:+998712006060',
  },
  {
    Icon: EnvelopeSimple, tint: 'text-amber-400', bg: 'bg-amber-500/15',
    label: 'Email', value: 'salom@mypos.uz',
    href: 'mailto:salom@mypos.uz',
  },
  {
    Icon: MapPin, tint: 'text-[#ff0037]', bg: 'bg-[rgba(255,0,55,0.15)]',
    label: 'Ofis manzili',
    value: "Toshkent, Mirzo Ulug'bek tumani, Innovation Hub",
  },
];

const DEPARTMENTS: ReadonlyArray<{
  Icon: Icon; tint: string; bg: string;
  title: string; body: string; contact: string; href: string;
}> = [
  {
    Icon: Storefront, tint: 'text-[#5eead4]', bg: 'bg-[rgba(20,184,166,0.15)]',
    title: "Sotuv bo'limi",
    body: "Demo so'rash, narxlar, hamkorlik shartnomasi",
    contact: 'sotuv@mypos.uz', href: 'mailto:sotuv@mypos.uz',
  },
  {
    Icon: Headset, tint: 'text-[#ff0037]', bg: 'bg-[rgba(255,0,55,0.15)]',
    title: "Texnik yordam 24/7",
    body: "Kassa muammosi, terminal nosozligi, smena hisoboti",
    contact: '+998 71 200 60 60', href: 'tel:+998712006060',
  },
  {
    Icon: Handshake, tint: 'text-purple-400', bg: 'bg-purple-500/15',
    title: 'Hamkorlik',
    body: "Yangi shahar, distributor, integrator dasturi",
    contact: 'hamkor@mypos.uz', href: 'mailto:hamkor@mypos.uz',
  },
  {
    Icon: Heart, tint: 'text-rose-400', bg: 'bg-rose-500/15',
    title: 'OAV va press',
    body: "Intervyu, statistika, media materiallar",
    contact: 'press@mypos.uz', href: 'mailto:press@mypos.uz',
  },
];

const HOURS = [
  { day: 'Dushanba–Juma', time: '09:00 – 19:00' },
  { day: 'Shanba',        time: '10:00 – 15:00' },
  { day: 'Yakshanba',     time: 'Dam olish' },
] as const;

const SOCIAL: ReadonlyArray<{ Icon: Icon; href: string; label: string; hover: string }> = [
  { Icon: TelegramLogo,  href: 'https://t.me/mypos_uz',          label: 'Telegram',  hover: 'hover:text-[#26A5E4] hover:border-[#26A5E4]/40' },
  { Icon: InstagramLogo, href: 'https://instagram.com/mypos.uz', label: 'Instagram', hover: 'hover:text-[#E4405F] hover:border-[#E4405F]/40' },
  { Icon: YoutubeLogo,   href: 'https://youtube.com/@mypos',     label: 'YouTube',   hover: 'hover:text-[#FF0000] hover:border-[#FF0000]/40' },
  { Icon: LinkedinLogo,  href: 'https://linkedin.com/company/mypos', label: 'LinkedIn', hover: 'hover:text-[#0A66C2] hover:border-[#0A66C2]/40' },
  { Icon: FacebookLogo,  href: 'https://facebook.com/mypos.uz',  label: 'Facebook',  hover: 'hover:text-[#1877F2] hover:border-[#1877F2]/40' },
];

const FAQ: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: "Demo bepulmi?",
    a: "Ha, 30 daqiqalik onlayn demo to'liq bepul. Toshkentdagi ofisimizga tashrif buyursangiz ham mumkin — haqiqiy kassada sinab ko'rasiz.",
  },
  {
    q: "Qachon javob beradi?",
    a: "Telegramda 5 daqiqada, telefonda darhol. Email orqali ish soatlarida — 4 soat ichida javob beramiz.",
  },
  {
    q: "Bepul sinov bormi?",
    a: "Ha, 14 kun bepul foydalanish. Karta kerak emas. Tugagandan keyin xohlasangiz ulashishingiz mumkin.",
  },
  {
    q: "Viloyatda yordam beradimi?",
    a: "Ha, butun O'zbekiston bo'ylab. Toshkent + 11 viloyatda onboarding mutaxassislari bor.",
  },
];

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#001B1B]">
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[500px]" />
        <div className="relative mx-auto max-w-3xl px-5 pt-20 sm:pt-24 pb-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-[#5eead4] text-[11px] font-bold uppercase tracking-[0.08em]">
            <ChatCircleDots size={11} weight="fill" />
            BOG&apos;LANISH
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            Biz bilan{' '}
            <span className="gradient-teal">gaplashaylik</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            Demo so&apos;rash, narxlar, texnik savol yoki shunchaki salom — istalgan vaqtda yozing. Telegramda 5 daqiqada javob beramiz.
          </p>
        </div>
      </section>

      {/* Channels grid */}
      <section className="bg-[#001B1B] pb-6">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CHANNELS.map((c) => {
              const inner = (
                <>
                  <div className="flex items-start justify-between">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${c.bg}`}>
                      <c.Icon size={20} weight={c.Icon === TelegramLogo ? 'fill' : 'bold'} className={c.tint} />
                    </span>
                    {c.badge ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 ring-1 ring-inset ring-emerald-500/25 text-emerald-300 text-[9.5px] font-bold uppercase tracking-[0.06em]">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                        </span>
                        {c.badge}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-white/55">
                    {c.label}
                  </div>
                  <div className="mt-1 text-[13.5px] font-bold text-white tabular leading-snug">
                    {c.value}
                  </div>
                </>
              );

              return c.href ? (
                <a
                  key={c.label}
                  href={c.href}
                  target={c.external ? '_blank' : undefined}
                  rel={c.external ? 'noopener noreferrer' : undefined}
                  className="glass-card glass-card-hover press group block rounded-2xl p-5"
                >
                  {inner}
                </a>
              ) : (
                <div key={c.label} className="glass-card rounded-2xl p-5">
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Form + Sidebar */}
      <section className="bg-[#001B1B] py-12 sm:py-14">
        <div className="mx-auto max-w-5xl px-5 grid gap-5 lg:grid-cols-[3fr_2fr]">
          {/* Form */}
          <div>
            <div className="mb-5">
              <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
                Xabar yuborish
              </p>
              <h2 className="mt-1.5 text-[24px] sm:text-[28px] font-extrabold tracking-tight text-white">
                Forma orqali yozing
              </h2>
              <p className="mt-2 text-[13.5px] text-white/70">
                4 ish soatida javob beramiz · UZ/RU/EN tillarida
              </p>
            </div>
            <ContactForm />
          </div>

          {/* Sidebar */}
          <aside className="space-y-3">
            {/* Hours */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-amber-500/15">
                  <Clock size={15} weight="bold" className="text-amber-400" />
                </span>
                <h3 className="text-[14px] font-bold text-white">Ish vaqti</h3>
              </div>
              <ul className="mt-3.5 space-y-1.5">
                {HOURS.map((h) => (
                  <li key={h.day} className="flex items-center justify-between text-[12.5px]">
                    <span className="text-white/65">{h.day}</span>
                    <span className="tabular font-semibold text-white">{h.time}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center gap-2 text-[11.5px] text-white/55">
                <Sparkle size={11} weight="fill" className="text-[#5eead4]" />
                <span>Texnik yordam — <span className="text-white font-semibold">24/7</span></span>
              </div>
            </div>

            {/* Office */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                  <Buildings size={15} weight="bold" className="text-[#5eead4]" />
                </span>
                <h3 className="text-[14px] font-bold text-white">Ofis tashrifi</h3>
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-white/70">
                Toshkent, Mirzo Ulug&apos;bek tumani,<br />Innovation Hub<br />
                <span className="text-white/50">5 daqiqa metroga</span>
              </p>
              <a
                href="https://yandex.uz/maps"
                target="_blank"
                rel="noopener noreferrer"
                className="press mt-4 inline-flex h-9 items-center gap-1 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
              >
                <MapPin size={12} weight="bold" />
                Xaritada ko&apos;rish
              </a>
            </div>

            {/* Social */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="text-[14px] font-bold text-white">Ijtimoiy tarmoqlar</h3>
              <p className="mt-1 text-[11.5px] text-white/55">
                Yangiliklar, taqdimotlar, video darslar
              </p>
              <div className="mt-3.5 flex items-center gap-1.5">
                {SOCIAL.map(({ Icon: SIcon, href, label, hover }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className={`press flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.10] bg-white/[0.04] text-white/70 transition-colors ${hover}`}
                  >
                    <SIcon size={16} weight="fill" />
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* Departments */}
      <section className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Bo&apos;limlar
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Kerakli bo&apos;limga yo&apos;naltiring
            </h2>
            <p className="mt-3 text-[14px] text-white/70">
              Aniq mutaxassis bilan to&apos;g&apos;ridan-to&apos;g&apos;ri bog&apos;lansangiz tezroq bo&apos;ladi.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {DEPARTMENTS.map((d) => (
              <a
                key={d.title}
                href={d.href}
                className="glass-card glass-card-hover press group rounded-2xl p-5"
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${d.bg}`}>
                  <d.Icon size={20} weight="bold" className={d.tint} />
                </span>
                <h3 className="mt-3.5 text-[14.5px] font-bold tracking-tight text-white">
                  {d.title}
                </h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">
                  {d.body}
                </p>
                <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-[#5eead4] group-hover:translate-x-0.5 transition-transform tabular">
                  {d.contact}
                  <ArrowRight size={11} weight="bold" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-3xl px-5">
          <div className="text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              FAQ
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Tez-tez beriladigan savollar
            </h2>
          </div>

          <div className="mt-10 space-y-2.5">
            {FAQ.map((f, idx) => (
              <details
                key={f.q}
                className="glass-card rounded-2xl group"
                open={idx === 0}
              >
                <summary className="press flex cursor-pointer items-center justify-between gap-3 px-5 py-4 list-none">
                  <span className="text-[14.5px] font-bold text-white">{f.q}</span>
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

          {/* Still need help */}
          <div className="glass-card mt-5 flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(38,165,228,0.15)]">
              <TelegramLogo size={16} weight="fill" className="text-[#26A5E4]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white">
                Boshqa savol bormi?
              </div>
              <div className="text-[11.5px] text-white/55">
                Telegramda yozing — 5 daqiqada javob beramiz.
              </div>
            </div>
            <a
              href="https://t.me/mypos_uz"
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex h-9 items-center gap-1 px-3.5 rounded-lg bg-[#26A5E4] hover:bg-[#1d8fc7] text-white text-[12px] font-bold transition-colors"
            >
              Telegram
              <ArrowRight size={11} weight="bold" />
            </a>
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}
