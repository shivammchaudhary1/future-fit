"use client";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";

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
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const memberships = useQuery({
    queryKey: ["student-memberships", user?.id],
    queryFn: () => apiRequest<Membership[]>("/organizations"),
    enabled: !!user,
  });
  const schools = memberships.data?.filter((m) => m.role === "STUDENT" && m.status === "ACTIVE") ?? [];
  const organizationId = schools.find((m) => m.organizationId === selected)?.organizationId ?? schools[0]?.organizationId;
  const assignments = useQuery({
    queryKey: ["student-assignments", user?.id, organizationId],
    queryFn: () => apiRequest<Assignment[]>(`/organizations/${organizationId}/assessment-assignments`),
    enabled: !!user && !!organizationId,
  });
  const accept = useMutation({
    mutationFn: (id: string) => apiRequest(`/organizations/${id}/accept`, { method: "POST" }),
    onSuccess: async () => { await memberships.refetch(); },
  });
  const start = useMutation({
    mutationFn: (assignment: Assignment) => apiRequest<{ _id: string }>(`/assessments/${assignment.assessmentId}/start`, {
      method: "POST",
      body: JSON.stringify({ context: "SCHOOL", organizationId, assignmentId: assignment._id, language: user?.preferredLanguage ?? "en" }),
    }),
    onSuccess: (attempt) => router.push(`/assessment/${attempt._id}`),
  });
  return (
    <section>
      <h2>School assignments</h2>
      {(memberships.error || assignments.error || accept.error || start.error) && <p role="alert">{(memberships.error ?? assignments.error ?? accept.error ?? start.error)?.message}</p>}
      {memberships.data?.filter((m) => m.status === "INVITED").map((m) => <p key={m._id}>Invitation: {m.organizationId} ({m.role}) <button disabled={accept.isPending} onClick={() => accept.mutate(m.organizationId)}>Accept invitation</button></p>)}
      {schools.length > 0 && <label>School <select value={organizationId} onChange={(e) => setSelected(e.target.value)}>{schools.map((m) => <option key={m._id} value={m.organizationId}>{m.organizationId}</option>)}</select></label>}
      {(memberships.isLoading || assignments.isLoading) && <p>Loading assignments…</p>}
      {!memberships.isLoading && schools.length === 0 && <p>No active student school memberships.</p>}
      {assignments.data?.length === 0 && <p>No assignments.</p>}
      {assignments.data?.map((assignment) => <article key={assignment._id}>
        <h3>Assessment {assignment.assessmentId}</h3>
        {assignment.dueDate && <p>Due: {new Date(assignment.dueDate).toLocaleString()}</p>}
        <button disabled={start.isPending || assignment.status !== "ACTIVE"} onClick={() => start.mutate(assignment)}>Start or resume school assessment</button>
      </article>)}
    </section>
  );
}
