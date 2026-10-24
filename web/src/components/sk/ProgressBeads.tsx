/** Brass beads on an inset track. current is 1-based; beads up to current are "lit". */
export default function ProgressBeads({ total, current, label }: { total: number; current: number; label?: string }) {
  return (
    <div className="flex items-center gap-3" role="img" aria-label={label ?? `${current} of ${total}`}>
      <div className="sk-well relative flex items-center justify-between gap-5 px-4 py-2" style={{ borderRadius: 9999 }}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="block h-5 w-5 rounded-full" style={i < current
            ? { background: "radial-gradient(circle at 35% 30%, var(--brass-200), var(--brass-400) 55%, var(--brass-600))", boxShadow: "0 2px 3px var(--shadow-dark), inset 0 1px 1px #fff9" }
            : { background: "#CFC4AE", boxShadow: "inset 0 2px 3px rgba(70,52,30,.4)" }} />
        ))}
      </div>
      {label && <span className="text-sm font-semibold text-ink-muted">{label}</span>}
    </div>
  );
}
