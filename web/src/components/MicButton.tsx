import { Loader2, Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { tr, useLang } from "../i18n";
import { Recorder, startRecording } from "../lib/speech";

/** Tap to record, tap again to stop -> Groq Whisper via /v1/transcribe -> onText(transcript).
 *  Big: brass-ringed enamel dome with a live audio-level ring. Small: round brass-edged button. */
export default function MicButton({ onText, size = "big", hint }: { onText: (t: string) => void; size?: "big" | "small"; hint?: boolean }) {
  const { lang } = useLang();
  const rec = useRef<Recorder | null>(null);
  const ring = useRef<HTMLSpanElement>(null);
  const raf = useRef(0);
  const ctx = useRef<AudioContext | null>(null);
  const [on, setOn] = useState(false);
  const [wait, setWait] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => () => { cancelAnimationFrame(raf.current); ctx.current?.close().catch(() => {}); }, []);

  function watchLevel(stream: MediaStream) {            // read-only analyser on the recording stream
    try {
      const ac = new AudioContext(); ctx.current = ac;
      const an = ac.createAnalyser(); an.fftSize = 256;
      ac.createMediaStreamSource(stream).connect(an);
      const buf = new Uint8Array(an.frequencyBinCount);
      const tick = () => {
        an.getByteTimeDomainData(buf);
        let peak = 0; for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
        ring.current?.style.setProperty("--lvl", String(Math.min(peak / 60, 1)));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    } catch { /* level ring is cosmetic */ }
  }

  async function toggle() {
    setErr(""); navigator.vibrate?.(10);
    if (!on) {
      try { rec.current = await startRecording(); setOn(true); watchLevel(rec.current.stream); } catch { setErr(tr("micDenied", lang)); }
      return;
    }
    cancelAnimationFrame(raf.current); setOn(false); setWait(true);
    try {
      const blob = await rec.current!.stop();
      const r = await api.transcribe(blob);
      if (r.text) onText(r.text);
    } catch { setErr(tr("micDenied", lang)); } finally { setWait(false); ctx.current?.close().catch(() => {}); }
  }

  const label = on ? tr("recording", lang) : tr("tapToSpeak", lang);
  if (size === "small") {
    return (
      <div className="flex flex-col items-center gap-1">
        <button onClick={toggle} disabled={wait} aria-label={label} aria-pressed={on} className="sk-round" style={on ? { color: "#fff", background: "var(--alarm)" } : undefined}>
          {wait ? <Loader2 className="animate-spin" size={22} /> : on ? <Square size={18} fill="currentColor" /> : <Mic size={24} />}
        </button>
        {err && <p className="text-xs text-alarm">{err}</p>}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {on && <span ref={ring} aria-hidden className="pointer-events-none absolute -inset-3 rounded-full border-[5px] border-alarm/70"
          style={{ transform: "scale(calc(1 + var(--lvl, 0) * 0.14))", opacity: "calc(.35 + var(--lvl, 0) * .65)", transition: "transform .06s linear" }} />}
        {on && <span aria-hidden className="rec absolute inset-0 rounded-full" />}
        <button onClick={toggle} disabled={wait} aria-label={label} aria-pressed={on}
          className="sk-brass-ring relative block aspect-square w-[min(10.5rem,100%)] transition-transform active:translate-y-1 disabled:opacity-70">
          <span className={`grid h-full w-full place-items-center rounded-full text-white ${on ? "" : "sk-breathe"}`}
            style={{ background: on ? "radial-gradient(circle at 32% 26%, #D9635B 0%, #7B2E5A 45%, #1F2865 100%)" : "radial-gradient(circle at 32% 26%, #8E99DB 0%, #2E3A87 48%, #1F2865 100%)",
              boxShadow: "inset 0 3px 6px rgba(255,255,255,.35), inset 0 -12px 20px rgba(0,0,0,.35), 0 4px 10px rgba(31,40,101,.45)" }}>
            {wait ? <Loader2 className="animate-spin" size={56} /> : on ? <Square size={48} fill="currentColor" /> : <Mic size={64} strokeWidth={2} />}
          </span>
        </button>
      </div>
      {hint && <p className="text-center text-base font-semibold text-ink-muted" aria-live="polite">{label}</p>}
      {err && <p className="text-sm text-alarm">{err}</p>}
    </div>
  );
}
