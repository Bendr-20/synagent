"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { glassCardStyle, outlineButtonStyle, solidButtonStyle, theme } from "@/lib/theme";

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; applicationId: string; nextStep: string }
  | { kind: "error"; message: string };

const fieldLabelStyle: CSSProperties = {
  fontSize: "11px",
  color: theme.textMuted,
  fontFamily: "JetBrains Mono, monospace",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: "8px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "48px",
  background: "rgba(10,18,24,0.92)",
  border: `1px solid ${theme.border}`,
  borderRadius: "12px",
  padding: "12px 14px",
  color: theme.text,
  fontSize: "14px",
  lineHeight: 1.5,
  outline: "none",
};

export function CredBureauApplicationForm() {
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setSubmitState({ kind: "submitting" });

    const response = await fetch("/api/cred-bureau/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicant: {
          name: String(data.get("name") || ""),
          telegram: String(data.get("telegram") || ""),
          email: String(data.get("email") || ""),
          role: String(data.get("role") || ""),
        },
        humanProfile: {
          url: String(data.get("humanProfileUrl") || ""),
        },
        reviewAddendum: {
          whyJoin: String(data.get("whyJoin") || ""),
          availability: String(data.get("availability") || ""),
          disclosure: String(data.get("disclosure") || ""),
        },
      }),
    });

    const body = await response.json();
    if (!response.ok || !body.success) {
      setSubmitState({ kind: "error", message: body.error || "Application failed. Try again." });
      return;
    }

    form.reset();
    setSubmitState({ kind: "success", applicationId: body.applicationId, nextStep: body.nextStep });
  }

  return (
    <form id="apply" onSubmit={onSubmit} style={{ ...glassCardStyle, display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <div style={{ ...fieldLabelStyle, color: theme.accent }}>Apply to Cred Bureau</div>
        <h2 style={{ margin: "0 0 10px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "28px" }}>Submit for manual review</h2>
        <p style={{ margin: 0, color: theme.textMuted, lineHeight: 1.7 }}>
          Helixa profile is optional for the first pass. Link one if you have it; if approved, the team may ask you to mint or update one before the manual Telegram group add.
        </p>
      </div>

      <div className="cred-bureau-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <label>
          <div style={fieldLabelStyle}>Name</div>
          <input name="name" required placeholder="Your name or operator handle" style={inputStyle} />
        </label>
        <label>
          <div style={fieldLabelStyle}>Telegram Handle</div>
          <input name="telegram" placeholder="@username" style={inputStyle} />
        </label>
      </div>

      <div className="cred-bureau-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <label>
          <div style={fieldLabelStyle}>Email</div>
          <input name="email" type="email" placeholder="you@example.com" style={inputStyle} />
        </label>
        <label>
          <div style={fieldLabelStyle}>Role / Fit</div>
          <input name="role" placeholder="Reviewer, operator, builder, founder" style={inputStyle} />
        </label>
      </div>

      <div className="cred-bureau-actions" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <a href="https://helixa.xyz/join/human" style={{ ...solidButtonStyle, width: "auto", minWidth: "230px" }}>
          Mint/Create Helixa Profile
        </a>
        <a href="https://helixa.xyz/manage/human" style={{ ...outlineButtonStyle, width: "auto", minWidth: "230px", justifyContent: "center" }}>
          Update Profile
        </a>
      </div>

      <label>
        <div style={fieldLabelStyle}>Helixa Human Profile URL (optional)</div>
        <input name="humanProfileUrl" placeholder="https://helixa.xyz/h/your-profile-id" style={inputStyle} />
      </label>

      <label>
        <div style={fieldLabelStyle}>Why should this profile be reviewed for Cred Bureau?</div>
        <textarea name="whyJoin" required rows={4} placeholder="Review focus, relevant context, and why you should be in the group." style={{ ...inputStyle, resize: "vertical" }} />
      </label>

      <div className="cred-bureau-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <label>
          <div style={fieldLabelStyle}>Availability</div>
          <input name="availability" placeholder="A few hours/week, nights, weekends" style={inputStyle} />
        </label>
        <label>
          <div style={fieldLabelStyle}>Conflict Disclosure</div>
          <input name="disclosure" placeholder="Anything we should know before review" style={inputStyle} />
        </label>
      </div>

      <button type="submit" disabled={submitState.kind === "submitting"} style={{ ...solidButtonStyle, opacity: submitState.kind === "submitting" ? 0.72 : 1 }}>
        {submitState.kind === "submitting" ? "Submitting for review" : "Submit Application"}
      </button>

      {submitState.kind === "success" && (
        <div style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(0,229,255,0.24)", background: "rgba(0,229,255,0.08)", color: theme.textStrong, lineHeight: 1.6 }}>
          Application received. Reference: <span style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace" }}>{submitState.applicationId}</span>. {submitState.nextStep}
        </div>
      )}

      {submitState.kind === "error" && (
        <div style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(255,120,120,0.32)", background: "rgba(255,80,80,0.08)", color: "#ffc8c8", lineHeight: 1.6 }}>
          {submitState.message}
        </div>
      )}
    </form>
  );
}
