import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  Sparkles,
  Target,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { ASSETS } from "@/config/assets";

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
        <div className="auth-story-top">
          <Link href="/" className="auth-back">
            <ArrowLeft />
            Back to home
          </Link>

          <Link href="/" className="auth-brand" aria-label="Future Fit home">
            <Image
              src={ASSETS.brand.logoPrimary}
              alt="Future Fit"
              width={250}
              height={76}
              priority
            />
          </Link>
        </div>

        <div className="auth-story-content">
          <p className="auth-eyebrow">
            <Sparkles />
            Career guidance that feels personal
          </p>

          <h1>
            Discover your path.
            <span> Build with confidence.</span>
          </h1>

          <p className="auth-story-copy">
            Structured assessments, practical guidance and a clear next-step
            plan for Indian students.
          </p>

          <ul className="auth-benefits">
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
              Build a clearer education action plan
            </li>
          </ul>

          <div className="auth-mini-cards" aria-hidden="true">
            <span>
              <Compass />
              Explore
            </span>
            <span>
              <Target />
              Plan
            </span>
          </div>
        </div>

        <p className="auth-story-note">
          Designed for Classes 9–12 · English & Hindi
        </p>
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <Image
              src={ASSETS.brand.logoPrimary}
              alt="Future Fit"
              width={220}
              height={68}
              priority
            />
          </div>

          <div className="auth-card-heading">
            <h2>{title}</h2>
            <p className="auth-subtitle">{subtitle}</p>
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}
