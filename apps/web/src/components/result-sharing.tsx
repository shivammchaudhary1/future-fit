"use client";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth.store";

interface Share {
  _id: string;
  sharedWithUserId: string;
  organizationId?: string;
  revokedAt?: string;
}

export function ResultSharing({ resultId }: { resultId: string }) {
  const user = useAuthStore((s) => s.user);
  const [recipient, setRecipient] = useState("");
  const [organization, setOrganization] = useState("");
  const shares = useQuery({
    queryKey: ["result-shares", user?.id, resultId],
    queryFn: () => apiRequest<Share[]>(`/results/${resultId}/shares`),
    enabled: !!user,
  });
  const share = useMutation({
    mutationFn: () => apiRequest(`/results/${resultId}/share`, {
      method: "POST",
      body: JSON.stringify({ sharedWithUserId: recipient.trim(), ...(organization.trim() ? { organizationId: organization.trim() } : {}) }),
    }),
    onSuccess: async () => {
      setRecipient("");
      await shares.refetch();
    },
  });
  const revoke = useMutation({
    mutationFn: (id: string) => apiRequest(`/results/${resultId}/share/${id}`, { method: "DELETE" }),
    onSuccess: async () => { await shares.refetch(); },
  });
  return <section>
    <h2>Share this result</h2>
    <p>Share with an approved guardian, or enter a school ID to share with authorized school staff. The server checks the relationship before granting access.</p>
    <form onSubmit={(event) => { event.preventDefault(); share.mutate(); }}>
      <label>Recipient user ID <input required value={recipient} onChange={(event) => setRecipient(event.target.value)} /></label>
      <label>School ID (leave empty for a guardian) <input value={organization} onChange={(event) => setOrganization(event.target.value)} /></label>
      <button disabled={share.isPending || revoke.isPending}>Grant access</button>
    </form>
    {(shares.error || share.error || revoke.error) && <p role="alert">{(shares.error ?? share.error ?? revoke.error)?.message}</p>}
    {share.isSuccess && <p role="status">Sharing permission saved.</p>}
    {revoke.isSuccess && <p role="status">Sharing permission revoked.</p>}
    {shares.isLoading && <p>Loading permissions…</p>}
    <ul>{shares.data?.map((item) => <li key={item._id}>
      {item.sharedWithUserId} — {item.revokedAt ? "Revoked" : "Active"}
      {!item.revokedAt && <button disabled={revoke.isPending || share.isPending} onClick={() => revoke.mutate(item._id)}>Revoke access</button>}
    </li>)}</ul>
    <p>Revocation removes this explicit permission. School-role access may still apply to school assessments. Previously issued download links expire within 60 seconds; downloaded copies cannot be revoked.</p>
  </section>;
}
