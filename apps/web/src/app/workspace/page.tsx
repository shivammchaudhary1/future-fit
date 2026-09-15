"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AUTH_LINKS } from "@/config/auth.constants";
import { getAccessContext } from "@/lib/access-context";
import { useAuthStore } from "@/stores/auth.store";

import styles from "@/components/auth/workspace-boundary.module.css";

export default function WorkspaceResolverPage() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();

  const access = useQuery({
    queryKey: ["access-context", user?.id],
    queryFn: getAccessContext,
    enabled: initialized && Boolean(user),
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    if (!initialized) return;

    if (!user) {
      router.replace(AUTH_LINKS.login);
      return;
    }

    if (access.data) {
      router.replace(access.data.defaultHref);
    }
  }, [access.data, initialized, router, user]);

  return (
    <main className={styles.page}>
      <div className={styles.loader} />
      <strong>Opening your workspace…</strong>
      <span>
        Future Fit is checking whether this account is a platform admin, school
        admin, teacher, student/user or guardian.
      </span>

      {access.error ? (
        <>
          <span>{access.error.message}</span>
          <button type="button" onClick={() => void access.refetch()}>
            Try again
          </button>
        </>
      ) : null}
    </main>
  );
}
