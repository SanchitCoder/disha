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
  signals: Signals; actions: FamilyAction[]; plan_watch_signs: string[];
  understood: Understood[]; missing_info: { id: string; important: boolean; note: string }[];
};
export type Understood = { id: string; label: L3; value: L3; status: "stated" | "inferred" | "missing" };
export type FamilyAction = {
  id: string; type: string; title: string; title_en: string; title_hi: string; note: string; why: string | null; status: string; needs_doctor_ok: boolean;
  scheduled_for: string | null; provider_name: string | null; log_field: string | null; schedule_within_hours: number | null; schedulable: boolean; primary: boolean;
};
export type SlotsResponse = { needs_slot: boolean; options: { iso: string; day: string; label: string }[]; window_hours: number | null; outside_window: boolean; provider: string | null };
export type L3 = { en: string; hi: string; hinglish: string };
export type DetailField = {
  id: string; type: "chips" | "yesno" | "age" | "number_chips" | "multi_chips" | "number" | "number_pair" | "text"; label: L3; optional?: boolean; allow_none?: boolean; unit?: string; min?: number; max?: number;
  options?: { value: string | number; label: string | L3 }[]; none?: { value: string; label: L3 };
};
export type DetailsForm = { title: L3; intro: L3; fields: DetailField[]; known: { id: string; label: L3; value: unknown }[]; cluster: string; answers: Record<string, unknown> };
export type DetailsResult = { triage: TriageResponse; app: AppMeta; urgency_raised: boolean; emergency: boolean; saved: number; rejected: string[] };
export type ClinicianAction = {
  id: string; case_id: string; type: string; title: string; status: string; scheduled_for: string | null; provider_name: string | null; needs_clinician_ok: boolean;
  clinician_suggestion: string | null; label: string | null; patient: Record<string, any>; care_type: string | null; urgency: string | null;
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
export type VisitBrief = { summary_lines: string[]; bring_list: string[]; action_plan: string[]; clinician_suggestions: string[] };
export type BookResponse = { booking_id: string; visit_brief: VisitBrief; caregiver: Record<string, unknown> };
export type Checkin = { checkin_id: string; hours: number; question: string; options: string[]; language: string };
export type ReplyResponse = { escalated: boolean; closed: boolean; outcome: string; next_action: string | null; message: string; triage: TriageResponse | null; app: AppMeta | null };
export type CaseState = {
  case_id: string; status: string; triage: TriageResponse; app: AppMeta; history: Turn[]; location: Location | null; patient_id: string | null;
  checkins: { hours: number; due_at: string; answered: boolean; outcome: string | null }[]; booked: boolean;
};
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
  if (!r.ok) {
    const body = await r.text();
    let detail = body.slice(0, 200);
    try { const d = JSON.parse(body).detail; if (typeof d === "string") detail = d; } catch { /* not JSON */ }   // FastAPI errors: {"detail": "..."}
    throw new Error(detail);
  }
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
  getCase: (caseId: string) => call<CaseState>(`/v1/cases/${caseId}`),
  reading: (caseId: string, r: { temperature_c?: number; spo2?: number }) => post<ReplyResponse>(`/v1/safety-net/${caseId}/reading`, r),
  queue: () => call<QueueItem[]>("/v1/nurse/queue"),
  approve: (caseId: string, edit?: { care_type?: string; urgency?: string }) => post<Session>(`/v1/nurse/${caseId}/approve`, { ...edit }),
  taxonomy: () => call<Taxonomy>("/v1/taxonomy"),
  modelInfo: () => call<ModelInfo>("/v1/model/info"),
  caseActions: (caseId: string, lang?: string) => call<FamilyAction[]>(`/v1/cases/${caseId}/actions${lang ? `?lang=${lang}` : ""}`),
  slots: (actionId: string) => call<SlotsResponse>(`/v1/actions/${actionId}/slots`),
  schedule: (actionId: string, slot?: string) => post<FamilyAction>(`/v1/actions/${actionId}/schedule`, { slot }),
  cancelAction: (actionId: string) => post<FamilyAction>(`/v1/actions/${actionId}/cancel`, {}),
  confirm: (actionId: string, b: { note?: string; slot?: string } = {}) => post<ClinicianAction>(`/v1/actions/${actionId}/confirm`, b),
  logAction: (actionId: string, value: string | number, unit?: string) => post<{ logged: { value: number; unit: string }; escalated: boolean; reply: ReplyResponse | null }>(`/v1/actions/${actionId}/log`, { value, unit }),
  caregiverBrief: (bookingId: string) => call<VisitBrief>(`/v1/bookings/${bookingId}/brief`),
  nurseActions: () => call<ClinicianAction[]>("/v1/nurse/actions"),
  detailsForm: (caseId: string) => call<DetailsForm>(`/v1/cases/${caseId}/details-form`),
  saveDetails: (caseId: string, answers: Record<string, unknown>) => post<DetailsResult>(`/v1/cases/${caseId}/details`, { answers }),
};
