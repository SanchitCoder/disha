/** Small analog gauge (0–1). Needle + coloured arc: low confidence = amber/alarm. */
export default function ConfidenceGauge({ value, size = 84 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(1, value));
  const ang = -90 + v * 180;
  const col = v < 0.35 ? "var(--alarm)" : v < 0.6 ? "var(--amber)" : "var(--sage)";
  const arc = (a: number) => { const r = (a * Math.PI) / 180; return [50 + 38 * Math.cos(r), 52 + 38 * Math.sin(r)]; };
  const [x, y] = arc(ang - 90);
  return (
    <svg width={size} height={size * 0.64} viewBox="0 0 100 64" role="img" aria-label={`Confidence ${Math.round(v * 100)}%`}>
      <path d="M12 52 A38 38 0 0 1 88 52" fill="none" stroke="#D5C9B2" strokeWidth="9" strokeLinecap="round" />
      <path d={`M12 52 A38 38 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`} fill="none" stroke={col} strokeWidth="9" strokeLinecap="round" />
      <line x1="50" y1="52" x2={50 + 30 * Math.cos(((ang - 90) * Math.PI) / 180)} y2={52 + 30 * Math.sin(((ang - 90) * Math.PI) / 180)} stroke="#23201C" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="52" r="5" fill="#C9962E" stroke="#8E6414" />
    </svg>
  );
}
