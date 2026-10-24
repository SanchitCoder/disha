import { Phone } from "lucide-react";

/** Large red phone-keypad key with an embossed numeral. Emergency use only. */
export default function AlarmKey({ number, label, size = "lg" }: { number: "112" | "108"; label: string; size?: "md" | "lg" }) {
  const big = size === "lg";
  return (
    <a href={`tel:${number}`} aria-label={`${label}: call ${number}`}
      className={`flex min-w-0 flex-1 select-none flex-col items-center justify-center rounded-3xl px-3 py-3 text-white transition active:translate-y-[3px] sm:flex-none ${big ? "min-h-[120px] sm:min-w-[150px]" : "min-h-[92px] sm:min-w-[110px]"}`}
      style={{
        background: "linear-gradient(180deg,#E0645C 0%,var(--alarm) 52%,#8F2019 100%)",
        boxShadow: "inset 0 2px 0 rgba(255,255,255,.4), inset 0 -3px 6px rgba(0,0,0,.25), 0 5px 0 #6D130E, 0 14px 22px -8px rgba(143,32,25,.65)",
      }}>
      <span className={`font-display font-bold leading-none ${big ? "text-5xl" : "text-4xl"}`} style={{ textShadow: "0 2px 0 rgba(0,0,0,.35), 0 -1px 0 rgba(255,255,255,.35)" }}>{number}</span>
      <span className="mt-1.5 flex items-center gap-1.5 text-center text-sm font-semibold"><Phone size={14} aria-hidden />{label}</span>
    </a>
  );
}
