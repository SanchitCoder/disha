import type { components } from "./api-types";

// Typed client. Types mirror api/app/schemas.py (regenerate with `npm run gen:types` -> src/api-types.ts).
// API base URL. Dev: falls back to the local API. Production: VITE_API_URL must be set at BUILD time (e.g. https://disha-api.onrender.com).
// A localhost URL is ignored when the page itself is not served from localhost (a visitor's browser can never reach *their* localhost:8000),
// and the app then shows a "server address not configured" notice instead of failing with ERR_CONNECTION_REFUSED.
const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim().replace(/\/+$/, "");
const pageIsLocal = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);
const urlIsLocal = !!raw && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(raw);
const usable = !!raw && (!urlIsLocal || pageIsLocal);
export const API = usable ? raw! : import.meta.env.DEV ? "http://localhost:8000" : "";
export const API_CONFIGURED = usable || import.meta.env.DEV;

export type Turn = { role: "user" | "assistant"; content: string };
export type Location = { lat: number; lng: number };
export type MatchedCaregiver = components["schemas"]["MatchedCaregiver"];
export type TriageResponse = components["schemas"]["TriageResponse"];   // generated from /openapi.json
export type CaregiverCard = {
  caregiver_id: string; name: string; role: string; skills: string[]; languages: string[]; rating: number | null;
  review_count: number | null; gender: string | null; lat: number; lng: number; km: number | null; slot: string | null;
  score: number; reason: string;
};
export type AppMeta = {
  case_id: string; patient_id: string | null; family_id: string | null; status: string; confidence: number;
  needs_nurse_review: boolean; is_emergency: boolean; language: "hi" | "hinglish" | "en"; watch_list: string[];
  follow_up_options: string[]; question_no: number; patient_summary: { relation: string; age_band: string };
  speak_text: string; key_factors: string[]; caregivers: CaregiverCard[]; emergency_steps: string[];
  signals: Signals;
};
export type Signals = { llm?: { care: string; p: number }; model?: { care: string; p: number }; agree?: boolean; weight?: number };
export type Session = { triage: TriageResponse; app: AppMeta; learned?: { trained_on: { labelled_examples: number; nurse_feedback: number } } | null };
export type ModelInfo = {
  language_model: { provider: string; model: string; available: boolean };
  trained_classifier: { algorithm: string; trained_on: { labelled_examples: number; nurse_feedback: number }; train_accuracy: number;
    cross_validation: { protocol: string; accuracy_care: number; macro_f1_care: number } | null };
  blend: { classifier_weight: number };
  learning: { nurse_feedback_examples: number };
};
export type VisitBrief = { summary_lines: string[]; bring_list: string[] };
export type BookResponse = { booking_id: string; visit_brief: VisitBrief; caregiver: Record<string, unknown> };
export type Checkin = { checkin_id: string; hours: number; question: string; options: string[]; language: string };
export type ReplyResponse = { escalated: boolean; closed: boolean; message: string; triage: TriageResponse | null; app: AppMeta | null };
export type QueueItem = {
  case_id: string; created_at: string; care_type: string; urgency: string; confidence: number; reasoning: string;
  key_factors: string[]; history: Turn[]; signals?: Signals;
};
export type Taxonomy = {
  care_types: { id: string; names: Record<string, string> }[];
  urgency_levels: { id: string; names: Record<string, string> }[];
  emergency_label: string;
};

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try { r = await fetch(API + path, init); }
  catch { throw new Error(`Cannot reach the Disha server${API ? ` at ${API}` : ""}. Please try again in a moment.`); }
  if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
  return r.json();
}
const post = <T,>(path: string, body: unknown) =>
  call<T>(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const api = {
  sessionTriage: (b: {
    user_input: string; location?: Location; conversation_history: Turn[]; case_id?: string | null; patient_id?: string | null;
    family_id?: string | null; language?: string;
  }) => post<Session>("/v1/session/triage", { language: "auto", ...b }),
  transcribe: async (blob: Blob): Promise<{ text: string; language: string }> => {
    const fd = new FormData();
    const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
    fd.append("audio", blob, `speech.${ext}`);
    return call("/v1/transcribe", { method: "POST", body: fd });
  },
  book: (case_id: string, caregiver_id: string, slot: string) => post<BookResponse>("/v1/book", { case_id, caregiver_id, slot }),
  simulate: (caseId: string, hours = 6) => post<Checkin>(`/v1/safety-net/${caseId}/simulate?hours=${hours}`, {}),
  reply: (caseId: string, text: string) => post<ReplyResponse>(`/v1/safety-net/${caseId}/reply`, { text }),
  getCase: (caseId: string) => call<{ case_id: string; status: string; triage: TriageResponse; app: AppMeta }>(`/v1/cases/${caseId}`),
  queue: () => call<QueueItem[]>("/v1/nurse/queue"),
  approve: (caseId: string, edit?: { care_type?: string; urgency?: string }) => post<Session>(`/v1/nurse/${caseId}/approve`, { ...edit }),
  taxonomy: () => call<Taxonomy>("/v1/taxonomy"),
  modelInfo: () => call<ModelInfo>("/v1/model/info"),
};
