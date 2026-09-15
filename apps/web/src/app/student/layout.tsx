import type { ReactNode } from "react";

import { WorkspaceBoundary } from "@/components/auth/workspace-boundary";

export default function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WorkspaceBoundary workspace="USER">
      {children}
    </WorkspaceBoundary>
  );
}
