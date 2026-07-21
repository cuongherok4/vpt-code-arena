import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Code2, Trophy, ArrowRight, Zap,
  Users, Star, CheckCircle, ChevronRight,
  GraduationCap, Cpu, Swords,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */
const features = [
  {
    icon: GraduationCap,
    title: 'Học lập trình',
    description: 'Lộ trình bài bản cho Java, C và Python. Từ cơ bản đến nâng cao với bài tập thực hành phong phú.',
    href: '/learn',
    accentColor: '#38bdf8',
    accentBg: 'rgba(56,189,248,0.08)',
    accentBorder: 'rgba(56,189,248,0.2)',
    accentHover: 'rgba(56,189,248,0.14)',
    tag: 'Java · C · Python',
  },
  {
    icon: Cpu,
    title: 'Kỳ thi trực tuyến',
    description: 'Hàng trăm bài thi được thiết kế bởi chuyên gia. Rèn luyện kỹ năng giải thuật mỗi ngày.',
    href: '/exam',
    accentColor: '#f59e0b',
    accentBg: 'rgba(245,158,11,0.08)',
    accentBorder: 'rgba(245,158,11,0.2)',
    accentHover: 'rgba(245,158,11,0.14)',
    tag: 'Algorithms · Data Structures',
  },
  {
    icon: Swords,
    title: 'Thách đấu 1v1',
    description: 'Vào phòng, chọn bài, code nhanh hơn đối thủ. Hệ thống xếp hạng Elo theo thời gian thực.',
    href: '/battle',
    accentColor: '#34d399',
    accentBg: 'rgba(52,211,153,0.08)',
    accentBorder: 'rgba(52,211,153,0.2)',
    accentHover: 'rgba(52,211,153,0.14)',
    tag: 'Real-time · ELO Rating',
  },
];

const stats = [
  { label: 'Bài tập', value: 500, suffix: '+', icon: Code2, color: '#38bdf8' },
  { label: 'Lập trình viên', value: 2000, suffix: '+', icon: Users, color: '#f59e0b' },
  { label: 'Trận / tháng', value: 10000, suffix: '+', icon: Zap, color: '#34d399' },
  { label: 'Ngôn ngữ HĐ', value: 3, suffix: '', icon: Star, color: '#a78bfa' },
];

const highlights = [
  'Trình chấm bài Judge0',
  'Battle thời gian thực',
  'Theo dõi tiến độ',
  'Bảng xếp hạng Elo',
];

const steps = [
  {
    num: '01',
    title: 'Tạo tài khoản',
    desc: 'Đăng ký miễn phí trong vài giây. Không cần thẻ tín dụng.',
    color: '#38bdf8',
  },
  {
    num: '02',
    title: 'Chọn lộ trình',
    desc: 'Java, C hoặc Python — học theo tốc độ và mục tiêu của bạn.',
    color: '#f59e0b',
  },
  {
    num: '03',
    title: 'Chinh phục mục tiêu',
    desc: 'Thi đấu, leo thang bảng xếp hạng và ghi dấu ấn của mình.',
    color: '#34d399',
  },
];

/* ─────────────────────────────────────────────────────────
   ANIMATED NUMBER (count-up on scroll into view)
───────────────────────────────────────────────────────── */
function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const DURATION = 1500;
          const STEPS = 60;
          const increment = target / STEPS;
          let cur = 0;
          const id = setInterval(() => {
            cur = Math.min(cur + increment, target);
            setCount(Math.round(cur));
            if (cur >= target) clearInterval(id);
          }, DURATION / STEPS);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  const display =
    count >= 1000 ? `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}K` : `${count}`;
  return <span ref={ref}>{display}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────
   FADE-IN ON SCROLL  (single reusable component)
