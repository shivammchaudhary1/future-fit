"use client";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
interface Result {
  _id: string;
  reportStatus: string;
  dimensions: Record<string, number>;
  scoringVersion: string;
}
export default function ResultsPage() {
  const user = useAuthStore((s) => s.user);
  const results = useQuery({
    queryKey: ["results", user?.id],
    queryFn: () => apiRequest<Result[]>("/results"),
    enabled: !!user,
    refetchInterval: 12_000,
  });
  return (
    <main className="student-dashboard">
      <Link href="/student/dashboard">Dashboard</Link>
      <h1>Results</h1>
      {results.error && <p role="alert">{results.error.message}</p>}
      {results.isLoading && <p>Loading…</p>}
      {results.data?.length === 0 && <p>No submitted assessments yet.</p>}
      {results.data?.map((result) => (
        <section key={result._id}>
          <Link href={`/results/${result._id}`}>View result</Link>
          <p>Report: {result.reportStatus}</p>
          <p>Scoring version: {result.scoringVersion}</p>
        </section>
      ))}
    </main>
  );
}
