"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { AUTH_LINKS } from "@/config/auth.constants";
import {
  getAccessContext,
  hasWorkspace,
  type WorkspaceKind,
} from "@/lib/access-context";
import { useAuthStore } from "@/stores/auth.store";

import styles from "./workspace-boundary.module.css";

export function WorkspaceBoundary({
  workspace,
  children,
}: {
  workspace: WorkspaceKind;
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, initialized } = useAuthStore();

  const access = useQuery({
    queryKey: ["access-context", user?.id],
    queryFn: getAccessContext,
    enabled: initialized && Boolean(user),
    staleTime: 30_000,
    retry: 1,
  });

  const allowed = hasWorkspace(access.data, workspace);

  useEffect(() => {
    if (!initialized) return;

    if (!user) {
      router.replace(AUTH_LINKS.login);
      return;
    }

    if (access.data && !allowed) {
      router.replace(access.data.defaultHref);
    }
  }, [access.data, allowed, initialized, router, user]);

  if (!initialized || !user || access.isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.loader} />
        <strong>Checking your Future Fit workspace…</strong>
        <span>We are opening the dashboard assigned to this account.</span>
      </main>
    );
  }

  if (access.error) {
    return (
      <main className={styles.page}>
        <ShieldAlert size={30} />
        <strong>We could not verify this workspace.</strong>
        <span>{access.error.message}</span>
        <button type="button" onClick={() => void access.refetch()}>
          Try again
        </button>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className={styles.page}>
        <div className={styles.loader} />
        <strong>Opening your correct dashboard…</strong>
      </main>
    );
  }

  return children;
}
