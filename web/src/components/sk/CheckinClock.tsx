import { motion, useReducedMotion } from "framer-motion";

/** Analog wall clock for the Safety Net. `hours` = hours elapsed since booking; markers at +6 h and +24 h. */
export default function CheckinClock({ hours = 0, size = 220 }: { hours?: number; size?: number }) {
  const reduce = useReduceMotionSafe();
  const hourDeg = (hours % 12) * 30;
  const minDeg = hours * 360;
  const t = reduce ? { duration: 0 } : { duration: 1.4, ease: "easeInOut" as const };
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{ maxWidth: "100%", height: "auto" }} role="img" aria-label={`Safety Net clock, ${hours} hours ahead`}>
      <defs>
        <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EBD7A6" /><stop offset=".45" stopColor="#C9962E" /><stop offset="1" stopColor="#8E6414" /></linearGradient>
        <radialGradient id="face" cx="40%" cy="32%" r="80%"><stop offset="0" stopColor="#FFFDF8" /><stop offset="1" stopColor="#EADFC8" /></radialGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#rim)" />
      <circle cx="100" cy="100" r="86" fill="url(#face)" stroke="rgba(70,52,30,.35)" strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1="100" y1="19" x2="100" y2={i % 3 === 0 ? 31 : 26} stroke="#23201C" strokeWidth={i % 3 === 0 ? 3 : 1.6} transform={`rotate(${i * 30} 100 100)`} />
      ))}
      {/* +6 h (6 o'clock) and +24 h (full circle, 12 o'clock) markers */}
      <g fontFamily="Inter, sans-serif" fontWeight="700" fontSize="9.5" textAnchor="middle">
        <circle cx="100" cy="148" r="14" fill="#4F8A5B" /><text x="100" y="151.5" fill="#fff">+6h</text>
        <circle cx="100" cy="54" r="16" fill="#2E3A87" /><text x="100" y="57.5" fill="#fff">+24h</text>
      </g>
      <motion.line x1="100" y1="100" x2="100" y2="66" stroke="#23201C" strokeWidth="6" strokeLinecap="round" style={{ originX: "100px", originY: "100px" }} initial={false} animate={{ rotate: hourDeg }} transition={t} />
      <motion.line x1="100" y1="100" x2="100" y2="40" stroke="#2E3A87" strokeWidth="3.5" strokeLinecap="round" style={{ originX: "100px", originY: "100px" }} initial={false} animate={{ rotate: minDeg }} transition={t} />
      <circle cx="100" cy="100" r="6" fill="#C9962E" stroke="#8E6414" />
      <ellipse cx="72" cy="52" rx="38" ry="20" fill="#fff" opacity=".18" transform="rotate(-25 72 52)" />
    </svg>
  );
}

function useReduceMotionSafe() { return useReducedMotion() ?? false; }
