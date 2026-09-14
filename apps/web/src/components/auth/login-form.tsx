"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AUTH_ROUTES } from "@future-fit/config";
import type { AuthResult } from "@future-fit/types";
import { loginSchema } from "@future-fit/validation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AUTH_LINKS } from "@/config/auth.constants";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import { AuthMessage } from "./auth-message";
import { FormField } from "./form-field";
import { BotChallenge } from "./bot-challenge";

type Fields = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState("");
  const [challengeKey, setChallengeKey] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({ resolver: zodResolver(loginSchema) });
  const submit = handleSubmit(async (values) => {
    setError("");
    try {
      const result = await apiRequest<AuthResult>(AUTH_ROUTES.login, {
        method: "POST",
        headers: { "x-turnstile-token": challenge },
        body: JSON.stringify(values),
      });
      setAuth(result);
      router.replace(AUTH_LINKS.dashboard);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
    } finally {
      setChallengeKey((key) => key + 1);
    }
  });
  return (
    <form onSubmit={(event) => void submit(event)} className="auth-form">
      <AuthMessage>{error}</AuthMessage>
      <BotChallenge key={challengeKey} action="login" onToken={setChallenge} />
      <FormField
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <FormField
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="Enter your password"
        error={errors.password?.message}
        {...register("password")}
      />
      <div className="form-row">
        <label className="remember">
          <input type="checkbox" /> Remember me
        </label>
        <Link href={AUTH_LINKS.forgotPassword}>Forgot password?</Link>
      </div>
      <button className="button auth-submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
      <p className="auth-switch">
        New to Future Fit?{" "}
        <Link href={AUTH_LINKS.register}>Create an account</Link>
      </p>
    </form>
  );
}
