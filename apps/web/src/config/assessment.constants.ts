export const SYNC_INTERVAL_MS = 12_000;
export const OFFLINE_DB = "future-fit-assessments";
export const OFFLINE_STORE = "drafts";
export const OFFLINE_VERSION = 1;
export const ASSESSMENT_MESSAGES = {
  en: {
    assessments: "Assessments",
    results: "Results",
    start: "Start assessment",
    resume: "Resume",
    save: "Save & exit",
    submit: "Submit assessment",
    saved: "All answers saved",
    pending: "Answers waiting to sync",
    failed: "Unable to sync. Your answers remain on this device.",
    loading: "Loading…",
    required: "Required",
    confirm: "Submit your answers? You cannot change them afterwards.",
    empty: "No published assessments are available yet.",
  },
  hi: {
    assessments: "आकलन",
    results: "परिणाम",
    start: "आकलन शुरू करें",
    resume: "जारी रखें",
    save: "सहेजें और बाहर जाएँ",
    submit: "आकलन जमा करें",
    saved: "सभी उत्तर सहेजे गए",
    pending: "उत्तर सिंक होने की प्रतीक्षा में हैं",
    failed: "सिंक नहीं हो सका। आपके उत्तर इस डिवाइस पर सुरक्षित हैं।",
    loading: "लोड हो रहा है…",
    required: "आवश्यक",
    confirm: "उत्तर जमा करें? इसके बाद आप उन्हें बदल नहीं सकते।",
    empty: "अभी कोई प्रकाशित आकलन उपलब्ध नहीं है।",
  },
} as const;
