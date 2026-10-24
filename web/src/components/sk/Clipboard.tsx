import { Square, SquareCheck } from "lucide-react";

/** Visit Brief on a clipboard: metal clip, ruled paper, checkbox bring-list. */
export default function Clipboard({ lines, bring, title = "Visit Brief", bringTitle = "To bring" }: { lines: string[]; bring: string[]; title?: string; bringTitle?: string }) {
  return (
    <div className="relative mx-auto w-full max-w-sm rounded-2xl p-3 pt-6" style={{ background: "linear-gradient(180deg,#8A6B3A,#6E5328)", boxShadow: "0 14px 26px -10px var(--shadow-dark), inset 0 1px 0 rgba(255,255,255,.25)" }}>
      <svg aria-hidden viewBox="0 0 120 40" className="absolute left-1/2 top-0 w-28 -translate-x-1/2 -translate-y-2">
        <defs><linearGradient id="clip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E9ECF1" /><stop offset=".5" stopColor="#A9AFBB" /><stop offset="1" stopColor="#737A88" /></linearGradient></defs>
        <rect x="10" y="6" width="100" height="28" rx="8" fill="url(#clip)" stroke="#5B616D" />
        <rect x="42" y="0" width="36" height="16" rx="6" fill="url(#clip)" stroke="#5B616D" />
        <circle cx="60" cy="9" r="3" fill="#3C4350" />
      </svg>
      <div className="rounded-lg p-4" style={{ background: "repeating-linear-gradient(180deg,#FFFDF8 0,#FFFDF8 27px,#E5DCC9 27px,#E5DCC9 28px)" }}>
        <p className="font-display text-lg font-bold leading-[28px] text-neel-700">{title}</p>
        <ol className="list-decimal pl-5 text-[15px] leading-[28px] text-ink">{lines.map((l) => <li key={l}>{l}</li>)}</ol>
        <p className="mt-2 text-sm font-bold uppercase leading-[28px] tracking-wide text-brass-600">{bringTitle}</p>
        <ul className="text-[15px] leading-[28px]">
          {bring.map((b, i) => (
            <li key={b} className="flex items-center gap-2 capitalize">
              {i < 2 ? <SquareCheck size={18} className="text-sage" aria-hidden /> : <Square size={18} className="text-ink-muted" aria-hidden />}{b.replace(/_/g, " ")}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
