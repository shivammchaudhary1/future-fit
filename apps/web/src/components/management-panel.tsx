"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
export interface ManagementAction {
  label: string;
  path: string;
  method?: "POST" | "PATCH";
  template: Record<string, unknown>;
}
export function ManagementPanel({
  title,
  readPath,
  actions = [],
}: {
  title: string;
  readPath: string;
  actions?: ManagementAction[];
}) {
  const user = useAuthStore((s) => s.user);
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section>
      <h2>{title}</h2>
      {data.isLoading && <p>Loading…</p>}
      {(error || data.error) && (
        <p role="alert">{error || data.error?.message}</p>
      )}
      <pre style={{ overflowX: "auto", maxHeight: 420 }}>
        {JSON.stringify(data.data ?? [], null, 2)}
      </pre>
      {lastResult !== undefined && (
        <div role="status">
          <p>Action completed. Returned record:</p>
          <pre style={{ overflowX: "auto", maxHeight: 420 }}>
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        </div>
      )}
      {actions.length > 0 && (
        <>
          <label>
            Action{" "}
            <select
              value={selection}
              onChange={(e) => {
                const index = Number(e.target.value);
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
          <label>
            Request data
            <textarea
              rows={12}
              style={{ width: "100%", fontFamily: "monospace" }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </label>
          <button disabled={busy || !user} onClick={() => void submit()}>
            Apply
          </button>
        </>
      )}
    </section>
  );
}
