"use client";
import { LogOut, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { AUTH_LINKS } from "@/config/auth.constants";
import { useAuthStore } from "@/stores/auth.store";
export default function StudentDashboard() {
  const router = useRouter();
  const { user, initialized, logout } = useAuthStore();
  useEffect(() => {
    if (initialized && !user) router.replace(AUTH_LINKS.login);
  }, [initialized, user, router]);
  if (!initialized || !user)
    return <main className="dashboard-loading">Preparing your dashboard…</main>;
  return (
    <main className="student-dashboard">
      <header>
        <Link className="brand" href="/">
          <span className="brand-mark">F</span>
          <span>
            <strong>
              Future<span>Fit</span>
            </strong>
          </span>
        </Link>
        <button
          onClick={() =>
            void logout().then(() => router.replace(AUTH_LINKS.login))
          }
        >
          <LogOut /> Sign out
        </button>
      </header>
      <section>
        <p className="eyebrow">
          <Sparkles /> Student dashboard
        </p>
        <h1>Welcome, {user.firstName}!</h1>
        <nav>
          <Link href="/student/profile">Profile</Link> ·{" "}
          <Link href="/careers">Careers</Link> ·{" "}
          <Link href="/payments">Payments</Link> ·{" "}
          <Link href="/school/dashboard">School</Link> ·{" "}
          <Link href="/teacher/dashboard">Teacher</Link> ·{" "}
          <Link href="/guardian/dashboard">Guardian</Link> ·
          <Link href="/assessments">Take an assessment</Link> ·{" "}
          <Link href="/results">Your results</Link>
        </nav>
      </section>
    </main>
  );
}
