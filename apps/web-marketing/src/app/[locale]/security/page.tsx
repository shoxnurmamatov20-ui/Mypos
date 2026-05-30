import {
  ArrowRight,
  Bell,
  Bug,
  CalendarBlank,
  CheckCircle,
  Clock,
  Database,
  EnvelopeSimple,
  Eye,
  Fingerprint,
  HardDrives,
  Key,
  Lock,
  MagnifyingGlass,
  Pulse,
  ShieldCheck,
  ShieldStar,
  Sparkle,
  TelegramLogo,
  Trophy,
  UserCircle,
  UsersThree,
  Warning,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'Xavfsizlik — MyPOS',
  description: "MyPOS qanday himoyalaydi: shifrlash, 2FA, audit, monitoring va incident response. ISO/SOC darajasidagi infratuzilma.",
};

const LAST_AUDIT = '2026-04-15';

type Stat = { value: string; label: string; Icon: Icon };

const STATS: ReadonlyArray<Stat> = [
  { value: '256', label: "bit AES shifrlash", Icon: Lock },
  { value: '99.99%', label: "uptime SLA",     Icon: Pulse },
  { value: '24/7', label: "monitoring",       Icon: Eye },
  { value: '0',   label: "ma'lumot yo'qotish",Icon: ShieldCheck },
];

type Pillar = { Icon: Icon; tint: string; bg: string; title: string; body: string; items: ReadonlyArray<string> };

const PILLARS: ReadonlyArray<Pillar> = [
  {
    Icon: Lock, tint: 'text-[#5eead4]', bg: 'bg-[rgba(20,184,166,0.15)]',
    title: 'Shifrlash',
    body: "Barcha ma'lumotlar harakat va saqlash paytida shifrlangan.",
    items: [
      'TLS 1.3 — yangi standart, oldingi versiyalar yo\'q',
      'AES-256 — diskda saqlangan har bir bayt shifrlangan',
      'bcrypt + salt — parollar hech qachon ochiq saqlanmaydi',
      'Sertifikatlarning avtomatik yangilanishi (Let\'s Encrypt)',
    ],
  },
  {
    Icon: Fingerprint, tint: 'text-blue-400', bg: 'bg-blue-500/15',
    title: 'Autentifikatsiya',
    body: "Akkauntingizga kirish faqat sizga ruxsat etilgan usullar bilan.",
    items: [
      '2FA (ikki bosqichli) — SMS, Telegram yoki Google Authenticator',
      'Biometriya — Face ID / Touch ID mobil ilovada',
      'Smena va xodim PIN-kodi (4-6 raqam)',
      'Session timeout — 24 soatdan keyin avtomatik chiqish',
    ],
  },
  {
    Icon: UsersThree, tint: 'text-purple-400', bg: 'bg-purple-500/15',
    title: 'Ruxsat boshqaruvi',
    body: "Har bir xodim faqat o'z roliga tegishli ma'lumotni ko'radi.",
    items: [
      'RBAC — rol asosida ruxsat (egasi, menejer, ofitsiant, oshpaz)',
      'Bo\'lim va filial bo\'yicha cheklash',
      'IP-manzil bo\'yicha kirishni cheklash',
      'Har bir harakat — kim, qachon, qayerdan — log qilinadi',
    ],
  },
  {
    Icon: Database, tint: 'text-amber-400', bg: 'bg-amber-500/15',
    title: "Ma'lumot infratuzilmasi",
    body: "O'zbekiston hududidagi sertifikatlangan ma'lumot markazlari.",
    items: [
      'UZCLOUD (Toshkent) — Tier III sertifikat',
      'Beeline DC (zaxira) — alohida hudud',
      'Har 6 soatda avtomatik backup',
      '30 kunlik point-in-time recovery',
    ],
  },
  {
    Icon: Eye, tint: 'text-emerald-400', bg: 'bg-emerald-500/15',
    title: 'Monitoring va aniqlash',
    body: "Har sekundda yuzlab signal kuzatiladi va anomaliyalar avtomatik aniqlanadi.",
    items: [
      '24/7 SOC (Security Operations Center)',
      'Anomaly detection — odatdan tashqari faollik aniqlash',
      'Rate limiting — DDoS va brute-force himoyasi',
      "WAF (Web Application Firewall) — SQL injection, XSS",
    ],
  },
  {
    Icon: ShieldStar, tint: 'text-[#ff0037]', bg: 'bg-[rgba(255,0,55,0.15)]',
    title: 'Incident javob',
    body: "Muammo yuz bersa — tezkor va shaffof javob.",
    items: [
      'O\'rtacha aniqlash vaqti (MTTD): 7 daqiqa',
      'O\'rtacha javob vaqti (MTTR): 23 daqiqa',
      '4 soat ichida ta\'sirlangan mijozlarga xabar',
      "Har bir incident uchun post-mortem hisobot",
    ],
  },
];

