export const RESULT_LIMITS = { noteLength: 4000 } as const;
export const AI_RESULT_LABELS = {
  en: {
    strengths: "Possible strengths",
    growthAreas: "Areas to explore",
    limitations: "Limitations",
    evidence: "Referenced scores",
    careerExplanations: "Career exploration",
    version: "Guidance version",
  },
  hi: {
    strengths: "संभावित खूबियाँ",
    growthAreas: "सीखने और खोजने के क्षेत्र",
    limitations: "सीमाएँ",
    evidence: "संदर्भित स्कोर",
    careerExplanations: "करियर की खोज",
    version: "मार्गदर्शन संस्करण",
  },
} as const;
