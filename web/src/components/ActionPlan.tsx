import { BellRing, Hospital, LucideIcon, Stethoscope, TestTube, Thermometer, UserRoundSearch, Video } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, FamilyAction } from "../api";
import { Key, tr, useLang } from "../i18n";
import { useCase } from "../state";
import MicButton from "./MicButton";
import SlotPicker from "./SlotPicker";
import SkButton from "./sk/SkButton";
import SkCard from "./sk/SkCard";
import { SkInput } from "./sk/SkInput";

const ICON: Record<string, LucideIcon> = {
  home_sample_collection: TestTube, doctor_teleconsult: Video, nurse_visit: Stethoscope, paramedic_visit: Stethoscope, home_monitoring: Thermometer,
  facility_test_referral: Hospital, specialist_referral: UserRoundSearch, follow_up_checkin: BellRing,
};
const STATUS: Record<string, { key: Key; cls: string }> = {
  suggested: { key: "stSuggested", cls: "bg-well text-ink" },
  awaiting_clinician: { key: "stAwaiting", cls: "bg-[#FBF0D9] text-[#7A4B05]" },
  confirmed: { key: "stConfirmed", cls: "bg-[#E4F1E6] text-[#1F4A2A]" },
  scheduled: { key: "stScheduled", cls: "bg-[#E4F1E6] text-[#1F4A2A]" },
  done: { key: "stDone", cls: "bg-[#E4F1E6] text-[#1F4A2A]" },
};
const when = (iso: string | null, lang: "hi" | "en") => {
  if (!iso) return "";
  const d = new Date(iso), now = new Date();
  const day = d.toDateString() === now.toDateString() ? tr("today", lang) : new Date(now.getTime() + 864e5).toDateString() === d.toDateString() ? tr("tomorrow", lang) : d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  return `${day} ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: false })}`;
};

function Log({ action, caseId, onChange }: { action: FamilyAction; caseId: string; onChange: () => void }) {
  const { lang } = useLang();
  const { setLast } = useCase();
  const nav = useNavigate();
  const isTemp = action.log_field === "temperature_c";
  const [val, setVal] = useState("");
  const [unit, setUnit] = useState("F");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function send() {
    setBusy(true); setMsg("");
    try {
      const r = await api.logAction(action.id, val, isTemp ? unit : undefined);
      if (r.escalated && r.reply?.triage && r.reply.app) { setLast({ triage: r.reply.triage, app: r.reply.app }); nav(r.reply.app.is_emergency ? "/emergency" : "/plan"); return; }
      setMsg(`${tr("lastReading", lang)}: ${r.logged.value} ${r.logged.unit}`); setVal(""); onChange();
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="mt-3">
      <div className="flex items-center gap-2">
        <div className="flex-1"><SkInput inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} placeholder={isTemp ? "101.5" : "—"} aria-label={action.title} data-testid="log-value" /></div>
        {isTemp && (
          <div className="flex gap-1.5" role="group" aria-label="Unit">
            {["F", "C"].map((u) => <button key={u} onClick={() => setUnit(u)} aria-pressed={unit === u} className={`min-h-[48px] min-w-[48px] rounded-xl px-3 font-bold ${unit === u ? "sk-btn" : "sk-btn-secondary"}`}>°{u}</button>)}
          </div>
        )}
        <MicButton size="small" onText={(t) => setVal(t.match(/\d+(?:\.\d+)?/)?.[0] ?? val)} />
      </div>
      <div className="mt-2"><SkButton variant="secondary" disabled={!val || busy} loading={busy} onClick={send} data-testid="log-send">{tr("logNow", lang)}</SkButton></div>
      {msg && <p role="status" className="mt-2 text-sm font-semibold text-ink-muted" data-testid="log-message">{msg}</p>}
    </div>
  );
}

