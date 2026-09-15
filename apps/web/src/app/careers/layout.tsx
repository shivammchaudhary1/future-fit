import type { ReactNode } from "react";

import { WorkspaceBoundary } from "@/components/auth/workspace-boundary";

export default function CareersLayout({
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
