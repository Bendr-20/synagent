"use client";

import { useRouter } from "next/navigation";
import { useState, type CSSProperties } from "react";
import type {
  CredBureauPayoutExportRecord,
  CredBureauRewardContribution,
  CredBureauRewardContributionStatus,
  CredBureauRewardSeasonId,
} from "@/lib/cred-bureau-rewards-types";
import { outlineButtonStyle, solidButtonStyle, theme } from "@/lib/theme";

type SuggestedRewardReview = {
  suggestedPoints: number | null;
  suggestedReason: string;
  reviewFlags: string[];
  approveSuggestedAvailable: boolean;
};

type RewardReviewControlsProps = {
  contribution: CredBureauRewardContribution;
  reviewKey: string;
  suggestion?: SuggestedRewardReview;
};

type PayoutExportSummary = Pick<CredBureauPayoutExportRecord, "id" | "createdAt" | "seasonId" | "seasonTokenPool" | "totalPoints" | "rowCount" | "createdBy">;

type PayoutExportControlsProps = {
  reviewKey: string;
  activeSeason: CredBureauRewardSeasonId;
  exports: PayoutExportSummary[];
};

type ExportLinks = Record<string, { json?: string; csv?: string }>;

const fieldLabelStyle: CSSProperties = {
  color: theme.textMuted,
  fontSize: "10px",
  fontFamily: "JetBrains Mono, monospace",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: "6px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  background: "rgba(10,18,24,0.92)",
  border: `1px solid ${theme.border}`,
  borderRadius: "12px",
  padding: "11px 12px",
  color: theme.text,
  fontSize: "13px",
  lineHeight: 1.4,
  outline: "none",
};

const textareaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: "82px",
  resize: "vertical",
};

function setBlobUrl(downloadLinks: ExportLinks, exportId: string, kind: "json" | "csv", url: string): ExportLinks {
  return {
    ...downloadLinks,
    [exportId]: {
      ...(downloadLinks[exportId] || {}),
      [kind]: url,
    },
  };
}

function makeJsonDownloadLink(exportRecord: unknown) {
  const blob = new Blob([`${JSON.stringify(exportRecord, null, 2)}\n`], { type: "application/json" });
  return URL.createObjectURL(blob);
}

