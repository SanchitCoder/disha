import { Ambulance, CheckCheck, Eye, TriangleAlert, FlaskConical, Home, Hourglass, ShieldCheck, Syringe, UserRoundSearch, Video, LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api, FamilyAction, Taxonomy } from "../api";
import ActionPlan from "../components/ActionPlan";
import DetailsCard from "../components/DetailsForm";
import PatientInfo from "../components/PatientInfo";
import Bi from "../components/Bi";
import ListenButton from "../components/ListenButton";
import SkButton from "../components/sk/SkButton";
import SkCard from "../components/sk/SkCard";
import UrgencyLight from "../components/sk/UrgencyLight";
import { tr, useLang } from "../i18n";
import { watchCases } from "../lib/supabase";
import { useCase } from "../state";

const ICONS: [RegExp, LucideIcon][] = [[/paramedic|medic/, Ambulance], [/nurs/, Syringe], [/lab|test/, FlaskConical], [/tele|gp|doctor/, Video]];
export const iconFor = (label: string): LucideIcon => ICONS.find(([r]) => r.test(label))?.[1] ?? Home;

export function useTaxonomy() {
  const [t, setT] = useState<Taxonomy | null>(null);
  useEffect(() => void api.taxonomy().then(setT).catch(() => {}), []);
  return t;
}

export default function Plan() {
  const { last, setLast, caseId } = useCase();
  const { lang } = useLang();
  const nav = useNavigate();
  const tax = useTaxonomy();
  const [confirmed, setConfirmed] = useState(false);
  const [actions, setActions] = useState<FamilyAction[] | null>(null);
  const review = last?.app.needs_nurse_review && last.app.status === "awaiting_review";

  useEffect(() => {          // the live plan (statuses change as steps are scheduled); the decision response carries a first copy
    if (caseId) api.caseActions(caseId).then(setActions).catch(() => {});
  }, [caseId, last?.triage.care_type]);

  useEffect(() => {          // nurse-in-the-loop: realtime (if Supabase configured) + polling fallback
    if (!review || !caseId) return;
    const refresh = async () => {
      const c = await api.getCase(caseId).catch(() => null);
      if (c && c.status !== "awaiting_review") { setLast({ triage: c.triage, app: { ...c.app, status: c.status } }); setConfirmed(true); }
    };
    const off = watchCases(refresh, caseId);
    const iv = setInterval(refresh, 3000);
    return () => { off(); clearInterval(iv); };
  }, [review, caseId, setLast]);

  if (!last || !last.triage.care_type) return <Navigate to="/start" replace />;
  if (last.app.is_emergency) return <Navigate to="/emergency" replace />;
  const t = last.triage, a = last.app;
  const names = tax?.care_types.find((c) => c.id === t.care_type)?.names;
  const careName = (lang === "hi" ? names?.hinglish : names?.en) ?? t.care_type!.replace(/_/g, " ");
  const Icon = iconFor(t.care_type!);
  const careOf = (id: string) => id === "follow_up" ? "follow-up" : ((lang === "hi" ? tax?.care_types.find((c) => c.id === id)?.names.hinglish : tax?.care_types.find((c) => c.id === id)?.names.en) ?? id.replace(/_/g, " "));

  return (
    <div className="flex flex-col gap-5 pb-6">
      <SkCard>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="sk-well grid h-20 w-20 shrink-0 place-items-center text-neel-600" style={{ borderRadius: 22 }}><Icon size={44} strokeWidth={1.8} aria-hidden /></span>
          <div className="min-w-0 flex-[1_1_8rem]">
            <p className="text-sm font-semibold text-ink-muted"><Bi k="plan" /></p>
            <h1 className="text-[1.45rem] font-bold leading-tight text-neel-700 first-letter:uppercase">{careName}</h1>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-well/60 p-3">
          <UrgencyLight urgency={t.urgency ?? "scheduled"} lang={lang} />
          <ListenButton text={a.speak_text} auto />
        </div>
      </SkCard>

      <SkCard header={<>{tr("why", lang)}</>} className="border-l-[6px] !border-l-brass-400">
        <p className="text-base text-ink">{t.reasoning}</p>
        {a.signals?.llm && a.signals?.model && (
          <div className="sk-well mt-4 p-3 text-sm" aria-label={tr("crossCheck", lang)}>
            <p className="mb-1.5 font-semibold text-ink-muted">{tr("crossCheck", lang)}</p>
            {([["llmLabel", a.signals.llm], ["modelLabel", a.signals.model]] as const).map(([k, v]) => (
              <p key={k} className="flex items-center justify-between gap-2 py-0.5">
                <span>{tr(k, lang)}</span>
                <span className="font-semibold">{careOf(v.care)} · {Math.round(v.p * 100)}%</span>
              </p>
            ))}
            <p className={`mt-1.5 flex items-center gap-1.5 font-bold ${a.signals.agree ? "text-sage" : "text-amber"}`}>
              {a.signals.agree ? <CheckCheck size={16} aria-hidden /> : <TriangleAlert size={16} aria-hidden />}{tr(a.signals.agree ? "agreeYes" : "agreeNo", lang)}
            </p>
          </div>
        )}
      </SkCard>

      {review && (
        <div className="sk-well flex items-center gap-3 border-2 border-amber p-4 text-lg font-semibold" role="status">
          <Hourglass className="animate-pulse text-amber" aria-hidden />{tr("nurseChecking", lang)}
        </div>
      )}
      {confirmed && <div className="flex items-center gap-3 rounded-2xl border-2 border-sage bg-[#E4F1E6] p-4 text-lg font-semibold text-[#1F4A2A]" role="status"><ShieldCheck aria-hidden />{tr("nurseDone", lang)}</div>}

      {caseId && <PatientInfo caseId={caseId} onPlan={setActions} />}
      {caseId && <ActionPlan caseId={caseId} actions={actions ?? a.actions ?? []} setActions={setActions} />}
      {caseId && <DetailsCard caseId={caseId} onPlan={setActions} />}

      <SkCard header={<span className="flex items-center gap-2"><Eye size={22} aria-hidden />{tr("dhyan", lang)}</span>}>
        <ul className="flex flex-col gap-2.5">
          {[...new Set([...(a.plan_watch_signs ?? []), ...a.watch_list])].map((w) => (
            <li key={w} className="flex gap-3 text-base">
              <span aria-hidden className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #F8CF8A, var(--amber) 60%, #8A5508)", boxShadow: "0 0 8px rgba(217,142,31,.6)" }} />{w}
            </li>
          ))}
        </ul>
      </SkCard>

      <p className="text-center font-semibold text-ink-muted"><Bi k="notDiagnosis" /></p>
      {!review && <SkButton size="xl" icon={UserRoundSearch} onClick={() => nav("/book")} data-testid="find-caregiver">{tr("findCaregiver", lang)}</SkButton>}
      <Link to="/start" className="sk-textbtn mx-auto font-semibold text-neel-600 underline underline-offset-4" onClick={() => window.speechSynthesis?.cancel()}>{tr("start", lang)}</Link>
    </div>
  );
}
