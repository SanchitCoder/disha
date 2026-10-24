import { Volume2 } from "lucide-react";
import { useEffect } from "react";
import { speak } from "../lib/speech";

/** Read-aloud button (browser speechSynthesis); with `auto`, reads once on mount. */
export default function ListenButton({ text, auto = false, label = "Listen" }: { text: string; auto?: boolean; label?: string }) {
  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => speak(text), 400);   // voices load async
    return () => { clearTimeout(t); window.speechSynthesis?.cancel(); };
  }, [auto, text]);
  return <button aria-label={label} onClick={() => speak(text)} className="sk-round"><Volume2 size={24} aria-hidden /></button>;
}
