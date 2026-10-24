import { Mic } from "lucide-react";

/** Presentational mic: enamel indigo dome in a brass bezel. (The live recorder in components/MicButton.tsx gets this look in the app-screens phase.) */
export default function MicDome({ size = 168, recording = false, className = "" }: { size?: number; recording?: boolean; className?: string }) {
  const inner = size - 20;
  return (
    <div className={`sk-brass-ring relative inline-block ${className}`} style={{ width: size, height: size }} aria-hidden>
      {recording && <span className="rec absolute inset-0 rounded-full" />}
      <div
        className={`grid place-items-center rounded-full text-white ${recording ? "" : "sk-breathe"}`}
        style={{
          width: inner, height: inner,
          background: recording
            ? "radial-gradient(circle at 32% 26%, #D9635B 0%, #7B2E5A 45%, #1F2865 100%)"
            : "radial-gradient(circle at 32% 26%, #8E99DB 0%, #2E3A87 48%, #1F2865 100%)",
          boxShadow: "inset 0 3px 6px rgba(255,255,255,.35), inset 0 -10px 18px rgba(0,0,0,.35), 0 4px 10px rgba(31,40,101,.45)",
        }}
      >
        <Mic size={size * 0.34} strokeWidth={2.2} />
      </div>
    </div>
  );
}
