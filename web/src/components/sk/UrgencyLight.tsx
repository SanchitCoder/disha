const LENSES = [
  { id: "immediate", on: "radial-gradient(circle at 35% 30%, #F6A39E, #C0322B 55%, #7E1A15)", glow: "rgba(192,50,43,.65)", label: { en: "Emergency", hi: "इमरजेंसी" } },
  { id: "same_day", on: "radial-gradient(circle at 35% 30%, #F8CF8A, #D98E1F 55%, #8A5508)", glow: "rgba(217,142,31,.65)", label: { en: "Same day", hi: "आज ही" } },
  { id: "routine", on: "radial-gradient(circle at 35% 30%, #A7D3AF, #4F8A5B 55%, #2B5535)", glow: "rgba(79,138,91,.6)", label: { en: "Scheduled", hi: "तय समय पर" } },
] as const;
const OFF = "radial-gradient(circle at 35% 30%, #D8D1C4, #B9B0A0 60%, #8F8676)";

/** Three-lens traffic light; only the active urgency is lit. Always paired with a text label. */
const ALIAS: Record<string, string> = { emergency: "immediate", scheduled: "routine" };   // organiser urgency ids -> lens ids

export default function UrgencyLight({ urgency: raw, lang = "en", compact = false }: { urgency: string; lang?: "en" | "hi"; compact?: boolean }) {
  const urgency = ALIAS[raw] ?? raw;
  const active = LENSES.find((l) => l.id === urgency);
  const d = compact ? 22 : 30;
  return (
    <div className="flex items-center gap-3" role="img" aria-label={`Urgency: ${active?.label.en ?? urgency}`}>
      <div className="flex flex-col gap-1.5 rounded-2xl p-2" style={{ background: "linear-gradient(180deg,#3A3631,#23201C)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.18), 0 6px 12px -6px var(--shadow-dark)" }}>
        {LENSES.map((l) => (
          <span key={l.id} className="block rounded-full" style={{
            width: d, height: d, background: l.id === urgency ? l.on : OFF, opacity: l.id === urgency ? 1 : 0.55,
            boxShadow: l.id === urgency ? `0 0 14px 3px ${l.glow}, inset 0 2px 3px rgba(255,255,255,.55)` : "inset 0 2px 4px rgba(0,0,0,.4)",
          }} />
        ))}
      </div>
      <span className="font-display text-lg font-bold leading-tight text-ink">{active?.label[lang] ?? urgency}</span>
    </div>
  );
}
