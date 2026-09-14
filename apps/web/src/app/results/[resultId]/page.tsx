"use client";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { ResultSharing } from "@/components/result-sharing";
import { GuidanceNotes } from "@/components/guidance-notes";
import { AI_RESULT_LABELS } from "@/config/result.constants";
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
    careerExplanations?: Array<{ careerCode: string; explanation: string }>;
  };
  aiProvenance?: { promptVersion: string; model: string };
}
export default function ResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = use(params);
  const user = useAuthStore((s) => s.user);
  const labels = AI_RESULT_LABELS[user?.preferredLanguage ?? "en"];
  const [error, setError] = useState("");
  const result = useQuery({
    queryKey: ["result", user?.id, resultId],
    queryFn: () => apiRequest<Result>(`/results/${resultId}`),
    enabled: !!user,
  });
  async function download() {
    try {
      const report = await apiRequest<{ url: string }>(
        `/results/${resultId}/report`,
      );
      window.location.assign(report.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
    }
  }
  return (
    <main className="student-dashboard">
      <h1>Your assessment result</h1>
      {(error || result.error) && (
        <p role="alert">{error || result.error?.message}</p>
      )}
      {result.data && (
        <>
          <p>Report: {result.data.reportStatus}</p>
          <dl>
            {Object.entries(result.data.dimensions).map(([name, score]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{score}</dd>
              </div>
            ))}
          </dl>
          <p>{result.data.aiInterpretation?.summary}</p>
          {(["strengths", "growthAreas", "limitations"] as const).map((key) =>
            result.data.aiInterpretation?.[key]?.length ? (
              <section key={key}>
                <h2>{labels[key]}</h2>
                <ul>
                  {result.data.aiInterpretation[key].map((line, index) => (
                    <li key={index}>{line}</li>
                  ))}
                </ul>
              </section>
            ) : null,
          )}
          {!!result.data.aiInterpretation?.careerExplanations?.length && (
            <section>
              <h2>{labels.careerExplanations}</h2>
              {result.data.aiInterpretation.careerExplanations.map((career) => (
                <p key={career.careerCode}>
                  {career.careerCode}: {career.explanation}
                </p>
              ))}
            </section>
          )}
          {!!result.data.aiInterpretation?.evidence?.length && (
            <details>
              <summary>{labels.evidence}</summary>
              <ul>
                {result.data.aiInterpretation.evidence.map((item) => (
                  <li key={item.dimension}>
                    {item.dimension}: {item.value}
                  </li>
                ))}
              </ul>
            </details>
          )}
          {result.data.aiProvenance && (
            <small>
              {labels.version}: {result.data.aiProvenance.promptVersion} (
              {result.data.aiProvenance.model})
            </small>
          )}
          <ul>
            {result.data.careerMatches.map((career, index) => (
              <li key={career.code ?? index}>{career.title ?? career.code}</li>
            ))}
          </ul>
          <ol>
            {result.data.aiInterpretation?.actionPlan?.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <button
            disabled={result.data.reportStatus !== "READY"}
            onClick={() => void download()}
          >
            Download PDF
          </button>
          {result.data.userId === user?.id && (
            <ResultSharing key={resultId} resultId={resultId} />
          )}
          <GuidanceNotes key={`notes-${resultId}`} resultId={resultId} />
        </>
      )}
    </main>
  );
}
