import { apiRequest } from "@/lib/api-client";

export type WorkspaceKind =
  | "SUPER_ADMIN"
  | "SCHOOL_ADMIN"
  | "TEACHER"
  | "USER"
  | "GUARDIAN";

export interface WorkspaceSummary {
  kind: WorkspaceKind;
  label: string;
  href: string;
  organizationIds: string[];
}

export interface AccessContext {
  defaultWorkspace: WorkspaceKind;
  defaultHref: string;
  workspaces: WorkspaceSummary[];
  memberships: Array<{
    organizationId: string;
    role: "SCHOOL_ADMIN" | "TEACHER" | "STUDENT";
    status: string;
  }>;
  guardianLinks: Array<{
    id: string;
    studentId: string;
    guardianId: string;
    status: string;
  }>;
}

export function getAccessContext() {
  return apiRequest<AccessContext>("/users/me/access-context");
}

export function hasWorkspace(
  context: AccessContext | undefined,
  workspace: WorkspaceKind,
) {
  return Boolean(
    context?.workspaces.some((entry) => entry.kind === workspace),
  );
}
