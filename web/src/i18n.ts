import { createContext, useContext } from "react";

export type Lang = "hi" | "en";
const S = {
  tagline: { hi: "घर पर सही देखभाल का रास्ता", en: "The right home care, quickly" },
  ask: { hi: "बताइए, क्या तकलीफ़ है?", en: "Tell us what is wrong" },
  askRoman: { hi: "Bataiye, kya takleef hai?", en: "" },
  tapToSpeak: { hi: "बोलने के लिए दबाएँ", en: "Tap to speak" },
  recording: { hi: "सुन रहे हैं… रोकने के लिए दबाएँ", en: "Listening… tap to stop" },
  typeInstead: { hi: "या यहाँ लिखें", en: "Or type here" },
  example: { hi: "जैसे: papa ko do din se bukhar hai", en: "e.g. my father has had fever for 2 days" },
  confirmHeard: { hi: "हमने यह सुना — सही है?", en: "We heard this — is it right?" },
  send: { hi: "भेजें", en: "Send" },
  retry: { hi: "दोबारा बोलें", en: "Speak again" },
  changeLoc: { hi: "जगह बदलें", en: "Change location" },
  location: { hi: "आपकी जगह", en: "Your location" },
  thinking: { hi: "सोच रहे हैं…", en: "Thinking…" },
  question: { hi: "सवाल", en: "Question" },
  orSpeak: { hi: "या बोलकर बताएँ", en: "Or answer by voice" },
  plan: { hi: "हमारी सलाह", en: "Our advice" },
  why: { hi: "क्यों?", en: "Why?" },
  watch: { hi: "इन बातों पर नज़र रखें", en: "Watch for these signs" },
  notDiagnosis: { hi: "यह सलाह है, निदान नहीं।", en: "This is guidance, not a diagnosis." },
  nurseChecking: { hi: "नर्स पुष्टि कर रही है…", en: "A nurse is confirming this…" },
  nurseDone: { hi: "नर्स ने पुष्टि कर दी ✔", en: "A nurse has confirmed ✔" },
  findCaregiver: { hi: "देखभालकर्ता चुनें", en: "Find a caregiver" },
  book: { hi: "बुक करें", en: "Book" },
  best: { hi: "सबसे अच्छा विकल्प", en: "Best match" },
  others: { hi: "और विकल्प", en: "Other options" },
  booked: { hi: "बुकिंग पक्की ✔", en: "Booking confirmed ✔" },
  safetyOn: { hi: "Safety Net चालू: हम 6 घंटे बाद हाल पूछेंगे", en: "Safety Net on: we will check in after 6 hours" },
  visitBrief: { hi: "विज़िट ब्रीफ़ (देखभालकर्ता के लिए)", en: "Visit Brief (for the caregiver)" },
  bring: { hi: "साथ लाएँ", en: "To bring" },
  demoCheckin: { hi: "Demo: 6 घंटे आगे", en: "Demo: jump 6 hours ahead" },
  checkin: { hi: "हाल-चाल", en: "Check-in" },
  escalating: { hi: "हालत बिगड़ी लग रही है — सलाह बदल रहे हैं…", en: "Looks worse — updating advice…" },
  closed: { hi: "अच्छा लगा! निगरानी बंद।", en: "Good to hear! Check-ins closed." },
  noChange: { hi: "ठीक है, हम फिर पूछेंगे।", en: "Noted, we will check again." },
  call112: { hi: "112 कॉल करें", en: "Call 112" },
  call108: { hi: "108 एम्बुलेंस", en: "108 Ambulance" },
  shareLoc: { hi: "परिवार को लोकेशन भेजें", en: "Send location to family" },
  emergency: { hi: "आपातकाल हो सकता है", en: "This may be an emergency" },
  offline: { hi: "इंटरनेट नहीं है। Emergency? 112 कॉल करें।", en: "You are offline. Emergency? Call 112." },
  speakAgain: { hi: "सुनें", en: "Listen" },
  start: { hi: "नई शिकायत", en: "New request" },
  nurseQueue: { hi: "नर्स रिव्यू कतार", en: "Nurse review queue" },
  approve: { hi: "मंज़ूर", en: "Approve" },
  editApprove: { hi: "बदलकर मंज़ूर", en: "Edit & approve" },
  micDenied: { hi: "माइक नहीं चला — कृपया लिखें।", en: "Mic unavailable — please type." },
  error: { hi: "कुछ गड़बड़ हुई, फिर कोशिश करें।", en: "Something went wrong. Please retry." },
  emergencySpeak: { hi: "यह आपातकाल हो सकता है। अभी 112 या 108 पर कॉल करें। मरीज़ के साथ रहें।", en: "This may be an emergency. Call 112 or 108 now. Stay with the patient." },
  eStep1: { hi: "मरीज़ के साथ रहें, घबराएँ नहीं।", en: "Stay with the patient and stay calm." },
  eStep2: { hi: "उन्हें सुरक्षित लिटा दें; खाना या पानी न दें।", en: "Lay them down safely; do not give food or drink." },
  eStep3: { hi: "फ़ोन खाली रखें ताकि एम्बुलेंस आपको कॉल कर सके।", en: "Keep your phone free so the ambulance can call you." },
  eNote: { hi: "112 राष्ट्रीय इमरजेंसी नंबर है और 108 एम्बुलेंस का।", en: "112 is the national emergency number and 108 is the ambulance." },
  crossCheck: { hi: "दो मॉडल की जाँच", en: "Two-model cross-check" },
  llmLabel: { hi: "भाषा मॉडल", en: "Language model" },
  modelLabel: { hi: "प्रशिक्षित मॉडल", en: "Trained model" },
  agreeYes: { hi: "दोनों सहमत", en: "Both agree" },
  agreeNo: { hi: "असहमति — नर्स जाँच करेगी", en: "They disagree — nurse will check" },
  learned: { hi: "मॉडल ने इस फ़ैसले से सीखा", en: "The model learned from this decision" },
  dhyan: { hi: "ध्यान दें", en: "Watch for these" },
  nurseNew: { hi: "नया केस", en: "New case" },
  ruleOut: { hi: "सभी बटन 48px से बड़े हैं", en: "" },
  same_day: { hi: "आज ही", en: "Today" },
  routine: { hi: "2–3 दिन में", en: "Within 2–3 days" },
  immediate: { hi: "अभी", en: "Right now" },
} as const;
export type Key = keyof typeof S;

