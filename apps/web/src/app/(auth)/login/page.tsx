import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { AUTH_COPY } from "@/config/auth.constants";
export default function LoginPage() {
  return (
    <AuthShell
      title={AUTH_COPY.signInTitle}
      subtitle={AUTH_COPY.signInSubtitle}
    >
      <LoginForm />
    </AuthShell>
  );
}
