"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Brain,
  ClipboardCheck,
  Compass,
  CreditCard,
  FileText,
  Languages,
  LayoutDashboard,
  PlayCircle,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AssessmentLanguageToggle } from "@/components/assessment/language-toggle";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StudentAssignments } from "@/components/student-assignments";
import type { QuestionnaireLanguage } from "@/config/questionnaire.constants";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import styles from "@/styles/student-experience.module.css";

interface Assessment {
  _id: string;
  name: string;
  description: string;
  type: string;
}

interface Attempt {
  context: "PERSONAL" | "SCHOOL";
  _id: string;
  assessmentId: string;
  status: string;
  progress: number;
}

const ASSESSMENT_COPY = {
  INTEREST: {
    en: {
      name: "Interest Assessment",
      description:
        "A 60-question assessment that helps you understand the activities and work styles you naturally enjoy.",
    },
    hi: {
      name: "रुचि आकलन",
      description:
        "60 प्रश्नों का आकलन जो यह समझने में मदद करता है कि आपको स्वाभाविक रूप से कौन-सी गतिविधियाँ और काम करने के तरीके पसंद हैं।",
    },
  },
  PERSONALITY: {
    en: {
      name: "Personality Assessment",
      description:
        "A 50-question assessment that helps you understand how you typically interact, organize yourself, think and respond to situations.",
    },
    hi: {
      name: "व्यक्तित्व आकलन",
      description:
        "50 प्रश्नों का आकलन जो यह समझने में मदद करता है कि आप आमतौर पर लोगों से कैसे जुड़ते हैं, काम को कैसे व्यवस्थित करते हैं, सोचते हैं और परिस्थितियों पर प्रतिक्रिया देते हैं।",
    },
  },
} as const;

function isObsoleteInterestPilot(assessment: Assessment) {
  if (assessment.type !== "INTEREST") return false;

  const sourceText =
    `${assessment.name} ${assessment.description}`.toLowerCase();

  return (
    sourceText.includes("(pilot)") ||
    sourceText.includes(" pilot ") ||
    sourceText.startsWith("pilot ") ||
    sourceText.endsWith(" pilot") ||
    sourceText.includes("pilot validates") ||
    sourceText.includes("development/pilot")
  );
}

function frontendAssessmentCopy(
  assessment: Assessment,
  language: QuestionnaireLanguage,
) {
  if (
    assessment.type === "INTEREST" ||
    assessment.type === "PERSONALITY"
  ) {
    return ASSESSMENT_COPY[assessment.type][language];
  }

  return {
    name: assessment.name,
    description: assessment.description,
  };
}

const navItems = [
  {
    label: "Overview",
    href: "/student/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Assessments",
    href: "/assessments",
    icon: ClipboardCheck,
  },
  { label: "Results", href: "/results", icon: FileText },
  { label: "Career Library", href: "/careers", icon: Compass },
  {
    label: "Access & Payments",
    href: "/payments",
    icon: CreditCard,
  },
  { label: "Profile", href: "/student/profile", icon: UserRound },
] as const;

export default function AssessmentsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [language, setLanguage] =
    useState<QuestionnaireLanguage>("en");

  useEffect(() => {
    if (user?.preferredLanguage === "hi") {
      setLanguage("hi");
    } else if (user?.preferredLanguage === "en") {
      setLanguage("en");
    }
  }, [user?.preferredLanguage]);

  const assessments = useQuery({
    queryKey: ["assessments", user?.id],
    queryFn: () => apiRequest<Assessment[]>("/assessments"),
    enabled: Boolean(user),
  });

  const attempts = useQuery({
    queryKey: ["attempts", user?.id],
    queryFn: () => apiRequest<Attempt[]>("/attempts"),
    enabled: Boolean(user),
  });

  const visibleAssessments = useMemo(
    () =>
      (assessments.data ?? []).filter(
        (assessment) => !isObsoleteInterestPilot(assessment),
      ),
    [assessments.data],
  );

  const start = useMutation({
    mutationFn: ({
      id,
      selectedLanguage,
    }: {
      id: string;
      selectedLanguage: QuestionnaireLanguage;
    }) =>
      apiRequest<Attempt>(`/assessments/${id}/start`, {
        method: "POST",
        body: JSON.stringify({
          context: "PERSONAL",
          language: selectedLanguage,
        }),
      }),
    onSuccess: (attempt) =>
      router.push(`/assessment/${attempt._id}`),
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
              <p>
                Start a new assessment or continue one already in
                progress.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Languages
                size={16}
                color="var(--ff-teal-700)"
              />

              <AssessmentLanguageToggle
                value={language}
                onChange={setLanguage}
                disabled={start.isPending}
                label="Question language"
              />
            </div>
          </header>

          <div className={styles.sectionBody}>
            {(assessments.error ||
              attempts.error ||
              start.error) && (
              <p className={styles.error} role="alert">
                {
                  (
                    assessments.error ??
                    attempts.error ??
                    start.error
                  )?.message
                }
              </p>
            )}

            {assessments.isLoading ? (
              <p className={styles.notice}>
                Loading available assessments…
              </p>
            ) : visibleAssessments.length === 0 ? (
              <div className={styles.empty}>
                <strong>
                  No assessments are published yet
                </strong>
                <p>Please check again later.</p>
              </div>
            ) : (
              <div className={styles.assessmentGrid}>
                {visibleAssessments.map(
                  (assessment, index) => {
                    const ongoing = attempts.data?.find(
                      (attempt) =>
                        attempt.assessmentId ===
                          assessment._id &&
                        attempt.context === "PERSONAL" &&
                        attempt.status === "IN_PROGRESS",
                    );

                    const progress = Math.max(
                      0,
                      Math.min(
                        100,
                        ongoing?.progress ?? 0,
                      ),
                    );

                    const displayAssessment =
                      frontendAssessmentCopy(
                        assessment,
                        language,
                      );

                    return (
                      <article
                        className={styles.assessmentCard}
                        key={assessment._id}
                      >
                        <div>
                          <span className={styles.cardIcon}>
                            {assessment.type === "INTEREST" ? (
                              <Compass />
                            ) : assessment.type === "PERSONALITY" ? (
                              <Brain />
                            ) : index % 2 === 0 ? (
                              <ClipboardCheck />
                            ) : (
                              <PlayCircle />
                            )}
                          </span>

                          <h3>{displayAssessment.name}</h3>
                          <p>
                            {displayAssessment.description}
                          </p>
                        </div>

                        <div className={styles.cardFooter}>
                          {ongoing ? (
                            <>
                              <div
                                className={
                                  styles.progressMeta
                                }
                              >
                                <span>In progress</span>
                                <strong>{progress}%</strong>
                              </div>

                              <div
                                className={
                                  styles.progressTrack
                                }
                              >
                                <span
                                  style={{
                                    width: `${progress}%`,
                                  }}
                                />
                              </div>

                              <Link
                                href={`/assessment/${ongoing._id}`}
                                className={
                                  styles.primaryButton
                                }
                              >
                                Resume assessment
                                <ArrowRight size={15} />
                              </Link>
                            </>
                          ) : (
                            <button
                              type="button"
                              className={
                                styles.primaryButton
                              }
                              disabled={start.isPending}
                              onClick={() =>
                                start.mutate({
                                  id: assessment._id,
                                  selectedLanguage:
                                    language,
                                })
                              }
                            >
                              Start assessment
                              <ArrowRight size={15} />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
