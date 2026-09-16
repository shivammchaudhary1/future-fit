/**
 * Future Fit Personality Assessment — 50-item student adaptation.
 *
 * SOURCE / PROVENANCE:
 * - International Personality Item Pool (IPIP)
 * - Goldberg (1992) Big-Five Factor Markers
 * - 50-item SHORT scales: 10 items for each of the five broad factors.
 * - Positive/reverse keys come from the official IPIP Big-Five Factor Markers
 *   scoring key supplied for this project.
 * - The 50-item table supplied for this project confirms the 10-item-per-factor
 *   short form and the positive/reverse item counts.
 *
 * IMPORTANT:
 * `sourceText` preserves the original source item for audit/provenance.
 * `translations.en.question` is a light Future Fit student-friendly adaptation.
 * `translations.hi.question` is the Hindi student-facing adaptation.
 * The student-facing wording may therefore not be psychometrically identical
 * to an unmodified administration of the original English IPIP items.
 */

export const PERSONALITY_ASSESSMENT = {
  stableKey: "FUTURE_FIT_PERSONALITY_IPIP_BFFM_50",
  name: "Personality Assessment",
  type: "PERSONALITY",
  description:
    "A 50-question bilingual assessment that helps students understand five broad personality tendencies.",
  version: "ipip-bffm-50-india-bilingual-v1",
  scoringModel: "IPIP_BIG_FIVE_50_V1",
  source: {
    framework: "IPIP",
    instrument: "Goldberg (1992) Big-Five Factor Markers",
    form: "50-item short scales",
    adaptation: "Future Fit India student bilingual v1",
  },
};

export const PERSONALITY_DIMENSIONS = [
  "EXTRAVERSION",
  "AGREEABLENESS",
  "CONSCIENTIOUSNESS",
  "EMOTIONAL_STABILITY",
  "INTELLECT_IMAGINATION",
];

export const EXPECTED_KEY_COUNTS = {
  EXTRAVERSION: { POSITIVE: 5, REVERSE: 5 },
  AGREEABLENESS: { POSITIVE: 6, REVERSE: 4 },
  CONSCIENTIOUSNESS: { POSITIVE: 6, REVERSE: 4 },
  EMOTIONAL_STABILITY: { POSITIVE: 2, REVERSE: 8 },
  INTELLECT_IMAGINATION: { POSITIVE: 7, REVERSE: 3 },
};

export const PERSONALITY_RESPONSE_OPTIONS = [
  {
    id: "1",
    value: 1,
    translations: {
      en: "Very inaccurate",
      hi: "मेरे लिए बिल्कुल सही नहीं",
    },
  },
  {
    id: "2",
    value: 2,
    translations: {
      en: "Moderately inaccurate",
      hi: "मेरे लिए काफी हद तक सही नहीं",
    },
  },
  {
    id: "3",
    value: 3,
    translations: {
      en: "Neither inaccurate nor accurate",
      hi: "न सही, न गलत",
    },
  },
  {
    id: "4",
    value: 4,
    translations: {
      en: "Moderately accurate",
      hi: "मेरे लिए काफी हद तक सही",
    },
  },
  {
    id: "5",
    value: 5,
    translations: {
      en: "Very accurate",
      hi: "मेरे लिए बिल्कुल सही",
    },
  },
];

