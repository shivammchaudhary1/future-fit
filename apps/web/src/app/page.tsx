import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  GraduationCap,
  HeartHandshake,
  Languages,
  MapPinned,
  Rocket,
  School,
  Sparkles,
  Target,
  UserRound,
  Users,
} from "lucide-react";
import { getImageProps } from "next/image";
import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/marketing/site-header";
import { ASSETS } from "@/config/assets";

import styles from "./page.module.css";

const assessments = [
  {
    icon: Compass,
    title: "Interest Assessment",
    subtitle: "What excites you?",
    tone: "purple",
  },
  {
    icon: BrainCircuit,
    title: "Personality Assessment",
    subtitle: "How you think & work",
    tone: "mint",
  },
  {
    icon: BarChart3,
    title: "Aptitude Assessment",
    subtitle: "Find your core strengths",
    tone: "yellow",
  },
  {
    icon: HeartHandshake,
    title: "Career Recommendations",
    subtitle: "Best careers for you",
    tone: "coral",
  },
  {
    icon: GraduationCap,
    title: "Education Path",
    subtitle: "Courses, exams & colleges",
    tone: "blue",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    subtitle: "Personalized & actionable",
    tone: "purple",
  },
] as const;

const steps = [
  {
    number: "1",
    icon: ClipboardCheck,
    title: "Take Assessments",
    text: "Answer thoughtful, research-based questions about yourself.",
    tone: "mint",
  },
  {
    number: "2",
    icon: BrainCircuit,
    title: "Understand Your Profile",
    text: "See your interests, strengths, values and personality together.",
    tone: "coral",
  },
  {
    number: "3",
    icon: Target,
    title: "Explore Career Matches",
    text: "Discover careers that fit your profile with clear reasons why.",
    tone: "yellow",
  },
  {
    number: "4",
    icon: Rocket,
    title: "Plan Your Next Steps",
    text: "Get subject, course, exam and skill recommendations.",
    tone: "blue",
  },
] as const;

const testimonials = [
  {
    quote:
      "Future Fit helped me understand my strengths and gave me career options I had never considered.",
    name: "Rohan Mehta",
    role: "Class 10 student",
  },
  {
    quote:
      "The report made the conversation with my child much clearer and more practical.",
    name: "Neha Verma",
    role: "Parent",
  },
  {
    quote:
      "The school view gives us a simple way to support students without losing the individual context.",
    name: "School Counsellor",
    role: "Indore",
  },
] as const;

