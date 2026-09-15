"use client";

import {
  ClipboardCheck,
  FileQuestion,
  LayoutDashboard,
  ScrollText,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import styles from "@/components/dashboard/dashboard.module.css";
import { ManagementPanel } from "@/components/management-panel";
import {
  ADMIN_ASSESSMENT_TEMPLATE,
  ADMIN_QUESTION_TEMPLATE,
  ADMIN_VERSION_TEMPLATE,
} from "@/config/management.constants";
import { useAuthStore } from "@/stores/auth.store";

const navItems = [
  { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Assessments", href: "#assessments", icon: ClipboardCheck },
  { label: "Question Bank", href: "#questions", icon: FileQuestion },
  { label: "Publishing", href: "#publishing", icon: Settings2 },
  { label: "Audit Log", href: "#audit", icon: ScrollText },
] as const;

export default function AdminDashboard() {
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);

  const [assessmentId, setAssessmentId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [questionId, setQuestionId] = useState("");

  if (!initialized) {
    return <main className="dashboard-loading">Preparing administration…</main>;
  }

  if (!user?.globalRoles.includes("SUPER_ADMIN")) {
    return (
      <main className="dashboard-loading">
        Super administrator sign-in required.
      </main>
    );
  }

  return (
    <DashboardShell
      roleLabel="Super Admin"
      title="Platform administration"
      description="Manage assessments, question content, publishing and platform audit records."
      navItems={[...navItems]}
    >
      <section className={styles.statGrid}>
        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <ShieldCheck />
            </span>
          </div>
          <strong>Active</strong>
          <span>Super administrator access</span>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <ClipboardCheck />
            </span>
          </div>
          <strong>Author</strong>
          <span>Assessment management</span>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <FileQuestion />
            </span>
          </div>
          <strong>Manage</strong>
          <span>Question bank content</span>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <ScrollText />
            </span>
          </div>
          <strong>Audit</strong>
          <span>Authorized platform activity</span>
        </article>
      </section>

      <p className={styles.notice}>
        Administrative changes remain validated and authorized by the API. This
        interface only improves presentation; it does not bypass backend access
        control.
      </p>

      <ManagementPanel
        id="assessments"
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
        id="questions"
        title="Question bank"
        readPath="/admin/questions"
        actions={[
          {
            label: "Create question",
            path: "/admin/questions",
            template: ADMIN_QUESTION_TEMPLATE,
          },
          {
            label: "Import questions (maximum 100)",
            path: "/admin/questions/import",
            template: { questions: [ADMIN_QUESTION_TEMPLATE] },
          },
        ]}
      />

      <section className={styles.workspaceToolbar}>
        <label>
          <span>Question ID to manage</span>
          <input
            value={questionId}
            placeholder="Paste question ObjectId"
            onChange={(event) => setQuestionId(event.target.value)}
          />
        </label>

        <p className={styles.notice}>
          Enter a valid question ID to edit, archive or restore that question.
        </p>
      </section>

      {/^[a-f\d]{24}$/i.test(questionId) && (
        <ManagementPanel
          key={questionId}
          title="Edit or archive question"
          readPath={`/admin/questions/${questionId}`}
          actions={[
            {
              label: "Replace question content",
              path: `/admin/questions/${questionId}`,
              method: "PATCH",
              template: { revision: 0, content: ADMIN_QUESTION_TEMPLATE },
            },
            {
              label: "Archive question",
              path: `/admin/questions/${questionId}/status`,
              template: { revision: 0, status: "ARCHIVED" },
            },
            {
              label: "Restore question",
              path: `/admin/questions/${questionId}/status`,
              template: { revision: 0, status: "ACTIVE" },
            },
          ]}
        />
      )}

      <section
        id="publishing"
        className={`${styles.workspaceToolbar} ${styles.sectionAnchor}`}
      >
        <label>
          <span>Assessment ID</span>
          <input
            value={assessmentId}
            placeholder="Paste assessment ObjectId"
            onChange={(event) => setAssessmentId(event.target.value)}
          />
        </label>

        <label>
          <span>Version ID</span>
          <input
            value={versionId}
            placeholder="Paste version ObjectId"
            onChange={(event) => setVersionId(event.target.value)}
          />
        </label>
      </section>

      {/^[a-f\d]{24}$/i.test(assessmentId) && (
        <ManagementPanel
          title="New assessment version"
          key={`assessment-${assessmentId}`}
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

      <ManagementPanel id="audit" title="Audit log" readPath="/admin/audit-logs" />
    </DashboardShell>
  );
}
