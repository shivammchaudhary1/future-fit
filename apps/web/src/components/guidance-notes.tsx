"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { MessageSquareText } from "lucide-react";
import { useState } from "react";

import { RESULT_LIMITS } from "@/config/result.constants";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import styles from "@/styles/student-experience.module.css";

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
  const user = useAuthStore((state) => state.user);
  const [text, setText] = useState("");
  const [selected, setSelected] = useState("");

  const memberships = useQuery({
    queryKey: ["note-memberships", user?.id],
    queryFn: () => apiRequest<Membership[]>("/organizations"),
    enabled: !!user,
  });

  const schools =
    memberships.data?.filter(
      (membership) =>
        membership.status === "ACTIVE" &&
        ["TEACHER", "SCHOOL_ADMIN"].includes(membership.role),
    ) ?? [];

  const organizationId =
    schools.find((membership) => membership.organizationId === selected)
      ?.organizationId ?? schools[0]?.organizationId;

  const notes = useQuery({
    queryKey: ["guidance-notes", user?.id, resultId],
    queryFn: () => apiRequest<Note[]>(`/results/${resultId}/notes`),
    enabled: !!user,
  });

  const save = useMutation({
    mutationFn: () =>
      apiRequest(`/results/${resultId}/notes`, {
        method: "POST",
        body: JSON.stringify({
          organizationId,
          text: text.trim(),
        }),
      }),
    onSuccess: async () => {
      setText("");
      await notes.refetch();
    },
  });

  return (
    <section className={styles.sectionCard}>
      <header className={styles.sectionHeader}>
        <div>
          <h2>Guidance notes</h2>
          <p>Notes from authorized teachers or school staff.</p>
        </div>
        <MessageSquareText size={18} />
      </header>

      <div className={styles.sectionBody}>
        {(notes.error || memberships.error || save.error) && (
          <p className={styles.error} role="alert">
            {(notes.error ?? memberships.error ?? save.error)?.message}
          </p>
        )}

        {notes.isLoading ? (
          <p className={styles.notice}>Loading guidance notes…</p>
        ) : notes.data?.length === 0 ? (
          <div className={styles.empty}>
            <strong>No guidance notes yet</strong>
            <p>Authorized school staff can add notes when appropriate.</p>
          </div>
        ) : (
          <div className={styles.notesList}>
            {notes.data?.map((note) => (
              <article className={styles.noteItem} key={note._id}>
                <p>{note.text}</p>
                <small>
                  {note.authorUserId} · {new Date(note.createdAt).toLocaleString()}
                </small>
              </article>
            ))}
          </div>
        )}

        {organizationId ? (
          <form
            className={styles.notesForm}
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate();
            }}
          >
            <p className={styles.notice}>
              Notes are visible to everyone authorized to view this result,
              including the student. Do not include staff-only confidential
              information.
            </p>

            <label className={styles.field}>
              <span>School</span>
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

            <label className={styles.field}>
              <span>Guidance</span>
              <textarea
                required
                maxLength={RESULT_LIMITS.noteLength}
                value={text}
                disabled={save.isPending}
                onChange={(event) => setText(event.target.value)}
              />
            </label>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={save.isPending || !text.trim()}
            >
              Add guidance note
            </button>

            {save.isSuccess ? (
              <p className={styles.success}>Guidance note saved.</p>
            ) : null}
          </form>
        ) : null}
      </div>
    </section>
  );
}
