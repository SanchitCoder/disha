import { ClipboardPen } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, DetailField, DetailsForm as Form, FamilyAction } from "../api";
import { tr, useLang } from "../i18n";
import { useCase } from "../state";
import AgeInput from "./AgeInput";
import ChipKey from "./sk/ChipKey";
import SkButton from "./sk/SkButton";
import SkCard from "./sk/SkCard";
import { SkInput } from "./sk/SkInput";

type Lbl = string | { en: string; hi: string; hinglish: string };
const L = (x: Lbl, lang: "hi" | "en") => (typeof x === "string" ? x : lang === "hi" ? x.hi : x.en);

function Field({ f, value, onChange, lang }: { f: DetailField; value: unknown; onChange: (v: unknown) => void; lang: "hi" | "en" }) {
  const chip = (v: string | number, label: string, selected: boolean, onClick: () => void) => (
    <ChipKey key={String(v)} tone={selected ? "primary" : "neutral"} selected={selected} onClick={onClick} style={{ minHeight: 52, minWidth: "3.25rem", fontSize: "1rem", width: "auto", padding: "0.5rem 1.1rem" }}>{label}</ChipKey>
  );
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-base font-bold">{L(f.label, lang)}{f.optional && <span className="font-normal text-ink-muted"> ({lang === "hi" ? "वैकल्पिक" : "optional"})</span>}</legend>
      {f.type === "yesno" && <div className="flex gap-2">{[["yes", tr("yes", lang)], ["no", tr("no", lang)]].map(([v, l]) => chip(v, l, value === v, () => onChange(value === v ? undefined : v)))}</div>}
      {(f.type === "chips" || f.type === "number_chips") && (
        <div className="flex flex-wrap gap-2">
          {f.options?.map((o) => chip(o.value, L(o.label, lang), value === o.value, () => onChange(value === o.value ? undefined : o.value)))}
          {f.none && chip(f.none.value, L(f.none.label, lang), value === f.none.value, () => onChange(value === f.none!.value ? undefined : f.none!.value))}
        </div>
      )}
      {f.type === "multi_chips" && (
        <div className="flex flex-wrap gap-2">
          {f.options?.map((o) => { const arr = (value as string[] | undefined) ?? []; const on = arr.includes(String(o.value)); return chip(o.value, L(o.label, lang), on, () => onChange(on ? arr.filter((x) => x !== o.value) : [...arr, String(o.value)])); })}
        </div>
      )}
      {f.type === "age" && <AgeInput label={L(f.label, lang)} value={typeof value === "number" ? value : undefined} onChange={onChange} />}
      {f.type === "number" && <SkInput inputMode="decimal" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={f.unit} aria-label={L(f.label, lang)} />}
      {f.type === "number_pair" && (
        <div className="flex items-center gap-2">
          <SkInput inputMode="numeric" value={((value as string[]) ?? ["", ""])[0]} onChange={(e) => onChange([e.target.value, ((value as string[]) ?? ["", ""])[1]])} placeholder="120" aria-label="Top" />
          <span aria-hidden>/</span>
          <SkInput inputMode="numeric" value={((value as string[]) ?? ["", ""])[1]} onChange={(e) => onChange([((value as string[]) ?? ["", ""])[0], e.target.value])} placeholder="80" aria-label="Bottom" />
        </div>
      )}
      {f.type === "text" && (
        <div className="flex flex-col gap-2">
          <SkInput value={value === "none" ? "" : (value as string) ?? ""} onChange={(e) => onChange(e.target.value)} aria-label={L(f.label, lang)} />
          {f.allow_none && <div>{chip("none", tr("piNone", lang), value === "none", () => onChange(value === "none" ? undefined : "none"))}</div>}
        </div>
      )}
    </fieldset>
  );
}

/** Optional "2 minute mein aur details do" card: tap-only, only what Disha does not already know; re-runs red-flag gate, decision and plan. */
export default function DetailsCard({ caseId, onPlan }: { caseId: string; onPlan: (a: FamilyAction[]) => void }) {
  const { lang } = useLang();
  const { setLast } = useCase();
  const nav = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [open, setOpen] = useState(false);
  const [ans, setAns] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "warn" } | null>(null);

  async function openForm() {
    setOpen(true);
    if (!form) { try { setForm(await api.detailsForm(caseId)); } catch (e) { setMsg({ text: (e as Error).message, tone: "warn" }); } }
  }
  async function save() {
    setBusy(true); setMsg(null);
    try {
      const clean = Object.fromEntries(Object.entries(ans).filter(([, v]) => v !== undefined && v !== "" && !(Array.isArray(v) && v.every((x) => x === ""))));
      const r = await api.saveDetails(caseId, clean);
      setLast({ triage: r.triage, app: r.app });
      if (r.emergency) { nav("/emergency"); return; }
      onPlan(r.app.actions);
      setMsg({ text: r.urgency_raised ? tr("urgencyRaised", lang) : tr("qdSaved", lang), tone: r.urgency_raised ? "warn" : "ok" });
      if (r.rejected?.length) { setMsg({ text: tr("piBad", lang), tone: "warn" }); return; }
      setOpen(false); setForm(null); setAns({});
    } catch (e) { setMsg({ text: (e as Error).message, tone: "warn" }); } finally { setBusy(false); }
  }

  return (
    <SkCard>
      {msg && <p role="status" data-testid="details-message" className={`mb-3 rounded-2xl p-3 font-semibold ${msg.tone === "warn" ? "bg-[#FBF0D9] text-[#7A4B05]" : "bg-[#E4F1E6] text-[#1F4A2A]"}`}>{msg.text}</p>}
      {!open ? (
        <SkButton variant="secondary" size="lg" icon={ClipboardPen} onClick={openForm} data-testid="open-details">{tr("qdOpen", lang)}</SkButton>
      ) : !form ? <p role="status" className="text-ink-muted">{tr("thinking", lang)}</p> : (
        <div className="flex flex-col gap-5">
          <div><h2 className="text-xl font-bold text-neel-700">{L(form.title, lang)}</h2><p className="mt-1 text-sm text-ink-muted">{L(form.intro, lang)}</p></div>
          {form.known.length > 0 && <p className="sk-well p-3 text-sm"><b>{tr("qdKnown", lang)}:</b> {form.known.map((k) => L(k.label, lang)).join(" · ")}</p>}
          {form.fields.map((f) => <Field key={f.id} f={f} lang={lang} value={ans[f.id]} onChange={(v) => setAns((a) => ({ ...a, [f.id]: v }))} />)}
          <div className="flex flex-col gap-3 sm:flex-row"><SkButton size="lg" loading={busy} disabled={busy} onClick={save} data-testid="save-details">{tr("qdSave", lang)}</SkButton>
            <SkButton size="lg" variant="ghost" onClick={() => setOpen(false)}>{tr("close", lang)}</SkButton></div>
        </div>
      )}
    </SkCard>
  );
}
