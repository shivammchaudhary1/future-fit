"use client";

import type { Answer, publicQuestion } from "@future-fit/validation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Cloud,
  LockKeyhole,
  Save,
  Send,
  Sparkles,
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

import { AssessmentLanguageToggle } from "@/components/assessment/language-toggle";
import { SYNC_INTERVAL_MS } from "@/config/assessment.constants";
import { ASSETS } from "@/config/assets";
import {
  questionnaireMessages,
  type QuestionnaireLanguage,
} from "@/config/questionnaire.constants";
import { ApiClientError, apiRequest } from "@/lib/api-client";
import { readDraft, writeDraft } from "@/lib/offline-assessment";
import { useAuthStore } from "@/stores/auth.store";

import styles from "@/styles/questionnaire.module.css";

function displayValue(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

function isAnswered(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Boolean(record.most) && Boolean(record.least);
  }

  return value !== undefined && value !== null && value !== "";
}

type Question = ReturnType<typeof publicQuestion>;

const EMPTY_QUESTIONS: Question[] = [];

interface Attempt {
  revision: number;
  status: string;
  responses: Answer[];
  language: QuestionnaireLanguage;
}

interface Payload {
  attempt: Attempt;
  version: { questions: Question[] };
}

function questionText(question: Question, language: QuestionnaireLanguage) {
  return (
    question.translations[language]?.question ??
    question.translations.en.question
  );
}

