import { Navigate } from "react-router-dom";
import { SendHorizontal } from "lucide-react";
import { useState } from "react";
import Bi from "../components/Bi";
import ListenButton from "../components/ListenButton";
import MicButton from "../components/MicButton";
import ChipKey from "../components/sk/ChipKey";
import ProgressBeads from "../components/sk/ProgressBeads";
import SkButton from "../components/sk/SkButton";
import SkCard from "../components/sk/SkCard";
import { SkInput } from "../components/sk/SkInput";
import { tr, useLang } from "../i18n";
import { useCase } from "../state";

export default function Question() {
  const { last, submit, busy, error } = useCase();
  const { lang } = useLang();
  const [picked, setPicked] = useState<string | null>(null);
  const [text, setText] = useState("");
  const q = last?.triage.follow_up_question;
  if (!last) return <Navigate to="/start" replace />;
  if (!q) return null;   // decision just arrived: the router is already moving to /plan or /emergency
  const n = last.app.question_no, total = 2;
  return (
    <div className="flex flex-col gap-6 pb-6">
      <ProgressBeads total={total} current={n} label={`${tr("question", lang)} ${n} / ${total}`} />
      <SkCard>
        <div className="flex items-start gap-3">
          <h1 className="flex-1 text-[1.6rem] font-bold leading-snug text-ink">{q}</h1>
          <ListenButton text={q} auto />
        </div>
      </SkCard>
      <div className="flex flex-col gap-4" role="group" aria-label={q}>
        {last.app.follow_up_options.map((o) => (
          <ChipKey key={o} selected={picked === o} disabled={busy} onClick={() => { setPicked(o); void submit(o); }}>{o}</ChipKey>
        ))}
      </div>
      <form className="flex items-center gap-3" onSubmit={(e) => { e.preventDefault(); if (text.trim()) void submit(text); }}>
        <div className="flex-1"><SkInput value={text} onChange={(e) => setText(e.target.value)} placeholder="…" aria-label="Your answer" /></div>
        <SkButton type="submit" icon={SendHorizontal} disabled={busy || !text.trim()} aria-label={tr("send", lang)}>{""}</SkButton>
      </form>
      <div className="flex items-center justify-center gap-3 text-ink-muted"><MicButton size="small" onText={(t) => submit(t)} /><span className="text-sm"><Bi k="orSpeak" /></span></div>
      {error && <p className="rounded-2xl border border-alarm/30 bg-[#FBEAE8] p-3 text-alarm" role="alert">{tr("error", lang)}</p>}
    </div>
  );
}
