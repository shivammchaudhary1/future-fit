"use client";

import type { AuthUser } from "@future-fit/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardCheck,
  Compass,
  CreditCard,
  FileText,
  Globe2,
  LayoutDashboard,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import styles from "@/styles/student-experience.module.css";

const navItems = [
  { label: "Overview", href: "/student/dashboard", icon: LayoutDashboard },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck },
  { label: "Results", href: "/results", icon: FileText },
  { label: "Career Library", href: "/careers", icon: Compass },
  { label: "Access & Payments", href: "/payments", icon: CreditCard },
  { label: "Profile", href: "/student/profile", icon: UserRound },
] as const;

type Grade = "9" | "10" | "11" | "12";
type Board =
  | "CBSE"
  | "CISCE"
  | "STATE_BOARD"
  | "IB"
  | "CAMBRIDGE"
  | "OTHER";
type Stream =
  | "PCM"
  | "PCB"
  | "PCMB"
  | "COMMERCE"
  | "HUMANITIES"
  | "VOCATIONAL"
  | "FLEXIBLE"
  | "UNDECIDED";

interface StudentProfile {
  grade?: Grade;
  board?: Board;
  stream?: Stream;
  state?: string;
  city?: string;
  subjects: string[];
  careerGoal?: string;
  profileComplete: boolean;
}

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [languageSaving, setLanguageSaving] = useState(false);
  const [form, setForm] = useState({
    grade: "" as Grade | "",
    board: "" as Board | "",
    stream: "UNDECIDED" as Stream,
    state: "",
    city: "",
    subjects: "",
    careerGoal: "",
  });

  const profile = useQuery({
    queryKey: ["student-profile", user?.id],
    queryFn: () => apiRequest<StudentProfile>("/students/me/profile"),
    enabled: Boolean(user),
  });

  useEffect(() => {
    if (!profile.data) return;

    setForm({
      grade: profile.data.grade ?? "",
      board: profile.data.board ?? "",
      stream: profile.data.stream ?? "UNDECIDED",
      state: profile.data.state ?? "",
      city: profile.data.city ?? "",
      subjects: profile.data.subjects.join(", "),
      careerGoal: profile.data.careerGoal ?? "",
    });
  }, [profile.data]);

  const saveProfile = useMutation({
    mutationFn: () =>
      apiRequest<StudentProfile>("/students/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          ...(form.grade ? { grade: form.grade } : {}),
          ...(form.board ? { board: form.board } : {}),
          stream: form.stream,
          state: form.state,
          city: form.city,
          subjects: form.subjects
            .split(",")
            .map((subject) => subject.trim())
            .filter(Boolean),
          careerGoal: form.careerGoal,
        }),
      }),
    onSuccess: async () => {
      setError("");
      await queryClient.invalidateQueries({
        queryKey: ["student-profile", user?.id],
      });
    },
    onError: (caught) => {
      setError(
        caught instanceof Error ? caught.message : "Student profile update failed",
      );
    },
  });

  async function language(preferredLanguage: string) {
    setLanguageSaving(true);
    setError("");

    try {
      const updated = await apiRequest<AuthUser>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ preferredLanguage }),
      });

      setAuth({ user: updated });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Language update failed",
      );
    } finally {
      setLanguageSaving(false);
    }
  }

  const initials = `${user?.firstName?.[0] ?? ""}${
    user?.lastName?.[0] ?? ""
  }`.toUpperCase();

  return (
    <DashboardShell
      roleLabel="Student Dashboard"
      title="Your student profile"
      description="Keep the education context Future Fit needs to interpret assessment results for an Indian Class 9–12 student."
      navItems={[...navItems]}
    >
      <div className={styles.pageStack}>
        {(error || profile.error) ? (
          <p className={styles.error} role="alert">
            {error || profile.error?.message}
          </p>
        ) : null}

        <section className={styles.profileGrid}>
          <article className={styles.identityCard}>
            <div className={styles.identityAvatar}>{initials || "FF"}</div>
            <h2>
              {user ? `${user.firstName} ${user.lastName}`.trim() : "Future Fit"}
            </h2>
            <p>{user?.email}</p>

            <div className={styles.identityMeta}>
              <span>
                <Mail size={14} />
                {user?.email}
              </span>
              <span>
                <Globe2 size={14} />
                {user?.preferredLanguage === "hi" ? "हिन्दी" : "English"}
              </span>
              <span>
                <ShieldCheck size={14} />
                {profile.data?.profileComplete
                  ? "Student profile ready"
                  : "Complete Class and Board to finish setup"}
              </span>
            </div>
          </article>

          <article className={styles.settingsCard}>
            <h2>Education details</h2>
            <p>
              These details are separate from your assessment scores. They will
              later be used for eligibility and pathway guidance, not to fake a
              psychological match.
            </p>

            <label className={styles.field}>
              <span>Current class</span>
              <select
                value={form.grade}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    grade: event.target.value as Grade | "",
                  }))
                }
              >
                <option value="">Select class</option>
                <option value="9">Class 9</option>
                <option value="10">Class 10</option>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Board</span>
              <select
                value={form.board}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    board: event.target.value as Board | "",
                  }))
                }
              >
                <option value="">Select board</option>
                <option value="CBSE">CBSE</option>
                <option value="CISCE">CISCE / ICSE / ISC</option>
                <option value="STATE_BOARD">State Board</option>
                <option value="IB">IB</option>
                <option value="CAMBRIDGE">Cambridge</option>
                <option value="OTHER">Other</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Current / planned stream</span>
              <select
                value={form.stream}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    stream: event.target.value as Stream,
                  }))
                }
              >
                <option value="UNDECIDED">Undecided / not applicable yet</option>
                <option value="PCM">PCM</option>
                <option value="PCB">PCB</option>
                <option value="PCMB">PCMB</option>
                <option value="COMMERCE">Commerce</option>
                <option value="HUMANITIES">Humanities</option>
                <option value="VOCATIONAL">Vocational</option>
                <option value="FLEXIBLE">Flexible subject combination</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>State</span>
              <input
                value={form.state}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    state: event.target.value,
                  }))
                }
                placeholder="e.g. Madhya Pradesh"
              />
            </label>

            <label className={styles.field}>
              <span>City</span>
              <input
                value={form.city}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    city: event.target.value,
                  }))
                }
                placeholder="e.g. Indore"
              />
            </label>

            <label className={styles.field}>
              <span>Subjects</span>
              <input
                value={form.subjects}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    subjects: event.target.value,
                  }))
                }
                placeholder="Maths, Physics, English"
              />
            </label>

            <label className={styles.field}>
              <span>Career goal, if you already have one</span>
              <textarea
                value={form.careerGoal}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    careerGoal: event.target.value,
                  }))
                }
                placeholder="Optional. It does not change your assessment score."
              />
            </label>

            <button
              type="button"
              className={styles.primaryButton}
              disabled={saveProfile.isPending}
              onClick={() => saveProfile.mutate()}
            >
              <Save size={15} />
              {saveProfile.isPending ? "Saving…" : "Save student profile"}
            </button>
          </article>
        </section>

        <section className={styles.sectionCard}>
          <header className={styles.sectionHeader}>
            <div>
              <h2>Language preference</h2>
              <p>
                Future Fit can present supported assessment content in English
                or Hindi.
              </p>
            </div>
          </header>

          <div className={styles.sectionBody}>
            <label className={styles.field}>
              <span>Preferred language</span>
              <select
                value={user?.preferredLanguage ?? "en"}
                disabled={languageSaving}
                onChange={(event) => void language(event.target.value)}
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
              </select>
            </label>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
