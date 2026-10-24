import { Star } from "lucide-react";
import { ReactNode } from "react";

const initials = (n: string) => n.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

/** Caregiver as a plastic ID badge: punched slot, initials photo, enamel reason tags. */
export default function CaregiverIDCard({ name, role, rating, reasons, best, bestLabel = "Best match", compact = false, action }: {
  name: string; role: string; rating?: number | null; reasons: string[]; best?: boolean; bestLabel?: string; compact?: boolean; action?: ReactNode;
}) {
  return (
    <div className={`sk-card relative ${compact ? "p-4 pt-7" : "p-5 pt-8"} ${best ? "ring-2 ring-brass-600/70" : ""}`}>
      <span aria-hidden className="absolute left-1/2 top-2.5 h-2.5 w-14 -translate-x-1/2 rounded-full bg-well" style={{ boxShadow: "inset 0 2px 3px rgba(70,52,30,.4)" }} />
      {best && (
        <span className="absolute -right-2 top-5 rotate-3 rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink"
          style={{ background: "linear-gradient(180deg,var(--brass-200),var(--brass-400))", boxShadow: "0 3px 6px -2px var(--shadow-dark), inset 0 1px 0 #fff8" }}>{bestLabel}</span>
      )}
      <div className="flex items-center gap-4">
        <div className="grid shrink-0 place-items-center rounded-full font-display font-bold text-white"
          style={{ width: compact ? 52 : 64, height: compact ? 52 : 64, fontSize: compact ? 18 : 22, background: "linear-gradient(145deg,var(--neel-400),var(--neel-700))", boxShadow: "inset 0 2px 3px rgba(255,255,255,.35), 0 0 0 3px var(--brass-200), 0 6px 10px -4px var(--shadow-dark)" }}>
          {initials(name)}
        </div>
        <div className="min-w-0">
          <p className="font-display truncate text-xl font-bold leading-tight text-ink">{name}</p>
          <p className="flex items-center gap-1.5 text-sm capitalize text-ink-muted">{role}
            {rating != null && <span className="inline-flex items-center gap-0.5 font-semibold text-brass-600"><Star size={14} fill="currentColor" aria-hidden />{rating}</span>}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {reasons.map((r) => (
          <span key={r} className="rounded-full px-3 py-1 text-sm font-semibold text-neel-700"
            style={{ background: "linear-gradient(180deg,#F0F1FB,#DDE0F3)", boxShadow: "inset 0 1px 0 #fff, 0 1px 2px var(--shadow-dark)" }}>{r}</span>
        ))}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
