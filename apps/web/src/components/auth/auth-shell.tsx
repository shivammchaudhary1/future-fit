import { ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link href="/" className="back">
          <ArrowLeft /> Back to home
        </Link>
        <div className="auth-brand">
          <span className="brand-mark">F</span>
          <strong>
            Future<span>Fit</span>
          </strong>
        </div>
        <div>
          <p className="eyebrow">
            <Sparkles /> Career guidance that feels personal
          </p>
          <h1>
            Same student.
            <br />
            <span>A brighter future.</span>
          </h1>
          <p>
            Scientific assessments meet practical guidance for Indian students.
          </p>
          <ul>
            <li>
              <CheckCircle2 />
              Understand your unique strengths
            </li>
            <li>
              <CheckCircle2 />
              Explore careers that genuinely fit
            </li>
            <li>
              <CheckCircle2 />
              Build a clear education action plan
            </li>
          </ul>
        </div>
        <small>Designed for Classes 9–12 • English & Hindi</small>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <h2>{title}</h2>
          <p className="auth-subtitle">{subtitle}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
