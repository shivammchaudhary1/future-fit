const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID, createHmac } = require("node:crypto");
require("reflect-metadata");
const { ConfigModule } = require("@nestjs/config");
const mongoose = require("mongoose");
const { AuthoringService } = require("../../dist/assessments/authoring.service.js");
const { AssessmentsService } = require("../../dist/assessments/assessments.service.js");
const { PaymentsService } = require("../../dist/payments/payments.service.js");
const { OrganizationsService } = require("../../dist/organizations/organizations.service.js");
const { SchoolsService } = require("../../dist/schools/schools.service.js");
const databaseName = "ff_it_" + randomUUID().replaceAll("-", "");
let connection, models, authoring, assessments, organizations, schools;
const actorId = new mongoose.Types.ObjectId();
const studentId = new mongoose.Types.ObjectId();
const teacherId = new mongoose.Types.ObjectId();
let assessment, version, question, organization;
let queueCalls = 0;
before(async () => {
  try {
  await ConfigModule.forRoot({ envFilePath: "../../.env" });
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required for isolated integration tests");
  connection = await mongoose.createConnection(process.env.MONGODB_URI, { dbName: databaseName, serverSelectionTimeoutMS: 10000 }).asPromise();
  models = {};
  for (const [name, path] of [
    ["Assessment", "assessments/assessment"], ["AssessmentVersion", "assessments/assessment-version"], ["Question", "assessments/question"], ["AssessmentAttempt", "assessments/attempt"], ["AssessmentResult", "assessments/result"],
    ["Product", "payments/payment"], ["Payment", "payments/payment"], ["Entitlement", "payments/payment"], ["User", "users/user"], ["Organization", "organizations/organization"], ["OrganizationMembership", "organizations/membership"],
    ["AcademicYear", "schools/academic-year"], ["SchoolClass", "schools/class"], ["ClassEnrollment", "schools/class-enrollment"], ["AssessmentAssignment", "schools/assessment-assignment"],
  ]) {
    const exports = require("../../dist/" + path + ".schema.js");
    models[name] = connection.model(name, exports[name + "Schema"]);
  }
  await Promise.all(Object.values(models).map((model) => model.init()));
  authoring = new AuthoringService(models.Assessment, models.AssessmentVersion, models.Question);
  organizations = new OrganizationsService(models.User, models.Organization, models.OrganizationMembership);
  schools = new SchoolsService(models.AcademicYear, models.SchoolClass, models.ClassEnrollment, models.AssessmentAssignment, models.OrganizationMembership, models.Assessment, organizations);
  assessments = new AssessmentsService(models.Assessment, models.AssessmentVersion, models.AssessmentAttempt, models.AssessmentResult, { enqueueScoring: async () => { queueCalls++; } }, organizations, schools, models.Entitlement);
  assessment = await authoring.create(actorId.toHexString(), { name: "Integration fixture", description: "Synthetic test, not an assessment instrument", type: "INTEREST" });
  question = await authoring.createQuestion({ type: "SINGLE_SELECT", translations: { en: { question: "Synthetic question" }, hi: { question: "परीक्षण प्रश्न" } }, options: [{ id: "a", translations: { en: "A", hi: "अ" }, scoring: { sample: 1 } }, { id: "b", translations: { en: "B", hi: "ब" }, scoring: { sample: 0 } }] });
  version = await authoring.createVersion(assessment._id.toHexString(), { version: "v1", sections: [{ key: "main", translations: { en: "Test", hi: "परीक्षण" }, questions: [{ questionId: question._id.toHexString(), order: 0, required: true }] }], scoringConfiguration: { scoringModel: "OPTION_SUM_V1", dimensions: ["sample"], weights: {} } });
  assert.equal(version.status, "DRAFT");
  assert.equal(version.assessmentId.toString(), assessment._id.toString());
  assert.ok(await models.AssessmentVersion.findOne({ _id: version._id, assessmentId: assessment._id, status: "DRAFT" }).lean());
  await authoring.publish(assessment._id.toHexString(), version._id.toHexString());
  organization = await organizations.create(actorId.toHexString(), { name: "Synthetic integration school", type: "SCHOOL", address: { city: "Test", state: "Test", country: "India" } });
  await models.OrganizationMembership.create([{ userId: studentId, organizationId: organization._id, role: "STUDENT", status: "ACTIVE" }, { userId: teacherId, organizationId: organization._id, role: "TEACHER", status: "ACTIVE" }]);
  } catch (error) { console.error("Integration setup failed:", error.name, "code:", error.code); throw error; }
});
after(async () => {
  if (!connection) return;
  // Only the exact randomly named database created by this test may be dropped.
  if (connection.name !== databaseName || !/^ff_it_[a-f0-9]{32}$/.test(databaseName)) throw new Error("Refusing to remove an unexpected database");
  try {
    await connection.dropDatabase();
    console.log("Isolated synthetic integration database removed.");
  } finally { await connection.close(); }
});
test("published snapshot is independent of later question-bank changes", async () => {
  await models.Question.updateOne({ _id: question._id }, { $set: { "content.options.0.scoring.sample": 999 } });
  const snapshot = await models.AssessmentVersion.findById(version._id).lean();
  assert.equal(snapshot.questionSnapshots[0].options[0].scoring.sample, 1);
});
test("MongoDB autosave revision permits only one concurrent writer", async () => {
  const attempt = await assessments.start(studentId.toHexString(), assessment._id.toHexString(), { context: "PERSONAL", language: "en" });
  const input = { revision: 0, progress: 100, responses: [{ questionId: question._id.toHexString(), answer: "a" }] };
  const writes = await Promise.allSettled([assessments.save(studentId.toHexString(), attempt._id.toHexString(), input), assessments.save(studentId.toHexString(), attempt._id.toHexString(), input)]);
  assert.equal(writes.filter((result) => result.status === "fulfilled").length, 1);
  const publicAttempt = await assessments.getAttempt(studentId.toHexString(), attempt._id.toHexString());
  assert.equal(publicAttempt.version.questions[0].options[0].scoring, undefined);
  await assessments.submit(studentId.toHexString(), attempt._id.toHexString());
  await assessments.submit(studentId.toHexString(), attempt._id.toHexString());
  assert.equal(await models.AssessmentResult.countDocuments({ attemptId: attempt._id }), 1);
  assert.equal(queueCalls, 2);
});
test("teacher cannot assign a student outside their own classes", async () => {
  await assert.rejects(schools.createAssignment(teacherId.toHexString(), organization._id.toHexString(), { assessmentId: assessment._id.toHexString(), targetType: "STUDENT", targetIds: [studentId.toHexString()] }), { status: 403 });
});
test("captured webhook atomically grants exactly one entitlement on replay", async () => {
  const product = await models.Product.create({ name: "Synthetic paid product", assessmentIds: [assessment._id], amount: 100, durationDays: 1 });
  const payment = await models.Payment.create({ userId: studentId, productId: product._id, requestKey: randomUUID(), providerOrderId: "order_synthetic_integration", amount: 100, currency: "INR", durationDays: 1, assessmentIds: [assessment._id], status: "CREATED" });
  const service = new PaymentsService(connection, models.Product, models.Payment, models.Entitlement, models.Assessment, { getOrThrow: () => "synthetic-secret" });
  const body = Buffer.from(JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_synthetic", order_id: payment.providerOrderId, amount: 100, currency: "INR", status: "captured" } } } }));
  const signature = createHmac("sha256", "synthetic-secret").update(body).digest("hex");
  await service.webhook(body, signature);
  await service.webhook(body, signature);
  assert.equal((await models.Payment.findById(payment._id)).status, "PAID");
  assert.equal(await models.Entitlement.countDocuments({ paymentId: payment._id }), 1);
});
