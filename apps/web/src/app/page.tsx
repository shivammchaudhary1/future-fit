import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Compass,
  GraduationCap,
  HeartHandshake,
  Languages,
  School,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { getImageProps } from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/marketing/site-header";
import { ASSETS } from "@/config/assets";

import styles from "./page.module.css";

const assessmentFeatures = [
  {
    icon: Compass,
    title: "Interests",
    description: "Discover what naturally excites you.",
    tone: "teal",
  },

  {
    icon: BrainCircuit,
    title: "Personality",
    description: "Understand how you think and work.",
    tone: "purple",
  },

  {
    icon: BarChart3,
    title: "Aptitude",
    description: "Identify your strongest abilities.",
    tone: "yellow",
  },

  {
    icon: HeartHandshake,
    title: "Values",
    description: "Know what matters most to you.",
    tone: "coral",
  },

  {
    icon: GraduationCap,
    title: "Education Path",
    description: "Explore subjects, courses and exams.",
    tone: "blue",
  },

  {
    icon: Sparkles,
    title: "Personalized Insights",
    description: "Turn your profile into practical guidance.",
    tone: "teal",
  },
] as const;

const journeySteps = [
  {
    number: "01",
    title: "Discover Yourself",
    description:
      "Complete thoughtful assessments about your interests, strengths, personality and values.",
  },

  {
    number: "02",
    title: "Understand Your Profile",
    description:
      "See a clear picture of what makes you unique and where your natural strengths lie.",
  },

  {
    number: "03",
    title: "Explore Career Matches",
    description:
      "Discover career paths that connect your profile with meaningful real-world opportunities.",
  },

  {
    number: "04",
    title: "Build Your Roadmap",
    description:
      "Get practical next steps for subjects, skills, courses, exams and future learning.",
  },
] as const;

