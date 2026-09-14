"use client";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { RESULT_LIMITS } from "@/config/result.constants";
interface Note {
  _id: string;
  text: string;
  authorUserId: string;
  createdAt: string;
}
interface Membership {
  organizationId: string;
  status: string;
  role: string;
}
export function GuidanceNotes({ resultId }: { resultId: string }) {
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const [selected, setSelected] = useState("");
  const memberships = useQuery({
    queryKey: ["note-memberships", user?.id],
    queryFn: () => apiRequest<Membership[]>("/organizations"),
    enabled: !!user,
  });
  const schools =
    memberships.data?.filter(
      (m) =>
        m.status === "ACTIVE" && ["TEACHER", "SCHOOL_ADMIN"].includes(m.role),
    ) ?? [];
  const organizationId =
    schools.find((m) => m.organizationId === selected)?.organizationId ??
    schools[0]?.organizationId;
  const notes = useQuery({
    queryKey: ["guidance-notes", user?.id, resultId],
    queryFn: () => apiRequest<Note[]>(`/results/${resultId}/notes`),
    enabled: !!user,
  });
  const save = useMutation({
    mutationFn: () =>
      apiRequest(`/results/${resultId}/notes`, {
        method: "POST",
        body: JSON.stringify({ organizationId, text: text.trim() }),
      }),
    onSuccess: async () => {
      setText("");
      await notes.refetch();
    },
  });
  return (
    <section>
      <h2>Guidance notes</h2>
      {(notes.error || memberships.error || save.error) && (
        <p role="alert">
          {(notes.error ?? memberships.error ?? save.error)?.message}
        </p>
      )}
      {notes.isLoading && <p>Loading notes…</p>}
      {notes.data?.length === 0 && <p>No guidance notes yet.</p>}
      {notes.data?.map((note) => (
        <article key={note._id}>
          <p style={{ whiteSpace: "pre-wrap" }}>{note.text}</p>
          <small>
            {note.authorUserId} · {new Date(note.createdAt).toLocaleString()}
          </small>
        </article>
      ))}
      {organizationId && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <p>
            Notes are visible to everyone authorized to view this result,
            including the student. Do not include confidential staff-only
            information.
          </p>
          <label>
            School{" "}
            <select
              value={organizationId}
              disabled={save.isPending}
              onChange={(event) => setSelected(event.target.value)}
            >
              {schools.map((school) => (
                <option
                  key={school.organizationId}
                  value={school.organizationId}
                >
                  {school.organizationId}
                </option>
              ))}
            </select>
          </label>
          <label>
            Guidance{" "}
            <textarea
              required
              maxLength={RESULT_LIMITS.noteLength}
              value={text}
              disabled={save.isPending}
              onChange={(event) => setText(event.target.value)}
            />
          </label>
          <button disabled={save.isPending || !text.trim()}>
            Add guidance note
          </button>
          {save.isSuccess && <p role="status">Guidance note saved.</p>}
        </form>
      )}
    </section>
  );
}