type Compliance = { Icon: Icon; tint: string; bg: string; label: string; body: string; status: 'active' | 'in-progress' };

const COMPLIANCE: ReadonlyArray<Compliance> = [
  { Icon: ShieldCheck, tint: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'GDPR mos',          body: "Ma'lumot huquqlari, eksport, o'chirish",   status: 'active' },
  { Icon: ShieldCheck, tint: 'text-emerald-400', bg: 'bg-emerald-500/15', label: 'PCI DSS L4',        body: "To'lov kartalari xavfsizligi",              status: 'active' },
  { Icon: ShieldCheck, tint: 'text-emerald-400', bg: 'bg-emerald-500/15', label: "O'z DSt 1106:2009", body: "O'zbekiston axborot xavfsizligi standarti", status: 'active' },
  { Icon: Clock,       tint: 'text-amber-400',   bg: 'bg-amber-500/15',   label: 'ISO 27001',         body: "Sertifikatlash jarayoni (Q4 2026)",        status: 'in-progress' },
  { Icon: Clock,       tint: 'text-amber-400',   bg: 'bg-amber-500/15',   label: 'SOC 2 Type II',     body: "Audit boshlandi (2026-Q3)",                 status: 'in-progress' },
];

type Practice = { Icon: Icon; title: string; body: string };

const PRACTICES: ReadonlyArray<Practice> = [
  { Icon: Bug,            title: "Bug Bounty dasturi",        body: "Topilgan xatolik uchun $50–$5,000 mukofot. responsibly@mypos.uz" },
  { Icon: MagnifyingGlass,title: "Penetration test",          body: "Yiliga 2 marta mustaqil tashqi audit (so'nggi: 2026-04-15)" },
  { Icon: UserCircle,     title: "Xodimlar tekshiruvi",       body: "Har bir muhandis NDA + xavfsizlik treningi · Background check" },
  { Icon: HardDrives,     title: "Zaxira va tiklash",         body: "Har 6 soatda · 30 kun PITR · Ofsayt geo-redundant" },
  { Icon: Sparkle,        title: "Yangi versiya — tezda",     body: "Kritik patch'lar 24 soat ichida deploy qilinadi" },
  { Icon: Bell,           title: "Sezilarli o'zgarish",       body: "Har akkaunt o'zgarishi haqida sizga darhol xabar" },
];

type Sla = { metric: string; target: string; current: string };

const SLA: ReadonlyArray<Sla> = [
  { metric: 'Uptime SLA',              target: '99.99%',  current: '99.997%' },
  { metric: "MTTD (aniqlash)",         target: '< 15 min',current: '7 min'   },
  { metric: "MTTR (yechish)",          target: '< 60 min',current: '23 min'  },
  { metric: 'Backup chastotasi',       target: '6 soat',  current: '4 soat'  },
  { metric: "Patch deploy (kritik)",  target: '< 24 soat',current: '6 soat'  },
];

