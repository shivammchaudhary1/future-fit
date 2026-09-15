"use client";

import type { LucideIcon } from "lucide-react";
import { Home, LogOut, Menu, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { ASSETS } from "@/config/assets";
import { AUTH_LINKS } from "@/config/auth.constants";
import { useAuthStore } from "@/stores/auth.store";

import styles from "./dashboard.module.css";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function DashboardShell({
  roleLabel,
  title,
  description,
  navItems,
  children,
  accent,
}: {
  roleLabel: string;
  title: string;
  description?: string;
  navItems: DashboardNavItem[];
  children: ReactNode;
  accent?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "FF";

  async function signOut() {
    await logout();
    router.replace(AUTH_LINKS.login);
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.sidebarBrand} aria-label="Future Fit home">
          <Image
            src={ASSETS.brand.logoPrimary}
            alt="Future Fit"
            width={220}
            height={68}
            priority
          />
        </Link>

        <div className={styles.roleBadge}>
          <Sparkles size={14} />
          {roleLabel}
        </div>

        <nav className={styles.sidebarNav} aria-label={`${roleLabel} navigation`}>
          {navItems.map(({ label, href, icon: Icon }) => {
            const active =
              href.startsWith("#")
                ? false
                : pathname === href ||
                  (href !== "/" && pathname.startsWith(`${href}/`));

            return (
              <Link
                key={`${label}-${href}`}
                href={href}
                className={active ? styles.navItemActive : styles.navItem}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.backHome}>
            <Home size={17} />
            Public website
          </Link>

          <button type="button" className={styles.signOut} onClick={() => void signOut()}>
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.mobileBar}>
            <Link href="/" className={styles.mobileBrand} aria-label="Future Fit home">
              <Image
                src={ASSETS.brand.logoIcon}
                alt="Future Fit"
                width={44}
                height={44}
                priority
              />
            </Link>

            <details className={styles.mobileMenu}>
              <summary aria-label="Open dashboard menu">
                <Menu size={22} />
              </summary>

              <div className={styles.mobileMenuPanel}>
                <strong>{roleLabel}</strong>

                <nav>
                  {navItems.map(({ label, href, icon: Icon }) => (
                    <Link key={`${label}-${href}`} href={href}>
                      <Icon size={17} />
                      {label}
                    </Link>
                  ))}
                </nav>

                <button type="button" onClick={() => void signOut()}>
                  <LogOut size={17} />
                  Sign out
                </button>
              </div>
            </details>
          </div>

          <div className={styles.topbarCopy}>
            <span>{roleLabel}</span>
            <strong>{title}</strong>
          </div>

          <div className={styles.userChip}>
            <span className={styles.avatar}>{initials}</span>

            <div>
              <strong>
                {user ? `${user.firstName} ${user.lastName}`.trim() : "Future Fit"}
              </strong>
              <small>{user?.email ?? roleLabel}</small>
            </div>
          </div>
        </header>

        <div className={styles.content}>
          <section className={styles.pageHeading}>
            <div>
              <span className={styles.pageEyebrow}>{roleLabel}</span>
              <h1>{title}</h1>
              {description ? <p>{description}</p> : null}
            </div>

            {accent ? <div className={styles.pageAccent}>{accent}</div> : null}
          </section>

          {children}
        </div>
      </section>
    </main>
  );
}
