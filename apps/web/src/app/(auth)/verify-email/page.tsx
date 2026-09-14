import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmail } from "@/components/auth/verify-email";
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  return (
    <AuthShell
      title="Verify your email"
      subtitle="We’re confirming that this email belongs to you."
    >
      <VerifyEmail token={token} />
    </AuthShell>
  );
}