export const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "hi", setLang: () => {} });
export const useLang = () => useContext(LangCtx);

/** Primary string in the chosen language. */
export const tr = (k: Key, lang: Lang) => S[k][lang] || S[k].en;
/** Hindi first with English below (or English only). */
export const pair = (k: Key, lang: Lang): [string, string | null] => (lang === "hi" ? [S[k].hi, S[k].en || null] : [S[k].en, null]);

// ---------------- landing page copy (hi + en) ----------------
const LANDING = {
  eyebrow: { hi: "भारतीय परिवारों के लिए AI केयर नेविगेटर", en: "AI care navigator for Indian families" },
  heroTitle: { hi: "सही केयर। सही समय। सही हाथ।", en: "Sahi care. Sahi samay. Sahi haath." },
  heroSub: { hi: "The right care, at the right time, from the right hands.", en: "The right care, at the right time, from the right hands." },
  heroBody: {
    hi: "Disha को हिंदी, English या Hinglish में बताइए क्या तकलीफ़ है। वह बताएगा कि कैसी देखभाल चाहिए, कितनी जल्दी, और कौन आए — फिर आपके ठीक होने तक हाल पूछता रहेगा।",
    en: "Tell Disha what's wrong in Hindi, English or Hinglish. It tells you what care you need, how fast, and who should come — then checks back until you're better.",
  },
  ctaStart: { hi: "शुरू करें — बताइए क्या तकलीफ़ है", en: "Start — bataiye kya takleef hai" },
  ctaHow: { hi: "देखें यह कैसे काम करता है", en: "See how it works" },
  trust1: { hi: "बोलकर बताएँ", en: "Voice-first" },
  trust2: { hi: "पहले इमरजेंसी सुरक्षा", en: "Emergency-first safety" },
  trust3: { hi: "सलाह, निदान नहीं", en: "Advice, not diagnosis" },
  phoneSample: { hi: "Papa ko do din se bukhar hai aur khansi bhi", en: "Papa ko do din se bukhar hai aur khansi bhi" },
  floatSameDay: { hi: "आज ही", en: "Same day" },
  floatUrgency: { hi: "ज़रूरत", en: "Urgency" },

  probTitle: { hi: "आज घर पर इलाज अंदाज़े पर चलता है", en: "Home care today is guesswork" },
  prob1T: { hi: "बहुत देर कर देना", en: "Wait too long" },
  prob1: { hi: "बढ़ता बुखार सर्दी जैसा समझ लिया जाता है, क्योंकि कोई नहीं बताता कि 'रुककर देखो' कब सुरक्षित नहीं रहता।", en: "A fever that is getting worse gets treated like a cold, because nobody tells you when 'wait and see' stops being safe." },
  prob2T: { hi: "घबराकर ER भागना", en: "Panic to the ER" },
  prob2: { hi: "परिवार हल्के मामलों को भी आधी रात इमरजेंसी ले जाते हैं, और सच में ज़रूरी मरीज़ों को देर हो जाती है।", en: "Families rush mild cases to crowded emergency rooms at midnight, and the really urgent ones get delayed." },
  prob3T: { hi: "गलत व्यक्ति को बुलाना", en: "Book the wrong person" },
  prob3: { hi: "जहाँ पैरामेडिक चाहिए वहाँ नर्स भेजी जाती है, या ऐसा डॉक्टर जिसकी भाषा मरीज़ नहीं समझता।", en: "A nurse is sent when a paramedic was needed, or a doctor who speaks a language the patient doesn't." },

  howTitle: { hi: "यह कैसे काम करता है", en: "How it works" },
  step1T: { hi: "बोलिए", en: "Speak" }, step1: { hi: "अपने शब्दों में, बोलकर या लिखकर।", en: "Say it in your own words, by voice or text." },
  step2T: { hi: "एक-दो सवाल", en: "A question or two" }, step2: { hi: "ज़्यादा से ज़्यादा दो आसान हाँ/नहीं सवाल।", en: "At most two simple yes/no questions." },
  step3T: { hi: "फ़ैसला", en: "We decide" }, step3: { hi: "कैसी देखभाल और कितनी जल्दी — कारण के साथ।", en: "Care type and how urgent, with the reason." },
  step4T: { hi: "सही व्यक्ति", en: "Right person" }, step4: { hi: "हुनर, दूरी, समय और भाषा के हिसाब से सबसे अच्छा देखभालकर्ता।", en: "Best caregiver by skill, distance, time and language." },
  step5T: { hi: "हाल पूछते हैं", en: "We check back" }, step5: { hi: "6 और 24 घंटे बाद हाल; बिगड़े तो तुरंत कदम।", en: "Check-ins at 6 h and 24 h; we act if it gets worse." },
  loopLabel: { hi: "अगर मरीज़ की हालत बिगड़े", en: "if the patient gets worse" },

  usTitle: { hi: "Disha अलग क्यों है", en: "What makes Disha different" },
  us1T: { hi: "सेफ़्टी नेट", en: "Safety Net" }, us1: { hi: "हम 6 और 24 घंटे बाद हाल पूछते हैं, और हालत बिगड़े तो तुरंत कदम उठाते हैं।", en: "We check in at 6 h and 24 h, and act if things get worse." },
  us2T: { hi: "परिवार पहले", en: "Family-first" }, us2: { hi: "उन बेटे-बेटियों के लिए बना, जो अपने माता-पिता के लिए मदद माँग रहे हैं।", en: "Built for the son or daughter asking for a parent." },
  us3T: { hi: "विज़िट ब्रीफ़", en: "Visit Brief" }, us3: { hi: "देखभालकर्ता केस की जानकारी और सही सामान के साथ पहुँचता है।", en: "Your caregiver arrives knowing the case and carrying the right kit." },
  us4T: { hi: "नर्स की निगरानी", en: "Nurse-in-the-loop" }, us4: { hi: "जब AI को पक्का न हो, तो नर्स पुष्टि करती है।", en: "When the AI isn't sure, a nurse confirms." },

  safeTitle: { hi: "इमरजेंसी AI का इंतज़ार नहीं करती", en: "Emergencies never wait for an AI" },
  safeBody: { hi: "इमरजेंसी को किसी भी AI से पहले पक्के सुरक्षा नियम पकड़ लेते हैं। Disha न बीमारी बताता है, न दवा।", en: "Emergencies are caught by fixed safety rules before any AI runs. Disha never diagnoses or prescribes." },
  national: { hi: "राष्ट्रीय इमरजेंसी", en: "National emergency" },
  ambulance: { hi: "एम्बुलेंस", en: "Ambulance" },

  provTitle: { hi: "होम-केयर प्रदाताओं के लिए", en: "For home-care providers" },
  provIntro: { hi: "Disha को अपने डिस्पैच से जोड़ें।", en: "Plug Disha into your dispatch." },
  prov1T: { hi: "दिनों में API", en: "API in days" }, prov1: { hi: "एक REST endpoint देखभाल का प्रकार, तात्कालिकता और रैंक किए देखभालकर्ता लौटाता है। लाइव दस्तावेज़ साथ में।", en: "One REST endpoint returns care type, urgency and ranked caregivers. Live docs included." },
  prov2T: { hi: "डिस्पैच + नर्स डैशबोर्ड", en: "Dispatch + nurse dashboard" }, prov2: { hi: "बुकिंग, विज़िट ब्रीफ़ और लाइव नर्स रिव्यू कतार।", en: "Bookings, visit briefs and a live nurse review queue." },
  prov3T: { hi: "हर बुकिंग पर भुगतान", en: "Pay per booking" }, prov3: { hi: "कोई सेट-अप शुल्क नहीं; विज़िट बुक होने पर ही भुगतान।", en: "No set-up fee; you pay only when a visit is booked." },
  provNurse: { hi: "नर्स डैशबोर्ड खोलें", en: "Open nurse dashboard" },
  provDocs: { hi: "API दस्तावेज़", en: "API docs" },

  footBuilt: { hi: "HackIIITD 2026 में बना · CAI, IIIT-Delhi", en: "Built at HackIIITD 2026 · CAI, IIIT-Delhi" },
  footModels: { hi: "मॉडल: Groq LLM + Groq Whisper", en: "Models: Groq LLM + Groq Whisper" },
  footNote: { hi: "Disha सलाह देता है, निदान नहीं। इमरजेंसी में 112 पर कॉल करें।", en: "Disha gives guidance, not a diagnosis. In an emergency call 112." },
  bestMatch: { hi: "सबसे अच्छा", en: "Best match" },
} as const;
export type LKey = keyof typeof LANDING;
export const tl = (k: LKey, lang: Lang) => LANDING[k][lang];
