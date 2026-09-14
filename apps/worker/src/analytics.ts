import type { Db, ObjectId } from "mongodb";
export async function refreshSchoolAnalytics(database: Db) {
  await database
    .collection("school_aggregates")
    .createIndex({ organizationId: 1 }, { unique: true });
  const organizations = database
    .collection<{ _id: ObjectId }>("organizations")
    .find({ status: "ACTIVE" });
  for await (const organization of organizations) {
    const organizationId = organization._id;
    const statuses = await database
      .collection("assessment_attempts")
      .aggregate<{ _id: string; count: number }>([
        { $match: { organizationId, context: "SCHOOL" } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ])
      .toArray();
    const roles = await database
      .collection("organization_memberships")
      .aggregate<{ _id: string; count: number }>([
        { $match: { organizationId, status: "ACTIVE" } },
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ])
      .toArray();
    // Replace absolute counts so repeated jobs never double-count a result.
    await database
      .collection("school_aggregates")
      .updateOne(
        { organizationId },
        {
          $set: {
            attemptsByStatus: Object.fromEntries(
              statuses.map((s) => [s._id, s.count]),
            ),
            membersByRole: Object.fromEntries(
              roles.map((r) => [r._id, r.count]),
            ),
            updatedAt: new Date(),
            status: "READY",
          },
        },
        { upsert: true },
      );
  }
}
