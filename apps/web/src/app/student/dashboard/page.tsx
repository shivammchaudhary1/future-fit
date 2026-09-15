"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Compass,
  CreditCard,
  FileText,
  GraduationCap,
  LayoutDashboard,
  PlayCircle,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import styles from "@/components/dashboard/dashboard.module.css";
import { AUTH_LINKS } from "@/config/auth.constants";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";

interface Attempt {
  _id: string;
  assessmentId: string;
  context: "PERSONAL" | "SCHOOL";
  status: string;
  progress: number;
}

interface Result {
  _id: string;
  reportStatus: string;
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

export default function StudentDashboard() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();

  useEffect(() => {
    if (initialized && !user) router.replace(AUTH_LINKS.login);
  }, [initialized, user, router]);

  const attempts = useQuery({
    queryKey: ["dashboard-attempts", user?.id],
    queryFn: () => apiRequest<Attempt[]>("/attempts"),
    enabled: !!user,
  });

  const results = useQuery({
    queryKey: ["dashboard-results", user?.id],
    queryFn: () => apiRequest<Result[]>("/results"),
    enabled: !!user,
  });

  if (!initialized || !user) {
    return <main className="dashboard-loading">Preparing your dashboard…</main>;
  }

  const attemptList = attempts.data ?? [];
  const resultList = results.data ?? [];
  const inProgress = attemptList.filter(
    (attempt) => attempt.status === "IN_PROGRESS",
  );
  const schoolAttempts = attemptList.filter(
    (attempt) => attempt.context === "SCHOOL",
  );
  const readyReports = resultList.filter(
    (result) =>
      result.reportStatus === "READY" ||
      result.reportStatus === "RESULT_READY",
  );

  return (
    <DashboardShell
      roleLabel="Student Dashboard"
      title={`Welcome, ${user.firstName}!`}
      description="Discover your strengths, continue assessments and keep your next steps in one place."
      navItems={[...navItems]}
      accent={
        <Link href="/assessments" className={styles.primaryAction}>
          Start an assessment
          <ArrowRight size={16} />
        </Link>
      }
    >
      {(attempts.error || results.error) && (
        <p className={styles.error} role="alert">
          {(attempts.error ?? results.error)?.message}
        </p>
      )}

      <section className={styles.statGrid} aria-label="Student overview">
        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <PlayCircle />
            </span>
          </div>
          <strong>{inProgress.length}</strong>
          <span>Assessments in progress</span>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <ClipboardCheck />
            </span>
          </div>
          <strong>{attemptList.length}</strong>
          <span>Total assessment attempts</span>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <GraduationCap />
            </span>
          </div>
          <strong>{schoolAttempts.length}</strong>
          <span>School assessment attempts</span>
        </article>

        <article className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statIcon}>
              <FileText />
            </span>
          </div>
          <strong>{readyReports.length}</strong>
          <span>Reports ready to view</span>
        </article>
      </section>

      <section className={styles.dashboardGrid}>
        <div className={styles.stack}>
          <article className={styles.card}>
            <header className={styles.cardHeader}>
              <div>
                <h2>Your assessment journey</h2>
                <p>Continue where you left off.</p>
              </div>
              <Link href="/assessments">View all assessments</Link>
            </header>

            <div className={styles.cardBody}>
              {attempts.isLoading ? (
                <p className={styles.notice}>
                  Loading your assessment progress…
                </p>
              ) : inProgress.length > 0 ? (
                <div className={styles.progressList}>
                  {inProgress.slice(0, 4).map((attempt) => {
                    const progress = Math.max(
                      0,
                      Math.min(100, attempt.progress ?? 0),
                    );

                    return (
                      <Link
                        href={`/assessment/${attempt._id}`}
                        key={attempt._id}
                        className={styles.progressItem}
                      >
                        <div className={styles.progressItemTop}>
                          <strong>
                            {attempt.context === "SCHOOL"
                              ? "School-assigned assessment"
                              : "Personal assessment"}
                          </strong>
                          <span>{progress}% complete</span>
                        </div>

                        <div className={styles.progressBar}>
                          <span style={{ width: `${progress}%` }} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <strong>No assessment currently in progress</strong>
                  <p>
                    Start an assessment when you are ready. Your answers can be
                    saved and continued later.
                  </p>
                  <Link href="/assessments" className={styles.primaryAction}>
                    Explore assessments
                    <ArrowRight size={15} />
                  </Link>
                </div>
              )}
            </div>
          </article>

          <article className={styles.card}>
            <header className={styles.cardHeader}>
              <div>
                <h2>Explore your next step</h2>
                <p>Useful places to continue your Future Fit journey.</p>
              </div>
            </header>

            <div className={styles.cardBody}>
              <div className={styles.quickGrid}>
                <Link href="/careers" className={styles.quickCard}>
                  <Compass />
                  <div>
                    <strong>Career Library</strong>
                    <span>Explore career paths and possibilities.</span>
                  </div>
                </Link>

                <Link href="/results" className={styles.quickCard}>
                  <FileText />
                  <div>
                    <strong>Your Results</strong>
                    <span>Open available assessment reports.</span>
                  </div>
                </Link>

                <Link href="/payments" className={styles.quickCard}>
                  <CreditCard />
                  <div>
                    <strong>Access & Payments</strong>
                    <span>Purchase and review paid assessment access.</span>
                  </div>
                </Link>

                <Link href="/student/profile" className={styles.quickCard}>
                  <UserRound />
                  <div>
                    <strong>Your Profile</strong>
                    <span>Keep your student profile up to date.</span>
                  </div>
                </Link>

                <Link href="/assessments" className={styles.quickCard}>
                  <BookOpen />
                  <div>
                    <strong>Assessments</strong>
                    <span>Start or continue your assessment journey.</span>
                  </div>
                </Link>
              </div>
            </div>
          </article>
        </div>

        <aside className={styles.stack}>
          <article className={styles.card}>
            <header className={styles.cardHeader}>
              <div>
                <h2>Reports</h2>
                <p>Your submitted assessment results.</p>
              </div>
              <Link href="/results">Open results</Link>
            </header>

            <div className={styles.cardBody}>
              {results.isLoading ? (
                <p className={styles.notice}>Checking your reports…</p>
              ) : resultList.length > 0 ? (
                <div className={styles.progressList}>
                  {resultList.slice(0, 4).map((result) => (
                    <Link
                      href={`/results/${result._id}`}
                      key={result._id}
                      className={styles.progressItem}
                    >
                      <div className={styles.progressItemTop}>
                        <strong>Assessment report</strong>
                        <span>{result.reportStatus}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <strong>No reports yet</strong>
                  <p>Your submitted assessment reports will appear here.</p>
                </div>
              )}
            </div>
          </article>

          <article className={styles.card}>
            <header className={styles.cardHeader}>
              <div>
                <h2>Your Future Fit reminder</h2>
                <p>Good decisions begin with understanding yourself.</p>
              </div>
            </header>

            <div className={styles.cardBody}>
              <p className={styles.notice}>
                Career guidance is a process, not a one-time answer. Use your
                assessment results as a starting point to explore, discuss and
                plan.
              </p>
            </div>
          </article>
        </aside>
      </section>
    </DashboardShell>
  );
}