type Faq = { q: string; a: string };

const FAQ: ReadonlyArray<Faq> = [
  {
    q: "Ma'lumotlarim qayerda saqlanadi?",
    a: "Barcha ma'lumotlar O'zbekistondagi UZCLOUD ma'lumot markazida saqlanadi. Zaxira nusxa Beeline DC'da. Ma'lumot hech qachon mamlakat tashqarisiga chiqmaydi.",
  },
  {
    q: "MyPOS xodimlari ma'lumotlarimni ko'radimi?",
    a: "Faqat siz ruxsat bergan taqdirda va texnik muammoni hal qilish uchun. Har bir kirish log qilinadi va siz ko'rishingiz mumkin. To'lov kartasi raqamlari hech qachon ko'rinmaydi.",
  },
  {
    q: "Xavfsizlik buzilishi yuz bersa nima qilasiz?",
    a: "4 soat ichida ta'sirlangan barcha mijozlarga email va Telegram orqali xabar beramiz. Status page'da real-time yangilanish. Har incident uchun ochiq post-mortem chiqaramiz.",
  },
  {
    q: "Parolimni unutsam nima bo'ladi?",
    a: "Email orqali reset link yuboriladi (15 daqiqa amal qiladi). 2FA yoqilgan bo'lsa, qo'shimcha tasdiqlash kerak bo'ladi. Backup kodlar — akkaunt yaratishda bir martalik berilgan.",
  },
  {
    q: "Xavfsizlik bo'yicha buzilish topdim — qanday xabar bermoq kerak?",
    a: "responsibly@mypos.uz manziliga shifrlangan email yuboring. PGP key sahifa pastida. Responsible disclosure dasturi orqali $50–$5,000 mukofot olishingiz mumkin.",
  },
];

