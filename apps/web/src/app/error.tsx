"use client";

import { RefreshCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import styles from "@/styles/system.module.css";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <span className={styles.icon}>
          <TriangleAlert size={27} />
        </span>

        <h1>Something did not load correctly.</h1>
        <p>
          Your account data has not been changed by this screen error. Try the
          request again, or return to your assigned Future Fit workspace.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={reset}>
            <RefreshCcw size={15} />
            Try again
          </button>

          <Link href="/workspace" className={styles.secondary}>
            My workspace
          </Link>
        </div>
      </section>
    </main>
  );
}
