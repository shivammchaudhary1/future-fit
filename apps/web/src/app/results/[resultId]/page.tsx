"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ClipboardCheck,
  Compass,
  CreditCard,
  Download,
  FileText,
  LayoutDashboard,
  Sparkles,
  UserRound,
} from "lucide-react";
import { use, useMemo, useState } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GuidanceNotes } from "@/components/guidance-notes";
import { ResultSharing } from "@/components/result-sharing";
import { AI_RESULT_LABELS } from "@/config/result.constants";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import styles from "@/styles/student-experience.module.css";

interface Result {
  userId: string;
  reportStatus: string;
  dimensions: Record<string, number>;
  careerMatches: Array<{ code?: string; title?: string }>;
  aiInterpretation?: {
    summary?: string;
    actionPlan?: string[];
    strengths?: string[];
    growthAreas?: string[];
    limitations?: string[];
    evidence?: Array<{ dimension: string; value: number }>;
    careerExplanations?: Array<{
      careerCode: string;
      explanation: string;
    }>;
  };
  aiProvenance?: { promptVersion: string; model: string };
}

const navItems = [
  { label: "Overview", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck },
  { label: "Results", href: "/results", icon: FileText },
  { label: "Career Library", href: "/careers", icon: Compass },
  { label: "Access & Payments", href: "/payments", icon: CreditCard },
  { label: "Profile", href: "/student/profile", icon: UserRound },
] as const;

export default function ResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = use(params);
  const user = useAuthStore((state) => state.user);
  const labels = AI_RESULT_LABELS[user?.preferredLanguage ?? "en"];
  const [error, setError] = useState("");

  const result = useQuery({
    queryKey: ["result", user?.id, resultId],
    queryFn: () => apiRequest<Result>(`/results/${resultId}`),
    enabled: !!user,
  });

  const maxDimension = useMemo(() => {
    if (!result.data) return 1;
    return Math.max(1, ...Object.values(result.data.dimensions));
  }, [result.data]);

  async function download() {
    try {
      const report = await apiRequest<{ url: string }>(
        `/results/${resultId}/report`,
      );
      window.location.assign(report.url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Download failed");
    }
  }

  return (
    <DashboardShell
      roleLabel="Student Dashboard"
      title="Assessment report"
      description="Use this result as a starting point for exploration, discussion and planning."
      navItems={[...navItems]}
    >
      {!result.data && !result.error ? (
        <p className={styles.notice}>Preparing your report…</p>
      ) : null}

      {(error || result.error) && (
        <p className={styles.error} role="alert">
          {error || result.error?.message}
        </p>
      )}

      {result.data ? (
        <div className={styles.pageStack}>
          <section className={styles.reportHero}>
            <div className={styles.reportSummary}>
              <span>Future Fit report</span>
              <h2>Your assessment insights</h2>
              <p>
                {result.data.aiInterpretation?.summary ??
                  "Your scoring is complete. Review your profile dimensions, career matches and next steps below."}
              </p>
            </div>

            <aside className={styles.reportActions}>
              <span className={styles.statusBadge}>
                {result.data.reportStatus}
              </span>

              <button
                type="button"
                className={styles.primaryButton}
                disabled={result.data.reportStatus !== "READY"}
                onClick={() => void download()}
              >
                <Download size={15} />
                Download PDF report
              </button>

              <span className={styles.provenance}>
                PDF download becomes available when the report status is READY.
              </span>
            </aside>
          </section>

          <section className={styles.reportCard}>
            <header className={styles.reportHeader}>
              <div>
                <h2>Your profile dimensions</h2>
                <p>Relative scores produced by the assessment scoring engine.</p>
              </div>
            </header>

            <div className={styles.reportBody}>
              <div className={styles.dimensionGrid}>
                {Object.entries(result.data.dimensions).map(([name, score]) => (
                  <article className={styles.dimensionCard} key={name}>
                    <div className={styles.dimensionTop}>
                      <strong>{name}</strong>
                      <span>{score}</span>
                    </div>

                    <div className={styles.dimensionBar}>
                      <span
                        style={{
                          width: `${Math.max(
                            4,
                            Math.min(100, (score / maxDimension) * 100),
                          )}%`,
                        }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          {(["strengths", "growthAreas", "limitations"] as const).some(
            (key) => result.data?.aiInterpretation?.[key]?.length,
          ) ? (
            <section className={styles.insightGrid}>
              {(["strengths", "growthAreas", "limitations"] as const).map(
                (key) =>
                  result.data?.aiInterpretation?.[key]?.length ? (
                    <article className={styles.insightCard} key={key}>
                      <h3>{labels[key]}</h3>
                      <ul>
                        {result.data.aiInterpretation[key]?.map((line, index) => (
                          <li key={`${key}-${index}`}>{line}</li>
                        ))}
                      </ul>
                    </article>
                  ) : null,
              )}
            </section>
          ) : null}

          <section className={styles.reportCard}>
            <header className={styles.reportHeader}>
              <div>
                <h2>Career matches</h2>
                <p>Career directions suggested by your profile.</p>
              </div>
              <Sparkles size={19} />
            </header>

            <div className={styles.reportBody}>
              {result.data.careerMatches.length ? (
                <div className={styles.careerMatchList}>
                  {result.data.careerMatches.map((career, index) => (
                    <div
                      className={styles.careerMatch}
                      key={career.code ?? `${index}`}
                    >
                      <span className={styles.careerRank}>{index + 1}</span>
                      <strong>{career.title ?? career.code}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>
                  <strong>No career matches available yet</strong>
                </div>
              )}

              {result.data.aiInterpretation?.careerExplanations?.length ? (
                <div className={styles.pageStack}>
                  {result.data.aiInterpretation.careerExplanations.map(
                    (career) => (
                      <article className={styles.dimensionCard} key={career.careerCode}>
                        <div className={styles.dimensionTop}>
                          <strong>{career.careerCode}</strong>
                        </div>
                        <p>{career.explanation}</p>
                      </article>
                    ),
                  )}
                </div>
              ) : null}
            </div>
          </section>

          {result.data.aiInterpretation?.actionPlan?.length ? (
            <section className={styles.reportCard}>
              <header className={styles.reportHeader}>
                <div>
                  <h2>Suggested next steps</h2>
                  <p>Use these actions as a practical starting point.</p>
                </div>
              </header>

              <div className={styles.reportBody}>
                <ol className={styles.actionPlan}>
                  {result.data.aiInterpretation.actionPlan.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            </section>
          ) : null}

          {result.data.aiInterpretation?.evidence?.length ? (
            <details className={styles.reportCard}>
              <summary className={styles.reportHeader}>{labels.evidence}</summary>
              <div className={styles.reportBody}>
                <div className={styles.dimensionGrid}>
                  {result.data.aiInterpretation.evidence.map((item) => (
                    <article className={styles.dimensionCard} key={item.dimension}>
                      <div className={styles.dimensionTop}>
                        <strong>{item.dimension}</strong>
                        <span>{item.value}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </details>
          ) : null}

          {result.data.aiProvenance ? (
            <p className={styles.provenance}>
              {labels.version}: {result.data.aiProvenance.promptVersion} (
              {result.data.aiProvenance.model})
            </p>
          ) : null}

          {result.data.userId === user?.id ? (
            <ResultSharing key={resultId} resultId={resultId} />
          ) : null}

          <GuidanceNotes key={`notes-${resultId}`} resultId={resultId} />
        </div>
      ) : null}
    </DashboardShell>
  );
}
