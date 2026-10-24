import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ClipboardCheck, Gauge, Hourglass, LayoutDashboard, LucideIcon, MessageCircleQuestion, Mic, Plug, Receipt, ShieldCheck, Siren, UserRoundCheck, UserX, Volume2, Stethoscope, Check } from "lucide-react";
import { ReactNode, useRef } from "react";
import { API } from "../api";
import { LKey, tl, useLang } from "../i18n";
import AlarmKey from "../components/sk/AlarmKey";
import CaregiverIDCard from "../components/sk/CaregiverIDCard";
import CheckinClock from "../components/sk/CheckinClock";
import Clipboard from "../components/sk/Clipboard";
import Logo from "../components/sk/Logo";
import MicDome from "../components/sk/MicDome";
import PhoneMockup from "../components/sk/PhoneMockup";
import SkButton from "../components/sk/SkButton";
import SkCard from "../components/sk/SkCard";
import UrgencyLight from "../components/sk/UrgencyLight";

const wrap = "mx-auto w-full max-w-[1120px] px-4 sm:px-6";

function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className={className} initial={reduce ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.45, delay }}>{children}</motion.div>
  );
}

function SectionTitle({ k, eyebrow }: { k: LKey; eyebrow?: string }) {
  const { lang } = useLang();
  return (
    <div className="mb-8 text-center sm:mb-12">
      {eyebrow && <p className={`mb-2 text-sm font-bold text-brass-600 ${lang === "en" ? "uppercase tracking-[0.18em]" : ""}`}>{eyebrow}</p>}
      <h2 className="sk-engraved font-display text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-tight text-neel-700">{tl(k, lang)}</h2>
    </div>
  );
}

function Engraved({ icon: Icon, k }: { icon: LucideIcon; k: LKey }) {
  const { lang } = useLang();
  return (
    <li className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold text-neel-700"
      style={{ background: "linear-gradient(180deg,#EFE6D3,#E3D8C0)", boxShadow: "inset 0 1px 2px rgba(70,52,30,.25), 0 1px 0 #fff" }}>
      <Icon size={16} className="text-brass-600" aria-hidden />{tl(k, lang)}
    </li>
  );
}

