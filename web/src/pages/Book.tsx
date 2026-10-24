import { BellRing, CalendarCheck } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, BookResponse } from "../api";
import Bi from "../components/Bi";
import MiniMap from "../components/MiniMap";
import CaregiverIDCard from "../components/sk/CaregiverIDCard";
import CheckinClock from "../components/sk/CheckinClock";
import Clipboard from "../components/sk/Clipboard";
import SkButton from "../components/sk/SkButton";
import { tl, tr, useLang } from "../i18n";
import { useCase } from "../state";

export default function Book() {
  const { last, caseId, location } = useCase();
  const { lang } = useLang();
  const nav = useNavigate();
  const [done, setDone] = useState<BookResponse | null>(null);
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [err, setErr] = useState("");
  if (!last || !caseId) return <Navigate to="/start" replace />;
  const cgs = last.app.caregivers;

  async function book(i: number) {
    setBusyIdx(i); setErr("");
    try { setDone(await api.book(caseId!, cgs[i].caregiver_id, cgs[i].slot ?? new Date().toISOString())); }
    catch (e) { setErr((e as Error).message); } finally { setBusyIdx(null); }
  }

  if (done) {
    const b = done.visit_brief;
    return (
      <div className="flex flex-col gap-5 pb-6">
        <div className="sk-card p-5 text-center">
          <p className="inline-flex items-center gap-2 text-2xl font-bold text-sage"><CalendarCheck aria-hidden /><Bi k="booked" /></p>
          <p className="mt-1 text-lg font-semibold">{String(done.caregiver.name)}</p>
        </div>
        <Link to={`/checkin/${caseId}`} data-testid="safety-banner" className="flex items-center gap-4 rounded-3xl border-2 border-sage bg-[#E4F1E6] p-4">
          <CheckinClock hours={6} size={84} />
          <p className="text-lg font-bold text-[#1F4A2A]"><Bi k="safetyOn" subClass="text-sm text-[#2B5535]" /></p>
        </Link>
        <Clipboard lines={b.summary_lines} bring={b.bring_list} title={tr("visitBrief", lang)} bringTitle={tr("bring", lang)} plan={b.action_plan} planTitle={tr("briefPlan", lang)} />
        <SkButton variant="secondary" size="lg" icon={BellRing} onClick={() => nav(`/checkin/${caseId}`)}>{tr("checkin", lang)}</SkButton>
      </div>
    );
  }

  if (!cgs.length) return <p className="sk-card p-5">No caregivers available right now. <Link className="font-semibold underline" to="/plan">Back</Link></p>;
  const reasons = (r: string) => r.split(", ").filter(Boolean);
  return (
    <div className="flex flex-col gap-5 pb-6">
      <h1 className="sk-engraved text-2xl font-bold text-neel-700"><Bi k="best" /></h1>
      <CaregiverIDCard best bestLabel={tl("bestMatch", lang)} name={cgs[0].name} role={cgs[0].role} rating={cgs[0].rating} reasons={reasons(cgs[0].reason)}
        action={<SkButton size="lg" icon={CalendarCheck} loading={busyIdx === 0} disabled={busyIdx !== null} onClick={() => book(0)} data-testid="book-top">{tr("book", lang)}</SkButton>} />
      <div className="rounded-3xl p-1.5" style={{ background: "linear-gradient(145deg,var(--brass-200),var(--brass-600))" }}><div className="sk-well overflow-hidden p-1"><MiniMap me={location} caregivers={cgs} /></div></div>
      {cgs.length > 1 && <h2 className="text-lg font-bold text-ink-muted"><Bi k="others" /></h2>}
      {cgs.slice(1).map((c, i) => (
        <CaregiverIDCard key={c.caregiver_id} compact name={c.name} role={c.role} rating={c.rating} reasons={reasons(c.reason)}
          action={<SkButton variant="secondary" loading={busyIdx === i + 1} disabled={busyIdx !== null} onClick={() => book(i + 1)}>{tr("book", lang)}</SkButton>} />
      ))}
      {err && <p className="rounded-2xl border border-alarm/30 bg-[#FBEAE8] p-3 text-alarm" role="alert">{tr("error", lang)} <span className="text-xs">{err}</span></p>}
    </div>
  );
}
