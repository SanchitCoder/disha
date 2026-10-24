import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Logo from "./components/sk/Logo";
import LangSwitch from "./components/sk/LangSwitch";
import BackendStatus from "./components/BackendStatus";
import { Lang, LangCtx, tr } from "./i18n";
import { CaseProvider } from "./state";
import Book from "./pages/Book";
import Emergency from "./pages/Emergency";
import NurseQueue from "./pages/NurseQueue";
import Plan from "./pages/Plan";
import Question from "./pages/Question";
import SafetyNet from "./pages/SafetyNet";
import Landing from "./pages/Landing";
import Speak from "./pages/Speak";

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
          <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-2 px-4">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Disha home">
              <Logo />
              <span className="leading-none">
                <span className="font-display block text-2xl font-bold tracking-tight text-neel-700">Disha</span>
                <span className="block text-xs font-semibold text-brass-600">दिशा</span>
              </span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/nurse" className="hidden px-2 text-sm font-semibold text-neel-600 underline-offset-4 hover:underline lg:inline">For providers</Link>
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
            <Route path="/q" element={<Question />} />
            <Route path="/plan" element={<Plan />} />
            <Route path="/book" element={<Book />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/checkin/:caseId" element={<SafetyNet />} />
            <Route path="/nurse" element={<NurseQueue />} />
          </Routes>
        </main>
      </CaseProvider>
    </LangCtx.Provider>
  );
}
