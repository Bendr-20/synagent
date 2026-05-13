"use client";

import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import type { CredBureauApplicationRecord, CredBureauApplicationStatus } from "@/lib/cred-bureau-types";
import { outlineButtonStyle, solidButtonStyle, theme } from "@/lib/theme";

type Props = {
  application: CredBureauApplicationRecord;
  reviewKey: string;
};

const noteStyle: CSSProperties = {
  width: "100%",
  minHeight: "72px",
  background: "rgba(10,18,24,0.92)",
  border: `1px solid ${theme.border}`,
  borderRadius: "12px",
  padding: "10px 12px",
  color: theme.text,
  fontSize: "13px",
  lineHeight: 1.5,
  outline: "none",
  resize: "vertical",
};

export function ReviewStatusControls({ application, reviewKey }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<CredBureauApplicationStatus>(application.status);
  const [closedAt, setClosedAt] = useState<string | null>(application.review.closedAt || null);
  const [reviewerNotes, setReviewerNotes] = useState(application.review.reviewerNotes || "");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function update(nextStatus: CredBureauApplicationStatus) {
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/cred-bureau/applications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${reviewKey}`,
      },
      body: JSON.stringify({ id: application.id, status: nextStatus, reviewerNotes }),
    });
    const body = await response.json();
    setSaving(false);

    if (!response.ok || !body.success) {
      setMessage(body.error || "Update failed");
      return;
    }

    setStatus(body.application.status);
    setClosedAt(body.application.review.closedAt || null);
    setMessage(`Saved: ${body.application.status}`);
  }

  async function closeReviewBox(nextClosed: boolean) {
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/cred-bureau/applications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${reviewKey}`,
      },
      body: JSON.stringify({ id: application.id, closeReviewBox: nextClosed }),
    });
    const body = await response.json();
    setSaving(false);

    if (!response.ok || !body.success) {
      setMessage(body.error || "Update failed");
      return;
    }

    setStatus(body.application.status);
    setClosedAt(body.application.review.closedAt || null);
    setMessage(nextClosed ? "Closed review box" : "Reopened review box");
    router.refresh();
  }

  const summary = [
    application.applicant.name,
    application.applicant.telegram,
    application.applicant.email,
    application.applicant.linkedinUrl,
    application.applicant.websiteUrl,
    application.humanProfile.url || "Helixa profile required",
    application.reviewAddendum.whyJoin,
  ].filter(Boolean).join(" | ");

  const finalDecision = status === "approved" || status === "rejected";
  const closed = Boolean(closedAt);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
      <textarea value={reviewerNotes} onChange={(event) => setReviewerNotes(event.target.value)} placeholder="Reviewer notes" style={noteStyle} />
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button type="button" disabled={saving} onClick={() => update("pending-review")} style={{ ...outlineButtonStyle, width: "auto", opacity: saving ? 0.7 : 1 }}>
          Pending
        </button>
        <button type="button" disabled={saving} onClick={() => update("approved")} style={{ ...solidButtonStyle, width: "auto", opacity: saving ? 0.7 : 1 }}>
          Approve
        </button>
        <button type="button" disabled={saving} onClick={() => update("rejected")} style={{ ...outlineButtonStyle, width: "auto", color: "#ffc8c8", opacity: saving ? 0.7 : 1 }}>
          Reject
        </button>
        <button type="button" onClick={() => navigator.clipboard?.writeText(summary)} style={{ ...outlineButtonStyle, width: "auto" }}>
          Copy TG Review Summary
        </button>
        {finalDecision && !closed && (
          <button type="button" disabled={saving} onClick={() => closeReviewBox(true)} style={{ ...outlineButtonStyle, width: "auto", opacity: saving ? 0.7 : 1 }}>
            Close Review Box
          </button>
        )}
        {closed && (
          <button type="button" disabled={saving} onClick={() => closeReviewBox(false)} style={{ ...outlineButtonStyle, width: "auto", opacity: saving ? 0.7 : 1 }}>
            Reopen Review Box
          </button>
        )}
      </div>
      <div style={{ color: theme.textMuted, fontSize: "12px", fontFamily: "JetBrains Mono, monospace" }}>
        Current status: <span style={{ color: theme.accent }}>{status}</span> | {closedAt ? `review box closed ${new Date(closedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC` : "manual group add only"}
      </div>
      {message && <div style={{ color: message.startsWith("Saved") ? theme.accent : "#ffc8c8", fontSize: "13px" }}>{message}</div>}
    </div>
  );
}