export function RewardReviewControls({ contribution, reviewKey, suggestion }: RewardReviewControlsProps) {
  const router = useRouter();
  const initialAssignedPoints = contribution.assignedPoints > 0 ? contribution.assignedPoints : suggestion?.suggestedPoints ?? contribution.assignedPoints;
  const [targetStatus, setTargetStatus] = useState<CredBureauRewardContributionStatus>(contribution.status);
  const [currentStatus, setCurrentStatus] = useState<CredBureauRewardContributionStatus>(contribution.status);
  const [assignedPoints, setAssignedPoints] = useState(String(initialAssignedPoints));
  const [payoutEligible, setPayoutEligible] = useState(contribution.payoutEligible);
  const [reviewerNotes, setReviewerNotes] = useState(contribution.reviewerNotes || "");
  const [antiFarmNotes, setAntiFarmNotes] = useState(contribution.antiFarmNotes || "");
  const [reviewedBy, setReviewedBy] = useState(contribution.reviewedBy || "");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isTerminal = contribution.status === "approved" || contribution.status === "rejected";

  function applyReviewResponse(body: any, fallbackReviewedBy: string, label: string) {
    setCurrentStatus(body.contribution.status);
    setTargetStatus(body.contribution.status);
    setAssignedPoints(String(body.contribution.assignedPoints));
    setPayoutEligible(Boolean(body.contribution.payoutEligible));
    setReviewerNotes(body.contribution.reviewerNotes || "");
    setAntiFarmNotes(body.contribution.antiFarmNotes || "");
    setReviewedBy(body.contribution.reviewedBy || fallbackReviewedBy);
    setMessage(`${label}: ${body.contribution.status}`);
    router.refresh();
  }

  async function saveReview() {
    const nextStatus = targetStatus;

    if (nextStatus === "submitted") {
      setMessage("Submitted is the intake state. Choose needs-info, approved, or rejected before saving a reviewer decision.");
      return;
    }

    if (isTerminal) {
      setMessage("Approved or rejected contributions cannot be changed via the status controls. Use the needs-info state if reopening is required.");
      return;
    }

    const parsedPoints = Number.parseInt(assignedPoints || "0", 10);
    if (!Number.isFinite(parsedPoints) || parsedPoints < 0) {
      setMessage("Assigned points must be zero or higher.");
      return;
    }

    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/cred-bureau/rewards/contributions", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${reviewKey}`,
      },
      body: JSON.stringify({
        id: contribution.id,
        status: nextStatus,
        assignedPoints: parsedPoints,
        reviewerNotes,
        antiFarmNotes,
        reviewedBy,
      }),
    });
    const body = await response.json();
    setSaving(false);

    if (!response.ok || !body.success) {
      setMessage(body.error || "Reward review update failed");
      return;
    }

    applyReviewResponse(body, reviewedBy, "Saved reward review");
  }

  async function approveSuggested() {
    if (!suggestion?.approveSuggestedAvailable || suggestion.suggestedPoints === null) {
      setMessage("No safe suggested score is available. Use manual review controls.");
      return;
    }

    if (isTerminal) {
      setMessage("Approved or rejected contributions cannot be changed via the status controls. Use the needs-info state if reopening is required.");
      return;
    }

    const parsedPoints = Number.parseInt(assignedPoints || "0", 10);
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/cred-bureau/rewards/contributions", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${reviewKey}`,
      },
      body: JSON.stringify({
        id: contribution.id,
        status: "approved",
        assignedPoints: suggestion?.suggestedPoints ?? parsedPoints,
        useSuggestedPoints: true,
        reviewerNotes,
        antiFarmNotes,
        reviewedBy,
      }),
    });
    const body = await response.json();
    setSaving(false);

    if (!response.ok || !body.success) {
      setMessage(body.error || "Approve Suggested failed");
      return;
    }

    applyReviewResponse(body, reviewedBy, "Approved suggested score");
  }

  return (
    <div className="cred-bureau-reward-review-controls" style={{ borderTop: "1px solid rgba(0,229,255,0.1)", paddingTop: "16px", display: "grid", gap: "12px" }}>
      <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
        Status controls
      </div>

      <div className="cred-bureau-reward-review-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
        <label>
          <div style={fieldLabelStyle}>Status</div>
          <select value={targetStatus} onChange={(event) => setTargetStatus(event.target.value as CredBureauRewardContributionStatus)} style={{ ...inputStyle, opacity: isTerminal ? 0.7 : 1, cursor: isTerminal ? "not-allowed" : "pointer" }} disabled={isTerminal}>
            <option value="submitted">submitted</option>
            <option value="needs-info">needs-info</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
        </label>

        <label>
          <div style={fieldLabelStyle}>Assigned points</div>
          <input type="number" min="0" step="1" value={assignedPoints} onChange={(event) => setAssignedPoints(event.target.value)} style={{ ...inputStyle, opacity: isTerminal ? 0.7 : 1 }} disabled={isTerminal} />
        </label>

        <label>
          <div style={fieldLabelStyle}>Reviewed by</div>
          <input type="text" value={reviewedBy} onChange={(event) => setReviewedBy(event.target.value)} placeholder="Reviewer name" style={{ ...inputStyle, opacity: isTerminal ? 0.7 : 1 }} disabled={isTerminal} />
        </label>
      </div>

      <div className="cred-bureau-reward-review-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
        <label>
          <div style={fieldLabelStyle}>Reviewer notes</div>
          <textarea value={reviewerNotes} onChange={(event) => setReviewerNotes(event.target.value)} placeholder="Reviewer notes" style={{ ...textareaStyle, opacity: isTerminal ? 0.7 : 1 }} disabled={isTerminal} />
        </label>

        <label>
          <div style={fieldLabelStyle}>Anti-farm notes</div>
          <textarea value={antiFarmNotes} onChange={(event) => setAntiFarmNotes(event.target.value)} placeholder="Anti-farm notes" style={{ ...textareaStyle, opacity: isTerminal ? 0.7 : 1 }} disabled={isTerminal} />
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ color: theme.textMuted, fontSize: "12px", fontFamily: "JetBrains Mono, monospace" }}>
          Current status: <span style={{ color: theme.accent }}>{currentStatus}</span> | Payout eligible: <span style={{ color: payoutEligible ? theme.accent : theme.textMuted }}>{payoutEligible ? "yes" : "no"}</span> (API-managed)
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {suggestion?.approveSuggestedAvailable && (
            <button type="button" disabled={saving || isTerminal} onClick={approveSuggested} style={{ ...solidButtonStyle, width: "auto", opacity: (saving || isTerminal) ? 0.7 : 1 }}>
              Approve Suggested
            </button>
          )}
          <button type="button" disabled={saving || isTerminal} onClick={saveReview} style={{ ...outlineButtonStyle, width: "auto", opacity: (saving || isTerminal) ? 0.7 : 1 }}>
            {isTerminal ? "Status locked" : "Save status controls"}
          </button>
        </div>
      </div>

      {message && <div style={{ color: message.startsWith("Saved") ? theme.accent : "#ffc8c8", fontSize: "13px", lineHeight: 1.5 }}>{message}</div>}
    </div>
  );
}

