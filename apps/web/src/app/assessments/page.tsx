"use client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { StudentAssignments } from "@/components/student-assignments";
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
export default function AssessmentsPage() {
  const t = useTranslations();
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
  if (!user)
    return (
      <main>
        <Link href="/login">Sign in to continue</Link>
      </main>
    );
  return (
    <main className="student-dashboard">
      <Link href="/student/dashboard">Dashboard</Link>
      <h1>{t("assessments")}</h1>
      <StudentAssignments />
      <h2>Personal assessments</h2>
      {(assessments.error || attempts.error || start.error) && (
        <p role="alert">
          {(assessments.error ?? attempts.error ?? start.error)?.message}
        </p>
      )}
      {assessments.isLoading && <p>{t("loading")}</p>}
      {assessments.data?.length === 0 && <p>{t("empty")}</p>}
      {assessments.data?.map((assessment) => {
        const ongoing = attempts.data?.find(
          (a) =>
            a.assessmentId === assessment._id && a.context === "PERSONAL" && a.status === "IN_PROGRESS",
        );
        return (
          <section key={assessment._id}>
            <h2>{assessment.name}</h2>
            <p>{assessment.description}</p>
            {ongoing ? (
              <Link href={`/assessment/${ongoing._id}`}>
                {t("resume")} ({ongoing.progress}%)
              </Link>
            ) : (
              <button
                disabled={start.isPending}
                onClick={() => start.mutate(assessment._id)}
              >
                {t("start")}
              </button>
            )}
          </section>
        );
      })}
    </main>
  );
}
