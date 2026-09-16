import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error("MONGODB_URI is missing.");

const AREA_CODE = {
  realistic: "R",
  investigative: "I",
  artistic: "A",
  social: "S",
  enterprising: "E",
  conventional: "C",
};

const OPTIONS = [
  {
    id: "1",
    translations: { en: "Strongly dislike", hi: "बिल्कुल पसंद नहीं" },
    scoring: {},
  },
  {
    id: "2",
    translations: { en: "Dislike", hi: "पसंद नहीं" },
    scoring: {},
  },
  {
    id: "3",
    translations: { en: "Unsure", hi: "निश्चित नहीं" },
    scoring: {},
  },
  {
    id: "4",
    translations: { en: "Like", hi: "पसंद है" },
    scoring: {},
  },
  {
    id: "5",
    translations: { en: "Strongly like", hi: "बहुत पसंद है" },
    scoring: {},
  },
];

await mongoose.connect(mongoUri);

try {
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection is not ready.");

  const sourceQuestions = await db
    .collection("onet_interest_questions")
    .find({
      sourceVersion: "api-v2",
      adaptationVersion: "future-fit-india-bilingual-v2",
    })
    .sort({ onetIndex: 1 })
    .toArray();

  if (sourceQuestions.length !== 60) {
    throw new Error(
      `Expected 60 bilingual adapted source questions, found ${sourceQuestions.length}.`,
    );
  }

  for (let i = 0; i < sourceQuestions.length; i += 1) {
    const q = sourceQuestions[i];
    if (
      q.onetIndex !== i + 1 ||
      !AREA_CODE[q.onetArea] ||
      !q.originalText ||
      !q.adaptedText?.en ||
      !q.adaptedText?.hi
    ) {
      throw new Error(`Invalid source question at O*NET index ${q.onetIndex}.`);
    }
  }

  const superAdmin = await db.collection("users").findOne({
    globalRoles: "SUPER_ADMIN",
  });
  if (!superAdmin) {
    throw new Error("SUPER_ADMIN user not found; cannot set assessment createdBy.");
  }

  const questions = db.collection("questions");
  const questionIds = [];

  for (const source of sourceQuestions) {
    const stableKey = `ONET_IP_60_${String(source.onetIndex).padStart(2, "0")}`;
    const content = {
      type: "SINGLE_SELECT",
      translations: {
        en: {
          question: source.adaptedText.en,
          helperText: "Choose how much you would enjoy doing this activity.",
        },
        hi: {
          question: source.adaptedText.hi,
          helperText: "चुनें कि आपको यह गतिविधि करना कितना पसंद आएगा।",
        },
      },
      options: OPTIONS,
      metadata: {
        dimension: AREA_CODE[source.onetArea],
        category: "O*NET Interest Profiler",
        onetOrder: source.onetIndex,
      },
    };

    const existing = await questions.findOne({
      "source.stableKey": stableKey,
    });

    if (existing) {
      await questions.updateOne(
        { _id: existing._id },
        {
          $set: {
            status: "ACTIVE",
            content,
            source: {
              stableKey,
              provider: "ONET",
              providerQuestionIndex: source.onetIndex,
              providerArea: source.onetArea,
              originalText: source.originalText,
              adaptationVersion: source.adaptationVersion,
            },
            updatedAt: new Date(),
          },
          $inc: { revision: 1 },
        },
      );
      questionIds.push(existing._id);
    } else {
      const inserted = await questions.insertOne({
        status: "ACTIVE",
        revision: 0,
        content,
        source: {
          stableKey,
          provider: "ONET",
          providerQuestionIndex: source.onetIndex,
          providerArea: source.onetArea,
          originalText: source.originalText,
          adaptationVersion: source.adaptationVersion,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      questionIds.push(inserted.insertedId);
    }
  }

  const assessmentStableKey = "FUTURE_FIT_RIASEC_ONET_60";
  const assessments = db.collection("assessments");
  let assessment = await assessments.findOne({
    stableKey: assessmentStableKey,
  });

  if (!assessment) {
    const inserted = await assessments.insertOne({
      stableKey: assessmentStableKey,
      isPaid: false,
      name: "Future Fit Interest Assessment",
      type: "INTEREST",
      description:
        "60-item bilingual RIASEC interest assessment scored through O*NET.",
      status: "DRAFT",
      createdBy: superAdmin._id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    assessment = await assessments.findOne({ _id: inserted.insertedId });
  }

  if (!assessment) throw new Error("Assessment could not be created.");

  const hydratedQuestions = await questions
    .find({ _id: { $in: questionIds } })
    .toArray();

  const byId = new Map(hydratedQuestions.map((q) => [q._id.toString(), q]));
  const questionSnapshots = questionIds.map((id, index) => {
    const q = byId.get(id.toString());
    if (!q) throw new Error(`Question ${id.toString()} disappeared.`);
    return {
      ...q.content,
      questionId: id.toString(),
      required: true,
      order: index + 1,
    };
  });

  const versionName = "onet-ip-60-india-bilingual-v1";
  const sections = [
    {
      key: "interest",
      translations: {
        en: "Activities and Interests",
        hi: "गतिविधियाँ और रुचियाँ",
      },
      questions: questionIds.map((id, index) => ({
        questionId: id.toString(),
        order: index + 1,
        required: true,
      })),
    },
  ];

  const scoringConfiguration = {
    scoringModel: "ONET_IP_60_V1",
    dimensions: ["R", "I", "A", "S", "E", "C"],
    weights: {},
  };

  const versions = db.collection("assessment_versions");
  const existingVersion = await versions.findOne({
    assessmentId: assessment._id,
    version: versionName,
  });

  let versionId;

  if (existingVersion) {
    await versions.updateOne(
      { _id: existingVersion._id },
      {
        $set: {
          questionSnapshots,
          sections,
          scoringConfiguration,
          status: "PUBLISHED",
          publishedAt: existingVersion.publishedAt ?? new Date(),
          updatedAt: new Date(),
        },
      },
    );
    versionId = existingVersion._id;
  } else {
    const inserted = await versions.insertOne({
      assessmentId: assessment._id,
      version: versionName,
      questionSnapshots,
      sections,
      scoringConfiguration,
      status: "PUBLISHED",
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    versionId = inserted.insertedId;
  }

  await assessments.updateOne(
    { _id: assessment._id },
    {
      $set: {
        status: "PUBLISHED",
        activeVersionId: versionId,
        updatedAt: new Date(),
      },
    },
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        assessmentId: assessment._id.toString(),
        assessmentVersionId: versionId.toString(),
        version: versionName,
        publishedQuestions: questionSnapshots.length,
        scoringModel: scoringConfiguration.scoringModel,
        answerOrder: "O*NET index 1..60",
        dimensions: scoringConfiguration.dimensions,
      },
      null,
      2,
    ),
  );
} finally {
  await mongoose.disconnect();
}
