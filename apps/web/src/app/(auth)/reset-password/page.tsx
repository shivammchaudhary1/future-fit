import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Use a strong password you haven’t used before."
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
