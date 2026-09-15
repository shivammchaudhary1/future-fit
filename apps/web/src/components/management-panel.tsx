"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import styles from "@/components/dashboard/dashboard.module.css";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";

export interface ManagementAction {
  label: string;
  path: string;
  method?: "POST" | "PATCH";
  template: Record<string, unknown>;
}

function describeData(value: unknown) {
  if (Array.isArray(value)) {
    return `${value.length} ${value.length === 1 ? "record" : "records"}`;
  }

  if (value && typeof value === "object") {
    return "Data available";
  }

  if (value === undefined) {
    return "Loading";
  }

  return "Response";
}

export function ManagementPanel({
  title,
  readPath,
  actions = [],
  id,
}: {
  title: string;
  readPath: string;
  actions?: ManagementAction[];
  id?: string;
}) {
  const user = useAuthStore((state) => state.user);
  const [selection, setSelection] = useState(0);
  const [input, setInput] = useState(
    JSON.stringify(actions[0]?.template ?? {}, null, 2),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<unknown>();

  const data = useQuery({
    queryKey: ["management", user?.id, readPath],
    queryFn: () => apiRequest<unknown>(readPath),
    enabled: !!user && !!readPath,
  });

  async function submit() {
    const action = actions[selection];
    if (!action) return;

    setBusy(true);
    setError("");
    setLastResult(undefined);

    try {
      const body: unknown = JSON.parse(input);
      const result = await apiRequest<unknown>(action.path, {
        method: action.method ?? "POST",
        body: JSON.stringify(body),
      });

      setLastResult(result);
      await data.refetch();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      id={id}
      className={`${styles.managementPanel} ${styles.sectionAnchor}`}
    >
      <header className={styles.managementPanelHeader}>
        <h2>{title}</h2>
        <span>{data.isLoading ? "Loading" : describeData(data.data)}</span>
      </header>

      <div className={styles.managementPanelBody}>
        {(error || data.error) && (
          <p className={styles.error} role="alert">
            {error || data.error?.message}
          </p>
        )}

        {data.isLoading ? (
          <p className={styles.notice}>Loading {title.toLowerCase()}…</p>
        ) : (
          <details>
            <summary>View current data</summary>
            <pre className={styles.dataPreview}>
              {JSON.stringify(data.data ?? [], null, 2)}
            </pre>
          </details>
        )}

        {lastResult !== undefined && (
          <div role="status">
            <p className={styles.notice}>Action completed successfully.</p>
            <details>
              <summary>View returned record</summary>
              <pre className={styles.dataPreview}>
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {actions.length > 0 && (
          <div className={styles.managementActions}>
            <label className={styles.managementField}>
              <span>Action</span>
              <select
                value={selection}
                onChange={(event) => {
                  const index = Number(event.target.value);
                  setSelection(index);
                  setInput(
                    JSON.stringify(actions[index]?.template ?? {}, null, 2),
                  );
                }}
              >
                {actions.map((action, index) => (
                  <option key={action.label} value={index}>
                    {action.label}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.managementField}>
              <span>Request data</span>
              <textarea
                rows={10}
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
            </label>

            <button
              type="button"
              className={styles.applyButton}
              disabled={busy || !user}
              onClick={() => void submit()}
            >
              {busy ? "Applying…" : "Apply action"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
