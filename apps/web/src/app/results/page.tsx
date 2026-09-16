"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Brain,
  ClipboardCheck,
  Compass,
  CreditCard,
  FileText,
  LayoutDashboard,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  INTEREST_RESULT_COPY,
  isCurrentInterestResult,
  normalizedInterestScores,
} from "@/config/interest-result.constants";
import {
  isPersonalityResult,
  normalizedPersonalityScores,
  PERSONALITY_RESULT_COPY,
} from "@/config/personality-result.constants";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";

import resultStyles from "@/styles/interest-result.module.css";
import styles from "@/styles/student-experience.module.css";

interface Result {
  _id: string;
  reportStatus?: string;
  resultStatus?: string;
  dimensions?: Record<string, number>;
  normalizedDimensions?: Record<string, number>;
  scoringVersion?: string;
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

const PAGE_COPY = {
  en: {
    title: "Your results",
    description:
      "Review your completed Future Fit assessments and normalized profiles.",
    empty: "No current assessment results yet",
    emptyDescription:
      "Complete an assessment and your scored result will appear here.",
    go: "Go to assessments",
    complete: "Scoring complete",
  },
  hi: {
    title: "आपके परिणाम",
    description:
      "अपने पूरे किए गए Future Fit आकलनों और सामान्यीकृत प्रोफ़ाइल देखें।",
    empty: "अभी कोई वर्तमान आकलन परिणाम नहीं है",
    emptyDescription:
      "कोई आकलन पूरा करें। स्कोरिंग के बाद उसका परिणाम यहाँ दिखाई देगा।",
    go: "आकलनों पर जाएँ",
    complete: "स्कोरिंग पूरी",
  },
} as const;

export default function ResultsPage() {
  const user = useAuthStore((state) => state.user);
  const language = user?.preferredLanguage === "hi" ? "hi" : "en";
  const pageCopy = PAGE_COPY[language];

  const results = useQuery({
    queryKey: ["results", user?.id],
    queryFn: () => apiRequest<Result[]>("/results"),
    enabled: Boolean(user),
    refetchInterval: 12_000,
  });

  const currentResults = useMemo(
    () =>
      (results.data ?? []).filter(
        (result) =>
          isCurrentInterestResult(result) ||
          isPersonalityResult(result),
      ),
    [results.data],
  );

  return (
    <DashboardShell
      roleLabel="Student Dashboard"
      title={pageCopy.title}
      description={pageCopy.description}
      navItems={[...navItems]}
    >
      <div className={styles.pageStack}>
        {results.error ? (
          <p className={styles.error} role="alert">
            {results.error.message}
          </p>
        ) : null}

        {results.isLoading ? (
          <p className={styles.notice}>
            Loading your assessment results…
          </p>
        ) : currentResults.length === 0 ? (
          <div className={styles.empty}>
            <strong>{pageCopy.empty}</strong>
            <p>{pageCopy.emptyDescription}</p>

            <Link
              href="/assessments"
              className={styles.primaryButton}
            >
              {pageCopy.go}
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className={resultStyles.resultList}>
            {currentResults.map((result) => {
              const personality =
                isPersonalityResult(result);
              const copy = personality
                ? PERSONALITY_RESULT_COPY[language]
                : INTEREST_RESULT_COPY[language];
              const scores = personality
                ? normalizedPersonalityScores(result)
                : normalizedInterestScores(result);
              const Icon = personality ? Brain : Sparkles;

              return (
                <article
                  className={resultStyles.resultOverviewCard}
                  key={result._id}
                >
                  <div className={resultStyles.cardHeader}>
                    <div className={resultStyles.cardTitleWrap}>
                      <span className={resultStyles.resultIcon}>
                        <Icon size={20} />
                      </span>

                      <div>
                        <span className={resultStyles.eyebrow}>
                          {copy.ready}
                        </span>
                        <h2>{copy.assessmentName}</h2>
                      </div>
                    </div>

                    <span className={resultStyles.readyBadge}>
                      {pageCopy.complete}
                    </span>
                  </div>

                  <div className={resultStyles.miniScoreGrid}>
                    {scores.map((item) => {
                      const text = item[language];

                      return (
                        <div
                          className={resultStyles.miniScore}
                          key={item.key}
                        >
                          <div
                            className={resultStyles.miniScoreTop}
                          >
                            <strong>{text.name}</strong>
                            <span>
                              {Math.round(item.normalized)}%
                            </span>
                          </div>

                          <div
                            className={resultStyles.miniTrack}
                          >
                            <span
                              style={{
                                width: `${item.normalized}%`,
                              }}
                            />
                          </div>

                          <small>
                            {copy.score}:{" "}
                            {item.normalized.toFixed(
                              Number.isInteger(
                                item.normalized,
                              )
                                ? 0
                                : 2,
                            )}{" "}
                            / 100
                          </small>
                        </div>
                      );
                    })}
                  </div>

                  <Link
                    href={`/results/${result._id}`}
                    className={styles.primaryButton}
                  >
                    {copy.view}
                    <ArrowRight size={15} />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
