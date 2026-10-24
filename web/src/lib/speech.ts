// Voice in: MediaRecorder -> blob (uploaded to /v1/transcribe). Voice out: browser speechSynthesis (hi-IN, falls back to en-IN).
export type Recorder = { stop: () => Promise<Blob>; stream: MediaStream };

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = ["audio/webm", "audio/ogg", "audio/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start();
  return {
    stream,
    stop: () =>
      new Promise<Blob>((resolve) => {
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
        };
        rec.stop();
      }),
  };
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const vs = window.speechSynthesis.getVoices();
  return vs.find((v) => v.lang === lang) ?? vs.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
}

export function speak(text: string) {
  if (!("speechSynthesis" in window) || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const hindiVoice = pickVoice("hi-IN");
  const v = hindiVoice ?? pickVoice("en-IN");
  if (v) u.voice = v;
  u.lang = v?.lang ?? "hi-IN";
  u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

export const stopSpeaking = () => "speechSynthesis" in window && window.speechSynthesis.cancel();
