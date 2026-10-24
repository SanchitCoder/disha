import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api, FamilyAction, SlotsResponse } from "../api";
import { tr, useLang } from "../i18n";
import ChipKey from "./sk/ChipKey";
import SkButton from "./sk/SkButton";

const dayName = (d: string, lang: "hi" | "en") => (d === "today" ? tr("today", lang) : d === "tomorrow" ? tr("tomorrow", lang) : d);

/** Bottom sheet: today / tomorrow chips, then time chips. Fits the viewport and scrolls inside it (works at 200% zoom). */
export default function SlotPicker({ action, onClose, onScheduled }: { action: FamilyAction; onClose: () => void; onScheduled: (a: FamilyAction) => void }) {
  const { lang } = useLang();
  const [data, setData] = useState<SlotsResponse | null>(null);
  const [day, setDay] = useState<string>("");
  const [slot, setSlot] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.slots(action.id).then((d) => { setData(d); setDay(d.options[0]?.day ?? ""); }).catch((e) => setErr((e as Error).message));
  }, [action.id]);
  useEffect(() => {          // the page behind the sheet must not scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const days = useMemo(() => [...new Set(data?.options.map((o) => o.day))], [data]);
  const times = data?.options.filter((o) => o.day === day) ?? [];

  async function confirm() {
    if (!slot) return;
    setBusy(true); setErr("");
    try { onScheduled(await api.schedule(action.id, slot)); onClose(); } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 sm:items-center" role="dialog" aria-modal="true" aria-label={tr("pickTime", lang)} onClick={onClose}>
      {/* ONE scroll container for the whole sheet: at 200% zoom nothing is clipped, the footer button is always reachable */}
      <div className="sk-card flex max-h-full w-full max-w-[30rem] flex-col overflow-y-auto overscroll-contain !rounded-b-none sm:max-h-[90dvh] sm:!rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[rgba(120,95,60,.2)] p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-muted">{tr("pickTime", lang)}</p>
            <h2 className="break-words text-xl font-bold leading-tight text-neel-700">{action.title}</h2>
          </div>
          <button onClick={onClose} aria-label={tr("close", lang)} className="sk-round !h-12 !w-12"><X size={22} aria-hidden /></button>
        </div>
        <div className="p-4">
          {!data && !err && <p role="status" className="text-center text-ink-muted">{tr("thinking", lang)}</p>}
          {data && !data.options.length && <p className="rounded-2xl bg-well p-4">{tr("noSlots", lang)}</p>}
          {data?.outside_window && !!data.options.length && <p className="mb-3 rounded-2xl bg-[#FBF0D9] p-3 text-sm font-semibold">{tr("laterSlots", lang)}</p>}
          {data?.provider && <p className="mb-3 break-words text-sm text-ink-muted">{data.provider}</p>}
          {days.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Day">
              {days.map((d) => (
                <button key={d} data-testid={`day-${d}`} onClick={() => { setDay(d); setSlot(""); }} aria-pressed={day === d}
                  className={`min-h-[48px] rounded-full px-5 text-base font-bold ${day === d ? "sk-btn" : "sk-btn-secondary"}`}>{dayName(d, lang)}</button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(4.75rem,1fr))] gap-2.5" role="group" aria-label="Time">
            {times.map((t) => (
              <ChipKey key={t.iso} tone={slot === t.iso ? "primary" : "neutral"} selected={slot === t.iso} data-testid="slot-chip" onClick={() => setSlot(t.iso)} style={{ minHeight: 52, fontSize: "1rem", padding: "0.5rem" }}>{t.label}</ChipKey>
            ))}
          </div>
          {err && <p role="alert" className="mt-3 rounded-2xl bg-[#FBEAE8] p-3 text-alarm">{err}</p>}
        </div>
        <div className="sticky bottom-0 border-t border-[rgba(120,95,60,.2)] bg-card p-4">
          <SkButton size="lg" disabled={!slot || busy} loading={busy} onClick={confirm} data-testid="slot-confirm">{tr("confirmSlot", lang)}</SkButton>
        </div>
      </div>
    </div>
  );
}
