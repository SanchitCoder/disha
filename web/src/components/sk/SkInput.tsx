import { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

/** Inset-well input/textarea. `trailing` renders an action (e.g. a mic button) inside on the right. */
export function SkInput({ trailing, ...p }: { trailing?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <input {...p} className={`sk-input min-h-[56px] ${trailing ? "pr-16" : ""}`} />
      {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
    </div>
  );
}

export function SkTextarea({ trailing, ...p }: { trailing?: ReactNode } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="relative">
      <textarea {...p} className={`sk-input resize-none ${trailing ? "pr-16" : ""}`} />
      {trailing && <div className="absolute bottom-2 right-2">{trailing}</div>}
    </div>
  );
}
