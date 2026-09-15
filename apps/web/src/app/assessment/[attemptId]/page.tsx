"use client";

import type { Answer, publicQuestion } from "@future-fit/validation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Cloud,
  Save,
  Send,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { SYNC_INTERVAL_MS } from "@/config/assessment.constants";
import { ASSETS } from "@/config/assets";
import { ApiClientError, apiRequest } from "@/lib/api-client";
import { readDraft, writeDraft } from "@/lib/offline-assessment";
import { useAuthStore } from "@/stores/auth.store";
import styles from "@/styles/student-experience.module.css";

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
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const key = `${user?.id}:${attemptId}`;

  const [payload, setPayload] = useState<Payload>();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [error, setError] = useState("");
  const [pending, setPending] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

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
          (data.attempt.status === "IN_PROGRESS" ? draft?.answers ?? [] : []).map(
            (answer) => [answer.questionId, answer.answer],
          ),
        );

        setAnswers(
          Object.fromEntries([
            ...data.attempt.responses.map(
              (answer) => [answer.questionId, answer.answer] as const,
            ),
            ...dirty.current,
          ]),
        );

        setPending(dirty.current.size);
        setPayload(data);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Loading failed");
        }
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
      } catch (caught) {
        if (!(caught instanceof ApiClientError) || caught.status !== 409) {
          throw caught;
        }

        const latest = await apiRequest<Payload>(`/attempts/${attemptId}`);

        if (latest.attempt.status !== "IN_PROGRESS") {
          throw caught;
        }

        revision.current = latest.attempt.revision;
        saved = await send();
      }

      revision.current = saved.revision;

      for (const response of batch) {
        if (dirty.current.get(response.questionId) === response.answer) {
          dirty.current.delete(response.questionId);
        }
      }

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
      void sync().catch(() => setError("Your latest answers could not sync."));
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
  }, [sync]);

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
        "Device storage failed. Keep this page open until your answers sync.",
      ),
    );
  }

  async function finish(submit: boolean) {
    if (
      submit &&
      !window.confirm(
        "Submit this assessment? You will not be able to change your answers afterward.",
      )
    ) {
      return;
    }

    setSubmitting(true);

    try {
      await sync();
      if (dirty.current.size) await sync();

      if (submit) {
        await apiRequest(`/attempts/${attemptId}/submit`, { method: "POST" });
      }

      router.push(submit ? "/results" : "/assessments");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Action failed");
    } finally {
      setSubmitting(false);
    }
  }

  const questions = payload?.version.questions ?? [];
  const question = questions[currentIndex];
  const progress = questions.length
    ? Math.round(((currentIndex + 1) / questions.length) * 100)
    : 0;

  const answeredCount = useMemo(
    () =>
      questions.filter((item) => {
        const value = answers[item.questionId];
        if (Array.isArray(value)) return value.length > 0;
        if (value && typeof value === "object") {
          const record = value as Record<string, unknown>;
          return Boolean(record.most) && Boolean(record.least);
        }
        return value !== undefined && value !== null && value !== "";
      }).length,
    [answers, questions],
  );

  if (!payload || !question) {
    return (
      <main className={styles.loadingPage}>
        <p>{error || "Preparing your assessment…"}</p>
      </main>
    );
  }

  const disabled = submitting || payload.attempt.status !== "IN_PROGRESS";
  const value = answers[question.questionId];
  const language = payload.attempt.language;

  const select = (part?: "most" | "least") => (
    <select
      className={styles.questionSelect}
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
                ...(typeof value === "object" && value ? value : {}),
                [part]: event.target.value,
              }
            : event.target.value,
        )
      }
    >
      <option value="">Select an option</option>
      {question.options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.translations[language]}
        </option>
      ))}
    </select>
  );

  return (
    <main className={styles.assessmentPage}>
      <header className={styles.assessmentTopbar}>
        <Link
          href="/assessments"
          className={styles.assessmentBrand}
          aria-label="Back to assessments"
        >
          <Image
            src={ASSETS.brand.logoPrimary}
            alt="Future Fit"
            width={220}
            height={68}
            priority
          />
        </Link>

        <div className={styles.assessmentProgressWrap}>
          <div className={styles.assessmentProgressMeta}>
            <span>
              Question {currentIndex + 1} of {questions.length}
            </span>
            <strong>{progress}%</strong>
          </div>

          <div className={styles.progressTrack}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className={styles.assessmentStatus}>
          {pending ? <Cloud size={15} /> : <CheckCircle2 size={15} />}
          {pending ? `${pending} answer(s) waiting to sync` : "All answers saved"}
        </div>
      </header>

      <div className={styles.assessmentContent}>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}

        <div className={styles.questionMeta}>
          <span>Discover your path</span>
          <span>
            {answeredCount}/{questions.length} answered
          </span>
        </div>

        <article className={styles.questionCard}>
          <fieldset disabled={disabled}>
            <legend>
              {question.translations[language].question}{" "}
              {question.required ? (
                <span className={styles.required}>Required</span>
              ) : null}
            </legend>

            {question.type === "TEXT" ? (
              <textarea
                className={styles.questionTextarea}
                value={displayValue(value)}
                placeholder="Type your answer here"
                onChange={(event) =>
                  change(question.questionId, event.target.value)
                }
              />
            ) : question.type === "NUMBER" ? (
              <input
                className={styles.questionInput}
                type="number"
                min={question.metadata.min}
                max={question.metadata.max}
                value={displayValue(value)}
                onChange={(event) =>
                  change(question.questionId, event.target.valueAsNumber)
                }
              />
            ) : question.type === "MULTI_SELECT" ? (
              <div className={styles.optionList}>
                {question.options.map((option) => (
                  <label className={styles.optionItem} key={option.id}>
                    <input
                      type="checkbox"
                      checked={Array.isArray(value) && value.includes(option.id)}
                      onChange={(event) =>
                        change(
                          question.questionId,
                          event.target.checked
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
                ))}
              </div>
            ) : question.type === "MOST_LEAST" ? (
              <div className={styles.mostLeast}>
                <label>
                  <span>Most like me</span>
                  {select("most")}
                </label>

                <label>
                  <span>Least like me</span>
                  {select("least")}
                </label>
              </div>
            ) : (
              select()
            )}
          </fieldset>
        </article>

        <div className={styles.questionActions}>
          <div className={styles.questionActionsInner}>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={disabled}
              onClick={() => void finish(false)}
            >
              <Save size={15} />
              Save & exit
            </button>

            <div className={styles.actionGroup}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              >
                <ArrowLeft size={15} />
                Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() =>
                    setCurrentIndex((index) =>
                      Math.min(questions.length - 1, index + 1),
                    )
                  }
                >
                  Next
                  <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={disabled}
                  onClick={() => void finish(true)}
                >
                  Submit assessment
                  <Send size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
