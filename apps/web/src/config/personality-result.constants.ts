export type PersonalityResultLanguage = "en" | "hi";

export interface PersonalityResultShape {
  scoringVersion?: string;
  resultStatus?: string;
  reportStatus?: string;
  dimensions?: Record<string, number>;
  normalizedDimensions?: Record<string, number>;
}

export const PERSONALITY_DIMENSIONS = [
  {
    key: "EXTRAVERSION",
    en: {
      name: "Extraversion",
      description:
        "How naturally you engage with people, conversations, groups and social energy.",
    },
    hi: {
      name: "बहिर्मुखता",
      description:
        "आप लोगों, बातचीत, समूहों और सामाजिक गतिविधियों से कितनी सहजता से जुड़ते हैं।",
    },
  },
  {
    key: "AGREEABLENESS",
    en: {
      name: "Agreeableness",
      description:
        "How strongly you tend toward empathy, cooperation, kindness and consideration for others.",
    },
    hi: {
      name: "सहयोगशीलता",
      description:
        "आप सहानुभूति, सहयोग, दयालुता और दूसरों की भावनाओं का ध्यान रखने की ओर कितना झुकते हैं।",
    },
  },
  {
    key: "CONSCIENTIOUSNESS",
    en: {
      name: "Conscientiousness",
      description:
        "How consistently you organize, plan, follow through and pay attention to responsibilities.",
    },
    hi: {
      name: "कर्तव्यनिष्ठा",
      description:
        "आप काम को व्यवस्थित करने, योजना बनाने, जिम्मेदारियाँ पूरी करने और विवरणों पर ध्यान देने में कितने नियमित हैं।",
    },
  },
  {
    key: "EMOTIONAL_STABILITY",
    en: {
      name: "Emotional Stability",
      description:
        "How calmly and steadily you tend to respond to stress, uncertainty and emotional ups and downs.",
    },
    hi: {
      name: "भावनात्मक स्थिरता",
      description:
        "तनाव, अनिश्चितता और भावनात्मक उतार-चढ़ाव में आप कितनी शांति और स्थिरता से प्रतिक्रिया देते हैं।",
    },
  },
  {
    key: "INTELLECT_IMAGINATION",
    en: {
      name: "Intellect & Imagination",
      description:
        "How much you enjoy ideas, imagination, reflection, learning and mentally exploring possibilities.",
    },
    hi: {
      name: "विचार और कल्पना",
      description:
        "आप विचारों, कल्पना, गहराई से सोचने, सीखने और नई संभावनाओं को मानसिक रूप से खोजने का कितना आनंद लेते हैं।",
    },
  },
] as const;

export const PERSONALITY_RESULT_COPY = {
  en: {
    assessmentName: "Personality Assessment",
    resultsTitle: "Personality Assessment results",
    resultsDescription:
      "See your normalized profile across five broad personality dimensions.",
    ready: "Result ready",
    score: "Normalized score",
    percent: "Percentage",
    view: "View full result",
    profileTitle: "Your personality profile",
    profileDescription:
      "Each dimension is normalized to a 0–100 scale. These scores describe tendencies, not fixed labels or abilities.",
    complete: "Scoring complete",
    scoring: "Scoring your result…",
    scoringDescription:
      "Your answers have been submitted. Your result will appear as soon as scoring finishes.",
    exploreNext: "How this will be used",
    exploreNextDescription:
      "Your personality profile will later combine with interest, aptitude, values and academic preferences to support complete Future Fit career guidance.",
    pdfReady: "Download PDF report",
    goToAssessment: "Go to assessments",
  },
  hi: {
    assessmentName: "व्यक्तित्व आकलन",
    resultsTitle: "व्यक्तित्व आकलन परिणाम",
    resultsDescription:
      "पाँच मुख्य व्यक्तित्व आयामों में अपना सामान्यीकृत प्रोफ़ाइल देखें।",
    ready: "परिणाम तैयार",
    score: "सामान्यीकृत स्कोर",
    percent: "प्रतिशत",
    view: "पूरा परिणाम देखें",
    profileTitle: "आपका व्यक्तित्व प्रोफ़ाइल",
    profileDescription:
      "हर आयाम को 0–100 के पैमाने पर सामान्यीकृत किया गया है। ये स्कोर आपकी प्रवृत्तियों को दर्शाते हैं, स्थायी लेबल या क्षमता को नहीं।",
    complete: "स्कोरिंग पूरी",
    scoring: "आपका परिणाम तैयार हो रहा है…",
    scoringDescription:
      "आपके उत्तर जमा हो चुके हैं। स्कोरिंग पूरी होते ही परिणाम दिखाई देगा।",
    exploreNext: "इसका उपयोग कैसे होगा",
    exploreNextDescription:
      "आगे चलकर आपके व्यक्तित्व प्रोफ़ाइल को रुचि, योग्यता, मूल्यों और शैक्षणिक पसंद के साथ जोड़कर पूरा Future Fit करियर मार्गदर्शन तैयार किया जाएगा।",
    pdfReady: "PDF रिपोर्ट डाउनलोड करें",
    goToAssessment: "आकलनों पर जाएँ",
  },
} as const;

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function readDimension(
  source: Record<string, number> | undefined,
  key: string,
) {
  if (!source) return undefined;

  const direct = source[key];
  if (finiteNumber(direct)) return direct;

  const matched = Object.entries(source).find(
    ([candidate]) => candidate.toLowerCase() === key.toLowerCase(),
  );

  return matched && finiteNumber(matched[1]) ? matched[1] : undefined;
}

export function normalizedPersonalityScores(
  result: PersonalityResultShape,
) {
  return PERSONALITY_DIMENSIONS.map((dimension) => {
    const storedNormalized = readDimension(
      result.normalizedDimensions,
      dimension.key,
    );
    const raw = readDimension(result.dimensions, dimension.key);

    const normalized = finiteNumber(storedNormalized)
      ? storedNormalized
      : finiteNumber(raw)
        ? ((raw - 10) / 40) * 100
        : 0;

    const safe = Math.max(0, Math.min(100, normalized));

    return {
      ...dimension,
      raw: finiteNumber(raw) ? raw : undefined,
      normalized: Math.round(safe * 100) / 100,
    };
  });
}

export function isPersonalityResult(
  result: PersonalityResultShape,
) {
  if (
    result.scoringVersion?.endsWith(
      ":IPIP_BIG_FIVE_50_V1",
    )
  ) {
    return true;
  }

  const keys = new Set(
    Object.keys(result.normalizedDimensions ?? {}).map((key) =>
      key.toUpperCase(),
    ),
  );

  return PERSONALITY_DIMENSIONS.every((dimension) =>
    keys.has(dimension.key),
  );
}
