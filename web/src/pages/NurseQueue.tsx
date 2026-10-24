import { BellPlus, Brain, Check, PencilLine } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ModelInfo, QueueItem, Taxonomy } from "../api";
import ConfidenceGauge from "../components/sk/ConfidenceGauge";
import SkButton from "../components/sk/SkButton";
import UrgencyLight from "../components/sk/UrgencyLight";
import { tr, useLang } from "../i18n";
import { watchCases } from "../lib/supabase";

export default function NurseQueue() {
  const { lang } = useLang();
  const [rows, setRows] = useState<QueueItem[]>([]);
  const [tax, setTax] = useState<Taxonomy | null>(null);
  const [edit, setEdit] = useState<Record<string, { care_type?: string; urgency?: string }>>({});
  const [toast, setToast] = useState(false);
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [learnedMsg, setLearnedMsg] = useState("");
  const seen = useRef<Set<string> | null>(null);

  const load = useCallback(() => void api.queue().then((r) => {
    if (seen.current && r.some((x) => !seen.current!.has(x.case_id))) { setToast(true); setTimeout(() => setToast(false), 4000); }
    seen.current = new Set(r.map((x) => x.case_id));
    setRows(r);
  }).catch(() => {}), []);

  useEffect(() => {
    api.taxonomy().then(setTax).catch(() => {});
    api.modelInfo().then(setModel).catch(() => {});
    load();
    const off = watchCases(load);                // Supabase Realtime when configured
    const iv = setInterval(load, 4000);          // polling fallback
    return () => { off(); clearInterval(iv); };
  }, [load]);

  async function approve(id: string, withEdit: boolean) {
    const res = await api.approve(id, withEdit ? edit[id] : undefined);
    if (res.learned) { setLearnedMsg(`${tr("learned", lang)} (${res.learned.trained_on.nurse_feedback})`); setTimeout(() => setLearnedMsg(""), 5000); api.modelInfo().then(setModel).catch(() => {}); }
    seen.current?.delete(id);
    setRows((r) => r.filter((x) => x.case_id !== id));
  }
  const sel = "sk-input !min-h-[44px] !py-2 !text-base";

  return (
    <div className="mx-auto max-w-5xl pb-10">
      {toast && (
        <div role="status" className="fixed right-4 top-20 z-30 flex items-center gap-2 rounded-2xl px-4 py-3 font-bold text-ink"
          style={{ background: "linear-gradient(180deg,var(--brass-200),var(--brass-400))", boxShadow: "0 10px 20px -6px var(--shadow-dark), inset 0 1px 0 #fff9", animation: "toast-in .3s ease-out" }}>
          <BellPlus size={20} aria-hidden />{tr("nurseNew", lang)}
        </div>
      )}
      <h1 className="sk-engraved mb-5 flex items-center gap-3 text-3xl font-bold text-neel-700">{tr("nurseQueue", lang)}
        <span className="rounded-full px-3 py-0.5 text-base text-ink" style={{ background: "linear-gradient(180deg,var(--brass-200),var(--brass-400))", boxShadow: "inset 0 1px 0 #fff9" }}>{rows.length}</span></h1>
      {model && (
        <p className="sk-well mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm" style={{ borderRadius: 16 }}>
          <Brain size={18} className="text-neel-600" aria-hidden />
          <span><b>{tr("modelLabel", lang)}:</b> {model.trained_classifier.trained_on.labelled_examples} + <b>{model.trained_classifier.trained_on.nurse_feedback}</b> nurse corrections</span>
          {model.trained_classifier.cross_validation && <span>unseen-phrasing accuracy {Math.round(model.trained_classifier.cross_validation.accuracy_care * 100)}%</span>}
          <span>{model.language_model.model} × {Math.round(model.blend.classifier_weight * 100)}% blend</span>
        </p>
      )}
      {learnedMsg && <p role="status" className="mb-4 rounded-2xl border-2 border-sage bg-[#E4F1E6] px-4 py-3 font-semibold text-[#1F4A2A]">{learnedMsg}</p>}
      {!rows.length && <p className="sk-card p-6 text-ink-muted">No cases waiting. New low-confidence cases appear here live.</p>}
      {!!rows.length && (
        <div className="sk-card overflow-hidden !p-0">
          <ul>
            {rows.map((r, i) => (
              <li key={r.case_id} className="grid gap-4 p-4 md:grid-cols-[1fr_auto_auto] md:items-center"
                style={{ borderTop: i ? "1px solid rgba(120,95,60,.22)" : undefined, background: i % 2 ? "rgba(232,223,205,.35)" : undefined }}>
                <div className="min-w-0">
                  <p className="text-xs text-ink-muted">{r.case_id.slice(0, 8)} · {new Date(r.created_at).toLocaleTimeString()}</p>
                  <p className="sk-well mt-1 px-3 py-2 text-sm !rounded-xl">{r.history.filter((h) => h.role === "user").map((h) => h.content).join(" → ")}</p>
                  <p className="mt-2 text-sm"><b>AI:</b> {r.care_type?.replace(/_/g, " ")} · {r.urgency?.replace("_", "-")}</p>
                  <p className="text-sm text-ink-muted">{r.reasoning}</p>
                  {r.signals?.llm && r.signals?.model && (
                    <p className={`mt-1 text-xs font-semibold ${r.signals.agree ? "text-sage" : "text-amber"}`}>
                      {tr("llmLabel", lang)}: {r.signals.llm.care.replace(/_/g, " ")} ({Math.round(r.signals.llm.p * 100)}%) · {tr("modelLabel", lang)}: {r.signals.model.care.replace(/_/g, " ")} ({Math.round(r.signals.model.p * 100)}%)
                    </p>
                  )}
                  {!!r.key_factors?.length && <div className="mt-1 flex flex-wrap gap-1.5">{r.key_factors.map((k) => <span key={k} className="rounded-full bg-well px-2.5 py-0.5 text-xs">{k}</span>)}</div>}
                </div>
                <div className="flex items-center gap-4 md:flex-col md:gap-2">
                  <ConfidenceGauge value={r.confidence ?? 0} />
                  <UrgencyLight compact urgency={r.urgency} lang={lang} />
                </div>
                <div className="flex min-w-[220px] flex-col gap-2">
                  <select aria-label="Care type" className={sel} value={edit[r.case_id]?.care_type ?? r.care_type} onChange={(e) => setEdit({ ...edit, [r.case_id]: { ...edit[r.case_id], care_type: e.target.value } })}>
                    {tax?.care_types.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}
                  </select>
                  <select aria-label="Urgency" className={sel} value={edit[r.case_id]?.urgency ?? r.urgency} onChange={(e) => setEdit({ ...edit, [r.case_id]: { ...edit[r.case_id], urgency: e.target.value } })}>
                    {tax?.urgency_levels.map((u) => <option key={u.id} value={u.id}>{u.id}</option>)}
                  </select>
                  <SkButton variant="sage" icon={Check} onClick={() => approve(r.case_id, false)}>{tr("approve", lang)}</SkButton>
                  <SkButton variant="secondary" icon={PencilLine} onClick={() => approve(r.case_id, true)}>{tr("editApprove", lang)}</SkButton>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
