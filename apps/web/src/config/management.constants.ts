export const SCHOOL_ACTIONS = {
  year: { name: "", startDate: "", endDate: "" },
  classroom: { academicYearId: "", grade: "9", section: "" },
  invitation: { email: "", role: "STUDENT" },
  memberStatus: { userId: "", status: "SUSPENDED" },
  assignment: { assessmentId: "", targetType: "CLASS", targetIds: [""] },
  users: { userIds: [""] },
} as const;
export const ADMIN_ASSESSMENT_TEMPLATE = {
  name: "",
  description: "",
  type: "INTEREST",
  isPaid: false,
};
export const ADMIN_QUESTION_TEMPLATE = {
  type: "SINGLE_SELECT",
  translations: { en: { question: "" }, hi: { question: "" } },
  options: [
    { id: "a", translations: { en: "", hi: "" }, scoring: {} },
    { id: "b", translations: { en: "", hi: "" }, scoring: {} },
  ],
};
export const ADMIN_VERSION_TEMPLATE = {
  version: "",
  sections: [
    {
      key: "main",
      translations: { en: "", hi: "" },
      questions: [{ questionId: "", order: 0, required: true }],
    },
  ],
  scoringConfiguration: {
    scoringModel: "OPTION_SUM_V1",
    dimensions: [""],
    weights: {},
  },
};
