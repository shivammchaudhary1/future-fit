export type ResultLanguage = "en" | "hi";

export const INTEREST_DIMENSIONS = [
  {
    key: "realistic",
    aliases: ["realistic", "R"],
    en: {
      name: "Hands-on",
      description:
        "Interest in practical activities, tools, machines and working with tangible things.",
    },
    hi: {
      name: "व्यावहारिक",
      description:
        "हाथों से काम करने, औज़ारों, मशीनों और वास्तविक चीज़ों के साथ काम करने में रुचि।",
    },
  },
  {
    key: "investigative",
    aliases: ["investigative", "I"],
    en: {
      name: "Analytical",
      description:
        "Interest in investigating questions, solving problems, science, data and ideas.",
    },
    hi: {
      name: "विश्लेषणात्मक",
      description:
        "प्रश्नों की जाँच, समस्याएँ हल करने, विज्ञान, डेटा और विचारों में रुचि।",
    },
  },
  {
    key: "artistic",
    aliases: ["artistic", "A"],
    en: {
      name: "Creative",
      description:
        "Interest in imagination, design, writing, visual expression, music and original ideas.",
    },
    hi: {
      name: "रचनात्मक",
      description:
        "कल्पना, डिज़ाइन, लेखन, दृश्य अभिव्यक्ति, संगीत और नए विचारों में रुचि।",
    },
  },
  {
    key: "social",
    aliases: ["social", "S"],
    en: {
      name: "People & Support",
      description:
        "Interest in helping, teaching, guiding, supporting and working closely with people.",
    },
    hi: {
      name: "लोगों की मदद",
      description:
        "लोगों की मदद, सिखाने, मार्गदर्शन देने, सहयोग करने और साथ काम करने में रुचि।",
    },
  },
  {
    key: "enterprising",
    aliases: ["enterprising", "E"],
    en: {
      name: "Leadership",
      description:
        "Interest in leading, influencing, presenting ideas, taking initiative and business activities.",
    },
    hi: {
      name: "नेतृत्व",
      description:
        "नेतृत्व, लोगों को प्रभावित करने, विचार प्रस्तुत करने, पहल करने और व्यवसाय से जुड़ी गतिविधियों में रुचि।",
    },
  },
  {
    key: "conventional",
    aliases: ["conventional", "C"],
    en: {
      name: "Organized",
      description:
        "Interest in structured work, records, details, planning, systems and organized processes.",
    },
    hi: {
      name: "संगठित",
      description:
        "व्यवस्थित काम, रिकॉर्ड, विवरण, योजना, सिस्टम और संगठित प्रक्रियाओं में रुचि।",
    },
  },
] as const;

