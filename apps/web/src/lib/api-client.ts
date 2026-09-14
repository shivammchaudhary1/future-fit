import { API_URL } from "@/config/auth.constants";
import type { AuthResult } from "@future-fit/types";

let refreshing: Promise<AuthResult> | undefined;
export function refreshSession(): Promise<AuthResult> {
  const refresh = () =>
    apiRequest<AuthResult>("/auth/refresh", { method: "POST" }, false);
  refreshing ??= Promise.resolve(
    typeof navigator !== "undefined" && navigator.locks
      ? navigator.locks.request("future-fit-refresh", refresh)
      : refresh(),
  ).finally(() => {
    refreshing = undefined;
  });
  return refreshing;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const csrf =
    typeof document === "undefined"
      ? undefined
      : document.cookie
          .split("; ")
          .find((item) => item.startsWith("ff_csrf="))
          ?.split("=")[1];
  if (
    csrf &&
    init.method &&
    !["GET", "HEAD", "OPTIONS"].includes(init.method.toUpperCase())
  )
    headers.set("x-csrf-token", decodeURIComponent(csrf));
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (
    response.status === 401 &&
    retry &&
    (!path.startsWith("/auth/") ||
      path === "/auth/logout" ||
      path.startsWith("/auth/sessions"))
  ) {
    try {
      await refreshSession();
      return apiRequest<T>(path, init, false);
    } catch {
      /* Preserve the original authentication error. */
    }
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      message?: string;
      error?: { message?: string; code?: string };
    } | null;
    throw new ApiClientError(
      body?.error?.message ??
        body?.message ??
        "Something went wrong. Please try again.",
      response.status,
      body?.error?.code,
    );
  }
  if (response.status === 204) return undefined as T;
  const body = (await response.json()) as { data: T };
  return body.data;
}
