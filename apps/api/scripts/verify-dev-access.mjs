import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const here = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(
  here,
  "../../../data/dev/dev-access-seed.v1.json",
);

const manifest = JSON.parse(
  await fs.readFile(manifestPath, "utf8"),
);

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is required.");
}

await mongoose.connect(mongoUri);

let failed = false;

try {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection is not ready.");
  }

  const users = db.collection("users");
  const organizations = db.collection("organizations");
  const memberships = db.collection(
    "organization_memberships",
  );
  const academicYears = db.collection("academic_years");
  const schoolClasses = db.collection("school_classes");
  const classEnrollments = db.collection(
    "class_enrollments",
  );
  const guardianLinks = db.collection("guardian_links");
  const careerSourceRecords = db.collection(
    "career_source_records",
  );

  const organization = await organizations.findOne({
    name: manifest.school.name,
    type: "SCHOOL",
  });

  const results = [];

  const byKey = {};

  for (const definition of manifest.users) {
    const user = await users.findOne({
      email: definition.email,
    });

    byKey[definition.key] = user;

    const item = {
      email: definition.email,
      expectedAccess: definition.accessType,
      userExists: Boolean(user),
      relationOk: false,
      details: [],
    };

    if (!user) {
      item.details.push("user missing");
      failed = true;
      results.push(item);
      continue;
    }

    if (definition.accessType === "SUPER_ADMIN") {
      item.relationOk =
        Array.isArray(user.globalRoles) &&
        user.globalRoles.includes("SUPER_ADMIN");

      item.details.push(
        item.relationOk
          ? "users.globalRoles contains SUPER_ADMIN"
          : "SUPER_ADMIN global role missing",
      );
    } else if (
      ["SCHOOL_ADMIN", "TEACHER", "STUDENT"].includes(
        definition.accessType,
      )
    ) {
      const membership = organization
        ? await memberships.findOne({
            organizationId: organization._id,
            userId: user._id,
            role: definition.accessType,
            status: "ACTIVE",
          })
        : null;

      item.relationOk = Boolean(membership);
      item.details.push(
        membership
          ? `active ${definition.accessType} membership found`
          : `${definition.accessType} membership missing`,
      );
    } else if (definition.accessType === "GUARDIAN") {
      const student = await users.findOne({
        email: "student@futurefit.dev",
      });

      const link = student
        ? await guardianLinks.findOne({
            studentId: student._id,
            guardianId: user._id,
            status: "APPROVED",
          })
        : null;

      item.relationOk = Boolean(link);
      item.details.push(
        link
          ? "approved guardian link found"
          : "approved guardian link missing",
      );
    }

    if (!item.relationOk) {
      failed = true;
    }

    results.push(item);
  }

  const deprecated = await users
    .find({
      email: {
        $in: manifest.deprecatedSeedAccounts,
      },
    })
    .project({ email: 1 })
    .toArray();

  if (deprecated.length > 0) {
    failed = true;
  }

  const teacher = byKey.teacher;
  const student = byKey.student;

  const academicYear = organization
    ? await academicYears.findOne({
        organizationId: organization._id,
        name: manifest.school.academicYear.name,
        status: "ACTIVE",
      })
    : null;

  const schoolClass =
    organization && academicYear
      ? await schoolClasses.findOne({
          organizationId: organization._id,
          academicYearId: academicYear._id,
          grade: manifest.school.demoClass.grade,
          section: manifest.school.demoClass.section,
          ...(teacher
            ? { teacherIds: teacher._id }
            : {}),
        })
      : null;

  const enrollment =
    organization && schoolClass && student
      ? await classEnrollments.findOne({
          organizationId: organization._id,
          classId: schoolClass._id,
          studentId: student._id,
          active: true,
        })
      : null;

  if (
    !organization ||
    !academicYear ||
    !schoolClass ||
    !enrollment
  ) {
    failed = true;
  }

  const careerCount =
    await careerSourceRecords.countDocuments();

  if (careerCount !== 1375) {
    failed = true;
  }

  const collectionCounts = {};

  for (const name of [
    "users",
    "organizations",
    "organization_memberships",
    "academic_years",
    "school_classes",
    "class_enrollments",
    "guardian_links",
    "career_source_records",
  ]) {
    const exists = await db
      .listCollections({ name }, { nameOnly: true })
      .hasNext();

    collectionCounts[name] = exists
      ? await db.collection(name).countDocuments()
      : 0;
  }

  console.log(
    JSON.stringify(
      {
        ok: !failed,
        database: db.databaseName,
        accessChecks: results,
        deprecatedSeedAccountsStillPresent:
          deprecated.map((entry) => entry.email),
        schoolRelationChecks: {
          organization: Boolean(organization),
          academicYear: Boolean(academicYear),
          classWithTeacher: Boolean(schoolClass),
          studentEnrollment: Boolean(enrollment),
        },
        careerSourceRecords: {
          expected: 1375,
          actual: careerCount,
          ok: careerCount === 1375,
        },
        collectionCounts,
        explanation:
          "Empty users.globalRoles is correct for principal, teacher, student and guardian. Their access is relation-based in other collections.",
      },
      null,
      2,
    ),
  );

  if (failed) {
    process.exitCode = 1;
  }
} finally {
  await mongoose.disconnect();
}
