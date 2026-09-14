"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import type { CareerContent } from "@future-fit/validation";
export default function CareersPage() {
  const [page, setPage] = useState(1);
  const user = useAuthStore((s) => s.user);
  const careers = useQuery({
    queryKey: ["careers", page, user?.id],
    queryFn: () =>
      apiRequest<CareerContent[]>(`/careers?page=${page}&limit=20`),
    enabled: !!user,
  });
  const language = user?.preferredLanguage ?? "en";
  return (
    <main className="student-dashboard">
      <h1>Career library</h1>
      {careers.error && <p role="alert">{careers.error.message}</p>}
      {careers.data?.length === 0 && (
        <p>No career profiles have been published.</p>
      )}
      {careers.data?.map((career) => (
        <section key={career.slug}>
          <h2>{career.translations[language].name}</h2>
          <p>{career.translations[language].summary}</p>
          <h3>Education pathways</h3>
          <ul>
            {career.educationPath.map((path) => (
              <li key={path.level}>
                {path.level}: {path.options.join(", ")}
              </li>
            ))}
          </ul>
          <p>Skills: {career.skills.join(", ")}</p>
        </section>
      ))}
      <button disabled={page === 1} onClick={() => setPage(page - 1)}>
        Previous
      </button>{" "}
      <button
        disabled={!careers.data || careers.data.length < 20}
        onClick={() => setPage(page + 1)}
      >
        Next
      </button>
    </main>
  );
}
