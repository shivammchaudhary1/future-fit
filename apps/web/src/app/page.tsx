import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  Compass,
  GraduationCap,
  HeartHandshake,
  Languages,
  PlayCircle,
  School,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

const assessments = [
  {
    icon: Compass,
    title: 'Interest Assessment',
    text: 'What excites you?',
    tone: 'mint',
  },
  {
    icon: BrainCircuit,
    title: 'Personality Assessment',
    text: 'How you think & work',
    tone: 'violet',
  },
  {
    icon: BarChart3,
    title: 'Aptitude Assessment',
    text: 'Find your core strengths',
    tone: 'yellow',
  },
  {
    icon: HeartHandshake,
    title: 'Career Recommendations',
    text: 'Best careers for you',
    tone: 'coral',
  },
  {
    icon: GraduationCap,
    title: 'Education Path',
    text: 'Courses, exams & colleges',
    tone: 'blue',
  },
  {
    icon: Sparkles,
    title: 'AI-Powered Insights',
    text: 'Personalized & actionable',
    tone: 'violet',
  },
];

const steps = [
  ['01', 'Take Assessments', 'Answer thoughtful, research-based questions.'],
  [
    '02',
    'Understand Your Profile',
    'See your interests, strengths, values and personality.',
  ],
  [
    '03',
    'Explore Career Matches',
    'Discover suitable careers with clear reasoning.',
  ],
  [
    '04',
    'Plan Your Next Steps',
    'Choose subjects, courses, exams and skills confidently.',
  ],
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header shell">
        <a className="brand" href="#" aria-label="Future Fit home">
          <span className="brand-mark">F</span>
          <span>
            <strong>
              Future<span>Fit</span>
            </strong>
            <small>Discover Today, Build Tomorrow.</small>
          </span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#assessments">Assessments</a>
          <a href="#schools">For Schools</a>
          <a href="#careers">Career Library</a>
          <a href="#how">How It Works</a>
        </nav>
        <div className="header-actions">
          <button className="language">
            <Languages size={17} /> EN <span>हिंदी</span>
          </button>
          <a className="login" href="/login">
            Log in
          </a>
          <a className="button small" href="/register">
            Get Started
          </a>
        </div>
      </header>

      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <Sparkles size={15} /> AI-powered guidance for Indian students
            </p>
            <h1>
              Find the right <span>future</span> for you.
            </h1>
            <p className="lede">
              Personalized career guidance through scientific assessments and
              AI-powered insights—designed for students in Classes 9–12.
            </p>
            <div className="benefits">
              <span>
                <CheckCircle2 />
                Know your strengths
              </span>
              <span>
                <CheckCircle2 />
                Explore real options
              </span>
              <span>
                <CheckCircle2 />
                Plan with confidence
              </span>
            </div>
            <div className="hero-actions">
              <a className="button" href="/register">
                Start Your Assessment <ArrowRight />
              </a>
              <a className="button secondary" href="#how">
                <PlayCircle /> See How It Works
              </a>
            </div>
            <p className="trust">
              <Users /> Join students across India building a brighter future.
            </p>
          </div>
          <div
            className="hero-art"
            aria-label="A student's journey from discovery to confident planning"
          >
            <div className="sun" />
            <div className="orbit one">Discover</div>
            <div className="orbit two">Explore</div>
            <div className="orbit three">Plan</div>
            <div className="student-card">
              <div className="avatar">
                <GraduationCap />
              </div>
              <strong>
                Same student.
                <br />
                <em>A brighter future.</em>
              </strong>
              <p>Your path begins with understanding yourself.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="assessment-strip shell" id="assessments">
        {assessments.map(({ icon: Icon, title, text, tone }) => (
          <article key={title}>
            <span className={`round-icon ${tone}`}>
              <Icon />
            </span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="indian shell" id="schools">
        <div>
          <p className="section-kicker">Made for India</p>
          <h2>Built around every student&apos;s reality</h2>
          <p>
            Guidance that understands school stages, Indian education pathways
            and bilingual families.
          </p>
        </div>
        <div className="feature-grid">
          <span>
            <School />
            Classes 9–12
          </span>
          <span>
            <Target />
            Indian pathways
          </span>
          <span>
            <Languages />
            English & Hindi
          </span>
          <span>
            <Users />
            Students, parents & schools
          </span>
        </div>
      </section>

      <section className="how shell" id="how">
        <p className="section-kicker">A simple journey</p>
        <h2>How Future Fit works</h2>
        <div className="steps">
          {steps.map(([number, title, text]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta shell">
        <div>
          <p className="section-kicker">Your future is worth exploring</p>
          <h2>Ready to discover your Future Fit?</h2>
          <p>Start with self-discovery. Finish with a practical plan.</p>
        </div>
        <a className="button" href="/register">
          Get Started Now <ArrowRight />
        </a>
      </section>

      <footer className="shell">
        <div className="brand">
          <span className="brand-mark">F</span>
          <span>
            <strong>
              Future<span>Fit</span>
            </strong>
            <small>Discover Today, Build Tomorrow.</small>
          </span>
        </div>
        <p>© 2026 Future Fit. Built for brighter futures in India.</p>
      </footer>
    </main>
  );
}
