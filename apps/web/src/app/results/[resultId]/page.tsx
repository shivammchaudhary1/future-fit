"use client";
import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
interface Result {
  reportStatus: string;
  dimensions: Record<string, number>;
  careerMatches: Array<{ code?: string; title?: string }>;
  aiInterpretation?: { summary?: string; actionPlan?: string[] };
}
export default function ResultPage({
  params,
}: {
  params: Promise<{ resultId: string }>;
}) {
  const { resultId } = use(params);
  const user = useAuthStore((s) => s.user);
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
        </>
      )}
    </main>
  );
}