export default function HomePage() {
  const desktopHero = getImageProps({
    src: ASSETS.hero.male.desktop,
    alt: "Indian senior-school student thinking about future career possibilities",
    width: 1920,
    height: 1080,
    priority: true,
    quality: 88,
    sizes: "(max-width: 860px) 100vw, 50vw",
  }).props;

  const mobileHero = getImageProps({
    src: ASSETS.hero.male.mobile,
    alt: "Indian senior-school student thinking about future career possibilities",
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
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <div className={styles.eyebrow}>
              <Sparkles size={15} />
              AI-powered career guidance for Indian students
            </div>

            <h1>
              Find the Right
              <span> Future </span>
              for You
            </h1>

            <p className={styles.heroLead}>
              Personalized career guidance through structured assessments and
              AI-assisted insights — designed for students in Classes 9–12.
            </p>

            <div className={styles.heroChecks}>
              <span>
                <CheckCircle2 />
                Know Your Strengths
              </span>
              <span>
                <CheckCircle2 />
                Explore Real Options
              </span>
              <span>
                <CheckCircle2 />
                Plan with Confidence
              </span>
            </div>

            <div className={styles.heroActions}>
              <Link href="/register" className={styles.primaryButton}>
                Start Your Assessment
                <ArrowRight size={18} />
              </Link>

              <Link href="#how" className={styles.secondaryButton}>
                See How It Works
              </Link>
            </div>

            <div className={styles.trustRow}>
              <div className={styles.avatarStack} aria-hidden="true">
                <span>R</span>
                <span>A</span>
                <span>N</span>
                <span>S</span>
              </div>
              <p>Built to help students make clearer decisions about their future.</p>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.heroGlow} />

            <div className={styles.stickyNote}>
              Same student.
              <br />
              A brighter future.
            </div>

            <picture>
              <source media="(max-width: 720px)" srcSet={mobileHero.srcSet} />
              <img
                {...desktopImageProps}
                srcSet={desktopSrcSet}
                className={styles.heroImage}
              />
            </picture>

            <div className={`${styles.heroPill} ${styles.pillOne}`}>
              <Compass />
              Explore Careers
            </div>
            <div className={`${styles.heroPill} ${styles.pillTwo}`}>
              <UserRound />
              Understand Yourself
            </div>
            <div className={`${styles.heroPill} ${styles.pillThree}`}>
              <Sparkles />
              Get AI Guidance
            </div>
            <div className={`${styles.heroPill} ${styles.pillFour}`}>
              <BarChart3 />
              Plan Your Path
            </div>
          </div>
        </div>
      </section>

      <section className={styles.assessmentBand} id="assessments">
        <div className={`${styles.container} ${styles.assessmentGrid}`}>
          {assessments.map(({ icon: Icon, title, subtitle, tone }) => (
            <article key={title} className={styles.assessmentItem}>
              <span
                className={`${styles.assessmentIcon} ${styles[tone]}`}
                aria-hidden="true"
              >
                <Icon />
              </span>
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.indiaSection} id="schools">
        <div className={`${styles.container} ${styles.indiaPanel}`}>
          <div className={styles.indiaContent}>
            <span className={styles.sectionLabel}>Made for India</span>
            <h2>Built for Indian Students</h2>
            <p>
              Because every student&apos;s journey is unique — and guidance
              should understand the education choices they actually face.
            </p>

            <div className={styles.indiaFeatures}>
              <article>
                <GraduationCap />
                <strong>Classes 9–12</strong>
                <span>Focused guidance at key decision points.</span>
              </article>

              <article>
                <MapPinned />
                <strong>Indian Education</strong>
                <span>Relevant streams, courses, exams and pathways.</span>
              </article>

              <article>
                <Languages />
                <strong>English & Hindi</strong>
                <span>Designed for bilingual students and families.</span>
              </article>

              <article>
                <Users />
                <strong>Students & Schools</strong>
                <span>Personal use plus school-supported assessment journeys.</span>
              </article>
            </div>
          </div>

          <div className={styles.indiaVisual}>
            <div className={styles.dreamBubble}>
              Big dreams
              <br />
              start with
              <br />
              self-discovery.
            </div>
            <div className={styles.indiaIllustration}>
              <School />
              <div>
                <strong>One student. One profile.</strong>
                <span>A clearer path forward.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.howSection} id="how">
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <span className={styles.sectionLabel}>A simple journey</span>
            <h2>How It Works</h2>
            <p>A clear step-by-step path from self-discovery to next steps.</p>
          </div>

          <div className={styles.steps}>
            {steps.map(({ number, icon: Icon, title, text, tone }, index) => (
              <article className={styles.stepCard} key={number}>
                <span className={styles.stepNumber}>{number}</span>
                <span className={`${styles.stepIcon} ${styles[tone]}`}>
                  <Icon />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
                {index < steps.length - 1 ? (
                  <ArrowRight className={styles.stepArrow} aria-hidden="true" />
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.reportSection} id="sample-report">
        <div className={`${styles.container} ${styles.reportPanel}`}>
          <div className={styles.reportHeading}>
            <span className={styles.sectionLabel}>See the outcome</span>
            <h2>See a Sample Report</h2>
            <p>Clear, simple and actionable career insights.</p>
          </div>

          <div className={styles.reportLayout}>
            <aside className={styles.reportNav}>
              <strong>Report Sections</strong>
              <span className={styles.reportNavActive}>Career Matches</span>
              <span>Strengths & Traits</span>
              <span>Recommended Subjects</span>
              <span>Education Path</span>
              <span>Action Plan</span>
            </aside>

            <div className={styles.reportCard}>
              <div className={styles.reportCardHeader}>
                <div>
                  <span>Your profile</span>
                  <h3>Your Top Career Matches</h3>
                </div>
                <Link href="/register">
                  View Full Report <ArrowRight size={15} />
                </Link>
              </div>

              {[
                ["Software Engineer", "92%"],
                ["Data Scientist", "87%"],
                ["UX/UI Designer", "82%"],
                ["Product Manager", "76%"],
                ["Research Scientist", "71%"],
              ].map(([career, score], index) => (
                <div className={styles.careerRow} key={career}>
                  <span className={styles.rank}>{index + 1}</span>
                  <strong>{career}</strong>
                  <div className={styles.matchBar}>
                    <span style={{ width: score }} />
                  </div>
                  <b>{score} match</b>
                </div>
              ))}
            </div>

            <blockquote className={styles.reportQuote}>
              <span>“</span>
              This report helps turn assessment results into choices a student
              can actually understand and discuss.
              <footer>Sample student report</footer>
            </blockquote>
          </div>
        </div>
      </section>

      <section className={styles.testimonialsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <span className={styles.sectionLabel}>Built for real decisions</span>
            <h2>Students, Parents & Schools</h2>
            <p>
              Different people need different views of the same journey — while
              the student stays at the center.
            </p>
          </div>

          <div className={styles.testimonials}>
            {testimonials.map((item) => (
              <article key={item.name}>
                <div className={styles.stars}>★★★★★</div>
                <p>“{item.quote}”</p>
                <strong>{item.name}</strong>
                <span>{item.role}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className={`${styles.container} ${styles.ctaPanel}`}>
          <div>
            <span className={styles.sectionLabel}>
              Discover Today, Build Tomorrow.
            </span>
            <h2>Ready to discover your Future Fit?</h2>
            <p>Take the first step towards a brighter, better-planned future.</p>
          </div>

          <div className={styles.ctaActions}>
            <Link href="/register" className={styles.primaryButton}>
              Get Started Now
              <ArrowRight size={18} />
            </Link>
            <Link href="#schools" className={styles.secondaryButton}>
              For Schools & Institutions
            </Link>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerGrid}`}>
          <div className={styles.footerBrand}>
            <Image
              src={ASSETS.brand.logoPrimary}
              alt="Future Fit"
              width={210}
              height={65}
            />
            <p>Discover Today, Build Tomorrow.</p>
          </div>

          <div className={styles.footerColumn}>
            <strong>Product</strong>
            <Link href="#assessments">Assessments</Link>
            <Link href="/careers">Career Library</Link>
            <Link href="#sample-report">Sample Report</Link>
          </div>

          <div className={styles.footerColumn}>
            <strong>For Schools</strong>
            <Link href="#schools">Overview</Link>
            <Link href="#how">How It Works</Link>
            <Link href="/register">Get Started</Link>
          </div>

          <div className={styles.footerColumn}>
            <strong>Account</strong>
            <Link href="/login">Login</Link>
            <Link href="/register">Create Account</Link>
            <Link href="/forgot-password">Forgot Password</Link>
          </div>
        </div>

        <div className={`${styles.container} ${styles.footerBottom}`}>
          <span>© {new Date().getFullYear()} Future Fit. All rights reserved.</span>
          <span>Built for brighter futures in India.</span>
        </div>
      </footer>
    </main>
  );
}
