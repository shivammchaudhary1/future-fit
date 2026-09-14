"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AUTH_ROUTES } from "@future-fit/config";
import { registerSchema } from "@future-fit/validation";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AUTH_LINKS } from "@/config/auth.constants";
import { apiRequest } from "@/lib/api-client";
import { AuthMessage } from "./auth-message";
import { FormField } from "./form-field";
import { BotChallenge } from "./bot-challenge";

type Fields = z.input<typeof registerSchema>;

export function RegisterForm() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState("");
  const [challengeKey, setChallengeKey] = useState(0);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({
    resolver: zodResolver(registerSchema),
    defaultValues: { preferredLanguage: "en" },
  });
  const submit = handleSubmit(async (values) => {
    setError("");
    try {
      const result = await apiRequest<{ message: string }>(
        AUTH_ROUTES.register,
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
          : "Unable to create your account.",
      );
    } finally {
      setChallengeKey((key) => key + 1);
    }
  });
  if (message)
    return (
      <div className="auth-complete">
        <AuthMessage kind="success">{message}</AuthMessage>
        <Link className="button auth-submit" href={AUTH_LINKS.login}>
          Go to sign in
        </Link>
      </div>
    );
  return (
    <form onSubmit={(event) => void submit(event)} className="auth-form">
      <AuthMessage>{error}</AuthMessage>
      <BotChallenge
        key={challengeKey}
        action="register"
        onToken={setChallenge}
      />
      <div className="field-grid">
        <FormField
          label="First name"
          autoComplete="given-name"
          placeholder="Aditi"
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <FormField
          label="Last name"
          autoComplete="family-name"
          placeholder="Sharma"
          error={errors.lastName?.message}
          {...register("lastName")}
        />
      </div>
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
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={errors.password?.message}
        {...register("password")}
      />
      <label className="form-field">
        <span>Preferred language</span>
        <select {...register("preferredLanguage")}>
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
        </select>
      </label>
      <button className="button auth-submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create my account"}
      </button>
      <p className="legal">
        By continuing, you agree to our Terms and Privacy Policy.
      </p>
      <p className="auth-switch">
        Already have an account? <Link href={AUTH_LINKS.login}>Sign in</Link>
      </p>
    </form>
  );
}
