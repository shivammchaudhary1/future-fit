"use client";

import type { QuestionnaireLanguage } from "@/config/questionnaire.constants";
import styles from "./language-toggle.module.css";

export function AssessmentLanguageToggle({
  value,
  onChange,
  disabled = false,
  label = "Question language",
}: {
  value: QuestionnaireLanguage;
  onChange: (language: QuestionnaireLanguage) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{label}</span>

      <div className={styles.segmented} role="group" aria-label={label}>
        <button
          type="button"
          className={value === "en" ? styles.active : undefined}
          aria-pressed={value === "en"}
          disabled={disabled}
          onClick={() => onChange("en")}
        >
          EN
        </button>

        <button
          type="button"
          className={value === "hi" ? styles.active : undefined}
          aria-pressed={value === "hi"}
          disabled={disabled}
          onClick={() => onChange("hi")}
        >
          हिंदी
        </button>
      </div>
    </div>
  );
}
