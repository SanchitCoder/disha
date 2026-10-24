import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { Link, Route, Routes, useLocation, useParams } from "react-router-dom";
import { ReactNode } from "react";
import Logo from "./components/sk/Logo";
import LangSwitch from "./components/sk/LangSwitch";
import BackendStatus from "./components/BackendStatus";
import { Lang, LangCtx, tr, useLang } from "./i18n";
import { CaseProvider, useCase } from "./state";
import Book from "./pages/Book";
import Emergency from "./pages/Emergency";
import NurseQueue from "./pages/NurseQueue";
import Plan from "./pages/Plan";
import Question from "./pages/Question";
import SafetyNet from "./pages/SafetyNet";
import Landing from "./pages/Landing";
import CaregiverBrief from "./pages/CaregiverBrief";
import Speak from "./pages/Speak";

/** Waits for the stored case to be restored; for /plan/:caseId style deep links, loads that case first. */
function WithCase({ children }: { children: ReactNode }) {
  const { caseId: wanted } = useParams();
  const { ready, caseId, hydrate } = useCase();
  const [state, setState] = useState<"loading" | "ok" | "missing">(wanted && wanted !== caseId ? "loading" : "ok");
  const { lang } = useLang();
  useEffect(() => {
    if (wanted && wanted !== caseId) hydrate(wanted).then(() => setState("ok")).catch(() => setState("missing"));
  }, [wanted]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (!ready || state === "loading") return <p className="py-10 text-center text-lg font-semibold text-neel-600" role="status">{tr("thinking", lang)}</p>;
  if (state === "missing") return <p className="sk-card p-5 text-lg">{tr("caseGone", lang)} <Link className="font-semibold underline" to="/start">{tr("start", lang)}</Link></p>;
  return <>{children}</>;
}

function useOnline() {
  const [on, setOn] = useState(navigator.onLine);
  useEffect(() => {
    const u = () => setOn(true), d = () => setOn(false);
    window.addEventListener("online", u); window.addEventListener("offline", d);
    return () => { window.removeEventListener("online", u); window.removeEventListener("offline", d); };
  }, []);
  return on;
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => (localStorage.getItem("disha.lang") as Lang) || "hi");
  const online = useOnline();
  const { pathname } = useLocation();
  useEffect(() => { try { localStorage.setItem("disha.lang", lang); } catch { /* private mode */ } document.documentElement.lang = lang; }, [lang]);
  const wide = pathname.startsWith("/nurse");
  const landing = pathname === "/";

  return (
    <LangCtx.Provider value={{ lang, setLang }}>
      <CaseProvider>
        <header className="sk-header sticky top-0 z-20">
          {/* wraps instead of overflowing: at 180-300 CSS px (a phone at 150-200% zoom) the controls drop to their own row */}
          <div className="mx-auto flex min-h-16 max-w-[1120px] flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-3 py-1.5 sm:px-4">
            <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Disha home">
              <Logo />
              <span className="min-w-0 leading-none">
                <span className="font-display block text-2xl font-bold tracking-tight text-neel-700">Disha</span>
                <span className="block text-xs font-semibold text-brass-600 max-[339px]:hidden">दिशा</span>
              </span>
            </Link>
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
              <Link to="/nurse" className="sk-textbtn hidden px-2 text-sm font-semibold text-neel-600 underline-offset-4 hover:underline lg:inline-flex">For providers</Link>
              <Link to="/emergency" aria-label="Emergency? Call 112"
                className="sk-btn-alarm !min-h-[44px] !gap-1.5 !rounded-full !px-3 text-sm sm:!px-4">
                <Phone size={16} strokeWidth={2.5} aria-hidden /><span className="hidden sm:inline">Emergency?</span> 112
              </Link>
              <LangSwitch />
            </div>
          </div>
        </header>
        <BackendStatus />
        {!online && (
          <a href="tel:112" className="block bg-alarm p-3 text-center text-lg font-bold text-white">{tr("offline", lang)}</a>
        )}
        <main className={landing ? "" : `mx-auto px-4 py-4 ${wide ? "max-w-6xl" : "max-w-[480px]"}`}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/start" element={<Speak />} />
            {["/q", "/q/:caseId"].map((p) => <Route key={p} path={p} element={<WithCase><Question /></WithCase>} />)}
            {["/plan", "/plan/:caseId"].map((p) => <Route key={p} path={p} element={<WithCase><Plan /></WithCase>} />)}
            {["/book", "/book/:caseId"].map((p) => <Route key={p} path={p} element={<WithCase><Book /></WithCase>} />)}
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/checkin/:caseId" element={<SafetyNet />} />
            <Route path="/nurse" element={<NurseQueue />} />
            <Route path="/brief/:bookingId" element={<CaregiverBrief />} />
          </Routes>
        </main>
      </CaseProvider>
    </LangCtx.Provider>
  );
}