export default function HomePage() {
  const desktopHero = getImageProps({
    src: ASSETS.hero.female.desktop,
    alt: "Indian student exploring future career opportunities",
    width: 1920,
    height: 1080,
    priority: true,
    quality: 88,
    sizes: "(max-width: 900px) 100vw, 50vw",
  }).props;

  const mobileHero = getImageProps({
    src: ASSETS.hero.female.mobile,
    alt: "Indian student exploring future career opportunities",
    width: 1080,
    height: 1920,
    priority: true,
    quality: 88,
    sizes: "100vw",
  }).props;

  const { srcSet: desktopSrcSet, ...desktopImageProps } = desktopHero;

  return (
    <main className={styles.page}>
      <SiteHeader />

      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroGrid}>
            <div className={styles.heroContent}>
              <div className={styles.eyebrow}>
                <Sparkles size={16} />

                <span>Personalized career guidance</span>
              </div>

              <h1 className={styles.heroTitle}>
                Discover your path.
                <span>Build a future that fits you.</span>
              </h1>

              <p className={styles.heroDescription}>
                Understand your interests, strengths and personality through
                structured assessments — then explore careers and education
                paths that make sense for you.
              </p>

              <div className={styles.heroBenefits}>
                <span>
                  <CheckCircle2 />
                  Know yourself
                </span>

                <span>
                  <CheckCircle2 />
                  Explore possibilities
                </span>

                <span>
                  <CheckCircle2 />
                  Plan confidently
                </span>
              </div>

              <div className={styles.heroActions}>
                <Link href="/register" className={styles.primaryButton}>
                  Start Your Journey
                  <ArrowRight size={19} />
                </Link>

                <Link href="#how" className={styles.secondaryButton}>
                  See How It Works
                </Link>
              </div>

              <p className={styles.studentNote}>
                <Users size={18} />
                Designed for students in Classes 9–12.
              </p>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.heroImageContainer}>
                <picture>
                  <source
                    media="(max-width: 720px)"
                    srcSet={mobileHero.srcSet}
                  />

                  <img
                    {...desktopImageProps}
                    srcSet={desktopSrcSet}
                    className={styles.heroImage}
                  />
                </picture>

                <div className={styles.floatingCardTop}>
                  <span className={styles.floatingIcon}>
                    <Compass size={19} />
                  </span>

                  <div>
                    <strong>Discover yourself</strong>

                    <small>Interests · Strengths</small>
                  </div>
                </div>

                <div className={styles.floatingCardBottom}>
                  <span className={styles.floatingIconYellow}>
                    <Target size={19} />
                  </span>

                  <div>
                    <strong>Find your direction</strong>

                    <small>Careers · Education</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.assessmentSection} id="assessments">
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <span className={styles.sectionLabel}>Your complete profile</span>

            <h2>More than just a career quiz.</h2>

            <p>
              Future Fit combines multiple dimensions of self-discovery to help
              students make more informed choices.
            </p>
          </div>

          <div className={styles.assessmentGrid}>
            {assessmentFeatures.map(
              ({ icon: Icon, title, description, tone }) => (
                <article className={styles.assessmentCard} key={title}>
                  <span className={`${styles.featureIcon} ${styles[tone]}`}>
                    <Icon size={25} />
                  </span>

                  <h3>{title}</h3>

                  <p>{description}</p>
                </article>
              ),
            )}
          </div>
        </div>
      </section>

      <section className={styles.indiaSection} id="schools">
        <div className={`${styles.container} ${styles.indiaGrid}`}>
          <div className={styles.indiaCopy}>
            <span className={styles.sectionLabel}>Designed for India</span>

            <h2>Guidance that understands where students are coming from.</h2>

            <p>
              Built for Indian students, families and schools with relevant
              education pathways and clear, student-friendly guidance.
            </p>

            <Link href="/register" className={styles.textLink}>
              Start exploring
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className={styles.indiaFeatures}>
            <article>
              <School />

              <div>
                <strong>Classes 9–12</strong>

                <span>Guidance at important school decision points.</span>
              </div>
            </article>

            <article>
              <Target />

              <div>
                <strong>Indian pathways</strong>

                <span>
                  Courses, skills and education routes relevant to India.
                </span>
              </div>
            </article>

            <article>
              <Languages />

              <div>
                <strong>English + Hindi</strong>

                <span>
                  Designed to support bilingual students and families.
                </span>
              </div>
            </article>

            <article>
              <Users />

              <div>
                <strong>Student-centered</strong>

                <span>
                  Useful for students, parents, counsellors and schools.
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.journeySection} id="how">
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <span className={styles.sectionLabel}>Simple by design</span>

            <h2>From curiosity to clarity.</h2>

            <p>
              A guided journey that turns self-discovery into practical next
              steps.
            </p>
          </div>

          <div className={styles.steps}>
            {journeySteps.map(({ number, title, description }) => (
              <article className={styles.step} key={number}>
                <span className={styles.stepNumber}>{number}</span>

                <h3>{title}</h3>

                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={`${styles.container} ${styles.cta}`}>
          <div>
            <span className={styles.sectionLabel}>
              Discover today. Build tomorrow.
            </span>

            <h2>Your future starts with understanding yourself.</h2>

            <p>Take the first step toward a path that feels right for you.</p>
          </div>

          <Link href="/register" className={styles.primaryButton}>
            Get Started
            <ArrowRight size={19} />
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <div className={styles.footerBrand}>
            <img
              src={ASSETS.brand.logoPrimary}
              alt="Future Fit"
              width={175}
              height={55}
            />

            <p>Discover Today, Build Tomorrow.</p>
          </div>

          <div className={styles.footerLinks}>
            <Link href="#assessments">Assessments</Link>

            <Link href="/careers">Careers</Link>

            <Link href="/login">Login</Link>

            <Link href="/register">Sign up</Link>
          </div>

          <p className={styles.copyright}>
            © {new Date().getFullYear()} Future Fit. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
