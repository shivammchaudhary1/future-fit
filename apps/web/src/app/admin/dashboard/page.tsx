"use client";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { ManagementPanel } from "@/components/management-panel";
import {
  ADMIN_ASSESSMENT_TEMPLATE,
  ADMIN_QUESTION_TEMPLATE,
  ADMIN_VERSION_TEMPLATE,
} from "@/config/management.constants";
export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const [assessmentId, setAssessmentId] = useState("");
  const [versionId, setVersionId] = useState("");
  if (!user?.globalRoles.includes("SUPER_ADMIN"))
    return <main>Super administrator sign-in required.</main>;
  return (
    <main className="student-dashboard">
      <h1>Administration</h1>
      <p>
        Management interface. All changes are validated and authorized by the
        API.
      </p>
      <ManagementPanel
        title="Assessments"
        readPath="/admin/assessments"
        actions={[
          {
            label: "Create assessment",
            path: "/admin/assessments",
            template: ADMIN_ASSESSMENT_TEMPLATE,
          },
        ]}
      />
      <ManagementPanel
        title="Question bank"
        readPath="/admin/questions"
        actions={[
          {
            label: "Create question",
            path: "/admin/questions",
            template: ADMIN_QUESTION_TEMPLATE,
          },
        ]}
      />
      <label>
        Assessment ID{" "}
        <input
          value={assessmentId}
          onChange={(e) => setAssessmentId(e.target.value)}
        />
      </label>
      {/^[a-f\d]{24}$/i.test(assessmentId) && (
        <ManagementPanel
          title="New assessment version"
          key={assessmentId}
          readPath={`/admin/assessments/${assessmentId}/versions`}
          actions={[
            {
              label: "Create version",
              path: `/admin/assessments/${assessmentId}/versions`,
              template: ADMIN_VERSION_TEMPLATE,
            },
          ]}
        />
      )}
      <label>
        Version ID to publish{" "}
        <input
          value={versionId}
          onChange={(e) => setVersionId(e.target.value)}
        />
      </label>
      {[assessmentId, versionId].every((id) => /^[a-f\d]{24}$/i.test(id)) && (
        <ManagementPanel
          title="Publish immutable version"
          readPath="/admin/assessments"
          actions={[
            {
              label: "Publish",
              path: `/admin/assessments/${assessmentId}/versions/${versionId}/publish`,
              template: {},
            },
          ]}
        />
      )}
      <ManagementPanel title="Audit log" readPath="/admin/audit-logs" />
    </main>
  );
}