function optionText(
  option: Question["options"][number],
  language: QuestionnaireLanguage,
) {
  return option.translations[language] ?? option.translations.en;
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
  const [language, setLanguage] =
    useState<QuestionnaireLanguage>("en");

  const dirty = useRef(new Map<string, unknown>());
  const revision = useRef(0);
  const syncing = useRef<Promise<void> | null>(null);
  const storage = useRef(Promise.resolve());

  const messages = questionnaireMessages(language);

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
          (
            data.attempt.status === "IN_PROGRESS"
              ? draft?.answers ?? []
              : []
          ).map((answer) => [answer.questionId, answer.answer]),
        );

        setAnswers(
          Object.fromEntries([
            ...data.attempt.responses.map(
              (answer) => [answer.questionId, answer.answer] as const,
            ),
            ...dirty.current,
          ]),
        );

        const storedLanguage = window.localStorage.getItem(
          `ff:questionnaire-language:${attemptId}`,
        );

        setLanguage(
          storedLanguage === "en" || storedLanguage === "hi"
            ? storedLanguage
            : data.attempt.language,
        );

        setPending(dirty.current.size);
        setPayload(data);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error ? caught.message : "Loading failed",
          );
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

        const latest = await apiRequest<Payload>(
          `/attempts/${attemptId}`,
        );

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
      void sync().catch(() => setError(messages.syncingFailed));
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
  }, [messages.syncingFailed, sync]);

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

    setAnswers((previous) => ({
      ...previous,
      [questionId]: answer,
    }));

    setPending(dirty.current.size);

    void persist().catch(() => setError(messages.storageFailed));
  }

  function chooseLanguage(nextLanguage: QuestionnaireLanguage) {
    setLanguage(nextLanguage);
    window.localStorage.setItem(
      `ff:questionnaire-language:${attemptId}`,
      nextLanguage,
    );
  }

  function goToQuestion(index: number) {
    setCurrentIndex(
      Math.max(0, Math.min(index, Math.max(0, questions.length - 1))),
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function finish(submit: boolean) {
    if (submit && requiredRemaining > 0) {
      setError(messages.incomplete);
      return;
    }

    if (submit && !window.confirm(messages.submitConfirm)) {
      return;
    }

    setSubmitting(true);

    try {
      await sync();

      if (dirty.current.size) {
        await sync();
      }

      if (submit) {
        await apiRequest(`/attempts/${attemptId}/submit`, {
          method: "POST",
        });
      }

      router.push(submit ? "/results" : "/assessments");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Action failed",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const questions = payload?.version.questions ?? EMPTY_QUESTIONS;
  const question = questions[currentIndex];

  const answeredCount = useMemo(
    () =>
      questions.filter((item) =>
        isAnswered(answers[item.questionId]),
      ).length,
    [answers, questions],
  );

  const requiredRemaining = useMemo(
    () =>
      questions.filter(
        (item) =>
          item.required && !isAnswered(answers[item.questionId]),
      ).length,
    [answers, questions],
  );

  const completion = questions.length
    ? Math.round((answeredCount / questions.length) * 100)
    : 0;

  const currentValue = question
    ? answers[question.questionId]
    : undefined;

  const currentAnswered = isAnswered(currentValue);

  useEffect(() => {
    if (!question) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (
        (question.type === "LIKERT" ||
          question.type === "SINGLE_SELECT") &&
        /^[1-5]$/.test(event.key)
      ) {
        const option = question.options.find(
          (entry) => entry.id === event.key,
        );

        if (option) {
          event.preventDefault();
          change(question.questionId, option.id);
        }
      }

      if (
        event.key === "ArrowLeft" &&
        currentIndex > 0 &&
        !event.metaKey &&
        !event.ctrlKey
      ) {
        event.preventDefault();
        goToQuestion(currentIndex - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  });

  if (!payload || !question) {
    return (
      <main className={styles.loadingPage}>
        <span className={styles.loadingOrb} />
        <p>{error || messages.loading}</p>
      </main>
    );
  }

  const disabled =
    submitting || payload.attempt.status !== "IN_PROGRESS";

  const select = (part?: "most" | "least") => (
    <select
      className={styles.select}
      disabled={disabled}
      value={
        part
          ? displayValue(
              (
                currentValue as
                  | Record<string, unknown>
                  | undefined
              )?.[part],
            )
          : displayValue(currentValue)
      }
      onChange={(event) =>
        change(
          question.questionId,
          part
            ? {
                ...(typeof currentValue === "object" &&
                currentValue
                  ? currentValue
                  : {}),
                [part]: event.target.value,
              }
            : event.target.value,
        )
      }
    >
      <option value="">{messages.selectOption}</option>

      {question.options.map((option) => (
        <option key={option.id} value={option.id}>
          {optionText(option, language)}
        </option>
      ))}
    </select>
  );

  const renderResponse = () => {
    if (
      question.type === "LIKERT" ||
      question.type === "SINGLE_SELECT"
    ) {
      return (
        <div
          className={styles.scaleOptions}
          aria-label={messages.responseScale}
        >
          {question.options.map((option, index) => {
            const selected = currentValue === option.id;

            return (
              <button
                type="button"
                key={option.id}
                className={`${styles.scaleOption} ${
                  selected ? styles.scaleOptionSelected : ""
                }`}
                aria-pressed={selected}
                disabled={disabled}
                onClick={() =>
                  change(question.questionId, option.id)
                }
              >
                <span className={styles.optionShortcut}>
                  {index + 1}
                </span>

                <span className={styles.optionLabel}>
                  {optionText(option, language)}
                </span>

                <span className={styles.optionCheck}>
                  {selected ? <Check size={16} /> : null}
                </span>
              </button>
            );
          })}
        </div>
      );
    }

    if (question.type === "TEXT") {
      return (
        <textarea
          className={styles.textarea}
          value={displayValue(currentValue)}
          placeholder={messages.typeAnswer}
          disabled={disabled}
          onChange={(event) =>
            change(question.questionId, event.target.value)
          }
        />
      );
    }

    if (question.type === "NUMBER") {
      return (
        <input
          className={styles.input}
          type="number"
          min={question.metadata.min}
          max={question.metadata.max}
          value={displayValue(currentValue)}
          disabled={disabled}
          onChange={(event) =>
            change(
              question.questionId,
              event.target.valueAsNumber,
            )
          }
        />
      );
    }

    if (question.type === "MULTI_SELECT") {
      return (
        <div className={styles.multiOptions}>
          {question.options.map((option) => {
            const selected =
              Array.isArray(currentValue) &&
              currentValue.includes(option.id);

            return (
              <label
                className={`${styles.multiOption} ${
                  selected ? styles.multiOptionSelected : ""
                }`}
                key={option.id}
              >
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={selected}
                  onChange={(event) =>
                    change(
                      question.questionId,
                      event.target.checked
                        ? [
                            ...(Array.isArray(currentValue)
                              ? (currentValue as unknown[])
                              : []),
                            option.id,
                          ]
                        : (
                            Array.isArray(currentValue)
                              ? (currentValue as unknown[])
                              : []
                          ).filter(
                            (id: unknown) => id !== option.id,
                          ),
                    )
                  }
                />

                <span>{optionText(option, language)}</span>
              </label>
            );
          })}
        </div>
      );
    }

    if (question.type === "MOST_LEAST") {
      return (
        <div className={styles.mostLeast}>
          <label>
            <span>{messages.mostLike}</span>
            {select("most")}
          </label>

          <label>
            <span>{messages.leastLike}</span>
            {select("least")}
          </label>
        </div>
      );
    }

    return select();
  };

  if (payload.attempt.status !== "IN_PROGRESS") {
    return (
      <main className={styles.completedPage}>
        <div className={styles.completedCard}>
          <span className={styles.completedIcon}>
            <CheckCircle2 size={30} />
          </span>
          <h1>{messages.alreadySubmitted}</h1>
          <Link href="/results" className={styles.primaryButton}>
            {messages.viewResults}
            <ArrowRight size={16} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link
          href="/assessments"
          className={styles.brand}
          aria-label="Future Fit assessments"
        >
          <Image
            src={ASSETS.brand.logoPrimary}
            alt="Future Fit"
            width={220}
            height={68}
            priority
          />
        </Link>

        <div className={styles.topProgress}>
          <div className={styles.topProgressMeta}>
            <span>
              {messages.question} {currentIndex + 1} {messages.of}{" "}
              {questions.length}
            </span>
            <strong>{completion}% {messages.complete}</strong>
          </div>

          <div className={styles.progressTrack}>
            <span style={{ width: `${completion}%` }} />
          </div>
        </div>

        <div className={styles.topActions}>
          <AssessmentLanguageToggle
            value={language}
            onChange={chooseLanguage}
            disabled={submitting}
            label={messages.language}
          />

          <div
            className={`${styles.syncStatus} ${
              pending ? styles.syncPending : styles.syncSaved
            }`}
          >
            {pending ? (
              <Cloud size={14} />
            ) : (
              <CheckCircle2 size={14} />
            )}

            <span>
              {pending
                ? pending === 1
                  ? messages.pendingSingle
                  : `${pending} ${messages.pendingMany}`
                : messages.saved}
            </span>
          </div>
        </div>
      </header>

      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHero}>
            <span className={styles.sparkle}>
              <Sparkles size={18} />
            </span>

            <span className={styles.eyebrow}>
              {messages.pageEyebrow}
            </span>

            <h1>{messages.pageTitle}</h1>

            <p>{messages.pageDescription}</p>
          </div>

          <div className={styles.progressSummary}>
            <div>
              <strong>{answeredCount}</strong>
              <span>{messages.answered}</span>
            </div>

            <div>
              <strong>{questions.length - answeredCount}</strong>
              <span>{messages.remaining}</span>
            </div>
          </div>

          <div className={styles.navigatorHeader}>
            <strong>{messages.navigatorTitle}</strong>
            <span>{answeredCount}/{questions.length}</span>
          </div>

          <div className={styles.questionNavigator}>
            {questions.map((item, index) => {
              const answered = isAnswered(
                answers[item.questionId],
              );
              const current = index === currentIndex;

              return (
                <button
                  type="button"
                  key={item.questionId}
                  className={`${styles.questionDot} ${
                    answered ? styles.questionDotAnswered : ""
                  } ${
                    current ? styles.questionDotCurrent : ""
                  }`}
                  aria-label={`${messages.question} ${index + 1}${
                    answered ? `, ${messages.answered}` : ""
                  }`}
                  aria-current={current ? "step" : undefined}
                  onClick={() => goToQuestion(index)}
                >
                  {answered && !current ? (
                    <Check size={12} />
                  ) : (
                    index + 1
                  )}
                </button>
              );
            })}
          </div>

          <div className={styles.privacyNote}>
            <LockKeyhole size={15} />
            <span>{messages.secureDraft}</span>
          </div>
        </aside>

        <section className={styles.workspace}>
          {error ? (
            <div className={styles.error} role="alert">
              {error}
            </div>
          ) : null}

          <div className={styles.questionStage}>
            <div className={styles.questionHeading}>
              <div>
                <span className={styles.questionKicker}>
                  {messages.currentQuestion}
                </span>

                <span className={styles.questionNumber}>
                  {String(currentIndex + 1).padStart(2, "0")}
                </span>
              </div>

              {question.required ? (
                <span className={styles.required}>
                  {messages.required}
                </span>
              ) : null}
            </div>

            <h2>{questionText(question, language)}</h2>

            <p className={styles.instruction}>
              {question.type === "MULTI_SELECT"
                ? messages.multiSelect
                : messages.selectOne}
            </p>

            <fieldset
              className={styles.responseArea}
              disabled={disabled}
            >
              <legend className={styles.srOnly}>
                {messages.responseScale}
              </legend>
              {renderResponse()}
            </fieldset>

            {(question.type === "LIKERT" ||
              question.type === "SINGLE_SELECT") &&
            question.options.length <= 5 ? (
              <p className={styles.keyboardHint}>
                {messages.keyboardHint}
              </p>
            ) : null}
          </div>

          <footer className={styles.footer}>
            <button
              type="button"
              className={styles.saveButton}
              disabled={submitting}
              onClick={() => void finish(false)}
            >
              <Save size={16} />
              {messages.saveExit}
            </button>

            <div className={styles.footerCenter}>
              {question.required && !currentAnswered ? (
                <span>{messages.chooseToContinue}</span>
              ) : (
                <span>
                  {answeredCount}/{questions.length}{" "}
                  {messages.answered}
                </span>
              )}
            </div>

            <div className={styles.navigation}>
              <button
                type="button"
                className={styles.secondaryButton}
                disabled={currentIndex === 0 || submitting}
                onClick={() =>
                  goToQuestion(currentIndex - 1)
                }
              >
                <ArrowLeft size={16} />
                {messages.previous}
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={
                    submitting ||
                    (question.required && !currentAnswered)
                  }
                  onClick={() =>
                    goToQuestion(currentIndex + 1)
                  }
                >
                  {messages.next}
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={
                    submitting || requiredRemaining > 0
                  }
                  onClick={() => void finish(true)}
                >
                  {messages.submit}
                  <Send size={16} />
                </button>
              )}
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
