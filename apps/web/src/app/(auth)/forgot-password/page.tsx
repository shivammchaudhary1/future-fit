import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AUTH_COPY } from "@/config/auth.constants";
export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title={AUTH_COPY.forgotTitle}
      subtitle={AUTH_COPY.forgotSubtitle}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