function ActionCard({ a, caseId, onUpdate, refresh }: { a: FamilyAction; caseId: string; onUpdate: (a: FamilyAction) => void; refresh: () => void }) {
  const { lang } = useLang();
  const nav = useNavigate();
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const Icon = ICON[a.type] ?? Stethoscope;
  const st = STATUS[a.status] ?? STATUS.suggested;
  const isTest = a.type === "home_sample_collection" || a.type === "facility_test_referral";
  const noSlot = a.type === "home_monitoring" || a.type === "facility_test_referral" || a.type === "specialist_referral";
  const open = a.status === "suggested";

  async function startNoSlot() {
    setBusy(true);
    try { onUpdate(await api.schedule(a.id)); } finally { setBusy(false); }
  }
  return (
    <li className="sk-card p-4" data-testid={`action-${a.type}`}>
      <div className="flex items-start gap-3">
        <span className="sk-well grid h-12 w-12 shrink-0 place-items-center text-neel-600" style={{ borderRadius: 14 }}><Icon size={24} aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="break-words text-lg font-bold leading-snug text-ink">{a.title}</p>
          <span className={`mt-1 inline-block rounded-full px-3 py-0.5 text-sm font-bold ${st.cls}`} data-testid="action-status">{tr(a.type === "follow_up_checkin" ? "stOn" : st.key, lang)}</span>
        </div>
      </div>
      <p className="mt-2 break-words text-base text-ink">{a.note}</p>
      {isTest && <p className="mt-1 text-sm font-semibold text-brass-600">{tr("doctorDecides", lang)}</p>}
      {a.why && <p className="mt-1 break-words text-sm text-ink-muted">{a.why}</p>}
      {a.scheduled_for && <p className="mt-2 font-semibold text-neel-700" data-testid="action-when">{when(a.scheduled_for, lang)}{a.provider_name ? ` · ${a.provider_name}` : ""}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {a.type === "follow_up_checkin" ? (
          <Link to={`/checkin/${caseId}`} className="sk-btn-secondary" data-testid="action-checkin-link">{tr("checkin", lang)}</Link>
        ) : a.primary && open ? (
          <SkButton onClick={() => nav("/book")} data-testid="schedule-primary">{tr("findCaregiver", lang)}</SkButton>
        ) : open && noSlot ? (
          <SkButton loading={busy} disabled={busy} onClick={startNoSlot} data-testid={`schedule-${a.type}`}>{tr(a.type === "home_monitoring" ? "startIt" : "requestIt", lang)}</SkButton>
        ) : open ? (
          <SkButton onClick={() => setPicker(true)} data-testid={`schedule-${a.type}`}>{tr("schedule", lang)}</SkButton>
        ) : null}
        {!open && a.type !== "follow_up_checkin" && a.status !== "done" && !a.primary && a.status !== "awaiting_clinician" && a.type !== "home_monitoring" && (
          <SkButton variant="secondary" onClick={() => setPicker(true)}>{tr("pickTime", lang)}</SkButton>
        )}
      </div>
      {a.type === "home_monitoring" && !open && <Log action={a} caseId={caseId} onChange={refresh} />}
      {picker && <SlotPicker action={a} onClose={() => setPicker(false)} onScheduled={onUpdate} />}
    </li>
  );
}

/** "Aapke agle kadam / Your next steps": the Action Plan as tap-to-schedule cards, plus the timeline of what is already planned. */
export default function ActionPlan({ caseId, actions, setActions }: { caseId: string; actions: FamilyAction[]; setActions: (a: FamilyAction[]) => void }) {
  const { lang } = useLang();
  if (!actions.length) return null;
  const update = (a: FamilyAction) => setActions(actions.map((x) => (x.id === a.id ? a : x)));
  const refresh = () => void api.caseActions(caseId).then(setActions).catch(() => {});
  const planned = actions.filter((a) => a.scheduled_for).sort((x, y) => (x.scheduled_for! < y.scheduled_for! ? -1 : 1));
  return (
    <section aria-labelledby="next-steps" data-testid="action-plan" className="flex flex-col gap-3">
      <h2 id="next-steps" className="sk-engraved text-xl font-bold text-neel-700">{tr("nextSteps", lang)}</h2>
      <ul className="flex flex-col gap-3">
        {actions.map((a) => <ActionCard key={a.id} a={a} caseId={caseId} onUpdate={update} refresh={refresh} />)}
      </ul>
      {planned.length > 0 && (
        <SkCard header={tr("timeline", lang)}>
          <ol className="flex flex-col gap-2" data-testid="timeline">
            {planned.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-2 text-base">
                <span className="font-bold text-neel-700">{when(a.scheduled_for, lang)}</span><span className="min-w-0 break-words">{a.title}</span>
                <span className="text-sm text-ink-muted">· {tr(a.status === "awaiting_clinician" ? "stAwaiting" : "stScheduled", lang)}</span>
              </li>
            ))}
          </ol>
        </SkCard>
      )}
    </section>
  );
}
