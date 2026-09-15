"use client";

import type { AuthUser } from "@future-fit/types";
import {
  Bell,
  ClipboardCheck,
  Compass,
  FileText,
  Globe2,
  LayoutDashboard,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ManagementPanel } from "@/components/management-panel";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import styles from "@/styles/student-experience.module.css";

const navItems = [
  { label: "Overview", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck },
  { label: "Results", href: "/results", icon: FileText },
  { label: "Career Library", href: "/careers", icon: Compass },
  { label: "Profile", href: "/student/profile", icon: UserRound },
] as const;

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function language(preferredLanguage: string) {
    setSaving(true);
    setError("");

    try {
      const updated = await apiRequest<AuthUser>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ preferredLanguage }),
      });

      setAuth({ user: updated });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Profile update failed",
      );
    } finally {
      setSaving(false);
    }
  }

  const initials = `${user?.firstName?.[0] ?? ""}${
    user?.lastName?.[0] ?? ""
  }`.toUpperCase();

  return (
    <DashboardShell
      roleLabel="Student Dashboard"
      title="Profile & settings"
      description="Manage your language, relationships, sessions and notifications."
      navItems={[...navItems]}
    >
      <div className={styles.pageStack}>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <section className={styles.profileGrid}>
          <article className={styles.identityCard}>
            <div className={styles.identityAvatar}>{initials || "FF"}</div>
            <h2>
              {user ? `${user.firstName} ${user.lastName}`.trim() : "Future Fit"}
            </h2>
            <p>{user?.email}</p>

            <div className={styles.identityMeta}>
              <span>
                <Mail size={14} />
                {user?.email}
              </span>
              <span>
                <Globe2 size={14} />
                {user?.preferredLanguage === "hi" ? "हिन्दी" : "English"}
              </span>
              <span>
                <ShieldCheck size={14} />
                Authenticated account
              </span>
            </div>
          </article>

          <article className={styles.settingsCard}>
            <h2>Language preference</h2>
            <p>
              Choose the language Future Fit should prefer for supported
              assessment and guidance content.
            </p>

            <label className={styles.field}>
              <span>Language</span>
              <select
                value={user?.preferredLanguage ?? "en"}
                disabled={saving}
                onChange={(event) => void language(event.target.value)}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
              </select>
            </label>

            {saving ? (
              <p className={styles.notice}>Saving your preference…</p>
            ) : null}
          </article>
        </section>

        <ManagementPanel
          title="Guardian relationships"
          readPath="/guardians"
          actions={[
            {
              label: "Request guardian relationship",
              path: "/guardians/requests",
              template: { guardianId: "" },
            },
          ]}
        />

        <ManagementPanel title="Active sessions" readPath="/auth/sessions" />

        <ManagementPanel title="Notifications" readPath="/notifications" />

        <p className={styles.notice}>
          <Bell size={14} /> Notification and session data shown here is loaded
          from your authenticated account.
        </p>
      </div>
    </DashboardShell>
  );
}
