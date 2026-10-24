import { Square, SquareCheck } from "lucide-react";

/** Visit Brief on a clipboard: metal clip, ruled paper, checkbox bring-list. */
export default function Clipboard({ lines, bring, title = "Visit Brief", bringTitle = "To bring", plan = [], planTitle = "Plan steps", suggestions = [], suggestTitle = "Suggested — confirm on visit" }:
  { lines: string[]; bring: string[]; title?: string; bringTitle?: string; plan?: string[]; planTitle?: string; suggestions?: string[]; suggestTitle?: string }) {
  return (
    <div className="relative mx-auto w-full max-w-sm rounded-2xl p-3 pt-6" style={{ background: "linear-gradient(180deg,#8A6B3A,#6E5328)", boxShadow: "0 14px 26px -10px var(--shadow-dark), inset 0 1px 0 rgba(255,255,255,.25)" }}>
      <svg aria-hidden viewBox="0 0 120 40" className="absolute left-1/2 top-0 w-28 -translate-x-1/2 -translate-y-2">
        <defs><linearGradient id="clip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E9ECF1" /><stop offset=".5" stopColor="#A9AFBB" /><stop offset="1" stopColor="#737A88" /></linearGradient></defs>
        <rect x="10" y="6" width="100" height="28" rx="8" fill="url(#clip)" stroke="#5B616D" />
        <rect x="42" y="0" width="36" height="16" rx="6" fill="url(#clip)" stroke="#5B616D" />
        <circle cx="60" cy="9" r="3" fill="#3C4350" />
      </svg>
      <div className="rounded-lg p-4" style={{ background: "repeating-linear-gradient(180deg,#FFFDF8 0,#FFFDF8 calc(1.75rem - 1px),#E5DCC9 calc(1.75rem - 1px),#E5DCC9 1.75rem)" }}>
        <p className="font-display text-lg font-bold leading-7 text-neel-700">{title}</p>
        <ol className="list-decimal break-words pl-5 text-[0.95rem] leading-7 text-ink">{lines.map((l) => <li key={l}>{l}</li>)}</ol>
        {plan.length > 0 && <><p className="mt-2 text-sm font-bold uppercase leading-7 tracking-wide text-brass-600">{planTitle}</p>
          <ul className="list-disc pl-5 text-[0.95rem] leading-7">{plan.map((x) => <li key={x} className="break-words">{x}</li>)}</ul></>}
        {suggestions.length > 0 && <div data-testid="visit-brief-suggestions"><p className="mt-2 text-sm font-bold uppercase leading-7 tracking-wide text-alarm">{suggestTitle}</p>
          <ul className="list-disc pl-5 text-[0.95rem] leading-7">{suggestions.map((x) => <li key={x} className="break-words">{x}</li>)}</ul></div>}
        <p className="mt-2 text-sm font-bold uppercase leading-7 tracking-wide text-brass-600">{bringTitle}</p>
        <ul className="text-[0.95rem] leading-7">
          {bring.map((b, i) => (
            <li key={b} className="flex items-center gap-2 break-words capitalize">
              {i < 2 ? <SquareCheck size={18} className="text-sage" aria-hidden /> : <Square size={18} className="text-ink-muted" aria-hidden />}{b.replace(/_/g, " ")}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
