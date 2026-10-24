import { ReactNode } from "react";

/** CSS phone frame: rounded body, notch, glass reflection. */
export default function PhoneMockup({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-[260px] rounded-[2.4rem] p-2.5 sm:w-[290px] ${className}`}
      style={{ background: "linear-gradient(145deg,#4A4F66,#1B1E2E)", boxShadow: "0 30px 50px -20px rgba(31,40,101,.55), inset 0 1px 1px rgba(255,255,255,.3), 0 0 0 1px #0E1020" }}>
      <div className="relative overflow-hidden rounded-[1.9rem] bg-paper" style={{ aspectRatio: "9 / 18.5" }}>
        <span aria-hidden className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-[#0E1020]" />
        <div className="flex h-full flex-col items-center justify-center gap-4 px-4 pt-8">{children}</div>
        <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(120deg, rgba(255,255,255,.28) 0%, rgba(255,255,255,0) 38%)" }} />
      </div>
    </div>
  );
}