export default async function SecurityPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#001B1B]">
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[500px]" />
        <div className="relative mx-auto max-w-3xl px-5 pt-20 sm:pt-24 pb-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-[#5eead4] text-[11px] font-bold uppercase tracking-[0.08em]">
            <ShieldCheck size={11} weight="fill" />
            XAVFSIZLIK
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            Bank darajasidagi{' '}
            <span className="gradient-teal">himoya</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            Restoraningizning butun ma&apos;lumoti — buyurtmadan to&apos;lovgacha — har soniyada himoyalangan. ISO va PCI darajasidagi infratuzilma.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-[11.5px]">
            <a
              href="https://status.mypos.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 font-bold hover:bg-emerald-500/15 transition-colors"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              Tizim normal · status.mypos.uz
            </a>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/[0.10] bg-white/[0.04] text-white/70">
              <CalendarBlank size={11} weight="bold" className="text-[#5eead4]" />
              So&apos;nggi audit: <span className="tabular text-white font-semibold">{LAST_AUDIT}</span>
            </span>
          </div>

          {/* Stats */}
          <div className="glass-card mx-auto mt-12 grid max-w-3xl grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden">
            {STATS.map((s) => (
              <div key={s.label} className="px-3 py-5 text-center bg-white/[0.02]">
                <s.Icon size={18} weight="bold" className="mx-auto mb-2 text-[#5eead4]" aria-hidden="true" />
                <div className="tabular text-[22px] sm:text-[24px] font-extrabold leading-none text-white">
                  {s.value}
                </div>
                <div className="mt-1 text-[10.5px] sm:text-[11px] font-semibold text-white/60">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 pillars */}
      <section className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              6 ta tamoyil
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Bizning himoya yondashuvimiz
            </h2>
            <p className="mt-3 text-[14px] text-white/70">
              Har bir qatlamda mustaqil mexanizm. Birortasi buzilsa — boshqa qatlamlar to&apos;sib qoladi.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PILLARS.map((p) => (
              <article key={p.title} className="glass-card glass-card-hover rounded-2xl p-5">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${p.bg}`}>
                  <p.Icon size={20} weight="bold" className={p.tint} />
                </span>
                <h3 className="mt-3.5 text-[15.5px] font-bold tracking-tight text-white">{p.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65">{p.body}</p>

                <ul className="mt-4 space-y-1.5">
                  {p.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-[11.5px] text-white/70">
                      <CheckCircle size={11} weight="fill" className="mt-[3px] text-[#5eead4] shrink-0" />
                      <span className="leading-relaxed">{it}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SLA / performance metrics */}
      <section className="bg-[#001B1B] py-12 sm:py-14">
        <div className="mx-auto max-w-3xl px-5">
          <div className="text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Real ko&apos;rsatkichlar
            </p>
            <h2 className="mt-3 text-[24px] sm:text-[32px] font-extrabold tracking-tight text-white">
              SLA — va&apos;da emas, fakt
            </h2>
            <p className="mt-3 text-[13.5px] text-white/70">
              Bizning va&apos;dalarimiz va so&apos;nggi 30 kun ichidagi haqiqiy ko&apos;rsatkichlarimiz.
            </p>
          </div>

          <div className="glass-card mt-8 rounded-2xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-3 px-5 py-3 border-b border-white/[0.06] text-[10px] font-bold uppercase tracking-[0.08em] text-white/55">
              <span>Ko&apos;rsatkich</span>
              <span className="text-right">Va&apos;da</span>
              <span className="text-right">Hozir</span>
            </div>
            <ul className="divide-y divide-white/[0.06]">
              {SLA.map((s) => (
                <li
                  key={s.metric}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-y-1 gap-x-3 px-5 py-3.5 text-[13px]"
                >
                  <span className="font-semibold text-white">{s.metric}</span>
                  <span className="tabular text-white/65 sm:text-right">{s.target}</span>
                  <span className="tabular font-bold text-emerald-300 sm:text-right">
                    {s.current}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11.5px] text-white/55">
            <span>So&apos;nggi 30 kun · status.mypos.uz</span>
            <a
              href="https://status.mypos.uz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-bold text-[#5eead4] hover:text-white transition-colors"
            >
              Status page
              <ArrowRight size={11} weight="bold" />
            </a>
          </div>
        </div>
      </section>

      {/* Compliance & certifications */}
      <section className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Sertifikatlar
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Mos kelish va auditlar
            </h2>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COMPLIANCE.map((c) => (
              <article
                key={c.label}
                className="glass-card glass-card-hover rounded-2xl p-5 relative"
              >
                <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${c.bg}`}>
                  <c.Icon size={22} weight="bold" className={c.tint} />
                </span>
                <h3 className="mt-3.5 text-[15px] font-bold tracking-tight text-white">{c.label}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">{c.body}</p>

                <span
                  className={`mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full ring-1 ring-inset text-[9.5px] font-bold uppercase tracking-[0.06em] ${
                    c.status === 'active'
                      ? 'bg-emerald-500/12 text-emerald-300 ring-emerald-500/25'
                      : 'bg-amber-500/12 text-amber-300 ring-amber-500/25'
                  }`}
                >
                  {c.status === 'active' ? (
                    <>
                      <CheckCircle size={10} weight="fill" />
                      Faol
                    </>
                  ) : (
                    <>
                      <Clock size={10} weight="bold" />
                      Jarayonda
                    </>
                  )}
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Operational practices */}
      <section className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Amaliyot
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Har kuni bajaradigan ishlar
            </h2>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PRACTICES.map((p) => (
              <article key={p.title} className="glass-card glass-card-hover rounded-2xl p-5 flex gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                  <p.Icon size={20} weight="bold" className="text-[#5eead4]" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-bold tracking-tight text-white">{p.title}</h3>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">{p.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Responsible disclosure */}
      <section className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-10 grid gap-6 md:grid-cols-2 md:items-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 0% 0%, rgba(255,0,55,0.15), transparent 50%), radial-gradient(circle at 100% 100%, rgba(20,184,166,0.18), transparent 50%)',
              }}
            />
            <div className="relative">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(255,0,55,0.15)]">
                <Bug size={22} weight="bold" className="text-[#ff0037]" />
              </div>
              <h2 className="mt-4 text-[24px] sm:text-[28px] font-extrabold tracking-tight text-white leading-[1.15]">
                Bug Bounty dasturi
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-white/75">
                Xavfsizlik buzilishini topgan tadqiqotchilar uchun mukofot. Mas&apos;uliyatli ravishda xabar bering — biz minnatdormiz.
              </p>

              <ul className="mt-5 space-y-2">
                {[
                  { range: '$50 – $250',    label: 'Low — UX yoki minor info' },
                  { range: '$250 – $1,000', label: 'Medium — autentifikatsiya zaifligi' },
                  { range: '$1,000 – $3,000',label: 'High — ma\'lumot tarqalishi' },
                  { range: '$3,000 – $5,000',label: 'Critical — RCE yoki ma\'lumot tortish' },
                ].map((t) => (
                  <li key={t.range} className="flex items-center gap-3 text-[12.5px]">
                    <span className="tabular font-bold text-emerald-300 w-32 shrink-0">{t.range}</span>
                    <span className="text-white/70">{t.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div className="rounded-2xl ring-1 ring-inset ring-white/10 bg-[rgba(0,16,16,0.55)] backdrop-blur-md overflow-hidden">
                <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-white/[0.06]">
                  <span className="h-2 w-2 rounded-full bg-[#ff605c]" />
                  <span className="h-2 w-2 rounded-full bg-[#ffbd44]" />
                  <span className="h-2 w-2 rounded-full bg-[#00ca4e]" />
                  <span className="ml-2 text-[10.5px] font-semibold text-white/45">
                    responsibly@mypos.uz
                  </span>
                </div>
                <pre className="text-[11.5px] leading-relaxed text-white/85 px-4 py-3.5 overflow-x-auto font-mono tabular">
{`To: responsibly@mypos.uz
Subject: [Bug Bounty] <qisqacha>

# Topilgan zaiflik
- Tur: SQL injection / XSS / RCE / IDOR
- Joy: https://mypos.uz/...
- CVSS: 7.5 (High)

# Qadamlar
1. ...
2. ...
3. ...

# Ta'sir
...

# Yechim taklifi
...

PGP key: keybase.io/mypos`}
                </pre>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href="mailto:responsibly@mypos.uz"
                  className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13px] font-bold transition-colors"
                >
                  <EnvelopeSimple size={13} weight="bold" />
                  Xabar yuborish
                </a>
                <a
                  href="https://keybase.io/mypos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[13px] font-bold hover:bg-white/[0.12] transition-colors"
                >
                  <Key size={13} weight="bold" />
                  PGP kalit
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What we don't do */}
      <section className="bg-[#001B1B] py-12">
        <div className="mx-auto max-w-3xl px-5">
          <div className="glass-card rounded-2xl p-6 sm:p-7">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(255,0,55,0.15)]">
                <Warning size={20} weight="bold" className="text-[#ff0037]" />
              </span>
              <div>
                <h2 className="text-[18px] sm:text-[20px] font-extrabold tracking-tight text-white">
                  Biz hech qachon qilmaymiz
                </h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-white/65">
                  Bu narsalarni so&apos;rasalar — bu firibgar.
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-2">
              {[
                "Telefon, SMS yoki Telegram orqali parolingizni so'rash",
                "To'lov karta raqami, CVV yoki PIN-kodingizni so'rash",
                "Email orqali \"akkauntingizni tasdiqlash\" havolasini yuborish",
                "Texnik yordam nomidan AnyDesk/TeamViewer'ga ulanishni so'rash",
                "Pulni tezda boshqa kartaga o'tkazishni talab qilish",
                "\"Xavfsizlik kodi\"ni boshqa odamga aytish",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] text-white/75">
                  <Warning size={13} weight="bold" className="mt-[3px] text-[#ff0037] shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center gap-2.5 px-4 py-3 rounded-xl ring-1 ring-inset ring-[#5eead4]/20 bg-[rgba(20,184,166,0.06)]">
              <Sparkle size={14} weight="fill" className="text-[#5eead4] shrink-0" />
              <p className="text-[12px] leading-relaxed text-white/80">
                Shubhali xabar olsangiz — uni o&apos;chirib, darhol{' '}
                <a href="https://t.me/mypos_uz" target="_blank" rel="noopener noreferrer" className="font-bold text-[#5eead4] hover:text-white transition-colors">
                  @mypos_uz Telegram
                </a>
                {' '}orqali xabar bering.
              </p>
            </div>
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
              Xavfsizlik bo&apos;yicha savollar
            </h2>
          </div>

          <div className="mt-10 space-y-2.5">
            {FAQ.map((f, idx) => (
              <details
                key={f.q}
                className="glass-card rounded-2xl group"
                open={idx === 0}
              >
                <summary className="press flex cursor-pointer items-center gap-3 px-5 py-4 list-none">
                  <span className="min-w-0 flex-1 text-[14.5px] font-bold text-white">{f.q}</span>
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

      {/* Hall of fame */}
      <section className="bg-[#001B1B] py-12">
        <div className="mx-auto max-w-3xl px-5">
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-amber-500/15">
              <Trophy size={22} weight="bold" className="text-amber-400" />
            </div>
            <h3 className="mt-4 text-[18px] font-bold text-white">Sharaf taxtasi</h3>
            <p className="mt-2 text-[12.5px] text-white/65 max-w-[28rem] mx-auto">
              Bizga zaiflik xabar bergan tadqiqotchilarga rahmat. Sizning ismingiz ham bu yerda bo&apos;lishi mumkin.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5">
              {['@dilshod_sec', '@bekmurodov', 'anonimous_42', '@cyber_uz', '@bug_hunter'].map((h) => (
                <span
                  key={h}
                  className="inline-flex h-7 items-center px-2.5 rounded-full border border-white/[0.10] bg-white/[0.04] text-white/70 text-[11px] font-mono"
                >
                  {h}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact + related */}
      <section className="bg-[#001B1B] py-12">
        <div className="mx-auto max-w-5xl px-5 space-y-3">
          <div className="glass-card rounded-2xl px-6 py-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-white">Xavfsizlik bo&apos;yicha bog&apos;lanish</h3>
              <p className="mt-1 text-[12px] text-white/55">
                Buzilish · Maslahat · PGP-shifrlangan xabar — barchasi bir manzilga.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="mailto:security@mypos.uz"
                className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13px] font-bold transition-colors"
              >
                <EnvelopeSimple size={13} weight="bold" />
                security@mypos.uz
              </a>
              <a
                href="https://t.me/mypos_security"
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg bg-[#26A5E4] hover:bg-[#1d8fc7] text-white text-[13px] font-bold transition-colors"
              >
                <TelegramLogo size={13} weight="fill" />
                Telegram
              </a>
            </div>
          </div>

          <div className="glass-card rounded-2xl px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[14px] font-bold text-white">Boshqa huquqiy hujjatlar</h3>
              <p className="mt-1 text-[11.5px] text-white/55">
                Maxfiylik, shartlar va cookie siyosati.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/${locale}/privacy`}
                className="press inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
              >
                <ShieldCheck size={12} weight="bold" />
                Maxfiylik
              </Link>
              <Link
                href={`/${locale}/terms`}
                className="press inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
              >
                Shartlar
              </Link>
              <Link
                href={`/${locale}/cookies`}
                className="press inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
              >
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}
