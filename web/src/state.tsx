import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, Location, Session, Turn } from "./api";

const SAMPLE: Location = { lat: 28.54, lng: 77.27 };

type Ctx = {
  caseId: string | null; history: Turn[]; last: Session | null; location: Location; patientId: string | null; busy: boolean; error: string | null;
  setLocation: (l: Location) => void; setLast: (s: Session) => void; submit: (text: string) => Promise<void>; reset: () => void;
};
const C = createContext<Ctx>(null as unknown as Ctx);
export const useCase = () => useContext(C);

export function CaseProvider({ children }: { children: ReactNode }) {
  const nav = useNavigate();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [history, setHistory] = useState<Turn[]>([]);
  const [last, setLast] = useState<Session | null>(null);
  const [patientId, setPatientId] = useState<string | null>(() => localStorage.getItem("disha.patient"));
  const [location, setLocation] = useState<Location>(SAMPLE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition((p) => setLocation({ lat: p.coords.latitude, lng: p.coords.longitude }), () => {}, { timeout: 4000 });
  }, []);

  const route = useCallback((s: Session) => nav(s.app.is_emergency ? "/emergency" : s.triage.follow_up_question ? "/q" : "/plan"), [nav]);

  const submit = useCallback(async (text: string) => {
    setBusy(true); setError(null);
    try {
      const s = await api.sessionTriage({ user_input: text, location, conversation_history: history, case_id: caseId, patient_id: patientId });
      const turns: Turn[] = [...history, { role: "user", content: text }];
      if (s.triage.follow_up_question) turns.push({ role: "assistant", content: s.triage.follow_up_question });
      setHistory(turns); setCaseId(s.app.case_id); setLast(s);
      if (s.app.patient_id) { setPatientId(s.app.patient_id); localStorage.setItem("disha.patient", s.app.patient_id); }
      route(s);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }, [history, caseId, patientId, location, route]);

  const reset = useCallback(() => { setCaseId(null); setHistory([]); setLast(null); setError(null); nav("/start"); }, [nav]);

  return <C.Provider value={{ caseId, history, last, location, patientId, busy, error, setLocation, setLast, submit, reset }}>{children}</C.Provider>;
}
