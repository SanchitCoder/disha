import { CloudOff, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { API, API_CONFIGURED } from "../api";
import { useLang } from "../i18n";

/** Pings /health on load. Shows a banner while the server wakes up (free hosts sleep) or if it cannot be reached.
 *  Emergency numbers stay one tap away in the header, so this never blocks them. */
export default function BackendStatus() {
  const { lang } = useLang();
  const [state, setState] = useState<"checking" | "ok" | "down">("checking");
  const [slow, setSlow] = useState(false);

  const check = useCallback(async () => {
    setState("checking"); setSlow(false);
    const slowTimer = setTimeout(() => setSlow(true), 2500);
    const ctl = new AbortController();
    const abort = setTimeout(() => ctl.abort(), 45000);   // a sleeping free-tier host can take ~30 s
    try {
      const r = await fetch(API + "/health", { signal: ctl.signal });
      // a static host's SPA fallback answers 200 with index.html: only a JSON {status:"ok"} counts as the Disha API
      const j = r.ok ? await r.json().catch(() => null) : null;
      setState(j?.status === "ok" ? "ok" : "down");
    } catch { setState("down"); }
    finally { clearTimeout(slowTimer); clearTimeout(abort); }
  }, []);

  useEffect(() => void check(), [check]);
  if (state === "ok" || (state === "checking" && !slow)) return null;

  const hi = lang === "hi";
  return (
    <div role="status" className="border-b border-amber/40 bg-[#FBF0D9] px-4 py-3 text-center text-sm font-semibold text-ink">
      {state === "checking" ? (
        <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={16} aria-hidden />{hi ? "सर्वर जाग रहा है… कृपया रुकें" : "Waking up the server… one moment"}</span>
      ) : (
        <span className="inline-flex flex-wrap items-center justify-center gap-2">
          <CloudOff size={16} aria-hidden />
          {API_CONFIGURED
            ? (hi ? "सर्वर से जुड़ नहीं पा रहे।" : "Can't reach the Disha server.")
            : (hi ? "सर्वर का पता सेट नहीं है (VITE_API_URL)।" : "Server address is not configured (set VITE_API_URL when building).")}
          <button onClick={check} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-neel-700 underline underline-offset-2"><RefreshCw size={14} aria-hidden />{hi ? "फिर कोशिश करें" : "Retry"}</button>
          <span className="w-full text-xs font-normal text-ink-muted">{hi ? "इमरजेंसी में सीधे 112 पर कॉल करें।" : "In an emergency, call 112 directly."}</span>
        </span>
      )}
    </div>
  );
}
