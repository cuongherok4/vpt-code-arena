import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Code2, Trophy, ArrowRight, Zap,
  Users, Star, CheckCircle, ChevronRight,
  GraduationCap, Cpu, Swords,
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────── */
const features = [
  {
    icon: GraduationCap,
    title: 'Học lập trình',
    description: 'Lộ trình bài bản cho Java, C và Python. Từ cơ bản đến nâng cao với bài tập thực hành phong phú.',
    href: '/learn',
    bg: 'bg-gradient-to-br from-[#e8f1fb] to-[#dbeafe]',
    border: 'border-[#0066b2]/15',
    iconColor: 'text-[#0066b2]',
    iconBg: 'bg-[#0066b2]/10',
    ctaColor: 'text-[#0066b2] group-hover:text-[#1a8fd1]',
    tag: 'Java · C · Python',
    tagCls: 'bg-blue-100 text-blue-700',
    delay: 0,
  },
  {
    icon: Cpu,
    title: 'Kỳ thi trực tuyến',
    description: 'Hàng trăm bài thi được thiết kế bởi chuyên gia. Rèn luyện kỹ năng giải thuật mỗi ngày.',
    href: '/exam',
    bg: 'bg-gradient-to-br from-[#fff7ed] to-[#fed7aa]',
    border: 'border-[#e87722]/15',
    iconColor: 'text-[#e87722]',
    iconBg: 'bg-[#e87722]/10',
    ctaColor: 'text-[#e87722] group-hover:text-[#f59340]',
    tag: 'Algorithms · Data Structures',
    tagCls: 'bg-orange-100 text-orange-700',
    delay: 100,
  },
  {
    icon: Swords,
    title: 'Thách đấu 1v1',
    description: 'Vào phòng, chọn bài, code nhanh hơn đối thủ. Hệ thống xếp hạng Elo theo thời gian thực.',
    href: '/battle',
    bg: 'bg-gradient-to-br from-[#f0fdf4] to-[#bbf7d0]',
    border: 'border-[#2e9e48]/15',
    iconColor: 'text-[#2e9e48]',
    iconBg: 'bg-[#2e9e48]/10',
    ctaColor: 'text-[#2e9e48] group-hover:text-[#42b561]',
    tag: 'Real-time · ELO Rating',
    tagCls: 'bg-green-100 text-green-700',
    delay: 200,
  },
];

const stats = [
  { label: 'Bài tập', value: 500, suffix: '+', icon: Code2, color: '#0066b2', bg: 'bg-blue-50' },
  { label: 'Lập trình viên', value: 2000, suffix: '+', icon: Users, color: '#e87722', bg: 'bg-orange-50' },
  { label: 'Trận / tháng', value: 10000, suffix: '+', icon: Zap, color: '#2e9e48', bg: 'bg-green-50' },
  { label: 'Ngôn ngữ', value: 3, suffix: '', icon: Star, color: '#0066b2', bg: 'bg-blue-50' },
];

const highlights = [
  'Trình chấm bài Judge0',
  'Battle thời gian thực',
  'Theo dõi tiến độ',
  'Bảng xếp hạng',
];

/* ─── Animated Counter ──────────────────────────────── */
function AnimatedNumber({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1200;
          const steps = 40;
          const step = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current = Math.min(current + step, target);
            setCount(Math.round(current));
            if (current >= target) clearInterval(timer);
          }, duration / steps);
        }
      },
      { threshold: 0.4 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  const display = count >= 1000 ? `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}K` : count.toString();
  return <div ref={ref}>{display}{suffix}</div>;
}

