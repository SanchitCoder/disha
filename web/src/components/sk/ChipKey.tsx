import { ButtonHTMLAttributes } from "react";

type Tone = "neutral" | "primary" | "sage" | "alarm";

/** Answer chip drawn as a physical keyboard key (thick bottom edge, sinks when pressed, lit when selected). */
export default function ChipKey({ tone = "neutral", selected, children, onClick, ...rest }: { tone?: Tone; selected?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} data-tone={tone} data-selected={selected ? "true" : "false"} className="sk-key"
      onClick={(e) => { navigator.vibrate?.(10); onClick?.(e); }}>
      {children}
    </button>
  );
}
