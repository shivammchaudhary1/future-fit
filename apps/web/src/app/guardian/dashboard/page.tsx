"use client";

import {
  FileText,
  LayoutDashboard,
  Link2,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { useState } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import styles from "@/components/dashboard/dashboard.module.css";
import { ManagementPanel } from "@/components/management-panel";

const navItems = [
  { label: "Overview", href: "/guardian/dashboard", icon: LayoutDashboard },
  { label: "Consent", href: "#consent", icon: ShieldCheck },
  { label: "Relationships", href: "#relationships", icon: Link2 },
  { label: "Shared Reports", href: "#shared-reports", icon: FileText },
] as const;

export default function GuardianDashboard() {
  const [requestId, setRequestId] = useState("");

  return (
    <DashboardShell
      roleLabel="Guardian Dashboard"
      title="Guardian workspace"
      description="Review consent, manage student relationships and open reports that have been explicitly shared with you."
      navItems={[...navItems]}
    >
      <section className={styles.statGrid}>
        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <ShieldCheck />
            </span>
          </div>
          <strong>Consent</strong>
          <span>Review the current policy</span>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <UserRoundCheck />
            </span>
          </div>
          <strong>Private</strong>
          <span>Student information stays access-controlled</span>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <Link2 />
            </span>
          </div>
          <strong>Linked</strong>
          <span>Manage approved relationships</span>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <FileText />
            </span>
          </div>
          <strong>Shared</strong>
          <span>Only reports shared with you appear here</span>
        </article>
      </section>

      <ManagementPanel
        id="consent"
        title="Current consent policy"
        readPath="/guardians/consent-policy"
      />

      <ManagementPanel
        id="relationships"
        title="Relationship requests"
        readPath="/guardians"
      />

      <section className={styles.workspaceToolbar}>
        <label>
          <span>Relationship request ID</span>
          <input
            value={requestId}
            placeholder="Paste request ObjectId"
            onChange={(event) => setRequestId(event.target.value)}
          />
        </label>

        <p className={styles.notice}>
          Enter a valid request ID to reveal consent or revocation actions.
        </p>
      </section>

      {/^[a-f\d]{24}$/i.test(requestId) && (
        <ManagementPanel
          title="Consent action"
          readPath="/guardians"
          actions={[
            {
              label: "Accept current consent policy",
              path: `/guardians/${requestId}/consent`,
              template: { accepted: true },
            },
            {
              label: "Revoke relationship",
              path: `/guardians/${requestId}/revoke`,
              template: {},
            },
          ]}
        />
      )}

      <ManagementPanel
        id="shared-reports"
        title="Reports explicitly shared with you"
        readPath="/results/shared"
      />
    </DashboardShell>
  );
}
