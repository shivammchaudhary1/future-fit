"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarDays, School } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import styles from "@/styles/student-experience.module.css";

interface Membership {
  _id: string;
  organizationId: string;
  role: string;
  status: string;
}

interface Assignment {
  _id: string;
  assessmentId: string;
  dueDate?: string;
  status: string;
}

export function StudentAssignments() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [selected, setSelected] = useState("");

  const memberships = useQuery({
    queryKey: ["student-memberships", user?.id],
    queryFn: () => apiRequest<Membership[]>("/organizations"),
    enabled: !!user,
  });

  const schools =
    memberships.data?.filter(
      (membership) =>
        membership.role === "STUDENT" && membership.status === "ACTIVE",
    ) ?? [];

  const organizationId =
    schools.find((membership) => membership.organizationId === selected)
      ?.organizationId ?? schools[0]?.organizationId;

  const assignments = useQuery({
    queryKey: ["student-assignments", user?.id, organizationId],
    queryFn: () =>
      apiRequest<Assignment[]>(
        `/organizations/${organizationId}/assessment-assignments`,
      ),
    enabled: !!user && !!organizationId,
  });

  const accept = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/organizations/${id}/accept`, { method: "POST" }),
    onSuccess: async () => {
      await memberships.refetch();
    },
  });

  const start = useMutation({
    mutationFn: (assignment: Assignment) =>
      apiRequest<{ _id: string }>(
        `/assessments/${assignment.assessmentId}/start`,
        {
          method: "POST",
          body: JSON.stringify({
            context: "SCHOOL",
            organizationId,
            assignmentId: assignment._id,
            language: user?.preferredLanguage ?? "en",
          }),
        },
      ),
    onSuccess: (attempt) => router.push(`/assessment/${attempt._id}`),
  });

  const invited =
    memberships.data?.filter((membership) => membership.status === "INVITED") ?? [];

  return (
    <section className={styles.sectionCard}>
      <header className={styles.sectionHeader}>
        <div>
          <h2>School assignments</h2>
          <p>Assessments assigned to you by a school or teacher.</p>
        </div>
      </header>

      <div className={styles.sectionBody}>
        {(memberships.error || assignments.error || accept.error || start.error) && (
          <p className={styles.error} role="alert">
            {(memberships.error ??
              assignments.error ??
              accept.error ??
              start.error)?.message}
          </p>
        )}

        {invited.map((membership) => (
          <div className={styles.invitation} key={membership._id}>
            <span>
              School invitation · {membership.organizationId} · {membership.role}
            </span>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={accept.isPending}
              onClick={() => accept.mutate(membership.organizationId)}
            >
              Accept invitation
            </button>
          </div>
        ))}

        {schools.length > 0 ? (
          <div className={styles.assignmentToolbar}>
            <label className={styles.field}>
              <span>School</span>
              <select
                value={organizationId}
                onChange={(event) => setSelected(event.target.value)}
              >
                {schools.map((membership) => (
                  <option key={membership._id} value={membership.organizationId}>
                    {membership.organizationId}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {memberships.isLoading || assignments.isLoading ? (
          <p className={styles.notice}>Loading school assignments…</p>
        ) : schools.length === 0 ? (
          <div className={styles.empty}>
            <strong>No active school membership</strong>
            <p>
              When a school adds you and the invitation is accepted, assigned
              assessments will appear here.
            </p>
          </div>
        ) : assignments.data?.length === 0 ? (
          <div className={styles.empty}>
            <strong>No active assignments</strong>
            <p>Your school has not assigned an assessment right now.</p>
          </div>
        ) : (
          <div className={styles.assessmentGrid}>
            {assignments.data?.map((assignment) => (
              <article className={styles.assignmentCard} key={assignment._id}>
                <div>
                  <span className={styles.cardIcon}>
                    <School />
                  </span>

                  <h3>School assessment</h3>
                  <p>Assessment ID: {assignment.assessmentId}</p>

                  {assignment.dueDate ? (
                    <p>
                      <CalendarDays size={13} />{" "}
                      Due {new Date(assignment.dueDate).toLocaleString()}
                    </p>
                  ) : null}
                </div>

                <div className={styles.cardFooter}>
                  <span className={styles.statusBadge}>{assignment.status}</span>

                  <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={start.isPending || assignment.status !== "ACTIVE"}
                    onClick={() => start.mutate(assignment)}
                  >
                    Start or resume
                    <ArrowRight size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
