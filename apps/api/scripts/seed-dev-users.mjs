import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hash } from "argon2";
import mongoose from "mongoose";

const PASSWORD_HASH_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

const here = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.resolve(
  here,
  "../../../data/dev/dev-access-seed.v1.json",
);

const manifest = JSON.parse(
  await fs.readFile(manifestPath, "utf8"),
);

const mongoUri = process.env.MONGODB_URI;
const password = process.env.DEV_SEED_PASSWORD;

if (!mongoUri) {
  throw new Error("MONGODB_URI is required in the root .env file.");
}

if (!password || password.length < 8) {
  throw new Error(
    "DEV_SEED_PASSWORD is required and must be at least 8 characters.",
  );
}

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run a development seed in production.");
}

function databaseNameFromUri(uri) {
  try {
    const parsed = new URL(uri);
    return decodeURIComponent(
      parsed.pathname.replace(/^\/+/, ""),
    );
  } catch {
    return "";
  }
}

const dbName = databaseNameFromUri(mongoUri);

if (!dbName) {
  throw new Error(
    "MONGODB_URI must include an explicit database name.",
  );
}

if (/prod|production/i.test(dbName)) {
  throw new Error(
    `Refusing to seed "${dbName}" because it looks like production.`,
  );
}

await mongoose.connect(mongoUri);

