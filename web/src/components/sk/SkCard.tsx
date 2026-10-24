import { ReactNode } from "react";

/** Raised paper card with an optional engraved header. */
export default function SkCard({ header, children, className = "" }: { header?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`sk-card p-5 ${className}`}>
      {header && <h3 className="sk-engraved font-display mb-3 text-xl font-semibold text-neel-700">{header}</h3>}
      {children}
    </div>
  );
}
