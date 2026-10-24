import { Key, pair, useLang } from "../i18n";

/** Hindi first, English below (or English only when the toggle is EN). */
export default function Bi({ k, className = "", subClass = "text-sm text-slate-500" }: { k: Key; className?: string; subClass?: string }) {
  const { lang } = useLang();
  const [a, b] = pair(k, lang);
  return <span className={className}>{a}{b && <span className={`block font-normal ${subClass}`}>{b}</span>}</span>;
}