───────────────────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  className = '',
  from = 'bottom',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  from?: 'bottom' | 'left' | 'right' | 'none';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const initial: Record<string, string> = {
    bottom: 'translateY(28px)',
    left: 'translateX(-28px)',
    right: 'translateX(28px)',
    none: 'none',
  };

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translate(0)' : initial[from],
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="relative overflow-x-hidden">

      {/* ══════════ HERO ══════════ */}
      <section className="relative flex min-h-[88vh] flex-col items-center justify-center px-4 pb-20 pt-16 text-center">

        {/* Ambient background — subtle, contained */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-10%] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/[0.06] blur-[140px]" />
          <div className="absolute right-[-5%] top-[30%] h-[350px] w-[500px] rounded-full bg-violet-500/[0.05] blur-[110px]" />
          <div className="absolute left-[-5%] bottom-[10%] h-[280px] w-[400px] rounded-full bg-emerald-500/[0.05] blur-[100px]" />
          <div className="absolute inset-0 hero-grid opacity-[0.22]" />
        </div>

        {/* Eyebrow */}
        <div className="animate-fade-in-up mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] px-4 py-1.5">
          <Zap size={11} className="text-cyan-400" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-cyan-300">
            Nền tảng luyện code của VPT
          </span>
        </div>

        {/* Logo */}
        <div className="animate-fade-in-up delay-100 mb-7">
          <img
            src="/logocty.png"
            alt="VPT Code Arena"
            className="mx-auto h-[72px] w-auto object-contain drop-shadow-[0_0_24px_rgba(56,189,248,0.18)] sm:h-24"
          />
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up delay-200 mx-auto mb-5 max-w-[720px] text-[2.6rem] font-black leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
          Chinh phục lập trình{' '}
          <span className="gradient-text-brand">theo cách của bạn</span>
        </h1>

        {/* Sub-headline */}
        <p className="animate-fade-in-up delay-300 mx-auto mb-9 max-w-[520px] text-base leading-relaxed text-slate-400 sm:text-lg">
          Lộ trình học bài bản · Kỳ thi trực tuyến · Battle 1v1 theo thời gian thực
        </p>

        {/* CTA row */}
        <div className="animate-fade-in-up delay-400 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            to="/learn"
            className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 px-7 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all duration-200 hover:-translate-y-px hover:shadow-cyan-500/35 hover:shadow-xl"
          >
            {/* Shimmer */}
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-500 group-hover:translate-x-full" aria-hidden />
            <BookOpen size={16} />
            Bắt đầu học ngay
            <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
          </Link>

          <Link
            to="/battle"
            className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-7 py-3.5 text-sm font-semibold text-slate-200 backdrop-blur-sm transition-all duration-200 hover:-translate-y-px hover:border-white/25 hover:bg-white/10 hover:text-white"
          >
            <Trophy size={16} className="text-amber-400" />
            Tham gia Battle
          </Link>
        </div>

        {/* Micro-proof */}
        <ul className="animate-fade-in-up delay-500 mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {highlights.map((text) => (
            <li key={text} className="flex items-center gap-1.5 text-xs text-slate-500">
              <CheckCircle size={12} className="shrink-0 text-emerald-400" />
              {text}
            </li>
          ))}
        </ul>

        {/* Scroll cue */}
        <div aria-hidden className="absolute bottom-7 left-1/2 -translate-x-1/2">
          <div className="flex flex-col items-center gap-1">
            <div className="h-8 w-[1px] rounded-full bg-gradient-to-b from-slate-600 to-transparent animate-pulse" />
          </div>
        </div>
      </section>

      {/* ══════════ STATS STRIP ══════════ */}
      <section className="mx-auto max-w-4xl px-4 pb-16">
        <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.07] sm:grid-cols-4 sm:divide-y-0">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.label} delay={i * 70}>
                <div className="flex flex-col items-center gap-2 px-6 py-7 text-center">
                  <Icon size={18} style={{ color: s.color }} />
                  <div className="text-[1.75rem] font-black leading-none" style={{ color: s.color }}>
                    <AnimatedNumber target={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    {s.label}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        {/* Section header */}
        <Reveal className="mb-12 text-center">
          <p className="app-kicker justify-center">Tính năng nổi bật</p>
          <h2 className="text-2xl font-black text-white sm:text-[2rem]">
            Mọi thứ bạn cần để{' '}
            <span className="gradient-text">phát triển</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            Từ học lý thuyết, luyện đề đến đấu trường 1v1 — tất cả trong một nền tảng.
          </p>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-3">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <Reveal key={feat.href} delay={i * 90}>
                <Link
                  to={feat.href}
                  style={{
                    borderColor: feat.accentBorder,
                    background: feat.accentBg,
                  }}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = feat.accentHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = feat.accentBg; }}
                >
                  {/* Shimmer sweep */}
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent transition-transform duration-600 group-hover:translate-x-full"
                  />

                  {/* Icon */}
                  <div
                    className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${feat.accentColor}18`, border: `1px solid ${feat.accentColor}25` }}
                  >
                    <Icon size={22} style={{ color: feat.accentColor }} />
                  </div>

                  {/* Tag */}
                  <span
                    className="mb-4 inline-block self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: feat.accentColor, background: `${feat.accentColor}15` }}
                  >
                    {feat.tag}
                  </span>

                  <h3 className="mb-2 text-lg font-black text-white">{feat.title}</h3>
                  <p className="flex-1 text-sm leading-relaxed text-slate-400">{feat.description}</p>

                  <div
                    className="mt-6 flex items-center gap-1.5 text-sm font-semibold transition-all duration-200"
                    style={{ color: feat.accentColor }}
                  >
                    Khám phá ngay
                    <ChevronRight size={15} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <Reveal className="mb-12 text-center">
          <p className="app-kicker justify-center">Bắt đầu dễ dàng</p>
          <h2 className="text-2xl font-black text-white sm:text-[2rem]">Chỉ 3 bước đơn giản</h2>
        </Reveal>

        {/* Timeline layout */}
        <div className="relative">
          {/* Vertical connector — visible on desktop */}
          <div
            aria-hidden
            className="absolute left-[calc(50%-0.5px)] top-8 hidden h-[calc(100%-64px)] w-px sm:block"
            style={{ background: 'linear-gradient(to bottom, rgba(56,189,248,0.3), rgba(245,158,11,0.3), rgba(52,211,153,0.3))' }}
          />

          <div className="flex flex-col gap-6">
            {steps.map((s, i) => {
              const isEven = i % 2 === 0;
              return (
                <Reveal key={s.num} delay={i * 100} from={isEven ? 'left' : 'right'}>
                  <div className={`flex items-start gap-5 sm:gap-8 ${isEven ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                    {/* Card */}
                    <div
                      className="group flex-1 rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      style={{ borderColor: `${s.color}25`, background: `${s.color}07` }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Number badge */}
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-slate-950 shadow-md"
                          style={{ background: s.color }}
                        >
                          {s.num}
                        </div>
                        <div>
                          <h3 className="mb-1 font-black text-white">{s.title}</h3>
                          <p className="text-sm leading-relaxed text-slate-400">{s.desc}</p>
                        </div>
                      </div>
                    </div>

                    {/* Center dot on connector */}
                    <div className="hidden sm:flex shrink-0 flex-col items-center">
                      <div
                        className="h-5 w-5 rounded-full border-2 border-slate-900 shadow-lg"
                        style={{ background: s.color }}
                      />
                    </div>

                    {/* Spacer to mirror card on opposite side */}
                    <div className="hidden flex-1 sm:block" />
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>


    </div>
  );
}
