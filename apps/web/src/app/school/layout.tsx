import type { ReactNode } from "react";

import { WorkspaceBoundary } from "@/components/auth/workspace-boundary";

export default function SchoolLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WorkspaceBoundary workspace="SCHOOL_ADMIN">
      {children}
    </WorkspaceBoundary>
  );
}
