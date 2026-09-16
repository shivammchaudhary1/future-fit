"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { getAccessContext } from "@/lib/access-context";
import { useAuthStore } from "@/stores/auth.store";

import styles from "./auth-guest-boundary.module.css";

export function AuthGuestBoundary({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);

  const access = useQuery({
    queryKey: ["auth-guest-redirect", user?.id],
    queryFn: getAccessContext,
    enabled: initialized && Boolean(user),
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    if (!initialized || !user) return;

    if (access.data?.defaultHref) {
      router.replace(access.data.defaultHref);
      return;
    }

    if (access.isError) {
      // Authentication pages must not remain visible to an authenticated user.
      // "/" is a safe fallback when workspace resolution is temporarily unavailable.
      router.replace("/");
    }
  }, [
    access.data?.defaultHref,
    access.isError,
    initialized,
    router,
    user,
  ]);

  if (!initialized) {
    return (
      <main className={styles.page}>
        <span className={styles.loader} />
        <strong>Checking your session…</strong>
      </main>
    );
  }

  if (user) {
    return (
      <main className={styles.page}>
        <span className={styles.loader} />
        <strong>Opening your Future Fit workspace…</strong>
        <span>You are already signed in.</span>
      </main>
    );
  }

  return children;
}
