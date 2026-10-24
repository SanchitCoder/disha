import { MapPin } from "lucide-react";
import ListenButton from "../components/ListenButton";
import AlarmKey from "../components/sk/AlarmKey";
import SkButton from "../components/sk/SkButton";
import { tl, tr, useLang } from "../i18n";
import { useCase } from "../state";

/** Works with or without an active case: without one (e.g. from the header pill) it shows the generic emergency steps. */
export default function Emergency() {
  const { last, location, reset } = useCase();
  const { lang } = useLang();
  const live = last?.app.is_emergency ? last : null;
  const steps = live?.app.emergency_steps?.length ? live.app.emergency_steps : [tr("eStep1", lang), tr("eStep2", lang), tr("eStep3", lang)];
  const speakText = live?.app.speak_text || tr("emergencySpeak", lang);
  const link = `https://maps.google.com/?q=${location.lat},${location.lng}`;
  const share = async () => {
    const data = { title: "Disha emergency", text: `Emergency! Patient location: ${link}`, url: link };
    if (navigator.share) await navigator.share(data).catch(() => {}); else window.open(`https://wa.me/?text=${encodeURIComponent(data.text)}`, "_blank");
  };
  return (
    <>
      <div aria-hidden className="fixed inset-0 z-0" style={{ background: "radial-gradient(ellipse at 50% 0%, #D9453C 0%, #B02A22 55%, #7E1A15 100%)" }} />
      <div className="relative z-10 flex flex-col gap-5 pb-8 pt-2 text-white">
        <div className="flex items-start gap-3">
          <h1 className="flex-1 text-[clamp(1.9rem,7vw,2.4rem)] font-bold leading-tight" style={{ textShadow: "0 2px 0 rgba(0,0,0,.25)" }}>{tr("emergency", lang)}</h1>
          <ListenButton text={speakText} auto />
        </div>
        <div className="flex gap-4"><AlarmKey number="112" label={tl("national", lang)} /><AlarmKey number="108" label={tl("ambulance", lang)} /></div>
        <p className="text-center text-sm text-red-100">{tr("eNote", lang)}</p>
        <ol className="flex flex-col gap-3 rounded-3xl bg-black/20 p-4 text-lg">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white font-display text-lg font-bold text-alarm" style={{ boxShadow: "inset 0 -2px 3px rgba(0,0,0,.2), 0 2px 4px rgba(0,0,0,.3)" }}>{i + 1}</span>{s}
            </li>
          ))}
        </ol>
        {live && <p className="text-sm text-red-100">{live.triage.reasoning}</p>}
        <button onClick={share} className="sk-btn-secondary !min-h-[56px] !text-alarm"><MapPin size={20} aria-hidden />{tr("shareLoc", lang)}</button>
        <button onClick={reset} className="sk-textbtn mx-auto font-semibold text-red-100 underline underline-offset-4">{tr("start", lang)}</button>
      </div>
    </>
  );
}
