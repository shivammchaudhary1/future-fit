"use client";

import type { CareerContent } from "@future-fit/validation";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Compass,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Search,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import styles from "@/styles/student-experience.module.css";

const navItems = [
  { label: "Overview", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck },
  { label: "Results", href: "/results", icon: FileText },
  { label: "Career Library", href: "/careers", icon: Compass },
  { label: "Profile", href: "/student/profile", icon: UserRound },
] as const;

export default function CareersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const user = useAuthStore((state) => state.user);

  const careers = useQuery({
    queryKey: ["careers", page, user?.id],
    queryFn: () =>
      apiRequest<CareerContent[]>(`/careers?page=${page}&limit=20`),
    enabled: !!user,
  });

  const language = user?.preferredLanguage ?? "en";

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return careers.data ?? [];

    return (careers.data ?? []).filter((career) => {
      const translation = career.translations[language];

      return [
        translation.name,
        translation.summary,
        ...career.skills,
        ...career.educationPath.flatMap((path) => [
          path.level,
          ...path.options,
        ]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [careers.data, language, search]);

  return (
    <DashboardShell
      roleLabel="Student Dashboard"
      title="Career library"
      description="Explore career profiles, skills and education pathways relevant to your future planning."
      navItems={[...navItems]}
    >
      <div className={styles.pageStack}>
        <div className={styles.libraryToolbar}>
          <label className={styles.field}>
            <span>Search this page</span>
            <div>
              <Search size={15} />
              <input
                value={search}
                placeholder="Search careers, skills or pathways"
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </label>

          <span className={styles.statusBadge}>Page {page}</span>
        </div>

        {careers.error ? (
          <p className={styles.error} role="alert">
            {careers.error.message}
          </p>
        ) : null}

        {careers.isLoading ? (
          <p className={styles.notice}>Loading career profiles…</p>
        ) : careers.data?.length === 0 ? (
          <div className={styles.empty}>
            <strong>No career profiles have been published</strong>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <strong>No careers match your search on this page</strong>
            <p>Try another keyword or clear the search box.</p>
          </div>
        ) : (
          <div className={styles.careerGrid}>
            {filtered.map((career) => {
              const translation = career.translations[language];

              return (
                <article className={styles.careerCard} key={career.slug}>
                  <div>
                    <span className={styles.cardIcon}>
                      <Compass />
                    </span>

                    <h2>{translation.name}</h2>
                    <p>{translation.summary}</p>

                    <div className={styles.skillList}>
                      {career.skills.slice(0, 7).map((skill) => (
                        <span className={styles.skillChip} key={skill}>
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className={styles.pathwayList}>
                      {career.educationPath.slice(0, 3).map((path) => (
                        <div className={styles.pathway} key={path.level}>
                          <strong>
                            <GraduationCap size={12} /> {path.level}
                          </strong>
                          <span>{path.options.join(", ")}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <span className={styles.provenance}>
                    <BookOpen size={12} /> Future Fit career profile
                  </span>
                </article>
              );
            })}
          </div>
        )}

        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={page === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            <ChevronLeft size={15} />
            Previous
          </button>

          <span>Page {page}</span>

          <button
            type="button"
            className={styles.secondaryButton}
            disabled={!careers.data || careers.data.length < 20}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