/* ─── Section fade-in on scroll ────────────────────── */
function FadeSection({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="relative">
      {/* Background blobs — contained, won't bleed */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] overflow-hidden">
        <div className="absolute left-1/2 top-[-80px] h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[#0066b2]/[0.07] blur-[130px]" />
        <div className="absolute right-[-80px] top-[120px] h-[320px] w-[500px] rounded-full bg-[#e87722]/[0.07] blur-[110px]" />
        <div className="absolute left-[-60px] bottom-0 h-[260px] w-[420px] rounded-full bg-[#2e9e48]/[0.05] blur-[100px]" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] overflow-hidden hero-grid opacity-[0.45]" />

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-12 text-center sm:pt-20">
        {/* Kicker */}
        <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-[#0066b2]/20 bg-[#0066b2]/[0.06] px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#0066b2]">
          <Zap className="h-3 w-3" />
          Nền tảng luyện code của VPT
        </div>

        {/* Logo lớn */}
        <div className="animate-fade-in-up delay-100 mb-7 flex justify-center">
          <img
            src="/logocty.png"
            alt="VPT"
            className="h-20 w-auto object-contain drop-shadow-md sm:h-24"
          />
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up delay-200 mx-auto mb-5 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight text-slate-800 sm:text-5xl lg:text-[3.6rem]">
          Chinh phục{' '}
          <span className="gradient-text-brand">lập trình</span>
          <br className="hidden sm:block" />
          {' '}theo cách của bạn
        </h1>

        {/* Sub-text */}
        <p className="animate-fade-in-up delay-300 mx-auto mb-10 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
          Học bài bản · Thi mọi lúc · Battle cùng bạn bè theo thời gian thực
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up delay-400 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/learn"
            className="group flex items-center gap-2.5 rounded-xl bg-[#0066b2] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0066b2]/25 transition-all duration-250 hover:bg-[#1a8fd1] hover:shadow-[#0066b2]/40 hover:-translate-y-0.5"
          >
            <BookOpen className="h-4 w-4" />
            Bắt đầu học ngay
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <Link
            to="/battle"
            className="flex items-center gap-2.5 rounded-xl border border-[#e87722]/30 bg-white px-7 py-3.5 text-sm font-bold text-[#e87722] shadow-sm transition-all duration-250 hover:border-[#e87722]/60 hover:bg-orange-50 hover:-translate-y-0.5"
          >
            <Trophy className="h-4 w-4" />
            Tham gia Battle
          </Link>
        </div>

        {/* Highlights */}
        <ul className="animate-fade-in-up delay-500 mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {highlights.map((h) => (
            <li key={h} className="flex items-center gap-1.5 text-xs text-slate-400">
              <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#2e9e48]" />
              {h}
            </li>
          ))}
        </ul>
      </section>

      {/* ══════════════════════════════════════
          STATS
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-4xl px-4 pb-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <FadeSection key={s.label} delay={i * 80} className="glass-card flex flex-col items-center gap-3 p-5 text-center">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.bg}`}>
                  <Icon className="h-5 w-5" style={{ color: s.color }} />
                </div>
                <div className="text-2xl font-black" style={{ color: s.color }}>
                  <AnimatedNumber target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</div>
              </FadeSection>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <FadeSection className="mb-10 text-center">
          <p className="app-kicker justify-center">Tính năng nổi bật</p>
          <h2 className="text-2xl font-black text-slate-800 sm:text-3xl">
            Mọi thứ bạn cần để{' '}
            <span className="gradient-text">phát triển</span>
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
            Từ học lý thuyết, luyện đề đến đấu trường 1v1 — tất cả trong một nền tảng.
          </p>
        </FadeSection>

        <div className="grid gap-5 sm:grid-cols-3">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <FadeSection key={feat.href} delay={feat.delay}>
                <Link
                  to={feat.href}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border ${feat.border} ${feat.bg} p-7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/[0.08]`}
                >
                  {/* Hover shimmer */}
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-500 group-hover:translate-x-full" />

                  <div className={`mb-5 inline-flex h-13 w-13 items-center justify-center rounded-2xl ${feat.iconBg}`}>
                    <Icon className={`h-7 w-7 ${feat.iconColor}`} />
                  </div>

                  <span className={`mb-3 inline-block self-start rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${feat.tagCls}`}>
                    {feat.tag}
                  </span>

                  <h3 className="mb-2 text-xl font-black text-slate-800">{feat.title}</h3>
                  <p className="flex-1 text-sm leading-relaxed text-slate-500">{feat.description}</p>

                  <div className={`mt-6 flex items-center gap-1.5 text-sm font-bold ${feat.ctaColor} transition-all duration-200`}>
                    Khám phá ngay
                    <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1.5" />
                  </div>
                </Link>
              </FadeSection>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <FadeSection className="mb-10 text-center">
          <p className="app-kicker justify-center">Bắt đầu dễ dàng</p>
          <h2 className="text-2xl font-black text-slate-800 sm:text-3xl">Chỉ 3 bước đơn giản</h2>
        </FadeSection>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { step: '01', title: 'Tạo tài khoản', desc: 'Đăng ký miễn phí, không cần thẻ tín dụng.', color: '#0066b2' },
            { step: '02', title: 'Chọn lộ trình', desc: 'Java, C hoặc Python — học theo tốc độ của bạn.', color: '#e87722' },
            { step: '03', title: 'Chinh phục mục tiêu', desc: 'Thi đấu, leo thang bảng xếp hạng, ghi dấu ấn.', color: '#2e9e48' },
          ].map((item, i) => (
            <FadeSection key={item.step} delay={i * 100}>
              <div className="glass-card flex flex-col items-start p-7">
                <div
                  className="mb-4 text-5xl font-black leading-none"
                  style={{ color: item.color, opacity: 0.15 }}
                >
                  {item.step}
                </div>
                <div className="mb-1 text-4 font-black text-slate-800">{item.title}</div>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            </FadeSection>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════ */}
      <section className="mx-auto max-w-4xl px-4 pb-16">
        <FadeSection>
          <div className="relative overflow-hidden rounded-3xl border border-[#0066b2]/15 bg-gradient-to-br from-[#e8f1fb] via-[#fff7ed] to-[#f0fdf4] p-10 text-center shadow-lg sm:p-14">
            {/* Inner blobs — contained by overflow-hidden */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute left-1/4 -top-20 h-[200px] w-[300px] rounded-full bg-[#0066b2]/10 blur-3xl" />
              <div className="absolute right-1/4 -bottom-20 h-[200px] w-[300px] rounded-full bg-[#e87722]/10 blur-3xl" />
            </div>

            <div className="relative">
              <img src="/logocty.png" alt="VPT" className="mx-auto mb-6 h-14 w-auto object-contain drop-shadow-sm" />
              <h2 className="mb-3 text-2xl font-black text-slate-800 sm:text-3xl">Sẵn sàng chinh phục?</h2>
              <p className="mb-8 text-slate-500">
                Tạo tài khoản miễn phí và bắt đầu hành trình lập trình ngay hôm nay.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/register"
                  className="group flex items-center gap-2 rounded-xl bg-[#0066b2] px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-[#0066b2]/25 transition-all duration-200 hover:bg-[#1a8fd1] hover:shadow-[#0066b2]/40 hover:-translate-y-0.5"
                >
                  Đăng ký miễn phí
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/learn"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-3.5 text-sm font-bold text-slate-600 shadow-sm transition-all duration-200 hover:border-[#0066b2]/30 hover:text-[#0066b2]"
                >
                  Xem lộ trình học
                </Link>
              </div>
            </div>
          </div>
        </FadeSection>
      </section>
    </div>
  );
}
