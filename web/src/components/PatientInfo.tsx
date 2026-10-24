import { CircleAlert, CircleCheck, CircleHelp, UserRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, FamilyAction, L3 } from "../api";
import { tr, useLang } from "../i18n";
import { useCase } from "../state";
import AgeInput from "./AgeInput";
import ChipKey from "./sk/ChipKey";
import SkButton from "./sk/SkButton";
import SkCard from "./sk/SkCard";

const pick = (x: L3, lang: "hi" | "en") => (lang === "hi" ? x.hi : x.en);
const CHIP = { minHeight: 52, minWidth: "3.25rem", fontSize: "1rem", width: "auto", padding: "0.5rem 1.1rem" } as const;

/** "What we understood": the patient facts Disha is routing on, flagged stated / guessed / missing, with inline fixes for the ones that change care. */
export default function PatientInfo({ caseId, onPlan }: { caseId: string; onPlan: (a: FamilyAction[]) => void }) {
  const { lang } = useLang();
  const { last, setLast } = useCase();
  const nav = useNavigate();
  const [age, setAge] = useState<number | undefined>();
  const [sex, setSex] = useState<string | undefined>();
  const [preg, setPreg] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "warn" } | null>(null);
  const rows = last?.app.understood ?? [];
  const missing = new Set((last?.app.missing_info ?? []).filter((m) => m.important).map((m) => m.id));
  if (!rows.length && !missing.size) return null;
  const ageWrong = rows.find((r) => r.id === "age")?.status !== "stated";

  async function save() {
    const answers: Record<string, unknown> = {};
    if (age !== undefined) answers.age_years = age;
    if (sex) answers.sex = sex;
    if (preg) answers.pregnant = preg;
    if (!Object.keys(answers).length) return;
    setBusy(true); setMsg(null);
    try {
      const r = await api.saveDetails(caseId, answers);
      setLast({ triage: r.triage, app: r.app });
      if (r.emergency) { nav("/emergency"); return; }
      onPlan(r.app.actions);
      if (r.rejected?.length) { setMsg({ text: tr("piBad", lang), tone: "warn" }); return; }
      setMsg({ text: tr("piSaved", lang), tone: "ok" });
      setAge(undefined); setSex(undefined); setPreg(undefined);
    } catch (e) { setMsg({ text: (e as Error).message, tone: "warn" }); } finally { setBusy(false); }
  }

  const Icon = { stated: CircleCheck, inferred: CircleAlert, missing: CircleHelp } as const;
  const tone = { stated: "text-sage", inferred: "text-amber", missing: "text-amber" } as const;
  return (
    <SkCard header={<span className="flex items-center gap-2"><UserRound size={22} aria-hidden />{tr("piTitle", lang)}</span>}>
      <p className="mb-3 text-sm text-ink-muted">{tr("piHint", lang)}</p>
      <dl className="flex flex-col gap-2" data-testid="understood">
        {rows.map((r) => {
          const I = Icon[r.status];
          return (
            <div key={r.id} className="flex flex-wrap items-baseline gap-x-2" data-status={r.status}>
              <dt className="font-semibold text-ink-muted">{pick(r.label, lang)}:</dt>
              <dd className="min-w-0 font-bold">{pick(r.value, lang)}</dd>
              <span className={`inline-flex items-center gap-1 text-sm font-semibold ${tone[r.status]}`}><I size={16} aria-hidden />{r.status === "stated" ? "" : r.status === "inferred" ? tr("piGuess", lang) : tr("piMissing", lang)}</span>
            </div>
          );
        })}
      </dl>
      {(missing.has("age_years") || ageWrong || missing.has("sex") || missing.has("pregnant")) && (
        <div className="mt-4 flex flex-col gap-4 border-t border-well pt-4">
          {(missing.has("age_years") || ageWrong) && (
            <fieldset className="min-w-0"><legend className="mb-2 font-bold">{tr("piAgeLbl", lang)}</legend><AgeInput value={age} onChange={setAge} label={tr("piAgeLbl", lang)} /></fieldset>
          )}
          {missing.has("sex") && (
            <fieldset className="min-w-0"><legend className="mb-2 font-bold">{lang === "hi" ? "मरीज़ हैं" : "Patient is"}</legend>
              <div className="flex gap-2">{[["male", lang === "hi" ? "पुरुष" : "Male"], ["female", lang === "hi" ? "महिला" : "Female"]].map(([v, l]) => (
                <ChipKey key={v} tone={sex === v ? "primary" : "neutral"} selected={sex === v} onClick={() => setSex(sex === v ? undefined : v)} style={CHIP}>{l}</ChipKey>))}</div>
            </fieldset>
          )}
          {missing.has("pregnant") && (sex === "female" || !missing.has("sex")) && (
            <fieldset className="min-w-0"><legend className="mb-2 font-bold">{lang === "hi" ? "क्या गर्भवती हैं?" : "Is she pregnant?"}</legend>
              <div className="flex gap-2">{[["yes", tr("yes", lang)], ["no", tr("no", lang)]].map(([v, l]) => (
                <ChipKey key={v} tone={preg === v ? "primary" : "neutral"} selected={preg === v} onClick={() => setPreg(preg === v ? undefined : v)} style={CHIP}>{l}</ChipKey>))}</div>
            </fieldset>
          )}
          <SkButton size="lg" loading={busy} disabled={busy || (age === undefined && !sex && !preg)} onClick={save} data-testid="save-patient-info">{tr("piSave", lang)}</SkButton>
        </div>
      )}
      {msg && <p role="status" data-testid="patient-info-message" className={`mt-3 rounded-2xl p-3 font-semibold ${msg.tone === "warn" ? "bg-[#FBF0D9] text-[#7A4B05]" : "bg-[#E4F1E6] text-[#1F4A2A]"}`}>{msg.text}</p>}
    </SkCard>
  );
}
