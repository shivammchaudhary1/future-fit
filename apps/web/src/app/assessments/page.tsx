"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ClipboardCheck,
  Compass,
  CreditCard,
  FileText,
  LayoutDashboard,
  PlayCircle,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StudentAssignments } from "@/components/student-assignments";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import styles from "@/styles/student-experience.module.css";

interface Assessment {
  _id: string;
  name: string;
  description: string;
}

interface Attempt {
  context: "PERSONAL" | "SCHOOL";
  _id: string;
  assessmentId: string;
  status: string;
  progress: number;
}

const navItems = [
  { label: "Overview", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck },
  { label: "Results", href: "/results", icon: FileText },
  { label: "Career Library", href: "/careers", icon: Compass },
  { label: "Access & Payments", href: "/payments", icon: CreditCard },
  { label: "Profile", href: "/student/profile", icon: UserRound },
] as const;

export default function AssessmentsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const assessments = useQuery({
    queryKey: ["assessments", user?.id],
    queryFn: () => apiRequest<Assessment[]>("/assessments"),
    enabled: !!user,
  });

  const attempts = useQuery({
    queryKey: ["attempts", user?.id],
    queryFn: () => apiRequest<Attempt[]>("/attempts"),
    enabled: !!user,
  });

  const start = useMutation({
    mutationFn: (id: string) =>
      apiRequest<Attempt>(`/assessments/${id}/start`, {
        method: "POST",
        body: JSON.stringify({
          context: "PERSONAL",
          language: user?.preferredLanguage ?? "en",
        }),
      }),
    onSuccess: (attempt) => router.push(`/assessment/${attempt._id}`),
  });

  if (!user) {
    return (
      <main className={styles.loadingPage}>
        <Link href="/login">Sign in to continue</Link>
      </main>
    );
  }

  return (
    <DashboardShell
      roleLabel="Student Dashboard"
      title="Assessments"
      description="Understand your interests, personality, strengths and preferences one step at a time."
      navItems={[...navItems]}
    >
      <div className={styles.pageStack}>
        <StudentAssignments />

        <section className={styles.sectionCard}>
          <header className={styles.sectionHeader}>
            <div>
              <h2>Personal assessments</h2>
              <p>Start a new assessment or continue one already in progress.</p>
            </div>
          </header>

          <div className={styles.sectionBody}>
            {(assessments.error || attempts.error || start.error) && (
              <p className={styles.error} role="alert">
                {(assessments.error ?? attempts.error ?? start.error)?.message}
              </p>
            )}

            {assessments.isLoading ? (
              <p className={styles.notice}>Loading available assessments…</p>
            ) : assessments.data?.length === 0 ? (
              <div className={styles.empty}>
                <strong>No assessments are published yet</strong>
                <p>Please check again later.</p>
              </div>
            ) : (
              <div className={styles.assessmentGrid}>
                {assessments.data?.map((assessment, index) => {
                  const ongoing = attempts.data?.find(
                    (attempt) =>
                      attempt.assessmentId === assessment._id &&
                      attempt.context === "PERSONAL" &&
                      attempt.status === "IN_PROGRESS",
                  );

                  const progress = Math.max(
                    0,
                    Math.min(100, ongoing?.progress ?? 0),
                  );

                  return (
                    <article className={styles.assessmentCard} key={assessment._id}>
                      <div>
                        <span className={styles.cardIcon}>
                          {index % 3 === 0 ? (
                            <Compass />
                          ) : index % 3 === 1 ? (
                            <ClipboardCheck />
                          ) : (
                            <PlayCircle />
                          )}
                        </span>

                        <h3>{assessment.name}</h3>
                        <p>{assessment.description}</p>
                      </div>

                      <div className={styles.cardFooter}>
                        {ongoing ? (
                          <>
                            <div className={styles.progressMeta}>
                              <span>In progress</span>
                              <strong>{progress}%</strong>
                            </div>

                            <div className={styles.progressTrack}>
                              <span style={{ width: `${progress}%` }} />
                            </div>

                            <Link
                              href={`/assessment/${ongoing._id}`}
                              className={styles.primaryButton}
                            >
                              Resume assessment
                              <ArrowRight size={15} />
                            </Link>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={styles.primaryButton}
                            disabled={start.isPending}
                            onClick={() => start.mutate(assessment._id)}
                          >
                            Start assessment
                            <ArrowRight size={15} />
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
