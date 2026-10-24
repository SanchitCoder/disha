import { MapPin, SendHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import Bi from "../components/Bi";
import MicButton from "../components/MicButton";
import SkButton from "../components/sk/SkButton";
import SkCard from "../components/sk/SkCard";
import { SkTextarea } from "../components/sk/SkInput";
import { tr, useLang } from "../i18n";
import { useCase } from "../state";

export default function Speak() {
  const { lang } = useLang();
  const { submit, busy, error, location, setLocation } = useCase();
  const [text, setText] = useState("");
  const [heard, setHeard] = useState<string | null>(null);
  useEffect(() => void window.speechSynthesis?.cancel(), []);

  function changeLocation() {
    const v = prompt("lat,lng  (e.g. 28.54,77.27)", `${location.lat},${location.lng}`);
    const [a, b] = (v ?? "").split(",").map(Number);
    if (Number.isFinite(a) && Number.isFinite(b)) setLocation({ lat: a, lng: b });
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="text-center">
        <h1 className="sk-engraved text-[clamp(1.9rem,7vw,2.4rem)] font-bold leading-tight text-neel-700"><Bi k="ask" subClass="text-base text-ink-muted" /></h1>
        {lang === "hi" && <p className="mt-1 text-ink-muted">{tr("askRoman", "hi")}</p>}
      </div>

      {heard === null ? (
        <div className="grid place-items-center py-2"><MicButton hint onText={(t) => setHeard(t)} /></div>
      ) : (
        <SkCard header={<Bi k="confirmHeard" subClass="text-sm text-ink-muted" />}>
          <SkTextarea value={heard} onChange={(e) => setHeard(e.target.value)} rows={3} aria-label="Transcript" />
          <div className="mt-4 flex flex-col gap-3">
            <SkButton size="lg" icon={SendHorizontal} disabled={busy || !heard.trim()} loading={busy} onClick={() => submit(heard)}>{tr("send", lang)}</SkButton>
            <SkButton variant="secondary" size="lg" onClick={() => setHeard(null)}>{tr("retry", lang)}</SkButton>
          </div>
        </SkCard>
      )}

      <SkCard>
        <label htmlFor="typed" className="mb-2 block text-sm font-semibold text-ink-muted"><Bi k="typeInstead" /></label>
        <SkTextarea id="typed" value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder={tr("example", lang)} />
        <div className="mt-4"><SkButton size="lg" icon={SendHorizontal} disabled={!text.trim()} loading={busy && heard === null} onClick={() => submit(text)} data-testid="send-typed">{tr("send", lang)}</SkButton></div>
      </SkCard>

      {busy && <p className="text-center text-lg font-semibold text-neel-600" role="status">{tr("thinking", lang)}</p>}
      {error && <p className="rounded-2xl border border-alarm/30 bg-[#FBEAE8] p-3 text-alarm" role="alert">{tr("error", lang)} <span className="text-xs">{error}</span></p>}

      <div className="sk-well mx-auto flex max-w-full flex-wrap items-center justify-center gap-x-2 px-4 py-1 text-sm text-ink" style={{ borderRadius: 24 }}>
        <MapPin size={16} className="text-brass-600" aria-hidden />{location.lat.toFixed(2)}, {location.lng.toFixed(2)}
        <button onClick={changeLocation} className="sk-textbtn font-semibold text-neel-600 underline underline-offset-2">{tr("changeLoc", lang)}</button>
      </div>
    </div>
  );
}
