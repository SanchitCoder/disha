import { useLang } from "../../i18n";

/** Physical slide switch: inset track, raised brass knob. EN on the left, हिंदी on the right. */
export default function LangSwitch() {
  const { lang, setLang } = useLang();
  const hi = lang === "hi";
  return (
    <button
      role="switch" aria-checked={hi} aria-label={hi ? "Language: Hindi. Switch to English" : "Language: English. Switch to Hindi"}
      onClick={() => setLang(hi ? "en" : "hi")}
      className="sk-well relative h-12 w-[6.75rem] shrink-0 rounded-full p-1 sm:w-[7.5rem]"
      style={{ borderRadius: 9999 }}
    >
      <span className="pointer-events-none absolute inset-0 grid grid-cols-2 items-center text-center text-sm font-semibold text-ink-muted">
        <span>EN</span><span>हिंदी</span>
      </span>
      <span
        aria-hidden
        className="absolute top-1 grid h-10 w-[3.1rem] place-items-center rounded-full text-sm font-bold text-ink transition-[left] duration-200 ease-out sm:w-[3.4rem]"
        style={{
          left: hi ? "calc(100% - 3.1rem - 4px)" : "4px",
          background: "linear-gradient(180deg, var(--brass-200) 0%, var(--brass-400) 55%, var(--brass-600) 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,.7), 0 2px 0 rgba(120,80,10,.5), 0 6px 10px -4px var(--shadow-dark)",
          textShadow: "0 1px 0 rgba(255,255,255,.5)",
        }}
      >
        {hi ? "हिंदी" : "EN"}
      </span>
    </button>
  );
}
