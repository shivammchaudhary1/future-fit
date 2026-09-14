import type { ComponentProps } from "react";

export function FormField({
  label,
  error,
  ...input
}: ComponentProps<"input"> & { label: string; error?: string }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input {...input} />
      {error ? <small role="alert">{error}</small> : null}
    </label>
  );
}
