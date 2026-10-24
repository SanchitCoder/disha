import { ReactNode } from "react";

/** CSS phone frame: rounded body, notch, glass reflection. */
export default function PhoneMockup({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-full max-w-[16.25rem] rounded-[2.4rem] p-2.5 sm:max-w-[18rem] ${className}`}
      style={{ background: "linear-gradient(145deg,#4A4F66,#1B1E2E)", boxShadow: "0 30px 50px -20px rgba(31,40,101,.55), inset 0 1px 1px rgba(255,255,255,.3), 0 0 0 1px #0E1020" }}>
      <div className="relative min-h-[26rem] overflow-hidden rounded-[1.9rem] bg-paper">   {/* grows with its content: never clips text at large zoom */}
        <span aria-hidden className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#0E1020]" />
        <div className="flex min-h-[26rem] flex-col items-center justify-center gap-4 px-4 pb-4 pt-10">{children}</div>
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 38%)" }} />
      </div>
    </div>
  );
}
