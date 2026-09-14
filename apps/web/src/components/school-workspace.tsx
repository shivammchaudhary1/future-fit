"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { ManagementPanel } from "./management-panel";
import { SCHOOL_ACTIONS } from "@/config/management.constants";
interface Membership {
  organizationId: string;
  role: string;
  status: string;
}
export function SchoolWorkspace({ teacher = false }: { teacher?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const [selected, setSelected] = useState("");
  const [classId, setClassId] = useState("");
  const memberships = useQuery({
    queryKey: ["memberships", user?.id],
    queryFn: () => apiRequest<Membership[]>("/organizations"),
    enabled: !!user,
  });
  const allowed =
    memberships.data?.filter(
      (m) =>
        m.status === "ACTIVE" &&
        m.role === (teacher ? "TEACHER" : "SCHOOL_ADMIN"),
    ) ?? [];
  const org =
    allowed.find((m) => m.organizationId === selected)?.organizationId ??
    allowed[0]?.organizationId;
  if (!user) return <main>Please sign in.</main>;
  return (
    <main className="student-dashboard">
      <h1>{teacher ? "Teacher workspace" : "School workspace"}</h1>
      {memberships.error && <p role="alert">{memberships.error.message}</p>}
      <label>
        Organization{" "}
        <select value={org ?? ""} onChange={(e) => setSelected(e.target.value)}>
          {allowed.map((m) => (
            <option key={m.organizationId}>{m.organizationId}</option>
          ))}
        </select>
      </label>
      {!org ? (
        <p>No active school membership for this role.</p>
      ) : (
        <>
          {!teacher && (
            <ManagementPanel
              title="School analytics"
              readPath={`/school/dashboard?organizationId=${org}`}
            />
          )}
          <ManagementPanel
            title="My students"
            readPath={`/staff/students?organizationId=${org}`}
          />
          <ManagementPanel
            title="Completion"
            readPath={`/staff/completion?organizationId=${org}`}
          />
          <ManagementPanel
            title="School-assigned results"
            readPath={`/staff/results?organizationId=${org}`}
          />
          {!teacher && (
            <>
              <ManagementPanel
                title="Memberships"
                readPath={`/organizations/${org}/members`}
                actions={[
                  {
                    label: "Invite registered user",
                    path: `/organizations/${org}/invitations`,
                    template: SCHOOL_ACTIONS.invitation,
                  },
                  {
                    label: "Change member status",
                    path: `/organizations/${org}/member-status`,
                    template: SCHOOL_ACTIONS.memberStatus,
                  },
                ]}
              />
              <ManagementPanel
                title="Academic years"
                readPath={`/organizations/${org}/academic-years`}
                actions={[
                  {
                    label: "Create academic year",
                    path: `/organizations/${org}/academic-years`,
                    template: SCHOOL_ACTIONS.year,
                  },
                ]}
              />
            </>
          )}
          <ManagementPanel
            title="Classes"
            readPath={`/organizations/${org}/classes`}
            actions={
              teacher
                ? []
                : [
                    {
                      label: "Create class",
                      path: `/organizations/${org}/classes`,
                      template: SCHOOL_ACTIONS.classroom,
                    },
                  ]
            }
          />
          {!teacher && (
            <>
              <label>
                Class ID for enrollment{" "}
                <input
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                />
              </label>
              {/^[a-f\d]{24}$/i.test(classId) && (
                <ManagementPanel
                  title="Class enrollment"
                  readPath={`/organizations/${org}/classes`}
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
            </>
          )}
          <ManagementPanel
            title="Assessment assignments"
            readPath={`/organizations/${org}/assessment-assignments`}
            actions={[
              {
                label: "Assign assessment",
                path: `/organizations/${org}/assessment-assignments`,
                template: SCHOOL_ACTIONS.assignment,
              },
            ]}
          />
        </>
      )}
    </main>
  );
}
