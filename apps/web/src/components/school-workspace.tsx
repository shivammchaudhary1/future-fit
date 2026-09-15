"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  School,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import styles from "@/components/dashboard/dashboard.module.css";
import { SCHOOL_ACTIONS } from "@/config/management.constants";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";

import { ManagementPanel } from "./management-panel";

interface Membership {
  organizationId: string;
  role: string;
  status: string;
}

export function SchoolWorkspace({ teacher = false }: { teacher?: boolean }) {
  const user = useAuthStore((state) => state.user);
  const [selected, setSelected] = useState("");
  const [classId, setClassId] = useState("");

  const memberships = useQuery({
    queryKey: ["memberships", user?.id],
    queryFn: () => apiRequest<Membership[]>("/organizations"),
    enabled: !!user,
  });

  const allowed =
    memberships.data?.filter(
      (membership) =>
        membership.status === "ACTIVE" &&
        membership.role === (teacher ? "TEACHER" : "SCHOOL_ADMIN"),
    ) ?? [];

  const organizationId =
    allowed.find((membership) => membership.organizationId === selected)
      ?.organizationId ?? allowed[0]?.organizationId;

  const navItems = teacher
    ? [
        { label: "Overview", href: "/teacher/dashboard", icon: LayoutDashboard },
        { label: "Students", href: "#students", icon: Users },
        { label: "Completion", href: "#completion", icon: BarChart3 },
        { label: "Results", href: "#results", icon: FileText },
        { label: "Assignments", href: "#assignments", icon: ClipboardCheck },
      ]
    : [
        { label: "Overview", href: "/school/dashboard", icon: LayoutDashboard },
        { label: "Analytics", href: "#analytics", icon: BarChart3 },
        { label: "Students", href: "#students", icon: Users },
        { label: "Members", href: "#members", icon: UserPlus },
        { label: "Classes", href: "#classes", icon: GraduationCap },
        { label: "Assignments", href: "#assignments", icon: ClipboardCheck },
      ];

  if (!user) {
    return <main>Please sign in.</main>;
  }

  return (
    <DashboardShell
      roleLabel={teacher ? "Teacher Dashboard" : "School Admin Dashboard"}
      title={teacher ? "Teacher workspace" : "School overview"}
      description={
        teacher
          ? "Review assigned students, assessment completion and school-shared results."
          : "Manage your school, students, classes, assessment assignments and analytics."
      }
      navItems={navItems}
    >
      {memberships.error && (
        <p className={styles.error} role="alert">
          {memberships.error.message}
        </p>
      )}

      <section className={styles.statGrid}>
        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <School />
            </span>
          </div>
          <strong>{allowed.length}</strong>
          <span>Active school memberships</span>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <Users />
            </span>
          </div>
          <strong>{organizationId ? "Active" : "—"}</strong>
          <span>Selected organization</span>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <ClipboardCheck />
            </span>
          </div>
          <strong>{teacher ? "Staff" : "Admin"}</strong>
          <span>Current workspace access</span>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <BarChart3 />
            </span>
          </div>
          <strong>Live</strong>
          <span>Data loaded from your school APIs</span>
        </article>
      </section>

      <div className={styles.workspaceToolbar}>
        <label>
          <span>Organization</span>
          <select
            value={organizationId ?? ""}
            onChange={(event) => setSelected(event.target.value)}
          >
            {allowed.map((membership) => (
              <option
                key={membership.organizationId}
                value={membership.organizationId}
              >
                {membership.organizationId}
              </option>
            ))}
          </select>
        </label>

        {!organizationId ? (
          <p className={styles.notice}>
            No active school membership exists for this role.
          </p>
        ) : (
          <p className={styles.notice}>
            Working with organization: <strong>{organizationId}</strong>
          </p>
        )}
      </div>

      {organizationId ? (
        <>
          {!teacher && (
            <ManagementPanel
              id="analytics"
              title="School analytics"
              readPath={`/school/dashboard?organizationId=${organizationId}`}
            />
          )}

          <ManagementPanel
            id="students"
            title="My students"
            readPath={`/staff/students?organizationId=${organizationId}`}
          />

          <ManagementPanel
            id="completion"
            title="Assessment completion"
            readPath={`/staff/completion?organizationId=${organizationId}`}
          />

          <ManagementPanel
            id="results"
            title="School-assigned results"
            readPath={`/staff/results?organizationId=${organizationId}`}
          />

          {!teacher && (
            <>
              <ManagementPanel
                id="members"
                title="Memberships"
                readPath={`/organizations/${organizationId}/members`}
                actions={[
                  {
                    label: "Invite registered user",
                    path: `/organizations/${organizationId}/invitations`,
                    template: SCHOOL_ACTIONS.invitation,
                  },
                  {
                    label: "Change member status",
                    path: `/organizations/${organizationId}/member-status`,
                    template: SCHOOL_ACTIONS.memberStatus,
                  },
                ]}
              />

              <ManagementPanel
                title="Academic years"
                readPath={`/organizations/${organizationId}/academic-years`}
                actions={[
                  {
                    label: "Create academic year",
                    path: `/organizations/${organizationId}/academic-years`,
                    template: SCHOOL_ACTIONS.year,
                  },
                ]}
              />
            </>
          )}

          <ManagementPanel
            id="classes"
            title="Classes"
            readPath={`/organizations/${organizationId}/classes`}
            actions={
              teacher
                ? []
                : [
                    {
                      label: "Create class",
                      path: `/organizations/${organizationId}/classes`,
                      template: SCHOOL_ACTIONS.classroom,
                    },
                  ]
            }
          />

          {!teacher && (
            <section className={styles.workspaceToolbar}>
              <label>
                <span>Class ID for enrollment</span>
                <input
                  value={classId}
                  placeholder="Paste class ObjectId"
                  onChange={(event) => setClassId(event.target.value)}
                />
              </label>

              <p className={styles.notice}>
                Enter a valid class ID to reveal enrollment actions.
              </p>
            </section>
          )}

          {!teacher && /^[a-f\d]{24}$/i.test(classId) && (
            <ManagementPanel
              title="Class enrollment"
              readPath={`/organizations/${organizationId}/classes`}
              actions={[
                {
                  label: "Add students",
                  path: `/classes/${classId}/students`,
                  template: SCHOOL_ACTIONS.users,
                },
                {
                  label: "Assign teachers",
                  path: `/classes/${classId}/teachers`,
                  template: SCHOOL_ACTIONS.users,
                },
              ]}
            />
          )}

          <ManagementPanel
            id="assignments"
            title="Assessment assignments"
            readPath={`/organizations/${organizationId}/assessment-assignments`}
            actions={[
              {
                label: "Assign assessment",
                path: `/organizations/${organizationId}/assessment-assignments`,
                template: SCHOOL_ACTIONS.assignment,
              },
            ]}
          />
        </>
      ) : null}
    </DashboardShell>
  );
}
