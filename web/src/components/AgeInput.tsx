import { useState } from "react";
import { tr, useLang } from "../i18n";
import ChipKey from "./sk/ChipKey";
import { SkInput } from "./sk/SkInput";

/** Exact age: years, or months for an infant. Reports years (a decimal for infants) or undefined while empty/invalid. */
export default function AgeInput({ value, onChange, label }: { value: number | undefined; onChange: (years: number | undefined) => void; label: string }) {
  const { lang } = useLang();
  const [unit, setUnit] = useState<"years" | "months">(value !== undefined && value < 1 ? "months" : "years");
  const shown = value === undefined ? "" : String(unit === "months" ? Math.round(value * 12) : +value.toFixed(1));
  const set = (raw: string, u = unit) => {
    const n = parseFloat(raw);
    onChange(raw.trim() === "" || Number.isNaN(n) || n < 0 ? undefined : u === "months" ? n / 12 : n);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="min-w-0 flex-[1_1_7rem]"><SkInput inputMode="decimal" value={shown} onChange={(e) => set(e.target.value)} aria-label={label} data-testid="age-input" /></div>
      {(["years", "months"] as const).map((u) => (
        <ChipKey key={u} tone={unit === u ? "primary" : "neutral"} selected={unit === u} onClick={() => { setUnit(u); if (value !== undefined) set(shown, u); }}
          style={{ minHeight: 52, fontSize: "1rem", width: "auto", padding: "0.5rem 1.1rem" }}>{tr(u === "years" ? "piYears" : "piMonths", lang)}</ChipKey>
      ))}
    </div>
  );
}