export const INTEREST_RESULT_COPY = {
  en: {
    assessmentName: "Interest Assessment",
    resultsTitle: "Interest Assessment results",
    resultsDescription:
      "See your normalized interest profile across six areas.",
    ready: "Result ready",
    score: "Normalized score",
    percent: "Percentage",
    view: "View full result",
    noResult: "No Interest Assessment result yet",
    noResultDescription:
      "Complete the 60-question Interest Assessment and your scores will appear here.",
    goToAssessment: "Go to assessment",
    profileTitle: "Your interest profile",
    profileDescription:
      "Each score is normalized to a 0–100 scale. A higher score means stronger interest in that type of activity.",
    scoreOutOf: "out of 100",
    complete: "Scoring complete",
    scoring: "Scoring your result…",
    scoringDescription:
      "Your answers have been submitted. Your result will appear as soon as scoring finishes.",
    exploreNext: "What happens next?",
    exploreNextDescription:
      "These interest scores will later combine with your personality, aptitude, values and academic preferences for complete Future Fit career guidance.",
    pdfReady: "Download PDF report",
    legacyTitle: "This older result is no longer part of the current assessment",
    legacyDescription:
      "Please complete the current 60-question Interest Assessment to see your latest profile.",
  },
  hi: {
    assessmentName: "रुचि आकलन",
    resultsTitle: "रुचि आकलन परिणाम",
    resultsDescription:
      "छह क्षेत्रों में अपना सामान्यीकृत रुचि प्रोफ़ाइल देखें।",
    ready: "परिणाम तैयार",
    score: "सामान्यीकृत स्कोर",
    percent: "प्रतिशत",
    view: "पूरा परिणाम देखें",
    noResult: "अभी रुचि आकलन का परिणाम नहीं है",
    noResultDescription:
      "60 प्रश्नों वाला रुचि आकलन पूरा करें। उसके बाद आपके स्कोर यहाँ दिखाई देंगे।",
    goToAssessment: "आकलन पर जाएँ",
    profileTitle: "आपकी रुचि प्रोफ़ाइल",
    profileDescription:
      "हर स्कोर को 0–100 के पैमाने पर सामान्यीकृत किया गया है। अधिक स्कोर उस प्रकार की गतिविधि में अधिक रुचि दर्शाता है।",
    scoreOutOf: "100 में से",
    complete: "स्कोरिंग पूरी",
    scoring: "आपका परिणाम तैयार हो रहा है…",
    scoringDescription:
      "आपके उत्तर जमा हो चुके हैं। स्कोरिंग पूरी होते ही परिणाम दिखाई देगा।",
    exploreNext: "आगे क्या होगा?",
    exploreNextDescription:
      "आगे चलकर इन रुचि स्कोरों को व्यक्तित्व, योग्यता, मूल्यों और शैक्षणिक पसंद के साथ जोड़कर पूरा Future Fit करियर मार्गदर्शन तैयार किया जाएगा।",
    pdfReady: "PDF रिपोर्ट डाउनलोड करें",
    legacyTitle: "यह पुराना परिणाम अब वर्तमान आकलन का हिस्सा नहीं है",
    legacyDescription:
      "अपना नया प्रोफ़ाइल देखने के लिए वर्तमान 60 प्रश्नों वाला रुचि आकलन पूरा करें।",
  },
} as const;

export interface InterestResultShape {
  scoringVersion?: string;
  resultStatus?: string;
  reportStatus?: string;
  dimensions?: Record<string, number>;
  normalizedDimensions?: Record<string, number>;
}

function finiteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function readDimension(
  source: Record<string, number> | undefined,
  aliases: readonly string[],
) {
  if (!source) return undefined;

  for (const alias of aliases) {
    const direct = source[alias];
    if (finiteNumber(direct)) return direct;

    const lowerAlias = alias.toLowerCase();
    const matched = Object.entries(source).find(
      ([key]) => key.toLowerCase() === lowerAlias,
    );

    if (matched && finiteNumber(matched[1])) {
      return matched[1];
    }
  }

  return undefined;
}

export function normalizedInterestScores(result: InterestResultShape) {
  return INTEREST_DIMENSIONS.map((dimension) => {
    const storedNormalized = readDimension(
      result.normalizedDimensions,
      dimension.aliases,
    );

    const raw = readDimension(
      result.dimensions,
      dimension.aliases,
    );

    const normalized = finiteNumber(storedNormalized)
      ? storedNormalized
      : finiteNumber(raw)
        ? (raw / 40) * 100
        : 0;

    const safe = Math.max(0, Math.min(100, normalized));

    return {
      ...dimension,
      raw: finiteNumber(raw) ? raw : undefined,
      normalized: Math.round(safe * 100) / 100,
    };
  });
}

export function isCurrentInterestResult(result: InterestResultShape) {
  if (result.scoringVersion?.endsWith(":ONET_IP_60_V1")) {
    return true;
  }

  const available = normalizedInterestScores(result).filter(
    (item) =>
      readDimension(
        result.normalizedDimensions,
        item.aliases,
      ) !== undefined,
  );

  return available.length === INTEREST_DIMENSIONS.length;
}
