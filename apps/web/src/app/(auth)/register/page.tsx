import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { AUTH_COPY } from "@/config/auth.constants";
export default function RegisterPage() {
  return (
    <AuthShell
      title={AUTH_COPY.registerTitle}
      subtitle={AUTH_COPY.registerSubtitle}
    >
      <RegisterForm />
    </AuthShell>
  );
}
