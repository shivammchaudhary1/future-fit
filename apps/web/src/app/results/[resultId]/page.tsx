"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  CreditCard,
  Download,
  FileText,
  LayoutDashboard,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GuidanceNotes } from "@/components/guidance-notes";
import { ResultSharing } from "@/components/result-sharing";
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
  _id?: string;
  userId: string;
  reportStatus?: string;
  resultStatus?: string;
  aiStatus?: string;
  dimensions?: Record<string, number>;
  normalizedDimensions?: Record<string, number>;
  scoringVersion?: string;
  careerMatches?: Array<{
    code?: string;
    title?: string;
  }>;
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

const UNKNOWN_COPY = {
  en: {
    title: "Assessment result",
    description:
      "This older result is not part of the current assessment set.",
    action: "Go to assessments",
  },
  hi: {
    title: "आकलन परिणाम",
    description:
      "यह पुराना परिणाम वर्तमान आकलन सेट का हिस्सा नहीं है।",
    action: "आकलनों पर जाएँ",
  },
} as const;

export default function ResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = use(params);
  const user = useAuthStore((state) => state.user);
  const language = user?.preferredLanguage === "hi" ? "hi" : "en";
  const [downloadError, setDownloadError] = useState("");

  const result = useQuery({
    queryKey: ["result", user?.id, resultId],
    queryFn: () =>
      apiRequest<Result>(`/results/${resultId}`),
    enabled: Boolean(user),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.resultStatus === "READY" ? false : 5_000;
    },
  });

  const personality = result.data
    ? isPersonalityResult(result.data)
    : false;
  const interest = result.data
    ? isCurrentInterestResult(result.data)
    : false;
  const supported = personality || interest;

  const copy = personality
    ? PERSONALITY_RESULT_COPY[language]
    : INTEREST_RESULT_COPY[language];

  const scores =
    result.data && personality
      ? normalizedPersonalityScores(result.data)
      : result.data && interest
        ? normalizedInterestScores(result.data)
        : [];

  const ProfileIcon = personality ? Brain : Sparkles;

  async function download() {
    setDownloadError("");

    try {
      const report = await apiRequest<{ url: string }>(
        `/results/${resultId}/report`,
      );

      window.location.assign(report.url);
    } catch (caught) {
      setDownloadError(
        caught instanceof Error
          ? caught.message
          : "Download failed",
      );
    }
  }

  return (
    <DashboardShell
      roleLabel="Student Dashboard"
      title={
        supported
          ? copy.resultsTitle
          : UNKNOWN_COPY[language].title
      }
      description={
        supported
          ? copy.resultsDescription
          : UNKNOWN_COPY[language].description
      }
      navItems={[...navItems]}
    >
      {!result.data && !result.error ? (
        <div className={resultStyles.processingCard}>
          <span className={resultStyles.processingIcon} />
          <div>
            <strong>{copy.scoring}</strong>
            <p>{copy.scoringDescription}</p>
          </div>
        </div>
      ) : null}

      {result.error ? (
        <p className={styles.error} role="alert">
          {result.error.message}
        </p>
      ) : null}

      {result.data && !supported ? (
        <section className={resultStyles.legacyCard}>
          <h2>{UNKNOWN_COPY[language].title}</h2>
          <p>{UNKNOWN_COPY[language].description}</p>

          <Link
            href="/assessments"
            className={styles.primaryButton}
          >
            {UNKNOWN_COPY[language].action}
            <ArrowRight size={15} />
          </Link>
        </section>
      ) : null}

      {result.data && supported ? (
        <div className={styles.pageStack}>
          <section className={resultStyles.hero}>
            <div>
              <span className={resultStyles.heroEyebrow}>
                {copy.complete}
              </span>

              <h1>{copy.profileTitle}</h1>
              <p>{copy.profileDescription}</p>
            </div>

            <div className={resultStyles.heroActions}>
              <span className={resultStyles.readyBadge}>
                <CheckCircle2 size={14} />
                {copy.ready}
              </span>

              {result.data.reportStatus === "READY" ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() => void download()}
                >
                  <Download size={15} />
                  {copy.pdfReady}
                </button>
              ) : null}
            </div>
          </section>

          {downloadError ? (
            <p className={styles.error} role="alert">
              {downloadError}
            </p>
          ) : null}

          <section className={resultStyles.profileSection}>
            <div className={resultStyles.sectionHeading}>
              <div>
                <h2>{copy.profileTitle}</h2>
                <p>{copy.profileDescription}</p>
              </div>
            </div>

            <div className={resultStyles.scoreGrid}>
              {scores.map((item) => {
                const text = item[language];
                const displayScore =
                  item.normalized.toFixed(
                    Number.isInteger(item.normalized)
                      ? 0
                      : 2,
                  );

                return (
                  <article
                    className={resultStyles.scoreCard}
                    key={item.key}
                  >
                    <div className={resultStyles.scoreHeader}>
                      <div>
                        <span
                          className={
                            resultStyles.dimensionMarker
                          }
                        />
                        <h3>{text.name}</h3>
                      </div>

                      <strong
                        className={resultStyles.percentage}
                      >
                        {Math.round(item.normalized)}%
                      </strong>
                    </div>

                    <p>{text.description}</p>

                    <div className={resultStyles.scoreValueRow}>
                      <div>
                        <span>{copy.score}</span>
                        <strong>
                          {displayScore}
                          <small> / 100</small>
                        </strong>
                      </div>

                      <div>
                        <span>{copy.percent}</span>
                        <strong>
                          {Math.round(item.normalized)}%
                        </strong>
                      </div>
                    </div>

                    <div className={resultStyles.scoreTrack}>
                      <span
                        style={{
                          width: `${item.normalized}%`,
                        }}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className={resultStyles.nextStepCard}>
            <span className={resultStyles.nextStepIcon}>
              <ProfileIcon size={21} />
            </span>

            <div>
              <h2>{copy.exploreNext}</h2>
              <p>{copy.exploreNextDescription}</p>
            </div>
          </section>

          {result.data.userId === user?.id ? (
            <ResultSharing
              key={resultId}
              resultId={resultId}
            />
          ) : null}

          <GuidanceNotes
            key={`notes-${resultId}`}
            resultId={resultId}
          />
        </div>
      ) : null}
    </DashboardShell>
  );
}
