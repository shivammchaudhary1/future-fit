"use client";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Answer, publicQuestion } from "@future-fit/validation";
import { ApiClientError, apiRequest } from "@/lib/api-client";
import { readDraft, writeDraft } from "@/lib/offline-assessment";
import { SYNC_INTERVAL_MS } from "@/config/assessment.constants";
import { useAuthStore } from "@/stores/auth.store";
function displayValue(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}
type Question = ReturnType<typeof publicQuestion>;
interface Attempt {
  revision: number;
  status: string;
  responses: Answer[];
  language: "en" | "hi";
}
interface Payload {
  attempt: Attempt;
  version: { questions: Question[] };
}
export default function AttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = use(params);
  const user = useAuthStore((s) => s.user);
  const t = useTranslations();
  const router = useRouter();
  const key = `${user?.id}:${attemptId}`;
  const [payload, setPayload] = useState<Payload>();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const dirty = useRef(new Map<string, unknown>());
  const revision = useRef(0);
  const syncing = useRef<Promise<void> | null>(null);
  const storage = useRef(Promise.resolve());
  const persist = useCallback(() => {
    const draft = {
      key,
      answers: [...dirty.current].map(([questionId, answer]) => ({
        questionId,
        answer,
      })),
      updatedAt: Date.now(),
    };
    storage.current = storage.current
      .catch(() => undefined)
      .then(() => writeDraft(draft));
    return storage.current;
  }, [key]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    void Promise.all([
      apiRequest<Payload>(`/attempts/${attemptId}`),
      readDraft(key),
    ])
      .then(([data, draft]) => {
        if (!active) return;
        revision.current = data.attempt.revision;
        dirty.current = new Map(
          (data.attempt.status === "IN_PROGRESS"
            ? (draft?.answers ?? [])
            : []
          ).map((a) => [a.questionId, a.answer]),
        );
        setAnswers(
          Object.fromEntries([
            ...data.attempt.responses.map(
              (a) => [a.questionId, a.answer] as const,
            ),
            ...dirty.current,
          ]),
        );
        setPending(dirty.current.size);
        setPayload(data);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Loading failed");
      });
    return () => {
      active = false;
    };
  }, [attemptId, key, user]);
  const sync = useCallback((): Promise<void> => {
    if (syncing.current) return syncing.current;
    if (!dirty.current.size) return Promise.resolve();
    const batch = [...dirty.current].map(([questionId, answer]) => ({
      questionId,
      answer,
    }));
    syncing.current = (async () => {
      await storage.current;
      const send = () =>
        apiRequest<Attempt>(`/attempts/${attemptId}/responses`, {
          method: "PATCH",
          body: JSON.stringify({
            responses: batch,
            revision: revision.current,
            progress: 0,
          }),
        });
      let saved: Attempt;
      try {
        saved = await send();
      } catch (e) {
        if (!(e instanceof ApiClientError) || e.status !== 409) throw e;
        const latest = await apiRequest<Payload>(`/attempts/${attemptId}`);
        if (latest.attempt.status !== "IN_PROGRESS") throw e;
        revision.current = latest.attempt.revision;
        saved = await send();
      }
      revision.current = saved.revision;
      for (const response of batch)
        if (dirty.current.get(response.questionId) === response.answer)
          dirty.current.delete(response.questionId);
      await persist();
      setPending(dirty.current.size);
      setError("");
    })().finally(() => {
      syncing.current = null;
    });
    return syncing.current;
  }, [attemptId, persist]);
  useEffect(() => {
    const run = () => {
      void sync().catch(() => setError(t("failed")));
    };
    const timer = window.setInterval(run, SYNC_INTERVAL_MS);
    window.addEventListener("online", run);
    document.addEventListener("visibilitychange", run);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (dirty.current.size) event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", run);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [sync, t]);
  function change(questionId: string, answer: unknown) {
    const incomplete =
      answer === "" ||
      (typeof answer === "number" && !Number.isFinite(answer)) ||
      (Array.isArray(answer) && !answer.length) ||
      (answer !== null &&
        typeof answer === "object" &&
        !Array.isArray(answer) &&
        (!("most" in answer) || !("least" in answer)));
    dirty.current.set(questionId, incomplete ? null : answer);
    setAnswers((previous) => ({ ...previous, [questionId]: answer }));
    setPending(dirty.current.size);
    void persist().catch(() =>
      setError(
        "Device storage failed. Keep this page open until answers sync.",
      ),
    );
  }
  async function finish(submit: boolean) {
    if (submit && !window.confirm(t("confirm"))) return;
    setSubmitting(true);
    try {
      await sync();
      if (dirty.current.size) await sync();
      if (submit)
        await apiRequest(`/attempts/${attemptId}/submit`, { method: "POST" });
      router.push(submit ? "/results" : "/assessments");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setSubmitting(false);
    }
  }
  if (!payload)
    return (
      <main>
        <p>{error || t("loading")}</p>
      </main>
    );
  const disabled = submitting || payload.attempt.status !== "IN_PROGRESS";
  return (
    <main className="student-dashboard">
      <h1>{t("assessments")}</h1>
      <p role="status">{pending ? t("pending") : t("saved")}</p>
      {error && <p role="alert">{error}</p>}
      {payload.version.questions.map((question) => {
        const value = answers[question.questionId];
        const language = payload.attempt.language;
        const select = (part?: "most" | "least") => (
          <select
            disabled={disabled}
            value={
              part
                ? displayValue(
                    (value as Record<string, unknown> | undefined)?.[part],
                  )
                : displayValue(value)
            }
            onChange={(event) =>
              change(
                question.questionId,
                part
                  ? {
                      ...(typeof value === "object" ? value : {}),
                      [part]: event.target.value,
                    }
                  : event.target.value,
              )
            }
          >
            <option value="">—</option>
            {question.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.translations[language]}
              </option>
            ))}
          </select>
        );
        return (
          <fieldset key={question.questionId} disabled={disabled}>
            <legend>
              {question.translations[language].question}{" "}
              {question.required && `(${t("required")})`}
            </legend>
            {question.type === "TEXT" ? (
              <textarea
                value={displayValue(value)}
                onChange={(e) => change(question.questionId, e.target.value)}
              />
            ) : question.type === "NUMBER" ? (
              <input
                type="number"
                min={question.metadata.min}
                max={question.metadata.max}
                value={displayValue(value)}
                onChange={(e) =>
                  change(question.questionId, e.target.valueAsNumber)
                }
              />
            ) : question.type === "MULTI_SELECT" ? (
              question.options.map((option) => (
                <label key={option.id}>
                  <input
                    type="checkbox"
                    checked={Array.isArray(value) && value.includes(option.id)}
                    onChange={(e) =>
                      change(
                        question.questionId,
                        e.target.checked
                          ? [
                              ...(Array.isArray(value)
                                ? (value as unknown[])
                                : []),
                              option.id,
                            ]
                          : (Array.isArray(value) ? value : []).filter(
                              (id: unknown) => id !== option.id,
                            ),
                      )
                    }
                  />
                  {option.translations[language]}
                </label>
              ))
            ) : question.type === "MOST_LEAST" ? (
              <>
                <label>Most {select("most")}</label>
                <label>Least {select("least")}</label>
              </>
            ) : (
              select()
            )}
          </fieldset>
        );
      })}
      <button disabled={disabled} onClick={() => void finish(false)}>
        {t("save")}
      </button>{" "}
      <button disabled={disabled} onClick={() => void finish(true)}>
        {t("submit")}
      </button>
    </main>
  );
}
