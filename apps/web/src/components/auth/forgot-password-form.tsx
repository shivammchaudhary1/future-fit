"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AUTH_ROUTES } from "@future-fit/config";
import { forgotPasswordSchema } from "@future-fit/validation";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AUTH_LINKS } from "@/config/auth.constants";
import { apiRequest } from "@/lib/api-client";
import { AuthMessage } from "./auth-message";
import { FormField } from "./form-field";
import { BotChallenge } from "./bot-challenge";

type Fields = z.infer<typeof forgotPasswordSchema>;
export function ForgotPasswordForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState("");
  const [challengeKey, setChallengeKey] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(forgotPasswordSchema) });
  const submit = handleSubmit(async (values) => {
    setError("");
    try {
      const result = await apiRequest<{ message: string }>(
        AUTH_ROUTES.forgotPassword,
        {
          method: "POST",
          headers: { "x-turnstile-token": challenge },
          body: JSON.stringify(values),
        },
      );
      setMessage(result.message);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to send recovery instructions.",
      );
    } finally {
      setChallengeKey((key) => key + 1);
    }
  });
  return (
    <form onSubmit={(event) => void submit(event)} className="auth-form">
      <AuthMessage>{error}</AuthMessage>
      <BotChallenge
        key={challengeKey}
        action="forgot-password"
        onToken={setChallenge}
      />
      <AuthMessage kind="success">{message}</AuthMessage>
      {!message && (
        <>
          <FormField
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <button className="button auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send reset link"}
          </button>
        </>
      )}
      <p className="auth-switch">
        <Link href={AUTH_LINKS.login}>Return to sign in</Link>
      </p>
    </form>
  );
}
