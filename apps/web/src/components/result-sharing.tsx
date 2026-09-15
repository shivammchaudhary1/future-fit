"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Share2, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";
import styles from "@/styles/student-experience.module.css";

interface Share {
  _id: string;
  sharedWithUserId: string;
  organizationId?: string;
  revokedAt?: string;
}

export function ResultSharing({ resultId }: { resultId: string }) {
  const user = useAuthStore((state) => state.user);
  const [recipient, setRecipient] = useState("");
  const [organization, setOrganization] = useState("");

  const shares = useQuery({
    queryKey: ["result-shares", user?.id, resultId],
    queryFn: () => apiRequest<Share[]>(`/results/${resultId}/shares`),
    enabled: !!user,
  });

  const share = useMutation({
    mutationFn: () =>
      apiRequest(`/results/${resultId}/share`, {
        method: "POST",
        body: JSON.stringify({
          sharedWithUserId: recipient.trim(),
          ...(organization.trim()
            ? { organizationId: organization.trim() }
            : {}),
        }),
      }),
    onSuccess: async () => {
      setRecipient("");
      await shares.refetch();
    },
  });

  const revoke = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/results/${resultId}/share/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await shares.refetch();
    },
  });

  return (
    <section className={styles.sectionCard}>
      <header className={styles.sectionHeader}>
        <div>
          <h2>Share this result</h2>
          <p>
            Share only with an approved guardian or authorized school staff.
          </p>
        </div>
        <Share2 size={18} />
      </header>

      <div className={styles.sectionBody}>
        <p className={styles.notice}>
          The server validates the relationship before granting access.
        </p>

        <form
          className={styles.sharingForm}
          onSubmit={(event) => {
            event.preventDefault();
            share.mutate();
          }}
        >
          <label className={styles.field}>
            <span>Recipient user ID</span>
            <input
              required
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>School ID (optional for guardian sharing)</span>
            <input
              value={organization}
              onChange={(event) => setOrganization(event.target.value)}
            />
          </label>

          <button
            type="submit"
            className={styles.primaryButton}
            disabled={share.isPending || revoke.isPending}
          >
            <ShieldCheck size={15} />
            Grant access
          </button>
        </form>

        {(shares.error || share.error || revoke.error) && (
          <p className={styles.error} role="alert">
            {(shares.error ?? share.error ?? revoke.error)?.message}
          </p>
        )}

        {share.isSuccess ? (
          <p className={styles.success}>Sharing permission saved.</p>
        ) : null}

        {revoke.isSuccess ? (
          <p className={styles.success}>Sharing permission revoked.</p>
        ) : null}

        {shares.isLoading ? (
          <p className={styles.notice}>Loading sharing permissions…</p>
        ) : null}

        <div className={styles.shareList}>
          {shares.data?.map((item) => (
            <div className={styles.shareItem} key={item._id}>
              <div>
                <strong>{item.sharedWithUserId}</strong>
                <span>
                  {item.organizationId
                    ? `School: ${item.organizationId}`
                    : "Guardian / direct share"}{" "}
                  · {item.revokedAt ? "Revoked" : "Active"}
                </span>
              </div>

              {!item.revokedAt ? (
                <button
                  type="button"
                  className={styles.dangerButton}
                  disabled={revoke.isPending || share.isPending}
                  onClick={() => revoke.mutate(item._id)}
                >
                  Revoke access
                </button>
              ) : null}
            </div>
          ))}
        </div>

        <p className={styles.provenance}>
          Previously issued download links expire quickly, but files already
          downloaded by another person cannot be remotely revoked.
        </p>
      </div>
    </section>
  );
}
