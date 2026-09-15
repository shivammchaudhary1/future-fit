import type { ReactNode } from "react";

import { WorkspaceBoundary } from "@/components/auth/workspace-boundary";

export default function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WorkspaceBoundary workspace="TEACHER">
      {children}
    </WorkspaceBoundary>
  );
}
