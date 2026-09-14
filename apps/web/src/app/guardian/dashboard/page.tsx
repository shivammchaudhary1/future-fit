"use client";
import { useState } from "react";
import { ManagementPanel } from "@/components/management-panel";
export default function GuardianDashboard() {
  const [requestId, setRequestId] = useState("");
  return (
    <main className="student-dashboard">
      <h1>Guardian workspace</h1>
      <ManagementPanel
        title="Current consent policy"
        readPath="/guardians/consent-policy"
      />
      <ManagementPanel title="Relationship requests" readPath="/guardians" />
      <label>
        Request ID{" "}
        <input
          value={requestId}
          onChange={(e) => setRequestId(e.target.value)}
        />
      </label>
      {/^[a-f\d]{24}$/i.test(requestId) && (
        <ManagementPanel
          title="Consent action"
          readPath="/guardians"
          actions={[
            {
              label: "Accept current consent policy",
              path: `/guardians/${requestId}/consent`,
              template: { accepted: true },
            },
            {
              label: "Revoke relationship",
              path: `/guardians/${requestId}/revoke`,
              template: {},
            },
          ]}
        />
      )}
      <ManagementPanel
        title="Reports explicitly shared with you"
        readPath="/results/shared"
      />
    </main>
  );
}
