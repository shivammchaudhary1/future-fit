"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ClipboardCheck,
  Compass,
  CreditCard,
  FileText,
  LayoutDashboard,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import styles from "@/styles/student-experience.module.css";

interface Result {
  _id: string;
  reportStatus: string;
  dimensions: Record<string, number>;
  scoringVersion: string;
}

const navItems = [
  { label: "Overview", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck },
  { label: "Results", href: "/results", icon: FileText },
  { label: "Career Library", href: "/careers", icon: Compass },
  { label: "Access & Payments", href: "/payments", icon: CreditCard },
  { label: "Profile", href: "/student/profile", icon: UserRound },
] as const;

export default function ResultsPage() {
  const user = useAuthStore((state) => state.user);

  const results = useQuery({
    queryKey: ["results", user?.id],
    queryFn: () => apiRequest<Result[]>("/results"),
    enabled: !!user,
    refetchInterval: 12_000,
  });

  return (
    <DashboardShell
      roleLabel="Student Dashboard"
      title="Your results"
      description="Review submitted assessments, generated reports and your latest career-guidance insights."
      navItems={[...navItems]}
    >
      <div className={styles.pageStack}>
        {results.error ? (
          <p className={styles.error} role="alert">
            {results.error.message}
          </p>
        ) : null}

        {results.isLoading ? (
          <p className={styles.notice}>Loading your assessment results…</p>
        ) : results.data?.length === 0 ? (
          <div className={styles.empty}>
            <strong>No submitted assessments yet</strong>
            <p>
              Complete an assessment first. Your result will appear here after
              scoring finishes.
            </p>
            <Link href="/assessments" className={styles.primaryButton}>
              Go to assessments
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className={styles.resultGrid}>
            {results.data?.map((result) => (
              <article className={styles.resultCard} key={result._id}>
                <div className={styles.resultCardTop}>
                  <div className={styles.resultIcon}>
                    <Sparkles />
                  </div>

                  <span className={styles.statusBadge}>{result.reportStatus}</span>
                </div>

                <div>
                  <h3>Assessment result</h3>
                  <p>Scoring version: {result.scoringVersion}</p>
                </div>

                <div className={styles.dimensionMiniGrid}>
                  {Object.entries(result.dimensions)
                    .slice(0, 6)
                    .map(([name, score]) => (
                      <div className={styles.dimensionMini} key={name}>
                        <strong>{score}</strong>
                        <span>{name}</span>
                      </div>
                    ))}
                </div>

                <Link
                  href={`/results/${result._id}`}
                  className={styles.primaryButton}
                >
                  View full result
                  <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
