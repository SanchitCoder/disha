import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, VisitBrief } from "../api";
import Clipboard from "../components/sk/Clipboard";
import { tr, useLang } from "../i18n";

/** CAREGIVER view of the Visit Brief: includes the clinician-only suggestions, labelled "Suggested — confirm on visit". Not linked from the family screens. */
export default function CaregiverBrief() {
  const { bookingId } = useParams();
  const { lang } = useLang();
  const [b, setB] = useState<VisitBrief | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { api.caregiverBrief(bookingId!).then(setB).catch((e) => setErr((e as Error).message)); }, [bookingId]);
  if (err) return <p role="alert" className="sk-card p-5 text-alarm">{err}</p>;
  if (!b) return <p role="status" className="py-10 text-center text-neel-600">{tr("thinking", lang)}</p>;
  return (
    <div className="flex flex-col gap-4 pb-6">
      <p className="rounded-2xl bg-[#FBF3DC] p-3 text-sm font-semibold">Caregiver view</p>
      <Clipboard lines={b.summary_lines} bring={b.bring_list} title={tr("visitBrief", lang)} bringTitle={tr("bring", lang)} plan={b.action_plan} planTitle={tr("briefPlan", lang)}
        suggestions={b.clinician_suggestions} suggestTitle={tr("briefSuggest", lang)} />
    </div>
  );
}
