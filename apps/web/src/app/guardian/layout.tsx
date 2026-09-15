import type { ReactNode } from "react";

import { WorkspaceBoundary } from "@/components/auth/workspace-boundary";

export default function GuardianLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <WorkspaceBoundary workspace="GUARDIAN">
      {children}
    </WorkspaceBoundary>
  );
}
