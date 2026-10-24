import { useId } from "react";

/** Brass compass rose on an indigo enamel disc. */
export default function Logo({ size = 44 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Disha" className="shrink-0 drop-shadow-[0_3px_4px_rgba(31,40,101,.35)]">
      <defs>
        <radialGradient id={`e${id}`} cx="35%" cy="28%" r="80%"><stop offset="0" stopColor="#5B67B5" /><stop offset=".6" stopColor="#2E3A87" /><stop offset="1" stopColor="#1F2865" /></radialGradient>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EBD7A6" /><stop offset=".5" stopColor="#C9962E" /><stop offset="1" stopColor="#A87A1E" /></linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill={`url(#b${id})`} />
      <circle cx="32" cy="32" r="26" fill={`url(#e${id})`} />
      <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="1" />
      {/* 8-point compass rose */}
      <path d="M32 9 L36 28 L55 32 L36 36 L32 55 L28 36 L9 32 L28 28 Z" fill={`url(#b${id})`} />
      <path d="M32 17 L34.5 29.5 L47 32 L34.5 34.5 L32 47 L29.5 34.5 L17 32 L29.5 29.5 Z" fill="#1F2865" opacity=".35" transform="rotate(45 32 32)" />
      <circle cx="32" cy="32" r="3.2" fill="#FAF6EE" stroke="#A87A1E" strokeWidth="1" />
    </svg>
  );
}
