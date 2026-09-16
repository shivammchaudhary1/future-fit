import type { ReactNode } from "react";

import { AuthGuestBoundary } from "@/components/auth/auth-guest-boundary";

import "./auth.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthGuestBoundary>{children}</AuthGuestBoundary>;
}
