"use client";

import { useState, type FormEvent } from "react";
import { CRED_BUREAU_REWARD_CONFIG } from "@/lib/cred-bureau-rewards-config";
import { outlineButtonStyle, solidButtonStyle, theme } from "@/lib/theme";

const inputStyle = {
  width: "100%",
  padding: "13px 14px",
  borderRadius: "12px",
  border: `1px solid ${theme.border}`,
  background: "rgba(5,10,14,0.58)",
  color: theme.textStrong,
  outline: "none",
};

const labelStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  color: theme.textMuted,
  fontSize: "13px",
  lineHeight: 1.45,
};

export function RewardSubmissionForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setStatus("submitting");
    setMessage("");

    const form = new FormData(formElement);
    const payload = {
      participant: {
        displayName: String(form.get("displayName") || ""),
        telegram: String(form.get("contact") || ""),
        email: String(form.get("contact") || "").includes("@") ? String(form.get("contact") || "") : undefined,
        wallet: String(form.get("wallet") || ""),
        helixaProfileUrl: String(form.get("helixaProfileUrl") || ""),
      },
      seasonId: String(form.get("seasonId") || "season-1"),
      categoryId: String(form.get("categoryId") || "matched-task"),
      title: String(form.get("title") || ""),
      description: String(form.get("description") || ""),
      evidenceUrl: String(form.get("evidenceUrl") || "") || null,
    };

    try {
      const response = await fetch("/api/cred-bureau/rewards/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || "Submission failed");
      setStatus("success");
      setMessage(`Contribution ${body.contributionId} is pending manual review.`);
      formElement.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Submission failed. Please try again.");
    }
  }

  return (
    <form className="cred-bureau-reward-form" onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div className="cred-bureau-reward-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" }}>
        <label style={labelStyle}>
          Display name
          <input name="displayName" required style={inputStyle} />
        </label>
        <label style={labelStyle}>
          Telegram or email
          <input name="contact" required style={inputStyle} />
        </label>
        <label style={labelStyle}>
          Wallet
          <input name="wallet" required placeholder="0x..." style={inputStyle} />
        </label>
        <label style={labelStyle}>
          Helixa profile URL
          <input name="helixaProfileUrl" required placeholder="https://helixa.xyz/h/..." style={inputStyle} />
        </label>
        <label style={labelStyle}>
          Season
          <select name="seasonId" style={inputStyle} defaultValue="season-1">
            {CRED_BUREAU_REWARD_CONFIG.seasons.map((season) => (
              <option key={season.id} value={season.id}>{season.label}</option>
            ))}
          </select>
        </label>
        <label style={labelStyle}>
          Category
          <select name="categoryId" style={inputStyle} defaultValue="matched-task">
            {CRED_BUREAU_REWARD_CONFIG.categories.map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label style={labelStyle}>
        Title
        <input name="title" required style={inputStyle} />
      </label>
      <label style={labelStyle}>
        Description
        <textarea name="description" required rows={5} style={{ ...inputStyle, resize: "vertical" }} />
      </label>
      <label style={labelStyle}>
        Evidence URL
        <input name="evidenceUrl" placeholder="https://..." style={inputStyle} />
      </label>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        <button type="submit" disabled={status === "submitting"} style={{ ...solidButtonStyle, width: "auto", minWidth: "220px", opacity: status === "submitting" ? 0.68 : 1 }}>
          {status === "submitting" ? "Submitting" : "Submit for Manual Review"}
        </button>
        <a href="/cred-bureau" style={{ ...outlineButtonStyle, width: "auto", minWidth: "180px" }}>
          Last chance to apply
        </a>
      </div>

      {message && (
        <div style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${status === "error" ? "rgba(255,120,120,0.35)" : "rgba(0,229,255,0.25)"}`, color: status === "error" ? "#ffb5b5" : theme.textStrong, background: "rgba(5,10,14,0.5)", lineHeight: 1.55 }}>
          {message}
        </div>
      )}
    </form>
  );
}
