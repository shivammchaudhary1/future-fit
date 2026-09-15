import { Languages, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ASSETS } from "@/config/assets";

import styles from "./site-header.module.css";

const navigation = [
  {
    label: "Assessments",
    href: "#assessments",
  },
  {
    label: "Career Library",
    href: "/careers",
  },
  {
    label: "For Schools",
    href: "#schools",
  },
  {
    label: "How It Works",
    href: "#how",
  },
] as const;

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.brand} aria-label="Future Fit home">
          <Image
            src={ASSETS.brand.logoPrimary}
            alt="Future Fit"
            width={230}
            height={72}
            priority
            className={styles.logo}
          />
        </Link>

        <nav className={styles.desktopNavigation} aria-label="Main navigation">
          {navigation.map((item) => (
            <Link key={item.label} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.language}
            aria-label="Change language"
          >
            <Languages size={17} />

            <span>EN</span>

            <span className={styles.hindi}>हिंदी</span>
          </button>

          <Link href="/login" className={styles.login}>
            Log in
          </Link>

          <Link href="/register" className={styles.getStarted}>
            Get Started
          </Link>
        </div>

        <details className={styles.mobileMenu}>
          <summary aria-label="Open navigation">
            <Menu size={24} />
          </summary>

          <div className={styles.mobileMenuPanel}>
            <nav aria-label="Mobile navigation">
              {navigation.map((item) => (
                <Link key={item.label} href={item.href}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className={styles.mobileActions}>
              <Link href="/login">Log in</Link>

              <Link href="/register" className={styles.mobileCta}>
                Get Started
              </Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