try {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("MongoDB connection is not ready.");
  }

  const now = new Date();
  const passwordHash = await hash(
    password,
    PASSWORD_HASH_OPTIONS,
  );

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
  const sessions = db.collection("auth_sessions");
  const oneTimeTokens = db.collection("one_time_tokens");

  /*
   * Clean up only accounts created by the previous Future Fit dev seed.
   * This does not delete arbitrary development users.
   */
  const deprecatedUsers = await users
    .find({
      email: {
        $in: manifest.deprecatedSeedAccounts,
      },
    })
    .toArray();

  const deprecatedIds = deprecatedUsers.map(
    (user) => user._id,
  );

  if (deprecatedIds.length > 0) {
    await memberships.deleteMany({
      userId: { $in: deprecatedIds },
    });

    await guardianLinks.deleteMany({
      $or: [
        { guardianId: { $in: deprecatedIds } },
        { studentId: { $in: deprecatedIds } },
      ],
    });

    await classEnrollments.deleteMany({
      studentId: { $in: deprecatedIds },
    });

    await schoolClasses.updateMany(
      {},
      {
        $pull: {
          teacherIds: { $in: deprecatedIds },
        },
      },
    );

    await sessions.deleteMany({
      userId: { $in: deprecatedIds },
    });

    await oneTimeTokens.deleteMany({
      userId: { $in: deprecatedIds },
    });

    await users.deleteMany({
      _id: { $in: deprecatedIds },
    });
  }

  const seededUsers = {};

  for (const definition of manifest.users) {
    await users.updateOne(
      { email: definition.email },
      {
        $set: {
          firstName: definition.firstName,
          lastName: definition.lastName,
          email: definition.email,
          passwordHash,
          authProviders: [{ provider: "LOCAL" }],
          preferredLanguage: "en",
          globalRoles: definition.globalRoles,
          status: "ACTIVE",
          emailVerified: true,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );

    const user = await users.findOne({
      email: definition.email,
    });

    if (!user) {
      throw new Error(
        `Failed to seed ${definition.email}`,
      );
    }

    seededUsers[definition.key] = user;
  }

  const school = manifest.school;

  await organizations.updateOne(
    {
      name: school.name,
      type: school.type,
    },
    {
      $set: {
        name: school.name,
        type: school.type,
        board: school.board,
        address: school.address,
        settings: school.settings,
        status: "ACTIVE",
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  const organization = await organizations.findOne({
    name: school.name,
    type: school.type,
  });

  if (!organization) {
    throw new Error("Failed to seed demo school.");
  }

  const organizationRoles = [
    ["principal", "SCHOOL_ADMIN"],
    ["teacher", "TEACHER"],
    ["student", "STUDENT"],
  ];

  for (const [userKey, role] of organizationRoles) {
    const user = seededUsers[userKey];

    await memberships.updateOne(
      {
        organizationId: organization._id,
        userId: user._id,
      },
      {
        $set: {
          organizationId: organization._id,
          userId: user._id,
          role,
          status: "ACTIVE",
          joinedAt: now,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );
  }

  /*
   * Ensure the five demo accounts do not accidentally retain a wrong
   * organization role from a previous seed.
   */
  const exactExpectedRoles = new Map(
    organizationRoles.map(
      ([key, role]) => [
        seededUsers[key]._id.toString(),
        role,
      ],
    ),
  );

  const managedSeedIds = manifest.users
    .map((definition) => seededUsers[definition.key]._id);

  const managedMemberships = await memberships
    .find({
      organizationId: organization._id,
      userId: { $in: managedSeedIds },
    })
    .toArray();

  for (const membership of managedMemberships) {
    const expectedRole = exactExpectedRoles.get(
      membership.userId.toString(),
    );

    if (!expectedRole) {
      await memberships.deleteOne({
        _id: membership._id,
      });
      continue;
    }

    if (membership.role !== expectedRole) {
      await memberships.updateOne(
        { _id: membership._id },
        {
          $set: {
            role: expectedRole,
            status: "ACTIVE",
            updatedAt: now,
          },
        },
      );
    }
  }

  const year = school.academicYear;

  await academicYears.updateOne(
    {
      organizationId: organization._id,
      name: year.name,
    },
    {
      $set: {
        organizationId: organization._id,
        name: year.name,
        startDate: new Date(year.startDate),
        endDate: new Date(year.endDate),
        status: "ACTIVE",
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  const academicYear = await academicYears.findOne({
    organizationId: organization._id,
    name: year.name,
  });

  if (!academicYear) {
    throw new Error("Failed to seed academic year.");
  }

  const demoClass = school.demoClass;

  await schoolClasses.updateOne(
    {
      organizationId: organization._id,
      academicYearId: academicYear._id,
      grade: demoClass.grade,
      section: demoClass.section,
    },
    {
      $set: {
        organizationId: organization._id,
        academicYearId: academicYear._id,
        grade: demoClass.grade,
        section: demoClass.section,
        teacherIds: [seededUsers.teacher._id],
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  const schoolClass = await schoolClasses.findOne({
    organizationId: organization._id,
    academicYearId: academicYear._id,
    grade: demoClass.grade,
    section: demoClass.section,
  });

  if (!schoolClass) {
    throw new Error("Failed to seed demo class.");
  }

  await classEnrollments.updateOne(
    {
      classId: schoolClass._id,
      studentId: seededUsers.student._id,
    },
    {
      $set: {
        organizationId: organization._id,
        classId: schoolClass._id,
        studentId: seededUsers.student._id,
        active: true,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  /*
   * Guardian is relation-based, not a global or organization role.
   */
  await guardianLinks.updateOne(
    {
      studentId: seededUsers.student._id,
      guardianId: seededUsers.guardian._id,
    },
    {
      $set: {
        studentId: seededUsers.student._id,
        guardianId: seededUsers.guardian._id,
        consentVersion: "dev-seed-v2",
        status: "APPROVED",
        consentedAt: now,
        updatedAt: now,
      },
      $unset: {
        revokedAt: "",
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  console.log(
    JSON.stringify(
      {
        success: true,
        database: dbName,
        repairedSeedVersion: "dev-access-v2",
        deletedDeprecatedAccounts:
          deprecatedUsers.map((user) => user.email),
        users: manifest.users.map(
          (definition) => ({
            email: definition.email,
            accessType: definition.accessType,
            storedIn: definition.storage,
          }),
        ),
        school: {
          name: organization.name,
          academicYear: academicYear.name,
          class: `${schoolClass.grade}-${schoolClass.section}`,
        },
        note:
          "Only SUPER_ADMIN appears in users.globalRoles. Principal, teacher and student are organization memberships; guardian is a guardian link.",
      },
      null,
      2,
    ),
  );
} finally {
  await mongoose.disconnect();
}
