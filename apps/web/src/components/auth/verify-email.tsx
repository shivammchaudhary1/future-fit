"use client";

import { AUTH_ROUTES } from "@future-fit/config";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_LINKS } from "@/config/auth.constants";
import { apiRequest } from "@/lib/api-client";
import { AuthMessage } from "./auth-message";

export function VerifyEmail({ token }: { token: string }) {
  const [state, setState] = useState<{
    loading: boolean;
    message: string;
    error: string;
  }>({ loading: true, message: "", error: "" });
  useEffect(() => {
    if (!token) {
      setState({
        loading: false,
        message: "",
        error: "The verification link is incomplete.",
      });
      return;
    }
    apiRequest<{ message: string }>(AUTH_ROUTES.verifyEmail, {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then((result) =>
        setState({ loading: false, message: result.message, error: "" }),
      )
      .catch((caught: unknown) =>
        setState({
          loading: false,
          message: "",
          error:
            caught instanceof Error
              ? caught.message
              : "Unable to verify this email.",
        }),
      );
  }, [token]);
  if (state.loading)
    return <p className="auth-loading">Verifying your email…</p>;
  return (
    <div className="auth-complete">
      <AuthMessage kind={state.error ? "error" : "success"}>
        {state.error || state.message}
      </AuthMessage>
      <Link className="button auth-submit" href={AUTH_LINKS.login}>
        Continue to sign in
      </Link>
    </div>
  );
}
