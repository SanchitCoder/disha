import { useReducedMotion } from "framer-motion";
import { FastForward, SendHorizontal, Thermometer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, CaseState, Checkin } from "../api";
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
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function SafetyNet() {
  const { caseId } = useParams();
  const { lang } = useLang();
  const { setLast, hydrate } = useCase();
  const nav = useNavigate();
  const reduce = useReducedMotion();
  const [state, setState] = useState<"loading" | "ready" | "missing" | "closed">("loading");
  const [info, setInfo] = useState<CaseState | null>(null);
  const [ci, setCi] = useState<Checkin | null>(null);
  const [clock, setClock] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [next, setNext] = useState("");
  const [esc, setEsc] = useState(false);
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [temp, setTemp] = useState("");
  const [spo2, setSpo2] = useState("");
  const lock = useRef(false);        // a ref, not state: it blocks a second click in the same tick

  const load = async () => {
    try {
      const c = await hydrate(caseId!);        // from the API, so a reload or a fresh tab works
      setInfo(c);
      if (c.triage.care_type && c.app.is_emergency) { nav("/emergency", { replace: true }); return; }
      setState(c.status === "closed" ? "closed" : "ready");
    } catch { setState("missing"); }
  };
  useEffect(() => void load(), [caseId]);   // eslint-disable-line react-hooks/exhaustive-deps

  const nextHours = info?.checkins.find((c) => !c.answered)?.hours ?? 6;

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (lock.current) return undefined;
    lock.current = true; setBusy(true); setMsg("");
    try { return await fn(); } catch (e) { setMsg((e as Error).message); return undefined; } finally { lock.current = false; setBusy(false); }
  }

  const demo = () => run(async () => {
    const r = await api.simulate(caseId!, nextHours);
    setCi(r); setReveal(false); setNext(""); setPicked(null); setClock(r.hours);   // the clock hands move first ...
    await sleep(reduce ? 0 : 1600);
    setReveal(true);                                                                  // ... then the question appears
  });

  function escalate(r: Awaited<ReturnType<typeof api.reply>>) {
    if (!r.triage || !r.app) return;
    setEsc(true); setLast({ triage: r.triage, app: r.app });
    setTimeout(() => nav(r.app!.is_emergency ? "/emergency" : "/plan"), reduce ? 300 : 2200);   // both screens read the advice aloud
  }

  const reply = (t: string) => run(async () => {
    const r = await api.reply(caseId!, t);
    if (r.escalated) return escalate(r);
    setMsg(r.closed ? tr("closed", lang) : tr("noChange", lang)); setNext(r.next_action ?? "");
    setCi(null); setReveal(false); setText("");
    if (r.closed) setState("closed"); else void load();
  });

  const logReading = () => run(async () => {
    const body = { ...(temp ? { temperature_c: Number(temp) } : {}), ...(spo2 ? { spo2: Number(spo2) } : {}) };
    const r = await api.reading(caseId!, body);
    if (r.escalated) return escalate(r);
    setMsg(tr("readingNoted", lang)); setTemp(""); setSpo2("");
  });

  if (state === "loading") return <p className="py-10 text-center text-lg font-semibold text-neel-600" role="status">{tr("thinking", lang)}</p>;
  if (state === "missing") return <SkCard><p className="text-lg">{tr("caseGone", lang)}</p><div className="mt-4"><SkButton to="/start">{tr("start", lang)}</SkButton></div></SkCard>;
  if (esc) return (
    <div className="escalating -mx-4 -mt-4 grid fill-screen place-items-center p-6 text-center" role="alert">
      <div><CheckinClock hours={24} size={160} /><p className="mt-4 text-2xl font-bold text-alarm">{tr("escalating", lang)}</p></div>
    </div>
  );
  return (
    <div className="flex flex-col gap-5 pb-6">
      <h1 className="sk-engraved text-center text-2xl font-bold text-neel-700"><Bi k="checkin" /></h1>
      <div className="grid place-items-center"><CheckinClock hours={clock} size={220} /></div>

      {state === "closed" ? (
        <SkCard><p className="text-lg" data-testid="case-closed">{tr("caseClosed", lang)}</p><div className="mt-4"><SkButton to="/start">{tr("start", lang)}</SkButton></div></SkCard>
      ) : !ci || !reveal ? (
        <SkButton size="xl" variant="secondary" icon={FastForward} loading={busy} disabled={busy} onClick={demo} data-testid="demo-checkin">
          {tr(nextHours >= 24 ? "demoCheckin24" : "demoCheckin", lang)}
        </SkButton>
      ) : (
        <>
          <SkCard>
            <div className="flex items-start gap-3"><p className="flex-1 text-xl font-bold leading-snug" data-testid="checkin-question">{ci.question}</p><ListenButton text={ci.question} auto /></div>
          </SkCard>
          <div className="flex flex-col gap-4" role="group" aria-label={ci.question}>
            {ci.options.map((o, i) => (
              <ChipKey key={o} tone={TONES[i] ?? "neutral"} selected={picked === o} disabled={busy} data-testid={`reply-chip-${i}`} onClick={() => { setPicked(o); void reply(o); }}>{o}</ChipKey>
            ))}
          </div>
          <form className="flex items-center gap-3" onSubmit={(e) => { e.preventDefault(); if (text.trim()) void reply(text); }}>
            <div className="flex-1"><SkInput value={text} onChange={(e) => setText(e.target.value)} placeholder="…" aria-label="Reply" data-testid="reply-input" /></div>
            <SkButton type="submit" icon={SendHorizontal} disabled={busy || !text.trim()} aria-label={tr("send", lang)} data-testid="reply-send">{""}</SkButton>
          </form>
          <div className="flex items-center justify-center gap-3 text-ink-muted"><MicButton size="small" onText={(t) => reply(t)} /><span className="text-sm"><Bi k="orSpeak" /></span></div>
        </>
      )}

      {state === "ready" && (
        <SkCard header={<span className="flex items-center gap-2"><Thermometer size={20} aria-hidden />{tr("logReading", lang)}</span>}>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(9.5rem,100%),1fr))] gap-3">
            <label className="text-sm font-semibold text-ink-muted">{tr("temperature", lang)}<SkInput inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="38.5" data-testid="reading-temp" /></label>
            <label className="text-sm font-semibold text-ink-muted">{tr("oxygen", lang)}<SkInput inputMode="numeric" value={spo2} onChange={(e) => setSpo2(e.target.value)} placeholder="97" data-testid="reading-spo2" /></label>
          </div>
          <div className="mt-3"><SkButton variant="secondary" disabled={busy || (!temp && !spo2)} onClick={logReading} data-testid="reading-send">{tr("logReading", lang)}</SkButton></div>
        </SkCard>
      )}

      {msg && <p className="sk-well p-4 text-lg" role="status" data-testid="checkin-message">{msg}</p>}
      {next && <p className="rounded-2xl border-2 border-brass-400 bg-[#FBF3DC] p-4 text-lg font-semibold" role="status" data-testid="next-step"><span className="text-sm text-brass-600">{tr("nextStep", lang)}</span><br />{next}</p>}
      <Link to="/start" className="sk-textbtn mx-auto font-semibold text-neel-600 underline underline-offset-4">{tr("start", lang)}</Link>
    </div>
  );
}
