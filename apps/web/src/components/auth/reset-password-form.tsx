"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AUTH_ROUTES } from "@future-fit/config";
import { resetPasswordSchema } from "@future-fit/validation";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AUTH_LINKS } from "@/config/auth.constants";
import { apiRequest } from "@/lib/api-client";
import { AuthMessage } from "./auth-message";
import { FormField } from "./form-field";

type Fields = z.infer<typeof resetPasswordSchema>;
export function ResetPasswordForm({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Fields>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });
  const submit = handleSubmit(async (values) => {
    setError("");
    try {
      const result = await apiRequest<{ message: string }>(
        AUTH_ROUTES.resetPassword,
        { method: "POST", body: JSON.stringify(values) },
      );
      setMessage(result.message);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to reset password.",
      );
    }
  });
  return (
    <form onSubmit={(event) => void submit(event)} className="auth-form">
      <input type="hidden" {...register("token")} />
      <AuthMessage>{error || errors.token?.message}</AuthMessage>
      <AuthMessage kind="success">{message}</AuthMessage>
      {!message && (
        <>
          <FormField
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.password?.message}
            {...register("password")}
          />
          <button className="button auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating…" : "Set new password"}
          </button>
        </>
      )}
      {message && (
        <Link className="button auth-submit" href={AUTH_LINKS.login}>
          Sign in
        </Link>
      )}
    </form>
  );
}
