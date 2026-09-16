export type QuestionnaireLanguage = "en" | "hi";

export const QUESTIONNAIRE_MESSAGES = {
  en: {
    pageTitle: "Interest Assessment",
    pageEyebrow: "Future Fit assessment",
    pageDescription:
      "Discover the activities, learning styles and work environments that naturally match your interests.",
    question: "Question",
    of: "of",
    answered: "answered",
    remaining: "remaining",
    complete: "Complete",
    required: "Required",
    saved: "All answers saved",
    pendingSingle: "1 answer waiting to sync",
    pendingMany: "answers waiting to sync",
    selectOne: "Choose the option that feels most like you.",
    multiSelect: "Choose every option that applies.",
    mostLike: "Most like me",
    leastLike: "Least like me",
    selectOption: "Select an option",
    typeAnswer: "Type your answer here",
    saveExit: "Save & exit",
    previous: "Previous",
    next: "Next",
    submit: "Submit assessment",
    review: "Review answers",
    submitConfirm:
      "Submit this assessment? You will not be able to change your answers afterward.",
    incomplete:
      "Please answer all required questions before submitting.",
    chooseToContinue: "Choose an answer to continue",
    keyboardHint: "Tip: press 1–5 to answer quickly.",
    navigatorTitle: "Your progress",
    navigatorHint: "Jump to any question. Filled circles are answered.",
    language: "Question language",
    english: "English",
    hindi: "हिंदी",
    secureDraft: "Your progress is saved automatically.",
    syncingFailed:
      "Your latest answers could not sync. They are still saved on this device.",
    storageFailed:
      "Device storage failed. Keep this page open until your answers sync.",
    loading: "Preparing your assessment…",
    alreadySubmitted: "This assessment has already been submitted.",
    viewResults: "View results",
    responseScale: "Your response",
    currentQuestion: "Current question",
  },
  hi: {
    pageTitle: "रुचि आकलन",
    pageEyebrow: "फ्यूचर फिट आकलन",
    pageDescription:
      "जानें कि कौन-सी गतिविधियाँ, सीखने के तरीके और कार्य वातावरण आपकी स्वाभाविक रुचियों से सबसे अधिक मेल खाते हैं।",
    question: "प्रश्न",
    of: "में से",
    answered: "उत्तर दिए",
    remaining: "बाकी",
    complete: "पूर्ण",
    required: "आवश्यक",
    saved: "सभी उत्तर सहेजे गए",
    pendingSingle: "1 उत्तर सिंक होने की प्रतीक्षा में",
    pendingMany: "उत्तर सिंक होने की प्रतीक्षा में",
    selectOne: "वह विकल्प चुनें जो आपके लिए सबसे उपयुक्त लगे।",
    multiSelect: "लागू होने वाले सभी विकल्प चुनें।",
    mostLike: "मेरे जैसा सबसे अधिक",
    leastLike: "मेरे जैसा सबसे कम",
    selectOption: "एक विकल्प चुनें",
    typeAnswer: "अपना उत्तर यहाँ लिखें",
    saveExit: "सहेजें और बाहर जाएँ",
    previous: "पिछला",
    next: "अगला",
    submit: "आकलन जमा करें",
    review: "उत्तर जाँचें",
    submitConfirm:
      "क्या आप यह आकलन जमा करना चाहते हैं? जमा करने के बाद उत्तर बदले नहीं जा सकेंगे।",
    incomplete:
      "जमा करने से पहले सभी आवश्यक प्रश्नों के उत्तर दें।",
    chooseToContinue: "आगे बढ़ने के लिए एक उत्तर चुनें",
    keyboardHint: "सुझाव: जल्दी उत्तर देने के लिए 1–5 दबाएँ।",
    navigatorTitle: "आपकी प्रगति",
    navigatorHint: "किसी भी प्रश्न पर जाएँ। भरे हुए गोले उत्तर दिए गए प्रश्न हैं।",
    language: "प्रश्न की भाषा",
    english: "English",
    hindi: "हिंदी",
    secureDraft: "आपकी प्रगति अपने-आप सहेजी जाती है।",
    syncingFailed:
      "नवीनतम उत्तर सिंक नहीं हो सके। वे इस डिवाइस पर सुरक्षित हैं।",
    storageFailed:
      "डिवाइस पर सहेजने में समस्या हुई। उत्तर सिंक होने तक यह पेज खुला रखें।",
    loading: "आपका आकलन तैयार किया जा रहा है…",
    alreadySubmitted: "यह आकलन पहले ही जमा किया जा चुका है।",
    viewResults: "परिणाम देखें",
    responseScale: "आपका उत्तर",
    currentQuestion: "वर्तमान प्रश्न",
  },
} as const;

export function questionnaireMessages(language: QuestionnaireLanguage) {
  return QUESTIONNAIRE_MESSAGES[language];
}
