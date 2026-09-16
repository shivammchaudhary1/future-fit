"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Compass,
  CreditCard,
  FileText,
  LayoutDashboard,
  PlayCircle,
  ScanSearch,
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

interface FitProfile {
  coverage: number;
  completedGroups: string[];
  sources: Array<{ assessmentType: string }>;
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

  const fit = useQuery({
    queryKey: ["student-fit-profile", user?.id],
    queryFn: () => apiRequest<FitProfile>("/students/me/fit-profile"),
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
  const readyReports = resultList.filter(
    (result) =>
      result.reportStatus === "READY" ||
      result.reportStatus === "RESULT_READY",
  );

  return (
    <DashboardShell
      roleLabel="Student Dashboard"
      title={`Welcome, ${user.firstName}!`}
      description="Complete your profile, take assessments and build your Future Fit profile step by step."
      navItems={[...navItems]}
      accent={
        <Link href="/assessments" className={styles.primaryAction}>
          Start an assessment
          <ArrowRight size={16} />
        </Link>
      }
    >
      {(attempts.error || results.error || fit.error) && (
        <p className={styles.error} role="alert">
          {(attempts.error ?? results.error ?? fit.error)?.message}
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
              <ScanSearch />
            </span>
          </div>
          <strong>{fit.data?.coverage ?? 0}%</strong>
          <span>Future Fit profile coverage</span>
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
                <p>Continue exactly where you left off.</p>
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
                          <strong>Personal assessment</strong>
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
                    Start when you are ready. Your answers can be saved and
                    continued later.
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
                <h2>Your Future Fit profile</h2>
                <p>
                  Each completed assessment adds one evidence layer to your
                  combined profile.
                </p>
              </div>
            </header>

            <div className={styles.cardBody}>
              <p className={styles.notice}>
                {fit.data?.completedGroups.length
                  ? `Completed profile groups: ${fit.data.completedGroups.join(", ")}.`
                  : "No profile group is complete yet. Start with the Interest pilot."}
              </p>
              <p className={styles.notice}>
                Career ranking will only be enabled after reviewed career
                requirement profiles are connected. We are not generating fake
                match percentages from incomplete data.
              </p>
            </div>
          </article>
        </div>

        <aside className={styles.stack}>
          <article className={styles.card}>
            <header className={styles.cardHeader}>
              <div>
                <h2>Student setup</h2>
                <p>Keep your Class, Board and education context current.</p>
              </div>
              <Link href="/student/profile">Open profile</Link>
            </header>

            <div className={styles.cardBody}>
              <div className={styles.quickGrid}>
                <Link href="/student/profile" className={styles.quickCard}>
                  <UserRound />
                  <div>
                    <strong>Your Profile</strong>
                    <span>Class, board, stream, subjects and location.</span>
                  </div>
                </Link>

                <Link href="/assessments" className={styles.quickCard}>
                  <BookOpen />
                  <div>
                    <strong>Assessments</strong>
                    <span>Start or continue your self-discovery journey.</span>
                  </div>
                </Link>

                <Link href="/results" className={styles.quickCard}>
                  <FileText />
                  <div>
                    <strong>Your Results</strong>
                    <span>Review completed assessment reports.</span>
                  </div>
                </Link>

                <Link href="/careers" className={styles.quickCard}>
                  <Compass />
                  <div>
                    <strong>Career Library</strong>
                    <span>Explore careers while the matching model matures.</span>
                  </div>
                </Link>
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <header className={styles.cardHeader}>
              <div>
                <h2>Important</h2>
                <p>Assessment scores are guidance inputs, not a verdict.</p>
              </div>
            </header>

            <div className={styles.cardBody}>
              <p className={styles.notice}>
                Future Fit separates psychological/profile alignment from
                academic eligibility and education pathways. A score should not
                be presented as a probability of career success.
              </p>
            </div>
          </article>
        </aside>
      </section>
    </DashboardShell>
  );
}