export const PERSONALITY_ITEMS = [
  {
    order: 1,
    dimension: "EXTRAVERSION",
    direction: "POSITIVE",
    sourceText: "Am the life of the party.",
    translations: {
      en: {
        question:
          "At school events or group gatherings, I am often one of the people who brings energy to the group.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "स्कूल के कार्यक्रमों या समूह में मैं अक्सर उन लोगों में होता/होती हूँ जो माहौल में ऊर्जा लाते हैं।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 2,
    dimension: "AGREEABLENESS",
    direction: "REVERSE",
    sourceText: "Feel little concern for others.",
    translations: {
      en: {
        question:
          "I often feel little concern about what other people are going through.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "दूसरे लोग किन परिस्थितियों से गुजर रहे हैं, इसकी मुझे अक्सर बहुत कम चिंता होती है।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 3,
    dimension: "CONSCIENTIOUSNESS",
    direction: "POSITIVE",
    sourceText: "Am always prepared.",
    translations: {
      en: {
        question:
          "I usually come prepared for classes, activities, or tasks.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं आमतौर पर कक्षा, गतिविधि या किसी काम के लिए पहले से तैयार रहता/रहती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 4,
    dimension: "EMOTIONAL_STABILITY",
    direction: "REVERSE",
    sourceText: "Get stressed out easily.",
    translations: {
      en: {
        question:
          "I get stressed easily when things become difficult or uncertain.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "जब चीजें कठिन या अनिश्चित हो जाती हैं, तो मैं आसानी से तनाव में आ जाता/जाती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 5,
    dimension: "INTELLECT_IMAGINATION",
    direction: "POSITIVE",
    sourceText: "Have a rich vocabulary.",
    translations: {
      en: {
        question:
          "I enjoy learning and using a wide range of words.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मुझे नए और अलग-अलग शब्द सीखना और उनका उपयोग करना पसंद है।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 6,
    dimension: "EXTRAVERSION",
    direction: "REVERSE",
    sourceText: "Don't talk a lot.",
    translations: {
      en: {
        question: "I usually do not talk much in groups.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question: "मैं समूह में आमतौर पर ज्यादा बात नहीं करता/करती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 7,
    dimension: "AGREEABLENESS",
    direction: "POSITIVE",
    sourceText: "Am interested in people.",
    translations: {
      en: {
        question:
          "I am genuinely interested in getting to know other people.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मुझे दूसरे लोगों को जानने और समझने में सचमुच रुचि होती है।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 8,
    dimension: "CONSCIENTIOUSNESS",
    direction: "REVERSE",
    sourceText: "Leave my belongings around.",
    translations: {
      en: {
        question:
          "I often leave my books, clothes, or belongings lying around.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं अक्सर अपनी किताबें, कपड़े या दूसरी चीजें इधर-उधर छोड़ देता/देती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 9,
    dimension: "EMOTIONAL_STABILITY",
    direction: "POSITIVE",
    sourceText: "Am relaxed most of the time.",
    translations: {
      en: {
        question: "I stay relaxed most of the time.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question: "मैं ज्यादातर समय शांत और सहज रहता/रहती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 10,
    dimension: "INTELLECT_IMAGINATION",
    direction: "REVERSE",
    sourceText: "Have difficulty understanding abstract ideas.",
    translations: {
      en: {
        question:
          "I find abstract or theoretical ideas difficult to understand.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मुझे अमूर्त या सैद्धांतिक विचार समझने में कठिनाई होती है।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 11,
    dimension: "EXTRAVERSION",
    direction: "POSITIVE",
    sourceText: "Feel comfortable around people.",
    translations: {
      en: {
        question:
          "I feel comfortable around other people, including in groups.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं दूसरे लोगों के बीच, खासकर समूह में, सहज महसूस करता/करती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 12,
    dimension: "AGREEABLENESS",
    direction: "REVERSE",
    sourceText: "Insult people.",
    translations: {
      en: {
        question:
          "I sometimes say things that can insult or hurt people.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं कभी-कभी ऐसी बातें कह देता/देती हूँ जो दूसरों का अपमान कर सकती हैं या उन्हें दुख पहुँचा सकती हैं।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 13,
    dimension: "CONSCIENTIOUSNESS",
    direction: "POSITIVE",
    sourceText: "Pay attention to details.",
    translations: {
      en: {
        question:
          "I pay close attention to details in my schoolwork and other tasks.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं पढ़ाई और दूसरे कामों में छोटी-छोटी बातों और विवरणों पर ध्यान देता/देती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 14,
    dimension: "EMOTIONAL_STABILITY",
    direction: "REVERSE",
    sourceText: "Worry about things.",
    translations: {
      en: {
        question: "I worry a lot about things that might go wrong.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं उन बातों को लेकर काफी चिंता करता/करती हूँ जो गलत हो सकती हैं।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 15,
    dimension: "INTELLECT_IMAGINATION",
    direction: "POSITIVE",
    sourceText: "Have a vivid imagination.",
    translations: {
      en: {
        question:
          "I have a vivid imagination and can picture ideas clearly in my mind.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मेरी कल्पना शक्ति जीवंत है और मैं विचारों को अपने मन में साफ़ तौर पर देख सकता/सकती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 16,
    dimension: "EXTRAVERSION",
    direction: "REVERSE",
    sourceText: "Keep in the background.",
    translations: {
      en: {
        question: "In groups, I usually prefer to stay in the background.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "समूह में मैं आमतौर पर पीछे रहना पसंद करता/करती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 17,
    dimension: "AGREEABLENESS",
    direction: "POSITIVE",
    sourceText: "Sympathize with others' feelings.",
    translations: {
      en: {
        question:
          "I easily understand and sympathize with how other people feel.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं आसानी से समझ पाता/पाती हूँ कि दूसरे लोग कैसा महसूस कर रहे हैं और उनके प्रति सहानुभूति रखता/रखती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 18,
    dimension: "CONSCIENTIOUSNESS",
    direction: "REVERSE",
    sourceText: "Make a mess of things.",
    translations: {
      en: {
        question:
          "I often make a mess while working and leave it for later.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "काम करते समय मैं अक्सर चीजें बिखेर देता/देती हूँ और उन्हें बाद के लिए छोड़ देता/देती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 19,
    dimension: "EMOTIONAL_STABILITY",
    direction: "POSITIVE",
    sourceText: "Seldom feel blue.",
    translations: {
      en: {
        question: "I rarely feel low or sad for no clear reason.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "बिना किसी स्पष्ट कारण के मैं बहुत कम उदास या मायूस महसूस करता/करती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 20,
    dimension: "INTELLECT_IMAGINATION",
    direction: "REVERSE",
    sourceText: "Am not interested in abstract ideas.",
    translations: {
      en: {
        question:
          "Abstract or theoretical ideas usually do not interest me.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "अमूर्त या सैद्धांतिक विचारों में आमतौर पर मेरी रुचि नहीं होती।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 21,
    dimension: "EXTRAVERSION",
    direction: "POSITIVE",
    sourceText: "Start conversations.",
    translations: {
      en: {
        question:
          "I often start conversations with classmates or new people.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं अक्सर सहपाठियों या नए लोगों से खुद बातचीत शुरू करता/करती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 22,
    dimension: "AGREEABLENESS",
    direction: "REVERSE",
    sourceText: "Am not interested in other people's problems.",
    translations: {
      en: {
        question:
          "I am usually not interested in other people's problems.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "आमतौर पर मुझे दूसरे लोगों की समस्याओं में ज्यादा रुचि नहीं होती।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 23,
    dimension: "CONSCIENTIOUSNESS",
    direction: "POSITIVE",
    sourceText: "Get chores done right away.",
    translations: {
      en: {
        question:
          "I usually finish small responsibilities or tasks without delaying them.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं छोटे काम या जिम्मेदारियाँ आमतौर पर बिना टाले जल्दी पूरा कर लेता/लेती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 24,
    dimension: "EMOTIONAL_STABILITY",
    direction: "REVERSE",
    sourceText: "Am easily disturbed.",
    translations: {
      en: {
        question:
          "Small problems or interruptions can upset me easily.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "छोटी समस्याएँ या रुकावटें मुझे आसानी से परेशान कर सकती हैं।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 25,
    dimension: "INTELLECT_IMAGINATION",
    direction: "POSITIVE",
    sourceText: "Have excellent ideas.",
    translations: {
      en: {
        question:
          "I often come up with ideas that I think are strong or useful.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मेरे मन में अक्सर ऐसे विचार आते हैं जिन्हें मैं अच्छा या उपयोगी मानता/मानती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 26,
    dimension: "EXTRAVERSION",
    direction: "REVERSE",
    sourceText: "Have little to say.",
    translations: {
      en: {
        question: "In conversations, I often feel I have little to say.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "बातचीत के दौरान मुझे अक्सर लगता है कि मेरे पास कहने के लिए ज्यादा कुछ नहीं है।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 27,
    dimension: "AGREEABLENESS",
    direction: "POSITIVE",
    sourceText: "Have a soft heart.",
    translations: {
      en: {
        question:
          "I am soft-hearted and easily moved by other people's difficulties.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं संवेदनशील हूँ और दूसरों की कठिनाइयों से आसानी से प्रभावित होता/होती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 28,
    dimension: "CONSCIENTIOUSNESS",
    direction: "REVERSE",
    sourceText: "Often forget to put things back in their proper place.",
    translations: {
      en: {
        question:
          "I often forget to put things back where they belong.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं अक्सर चीजों को उनकी सही जगह पर वापस रखना भूल जाता/जाती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 29,
    dimension: "EMOTIONAL_STABILITY",
    direction: "REVERSE",
    sourceText: "Get upset easily.",
    translations: {
      en: {
        question: "I get upset easily.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question: "मैं आसानी से परेशान या दुखी हो जाता/जाती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 30,
    dimension: "INTELLECT_IMAGINATION",
    direction: "REVERSE",
    sourceText: "Do not have a good imagination.",
    translations: {
      en: {
        question:
          "I find it difficult to imagine new situations, stories, or possibilities.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मुझे नई परिस्थितियों, कहानियों या संभावनाओं की कल्पना करना कठिन लगता है।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 31,
    dimension: "EXTRAVERSION",
    direction: "POSITIVE",
    sourceText: "Talk to a lot of different people at parties.",
    translations: {
      en: {
        question:
          "At school events or gatherings, I talk to many different people.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "स्कूल के कार्यक्रमों या मेल-जोल में मैं कई अलग-अलग लोगों से बात करता/करती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 32,
    dimension: "AGREEABLENESS",
    direction: "REVERSE",
    sourceText: "Am not really interested in others.",
    translations: {
      en: {
        question:
          "I am not very interested in getting to know other people.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मुझे दूसरे लोगों को जानने में बहुत ज्यादा रुचि नहीं होती।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 33,
    dimension: "CONSCIENTIOUSNESS",
    direction: "POSITIVE",
    sourceText: "Like order.",
    translations: {
      en: {
        question:
          "I like keeping my work, belongings, and plans organized.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मुझे अपना काम, सामान और योजनाएँ व्यवस्थित रखना पसंद है।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 34,
    dimension: "EMOTIONAL_STABILITY",
    direction: "REVERSE",
    sourceText: "Change my mood a lot.",
    translations: {
      en: {
        question: "My mood changes a lot during the day.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question: "दिन के दौरान मेरा मूड काफी बदलता रहता है।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 35,
    dimension: "INTELLECT_IMAGINATION",
    direction: "POSITIVE",
    sourceText: "Am quick to understand things.",
    translations: {
      en: {
        question: "I usually understand new ideas quickly.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question: "मैं आमतौर पर नए विचारों को जल्दी समझ लेता/लेती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 36,
    dimension: "EXTRAVERSION",
    direction: "REVERSE",
    sourceText: "Don't like to draw attention to myself.",
    translations: {
      en: {
        question: "I do not like drawing attention to myself.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question: "मुझे अपनी ओर लोगों का ध्यान खींचना पसंद नहीं है।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 37,
    dimension: "AGREEABLENESS",
    direction: "POSITIVE",
    sourceText: "Take time out for others.",
    translations: {
      en: {
        question: "I make time to help or support other people.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question: "मैं दूसरों की मदद या सहयोग के लिए समय निकालता/निकालती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 38,
    dimension: "CONSCIENTIOUSNESS",
    direction: "REVERSE",
    sourceText: "Shirk my duties.",
    translations: {
      en: {
        question:
          "I sometimes avoid responsibilities that I should handle.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं कभी-कभी उन जिम्मेदारियों से बचता/बचती हूँ जिन्हें मुझे पूरा करना चाहिए।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 39,
    dimension: "EMOTIONAL_STABILITY",
    direction: "REVERSE",
    sourceText: "Have frequent mood swings.",
    translations: {
      en: {
        question:
          "My mood often shifts noticeably from one feeling to another.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मेरा मूड अक्सर एक भावना से दूसरी भावना में काफी बदल जाता है।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 40,
    dimension: "INTELLECT_IMAGINATION",
    direction: "POSITIVE",
    sourceText: "Use difficult words.",
    translations: {
      en: {
        question:
          "I am comfortable understanding and using advanced or difficult words.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं कठिन या उन्नत शब्दों को समझने और इस्तेमाल करने में सहज हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 41,
    dimension: "EXTRAVERSION",
    direction: "POSITIVE",
    sourceText: "Don't mind being the center of attention.",
    translations: {
      en: {
        question:
          "I do not mind being the center of attention when the situation calls for it.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "जरूरत पड़ने पर मुझे सबके ध्यान के केंद्र में रहने से परेशानी नहीं होती।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 42,
    dimension: "AGREEABLENESS",
    direction: "POSITIVE",
    sourceText: "Feel others' emotions.",
    translations: {
      en: {
        question:
          "I can often sense and understand other people's emotions.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं अक्सर दूसरे लोगों की भावनाओं को महसूस और समझ पाता/पाती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 43,
    dimension: "CONSCIENTIOUSNESS",
    direction: "POSITIVE",
    sourceText: "Follow a schedule.",
    translations: {
      en: {
        question:
          "I like following a schedule or plan for my work and studies.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मुझे अपने काम और पढ़ाई के लिए समय-सारणी या योजना के अनुसार चलना पसंद है।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 44,
    dimension: "EMOTIONAL_STABILITY",
    direction: "REVERSE",
    sourceText: "Get irritated easily.",
    translations: {
      en: {
        question: "I get irritated easily.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question: "मैं आसानी से चिढ़ या परेशान हो जाता/जाती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 45,
    dimension: "INTELLECT_IMAGINATION",
    direction: "POSITIVE",
    sourceText: "Spend time reflecting on things.",
    translations: {
      en: {
        question:
          "I spend time thinking deeply about experiences, ideas, or problems.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं अनुभवों, विचारों या समस्याओं के बारे में गहराई से सोचने के लिए समय देता/देती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 46,
    dimension: "EXTRAVERSION",
    direction: "REVERSE",
    sourceText: "Am quiet around strangers.",
    translations: {
      en: {
        question:
          "I am usually quiet around people I do not know well.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "जिन लोगों को मैं अच्छी तरह नहीं जानता/जानती, उनके आसपास मैं आमतौर पर शांत रहता/रहती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 47,
    dimension: "AGREEABLENESS",
    direction: "POSITIVE",
    sourceText: "Make people feel at ease.",
    translations: {
      en: {
        question:
          "I try to make other people feel comfortable around me.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं कोशिश करता/करती हूँ कि मेरे आसपास दूसरे लोग सहज महसूस करें।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 48,
    dimension: "CONSCIENTIOUSNESS",
    direction: "POSITIVE",
    sourceText: "Am exacting in my work.",
    translations: {
      en: {
        question:
          "I set high standards for accuracy and quality in my work.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question:
          "मैं अपने काम की सटीकता और गुणवत्ता के लिए ऊँचे मानक रखता/रखती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 49,
    dimension: "EMOTIONAL_STABILITY",
    direction: "REVERSE",
    sourceText: "Often feel blue.",
    translations: {
      en: {
        question: "I often feel low or sad.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question: "मैं अक्सर उदास या मायूस महसूस करता/करती हूँ।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
  {
    order: 50,
    dimension: "INTELLECT_IMAGINATION",
    direction: "POSITIVE",
    sourceText: "Am full of ideas.",
    translations: {
      en: {
        question: "I often have many ideas in my mind.",
        helperText: "Choose how accurately this statement describes you.",
      },
      hi: {
        question: "मेरे मन में अक्सर कई अलग-अलग विचार आते रहते हैं।",
        helperText: "चुनें कि यह कथन आपको कितनी सही तरह से बताता है।",
      },
    },
  },
];