/* ---------------- 1. hero ---------------- */
function Hero() {
  const { lang } = useLang();
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const move = (e: React.MouseEvent) => {          // soft parallax: desktop pointer only
    if (reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    stage.current.style.setProperty("--px", String(((e.clientX - r.left) / r.width - 0.5) * 2));
    stage.current.style.setProperty("--py", String(((e.clientY - r.top) / r.height - 0.5) * 2));
  };
  const how = () => document.getElementById("how")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  return (
    <section className={`${wrap} grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8`}>
      <div className="text-center lg:text-left">
        <p className={`mb-3 inline-block rounded-full px-4 py-1 text-sm font-bold text-brass-600 ${lang === "en" ? "uppercase tracking-wide" : ""}`}
          style={{ background: "linear-gradient(180deg,#F8EFD6,#EBD7A6)", boxShadow: "inset 0 1px 0 #fff9, 0 1px 2px var(--shadow-dark)" }}>{tl("eyebrow", lang)}</p>
        <h1 className="sk-engraved font-display text-[clamp(2.4rem,6.4vw,4rem)] font-bold leading-[1.08] text-neel-700">{tl("heroTitle", lang)}</h1>
        <p className="font-display mt-3 text-[clamp(1.1rem,2.2vw,1.4rem)] italic text-ink-muted">{tl("heroSub", lang)}</p>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink lg:mx-0">{tl("heroBody", lang)}</p>
        <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row lg:justify-start">
          <SkButton to="/start" size="xl" icon={Mic} iconRight={ArrowRight}>{tl("ctaStart", lang)}</SkButton>
          <SkButton variant="secondary" size="xl" onClick={how}>{tl("ctaHow", lang)}</SkButton>
        </div>
        <ul className="mt-6 flex flex-wrap justify-center gap-2.5 lg:justify-start">
          <Engraved icon={Volume2} k="trust1" /><Engraved icon={Siren} k="trust2" /><Engraved icon={Stethoscope} k="trust3" />
        </ul>
      </div>

      <div ref={stage} onMouseMove={move} className="relative mx-auto w-full max-w-[420px] py-6" style={{ ["--px" as string]: 0, ["--py" as string]: 0 }}>
        <div style={{ transform: "translate3d(calc(var(--px) * -6px), calc(var(--py) * -6px), 0)" }}>
          <PhoneMockup>
            <div className="sk-well -mt-6 w-full px-3 py-2.5 text-center text-[13px] font-medium leading-snug text-ink">“{tl("phoneSample", lang)}”</div>
            <MicDome size={124} />
            <p className="text-center text-xs font-semibold text-ink-muted">{lang === "hi" ? "बोलने के लिए दबाएँ" : "Tap to speak"}</p>
            <div className="h-24" aria-hidden />
          </PhoneMockup>
        </div>
        <div className="absolute -left-2 top-[13rem] hidden w-[10.5rem] -rotate-6 sm:block sm:-left-10" style={{ transform: "translate3d(calc(var(--px) * 12px), calc(var(--py) * 10px), 0) rotate(-6deg)" }}>
          <div className="sk-card p-3"><p className={`mb-1.5 text-xs font-bold text-ink-muted ${lang === "en" ? "uppercase tracking-wide" : ""}`}>{tl("floatUrgency", lang)}</p><UrgencyLight urgency="same_day" lang={lang} compact /></div>
        </div>
        <div className="absolute -bottom-2 -right-2 hidden w-[14rem] rotate-3 sm:block sm:-right-14" style={{ transform: "translate3d(calc(var(--px) * 16px), calc(var(--py) * 12px), 0) rotate(3deg)" }}>
          <CaregiverIDCard compact name="Anita S." role="Medic" rating={4.8} reasons={["Hindi", "3 km", "4 pm"]} />
        </div>
      </div>
    </section>
  );
}

/* ---------------- 2. problem ---------------- */
function Problem() {
  const { lang } = useLang();
  const items: [LucideIcon, LKey, LKey][] = [[Hourglass, "prob1T", "prob1"], [Siren, "prob2T", "prob2"], [UserX, "prob3T", "prob3"]];
  return (
    <section className={`${wrap} py-12 sm:py-16`}>
      <SectionTitle k="probTitle" />
      <div className="grid gap-5 md:grid-cols-3">
        {items.map(([Icon, t, b], i) => (
          <Reveal key={t} delay={i * 0.08}>
            <SkCard className="h-full">
              <span className="sk-well mb-4 grid h-14 w-14 place-items-center text-neel-600" style={{ borderRadius: 16 }}><Icon size={28} aria-hidden /></span>
              <h3 className="font-display text-xl font-bold text-ink">{tl(t, lang)}</h3>
              <p className="mt-2 text-base text-ink-muted">{tl(b, lang)}</p>
            </SkCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- 3. how it works ---------------- */
const STEPS: [LucideIcon, LKey, LKey][] = [
  [Mic, "step1T", "step1"], [MessageCircleQuestion, "step2T", "step2"], [Gauge, "step3T", "step3"], [UserRoundCheck, "step4T", "step4"], [ShieldCheck, "step5T", "step5"],
];
function Bead({ n }: { n: number }) {
  return (
    <span className="relative z-10 grid h-12 w-12 place-items-center rounded-full font-display text-xl font-bold text-ink"
      style={{ background: "radial-gradient(circle at 35% 30%, var(--brass-200), var(--brass-400) 55%, var(--brass-600))", boxShadow: "0 4px 6px -2px var(--shadow-dark), inset 0 2px 2px #fffb, inset 0 -2px 3px rgba(90,60,5,.4)" }}>{n}</span>
  );
}
function HowItWorks() {
  const { lang } = useLang();
  return (
    <section id="how" className={`${wrap} scroll-mt-24 py-12 sm:py-16`}>
      <SectionTitle k="howTitle" />
      {/* desktop: horizontal track */}
      <div className="relative hidden md:block">
        <div className="sk-well absolute left-[10%] right-[10%] top-[18px] h-3" style={{ borderRadius: 9999 }} aria-hidden />
        <ol className="relative grid grid-cols-5 gap-3">
          {STEPS.map(([Icon, t, b], i) => (
            <li key={t} className="flex flex-col items-center text-center">
              <Bead n={i + 1} />
              <Icon size={30} className="mt-4 text-neel-600" aria-hidden />
              <h3 className="font-display mt-2 text-lg font-bold">{tl(t, lang)}</h3>
              <p className="mt-1 px-1 text-sm text-ink-muted">{tl(b, lang)}</p>
            </li>
          ))}
        </ol>
        <div className="relative mt-2 h-16" aria-hidden>
          <svg viewBox="0 0 100 16" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
            <path d="M90 0 C90 15, 50 15, 50 1.5" fill="none" stroke="var(--brass-600)" strokeWidth="2" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
          </svg>
          <svg width="14" height="14" viewBox="0 0 14 14" className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1"><path d="M7 0 L13 10 L1 10 Z" fill="var(--brass-600)" /></svg>
          <span className="absolute left-[70%] top-7 -translate-x-1/2 rounded-full bg-card px-3 py-1 text-sm font-semibold text-brass-600 shadow">↺ {tl("loopLabel", lang)}</span>
        </div>
      </div>
      {/* mobile: vertical track */}
      <ol className="relative md:hidden">
        <div className="sk-well absolute bottom-6 left-[21px] top-6 w-3" style={{ borderRadius: 9999 }} aria-hidden />
        {STEPS.map(([Icon, t, b], i) => (
          <li key={t} className="relative flex gap-4 pb-7 last:pb-0">
            <Bead n={i + 1} />
            <div className="pt-0.5"><h3 className="font-display flex items-center gap-2 text-lg font-bold"><Icon size={20} className="text-neel-600" aria-hidden />{tl(t, lang)}</h3>
              <p className="text-base text-ink-muted">{tl(b, lang)}</p></div>
          </li>
        ))}
        <li className="ml-16 mt-4 rounded-xl border border-dashed border-brass-600 px-3 py-2 text-sm font-semibold text-brass-600">↺ 5 → 3 · {tl("loopLabel", lang)}</li>
      </ol>
    </section>
  );
}

/* ---------------- 4. differentiators ---------------- */
function FamilyFrame() {
  return (
    <svg viewBox="0 0 220 150" className="mx-auto h-36 w-auto" role="img" aria-label="Family photo frame">
      <defs><linearGradient id="fr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EBD7A6" /><stop offset=".5" stopColor="#C9962E" /><stop offset="1" stopColor="#8E6414" /></linearGradient>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DDE0F3" /><stop offset="1" stopColor="#B9BFE3" /></linearGradient></defs>
      <rect x="6" y="6" width="208" height="138" rx="12" fill="url(#fr)" />
      <rect x="18" y="18" width="184" height="114" rx="6" fill="url(#bg)" stroke="rgba(70,52,30,.4)" />
      {[[70, 1], [110, 1.18], [150, 0.9]].map(([x, s], i) => (
        <g key={i} transform={`translate(${x} 128) scale(${s})`} fill={i === 1 ? "#1F2865" : "#2E3A87"}>
          <circle cx="0" cy="-60" r="14" /><path d="M-24 0 C-24 -30 -14 -42 0 -42 C14 -42 24 -30 24 0 Z" />
        </g>
      ))}
    </svg>
  );
}
function NurseBadge() {
  return (
    <svg viewBox="0 0 160 150" className="mx-auto h-36 w-auto" role="img" aria-label="Nurse badge">
      <defs><radialGradient id="nb" cx="35%" cy="28%" r="80%"><stop offset="0" stopColor="#8E99DB" /><stop offset=".6" stopColor="#2E3A87" /><stop offset="1" stopColor="#1F2865" /></radialGradient>
        <linearGradient id="nr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EBD7A6" /><stop offset=".5" stopColor="#C9962E" /><stop offset="1" stopColor="#8E6414" /></linearGradient></defs>
      <rect x="62" y="0" width="36" height="16" rx="8" fill="#E8DFCD" stroke="rgba(70,52,30,.4)" />
      <circle cx="80" cy="82" r="62" fill="url(#nr)" /><circle cx="80" cy="82" r="53" fill="url(#nb)" />
      <path d="M72 52h16v22h22v16H88v22H72V90H50V74h22z" fill="#FAF6EE" />
      <circle cx="112" cy="118" r="17" fill="#4F8A5B" stroke="#FAF6EE" strokeWidth="3" /><path d="M104 118l6 6 11-12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Different() {
  const { lang } = useLang();
  const cards: { t: LKey; b: LKey; art: ReactNode }[] = [
    { t: "us1T", b: "us1", art: <div className="flex justify-center"><CheckinClock hours={6} size={150} /></div> },
    { t: "us2T", b: "us2", art: <FamilyFrame /> },
    { t: "us3T", b: "us3", art: <div className="mx-auto max-w-[260px] origin-top scale-[.82] sm:scale-90"><Clipboard title="Visit Brief" bringTitle="To bring" lines={["Father, 60+", "Fever + cough, 2 days", "No breathing trouble"]} bring={["thermometer", "pulse_oximeter", "bp_monitor"]} /></div> },
    { t: "us4T", b: "us4", art: <NurseBadge /> },
  ];
  return (
    <section className={`${wrap} py-12 sm:py-16`}>
      <SectionTitle k="usTitle" />
      <div className="grid gap-6 sm:grid-cols-2">
        {cards.map((c, i) => (
          <Reveal key={c.t} delay={(i % 2) * 0.08}>
            <SkCard className="flex h-full flex-col">
              <div className="sk-well mb-4 flex min-h-[300px] items-center justify-center overflow-hidden p-3">{c.art}</div>
              <h3 className="font-display text-xl font-bold text-neel-700">{tl(c.t, lang)}</h3>
              <p className="mt-1.5 text-base text-ink-muted">{tl(c.b, lang)}</p>
            </SkCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- 5. safety promise ---------------- */
function Promise() {
  const { lang } = useLang();
  return (
    <section className={`${wrap} py-12 sm:py-16`}>
      <Reveal>
        <div className="sk-card grid items-center gap-8 p-5 sm:p-10 md:grid-cols-[auto_1fr]" style={{ borderColor: "rgba(192,50,43,.3)" }}>
          <div className="flex justify-center gap-3 sm:gap-4"><AlarmKey number="112" label={tl("national", lang)} /><AlarmKey number="108" label={tl("ambulance", lang)} /></div>
          <div className="text-center md:text-left">
            <p className={`mb-2 inline-flex items-center gap-2 text-sm font-bold text-alarm ${lang === "en" ? "uppercase tracking-[0.16em]" : ""}`}><ShieldCheck size={18} aria-hidden />{lang === "hi" ? "सुरक्षा वादा" : "Safety promise"}</p>
            <h2 className="font-display text-[clamp(1.6rem,3.4vw,2.2rem)] font-bold leading-tight text-ink">{tl("safeTitle", lang)}</h2>
            <p className="mt-3 text-lg text-ink-muted">{tl("safeBody", lang)}</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ---------------- 6. providers ---------------- */
function Providers() {
  const { lang } = useLang();
  const pts: [LucideIcon, LKey, LKey][] = [[Plug, "prov1T", "prov1"], [LayoutDashboard, "prov2T", "prov2"], [Receipt, "prov3T", "prov3"]];
  return (
    <section className={`${wrap} py-12 sm:py-16`}>
      <SectionTitle k="provTitle" eyebrow={tl("provIntro", lang)} />
      <div className="grid gap-5 md:grid-cols-3">
        {pts.map(([Icon, t, b], i) => (
          <Reveal key={t} delay={i * 0.08}>
            <SkCard className="h-full">
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-xl text-white" style={{ background: "linear-gradient(180deg,var(--neel-400),var(--neel-700))", boxShadow: "inset 0 1px 0 #fff5, 0 4px 8px -3px rgba(31,40,101,.5)" }}><Icon size={24} aria-hidden /></span>
              <h3 className="font-display text-lg font-bold">{tl(t, lang)}</h3>
              <p className="mt-1.5 text-base text-ink-muted">{tl(b, lang)}</p>
            </SkCard>
          </Reveal>
        ))}
      </div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <SkButton to="/nurse" size="lg" icon={ClipboardCheck}>{tl("provNurse", lang)}</SkButton>
        <SkButton href={`${API}/docs`} external variant="secondary" size="lg" icon={Check}>{tl("provDocs", lang)}</SkButton>
      </div>
    </section>
  );
}

/* ---------------- 7. footer ---------------- */
function Footer() {
  const { lang } = useLang();
  return (
    <footer className="mt-8 border-t border-[rgba(120,95,60,.2)] bg-[rgba(232,223,205,.5)]">
      <div className={`${wrap} flex flex-col items-center gap-3 py-10 text-center`}>
        <div className="flex items-center gap-2.5"><Logo size={36} /><span className="font-display text-2xl font-bold text-neel-700">Disha</span><span className="text-sm font-semibold text-brass-600">दिशा</span></div>
        <p className="text-sm text-ink">{tl("footBuilt", lang)}</p>
        <p className="text-sm text-ink-muted">{tl("footModels", lang)}</p>
        <p className="max-w-xl text-sm font-semibold text-ink">{tl("footNote", lang)}</p>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <>
      <Hero /><Problem /><HowItWorks /><Different /><Promise /><Providers /><Footer />
    </>
  );
}
