"use client";
import { useState } from "react";
import type { AuthUser } from "@future-fit/types";
import { useAuthStore } from "@/stores/auth.store";
import { apiRequest } from "@/lib/api-client";
import { ManagementPanel } from "@/components/management-panel";
export default function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const [error, setError] = useState("");
  async function language(preferredLanguage: string) {
    try {
      const updated = await apiRequest<AuthUser>("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ preferredLanguage }),
      });
      setAuth({ user: updated });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Profile update failed");
    }
  }
  return (
    <main className="student-dashboard">
      <h1>Your profile</h1>
      <p>Your user ID: {user?.id}</p>
      {error && <p role="alert">{error}</p>}
      <label>
        Language{" "}
        <select
          value={user?.preferredLanguage ?? "en"}
          onChange={(e) => void language(e.target.value)}
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
        </select>
      </label>
      <ManagementPanel
        title="Guardian relationships"
        readPath="/guardians"
        actions={[
          {
            label: "Request guardian relationship",
            path: "/guardians/requests",
            template: { guardianId: "" },
          },
        ]}
      />
      <ManagementPanel title="Sessions" readPath="/auth/sessions" />
      <ManagementPanel title="Notifications" readPath="/notifications" />
    </main>
  );
}
