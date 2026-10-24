import { FastForward, SendHorizontal } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, Checkin } from "../api";
import Bi from "../components/Bi";
import ListenButton from "../components/ListenButton";
import MicButton from "../components/MicButton";
import ChipKey from "../components/sk/ChipKey";
import CheckinClock from "../components/sk/CheckinClock";
import SkButton from "../components/sk/SkButton";
import SkCard from "../components/sk/SkCard";
import { SkInput } from "../components/sk/SkInput";
import { tr, useLang } from "../i18n";
import { useCase } from "../state";

const TONES = ["sage", "neutral", "alarm"] as const;   // Better / Same / Worse

export default function SafetyNet() {
  const { caseId } = useParams();
  const { lang } = useLang();
  const { setLast } = useCase();
  const nav = useNavigate();
  const [ci, setCi] = useState<Checkin | null>(null);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [esc, setEsc] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);

  async function demo() {
    setBusy(true); setMsg("");
    try { setCi(await api.simulate(caseId!, 6)); } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }
  async function reply(t: string) {
    setBusy(true);
    try {
      const r = await api.reply(caseId!, t);
      if (r.escalated && r.triage && r.app) {
        setEsc(true); setLast({ triage: r.triage, app: r.app });
        setTimeout(() => nav(r.app!.is_emergency ? "/emergency" : "/plan"), 2200);
      } else setMsg(r.closed ? tr("closed", lang) : tr("noChange", lang));
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  }

  if (esc) return (
    <div className="escalating -mx-4 -mt-4 grid min-h-[calc(100vh-4rem)] place-items-center p-6 text-center" role="alert">
      <div><CheckinClock hours={24} size={160} /><p className="mt-4 text-2xl font-bold text-alarm">{tr("escalating", lang)}</p></div>
    </div>
  );
  return (
    <div className="flex flex-col gap-5 pb-6">
      <h1 className="sk-engraved text-center text-2xl font-bold text-neel-700"><Bi k="checkin" /></h1>
      <div className="grid place-items-center"><CheckinClock hours={ci ? ci.hours ?? 6 : 0} size={220} /></div>
      {!ci ? (
        <SkButton size="xl" variant="secondary" icon={FastForward} loading={busy} onClick={demo}>{tr("demoCheckin", lang)}</SkButton>
      ) : (
        <>
          <SkCard>
            <div className="flex items-start gap-3"><p className="flex-1 text-xl font-bold leading-snug">{ci.question}</p><ListenButton text={ci.question} auto /></div>
          </SkCard>
          <div className="flex flex-col gap-4" role="group" aria-label={ci.question}>
            {ci.options.map((o, i) => <ChipKey key={o} tone={TONES[i] ?? "neutral"} selected={picked === o} disabled={busy} onClick={() => { setPicked(o); void reply(o); }}>{o}</ChipKey>)}
          </div>
          <form className="flex items-center gap-3" onSubmit={(e) => { e.preventDefault(); if (text.trim()) void reply(text); }}>
            <div className="flex-1"><SkInput value={text} onChange={(e) => setText(e.target.value)} placeholder="…" aria-label="Reply" /></div>
            <SkButton type="submit" icon={SendHorizontal} disabled={busy || !text.trim()} aria-label={tr("send", lang)}>{""}</SkButton>
          </form>
          <div className="flex items-center justify-center gap-3 text-ink-muted"><MicButton size="small" onText={(t) => reply(t)} /><span className="text-sm"><Bi k="orSpeak" /></span></div>
        </>
      )}
      {msg && <p className="sk-well p-4 text-lg" role="status">{msg}</p>}
    </div>
  );
}