export function PayoutExportControls({ reviewKey, activeSeason, exports }: PayoutExportControlsProps) {
  const [seasonId, setSeasonId] = useState<CredBureauRewardSeasonId>(activeSeason);
  const [seasonTokenPool, setSeasonTokenPool] = useState("1000");
  const [createdBy, setCreatedBy] = useState("");
  const [antiFarmReviewComplete, setAntiFarmReviewComplete] = useState(false);
  const [antiFarmReviewNotes, setAntiFarmReviewNotes] = useState("");
  const [payoutExports, setPayoutExports] = useState<PayoutExportSummary[]>(exports);
  const [downloadLinks, setDownloadLinks] = useState<ExportLinks>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function prepareJsonLink(exportId: string, exportRecord?: unknown) {
    if (exportRecord) {
      const jsonUrl = makeJsonDownloadLink(exportRecord);
      setDownloadLinks((links) => setBlobUrl(links, exportId, "json", jsonUrl));
      return;
    }

    const response = await fetch("/api/cred-bureau/rewards/payout-export?includeRows=1", {
      headers: { Authorization: `Bearer ${reviewKey}` },
    });
    const body = await response.json();

    if (!response.ok || !body.success) {
      setMessage(body.error || "Could not prepare Export JSON link");
      return;
    }

    const exportRecordFromApi = Array.isArray(body.exports) ? body.exports.find((item: any) => item.id === exportId) : null;
    if (!exportRecordFromApi) {
      setMessage("Stored payout export was not found.");
      return;
    }

    const jsonUrl = makeJsonDownloadLink(exportRecordFromApi);
    setDownloadLinks((links) => setBlobUrl(links, exportId, "json", jsonUrl));
  }

  async function prepareCsvLink(exportId: string) {
    const response = await fetch(`/api/cred-bureau/rewards/payout-export?exportId=${encodeURIComponent(exportId)}&format=csv`, {
      headers: { Authorization: `Bearer ${reviewKey}` },
    });

    if (!response.ok) {
      setMessage("Could not prepare Export CSV link");
      return;
    }

    const blob = await response.blob();
    const csvUrl = URL.createObjectURL(blob);
    setDownloadLinks((links) => setBlobUrl(links, exportId, "csv", csvUrl));
  }

  async function createPayoutExport() {
    if (!antiFarmReviewComplete) {
      setMessage("Anti-farm review confirmation is required before creating a payout export.");
      return;
    }

    if (antiFarmReviewNotes.trim().length < 20) {
      setMessage("Anti-farm notes must describe the manual review in at least 20 characters.");
      return;
    }

    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/cred-bureau/rewards/payout-export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${reviewKey}`,
      },
      body: JSON.stringify({
        seasonId,
        seasonTokenPool,
        createdBy,
        antiFarmReviewComplete,
        antiFarmReviewNotes,
      }),
    });
    const body = await response.json();
    setSaving(false);

    if (!response.ok || !body.success) {
      setMessage(body.error || "Payout export creation failed");
      return;
    }

    const exportRecord = body.exportRecord as CredBureauPayoutExportRecord;
    const summary: PayoutExportSummary = {
      id: exportRecord.id,
      createdAt: exportRecord.createdAt,
      seasonId: exportRecord.seasonId,
      seasonTokenPool: exportRecord.seasonTokenPool,
      totalPoints: exportRecord.totalPoints,
      rowCount: exportRecord.rowCount,
      createdBy: exportRecord.createdBy,
    };
    setPayoutExports((items) => [summary, ...items]);
    setMessage(`Payout export created: ${exportRecord.id}`);
    await prepareJsonLink(exportRecord.id, exportRecord);
    await prepareCsvLink(exportRecord.id);
  }

  function renderExportLinks(exportRecord: PayoutExportSummary) {
    const links = downloadLinks[exportRecord.id] || {};

    return (
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" onClick={() => prepareJsonLink(exportRecord.id)} style={{ ...outlineButtonStyle, width: "auto", padding: "10px 12px" }}>
          Prepare Export JSON link
        </button>
        <button type="button" onClick={() => prepareCsvLink(exportRecord.id)} style={{ ...outlineButtonStyle, width: "auto", padding: "10px 12px" }}>
          Prepare Export CSV link
        </button>
        {links.json && (
          <a href={links.json} download={`cred-bureau-${exportRecord.id}.json`} style={{ ...solidButtonStyle, width: "auto", padding: "10px 12px" }}>
            Export JSON
          </a>
        )}
        {links.csv && (
          <a href={links.csv} download={`cred-bureau-${exportRecord.id}.csv`} style={{ ...solidButtonStyle, width: "auto", padding: "10px 12px" }}>
            Export CSV
          </a>
        )}
      </div>
    );
  }

  return (
    <section style={{ border: `1px solid ${theme.border}`, borderRadius: "16px", padding: "24px", background: "linear-gradient(145deg, rgba(10,18,24,0.92), rgba(8,14,18,0.82))" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", flexWrap: "wrap", marginBottom: "18px" }}>
        <div>
          <div style={{ fontSize: "12px", color: theme.accent, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "10px" }}>
            Payout export form
          </div>
          <h2 style={{ margin: "0 0 8px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "28px" }}>Manual payout export</h2>
          <p style={{ color: theme.textMuted, lineHeight: 1.7, margin: 0, maxWidth: "720px" }}>
            Manual review required before sending rewards.
          </p>
        </div>
      </div>

      <div className="cred-bureau-reward-review-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "12px" }}>
        <label>
          <div style={fieldLabelStyle}>Season selector</div>
          <select value={seasonId} onChange={(event) => setSeasonId(event.target.value as CredBureauRewardSeasonId)} style={inputStyle}>
            <option value="season-1">Season 1</option>
            <option value="season-2">Season 2</option>
          </select>
        </label>
        <label>
          <div style={fieldLabelStyle}>Season pool token amount</div>
          <input type="text" inputMode="decimal" value={seasonTokenPool} onChange={(event) => setSeasonTokenPool(event.target.value)} placeholder="1000" style={inputStyle} />
        </label>
        <label>
          <div style={fieldLabelStyle}>Reviewer name</div>
          <input type="text" value={createdBy} onChange={(event) => setCreatedBy(event.target.value)} placeholder="Reviewer name" style={inputStyle} />
        </label>
      </div>

      <div className="cred-bureau-reward-review-grid" style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: "12px", marginBottom: "14px" }}>
        <label style={{ border: "1px solid rgba(0,229,255,0.14)", borderRadius: "14px", padding: "14px", display: "flex", gap: "10px", alignItems: "flex-start", color: theme.textStrong }}>
          <input type="checkbox" checked={antiFarmReviewComplete} onChange={(event) => setAntiFarmReviewComplete(event.target.checked)} required style={{ marginTop: "3px" }} />
          <span>
            <span style={{ display: "block", ...fieldLabelStyle }}>Anti-farm review confirmation</span>
            I confirm manual anti-farm review is complete for this payout export.
          </span>
        </label>
        <label>
          <div style={fieldLabelStyle}>Anti-farm notes</div>
          <textarea value={antiFarmReviewNotes} onChange={(event) => setAntiFarmReviewNotes(event.target.value)} required placeholder="Summarize duplicate-wallet, low-effort, social-cap, and manual spot checks before exporting." style={textareaStyle} />
        </label>
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "18px" }}>
        <button type="button" disabled={saving} onClick={createPayoutExport} style={{ ...solidButtonStyle, width: "auto", opacity: saving ? 0.7 : 1 }}>
          Create export
        </button>
        {message && <div style={{ color: message.startsWith("Payout export created") ? theme.accent : "#ffc8c8", fontSize: "13px", lineHeight: 1.5 }}>{message}</div>}
      </div>

      <div style={{ borderTop: "1px solid rgba(0,229,255,0.1)", paddingTop: "16px" }}>
        <h3 style={{ margin: "0 0 12px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif" }}>Stored payout exports</h3>
        {payoutExports.length === 0 ? (
          <div style={{ color: theme.textMuted, lineHeight: 1.6 }}>No payout export link has been created yet.</div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {payoutExports.map((exportRecord) => (
              <article key={exportRecord.id} style={{ border: "1px solid rgba(0,229,255,0.12)", borderRadius: "14px", padding: "14px", background: "rgba(5,10,14,0.22)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <div>
                    <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", marginBottom: "4px" }}>{exportRecord.id}</div>
                    <div style={{ color: theme.textStrong }}>{exportRecord.seasonId} · {exportRecord.rowCount} rows · {exportRecord.totalPoints} points</div>
                  </div>
                  <div style={{ color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}>
                    {new Date(exportRecord.createdAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC
                  </div>
                </div>
                {renderExportLinks(exportRecord)}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
