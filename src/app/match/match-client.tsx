"use client";

import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import { SiteShell } from "@/components/site-shell";
import { solidButtonStyle, glassCardStyle, theme } from "@/lib/theme";
import type { Synagent } from "@/app/synagents/data";
import type { MatchResult } from "@/lib/match-types";

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "48px",
  background: "rgba(10,18,24,0.9)",
  border: `1px solid ${theme.border}`,
  borderRadius: "12px",
  padding: "12px 14px",
  color: theme.text,
  fontSize: "14px",
  lineHeight: 1.5,
  outline: "none",
};

const labelStyle: CSSProperties = {
  fontSize: "11px",
  color: theme.textMuted,
  fontFamily: "JetBrains Mono, monospace",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: "8px",
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

export function MatchClient({ selectedAgent }: { selectedAgent?: Synagent }) {
  const [prefs, setPrefs] = useState({
    cost: 5,
    time: 5,
    quality: 5,
    credibility: 5,
    title: "",
    category: selectedAgent ? "operator-support" : "mvp-build",
    budgetRange: "1k-3k",
    urgency: "this-month",
    deliveryType: selectedAgent ? "human-only" : "hybrid",
    communicationPreference: "either",
    timezone: "",
    confidentiality: "private",
    paymentPreference: "usdc",
    email: "",
    telegram: "",
    desiredOutcome: "",
    needs: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [notificationsQueued, setNotificationsQueued] = useState<number>(0);
  const [matches, setMatches] = useState<MatchResult[]>([]);

  const sliderBackground = (value: number) => {
    const pct = ((value - 1) / 9) * 100;
    return `linear-gradient(90deg, ${theme.accent} 0%, ${theme.accent} ${pct}%, rgba(0,229,255,0.12) ${pct}%, rgba(0,229,255,0.12) 100%)`;
  };

  const renderSlider = (key: keyof Pick<typeof prefs, "cost" | "time" | "quality" | "credibility">, label: string) => (
    <div key={key} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", color: theme.textStrong, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: "12px", color: theme.accent, fontFamily: "JetBrains Mono, monospace" }}>{prefs[key]}</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={prefs[key]}
        onChange={(e) => setPrefs((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
        style={{ width: "100%", accentColor: theme.accent, cursor: "pointer", background: sliderBackground(prefs[key]), borderRadius: "999px" }}
      />
    </div>
  );

  const intakePayload = {
    selectedAgent: selectedAgent?.slug || null,
    title: prefs.title || null,
    category: prefs.category,
    budgetRange: prefs.budgetRange,
    urgency: prefs.urgency,
    deliveryType: prefs.deliveryType,
    communicationPreference: prefs.communicationPreference,
    timezone: prefs.timezone || null,
    confidentiality: prefs.confidentiality,
    paymentPreference: prefs.paymentPreference,
    desiredOutcome: prefs.desiredOutcome || null,
    brief: prefs.needs || null,
    contact: {
      email: prefs.email || null,
      telegram: prefs.telegram || null,
    },
    priorities: {
      cost: prefs.cost,
      time: prefs.time,
      quality: prefs.quality,
      credibility: prefs.credibility,
    },
  };

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(intakePayload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Submission failed");
      }
      setRequestId(data.requestId || null);
      setNotificationsQueued(data.notificationsQueued || 0);
      setMatches(Array.isArray(data.matchedAgents) ? data.matchedAgents : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SiteShell mainStyle={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
      <div style={{ width: "100%", maxWidth: "860px", ...glassCardStyle, borderRadius: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>Match Intake</div>
            <h1 style={{ fontSize: "28px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif" }}>Make Your Match</h1>
            <div style={{ marginTop: "8px", fontSize: "13px", color: theme.textMuted }}>
              (<Link href="/synagents" style={{ color: theme.accent, textDecoration: "none" }}>or Browse Synagents</Link>)
            </div>
          </div>
          <Link href="/" style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(0,229,255,0.26)", background: "rgba(5,10,14,0.18)", color: theme.accent, fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none" }}>
            Back
          </Link>
        </div>

        {selectedAgent && (
          <div style={{ padding: "14px 16px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.24)", color: theme.textMuted, lineHeight: 1.7 }}>
            You are submitting a proposal to <span style={{ color: theme.textStrong, fontWeight: 600 }}>{selectedAgent.name}</span>.
          </div>
        )}

        <p style={{ color: theme.textMuted, lineHeight: 1.7, fontSize: "15px" }}>
          Tell us what you need, how urgent it is, how you want to work, and how to reach you. This now creates a real request record and queues provider notifications.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <Field label="Project Title">
            <input value={prefs.title} onChange={(e) => setPrefs((prev) => ({ ...prev, title: e.target.value }))} placeholder="AI intake MVP, launch strategy, operator support..." style={inputStyle} />
          </Field>
          <Field label="Category">
            <select value={prefs.category} onChange={(e) => setPrefs((prev) => ({ ...prev, category: e.target.value }))} style={inputStyle}>
              <option value="mvp-build">MVP Build</option>
              <option value="operator-support">Operator Support</option>
              <option value="ai-consulting">AI Consulting</option>
              <option value="automation">Automation</option>
              <option value="design">Design</option>
              <option value="growth">Growth</option>
              <option value="research">Research</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Budget Range">
            <select value={prefs.budgetRange} onChange={(e) => setPrefs((prev) => ({ ...prev, budgetRange: e.target.value }))} style={inputStyle}>
              <option value="under-1k">Under 1K</option>
              <option value="1k-3k">1K - 3K</option>
              <option value="3k-10k">3K - 10K</option>
              <option value="10k-25k">10K - 25K</option>
              <option value="25k-plus">25K+</option>
              <option value="unknown">Not Sure Yet</option>
            </select>
          </Field>
          <Field label="Urgency">
            <select value={prefs.urgency} onChange={(e) => setPrefs((prev) => ({ ...prev, urgency: e.target.value }))} style={inputStyle}>
              <option value="asap">ASAP</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="flexible">Flexible</option>
            </select>
          </Field>
          <Field label="Delivery Type">
            <select value={prefs.deliveryType} onChange={(e) => setPrefs((prev) => ({ ...prev, deliveryType: e.target.value }))} style={inputStyle}>
              <option value="human-only">Human Only</option>
              <option value="agent-only">Agent Only</option>
              <option value="hybrid">Hybrid</option>
              <option value="unsure">Not Sure</option>
            </select>
          </Field>
          <Field label="Preferred Channel">
            <select value={prefs.communicationPreference} onChange={(e) => setPrefs((prev) => ({ ...prev, communicationPreference: e.target.value }))} style={inputStyle}>
              <option value="email">Email</option>
              <option value="telegram">Telegram</option>
              <option value="either">Either</option>
              <option value="scheduled-call">Scheduled Call</option>
            </select>
          </Field>
          <Field label="Timezone">
            <input value={prefs.timezone} onChange={(e) => setPrefs((prev) => ({ ...prev, timezone: e.target.value }))} placeholder="America/Chicago" style={inputStyle} />
          </Field>
          <Field label="Confidentiality">
            <select value={prefs.confidentiality} onChange={(e) => setPrefs((prev) => ({ ...prev, confidentiality: e.target.value }))} style={inputStyle}>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="nda-required">NDA Required</option>
            </select>
          </Field>
          <Field label="Payment Rail">
            <select value={prefs.paymentPreference} onChange={(e) => setPrefs((prev) => ({ ...prev, paymentPreference: e.target.value }))} style={inputStyle}>
              <option value="usdc">USDC</option>
              <option value="cred">CRED</option>
              <option value="usd">USD</option>
              <option value="open">Open</option>
            </select>
          </Field>
          <Field label="Email">
            <input value={prefs.email} onChange={(e) => setPrefs((prev) => ({ ...prev, email: e.target.value }))} placeholder="you@example.com" style={inputStyle} />
          </Field>
          <Field label="Telegram">
            <input value={prefs.telegram} onChange={(e) => setPrefs((prev) => ({ ...prev, telegram: e.target.value }))} placeholder="@handle" style={inputStyle} />
          </Field>
        </div>

        <Field label="Desired Outcome">
          <textarea rows={2} value={prefs.desiredOutcome} onChange={(e) => setPrefs((prev) => ({ ...prev, desiredOutcome: e.target.value }))} placeholder="What does success look like for this project?" style={{ ...inputStyle, minHeight: "84px", resize: "vertical" }} />
        </Field>

        <Field label="Project Brief">
          <textarea rows={4} value={prefs.needs} onChange={(e) => setPrefs((prev) => ({ ...prev, needs: e.target.value }))} placeholder="Tell us what you're building, what is blocked, what kind of help you want, and any constraints that matter...." style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }} />
        </Field>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "2px", marginBottom: "2px" }}>
          <span>Least Important</span>
          <span>Most Important</span>
        </div>

        {renderSlider("cost", "Cost")}
        {renderSlider("time", "Time")}
        {renderSlider("quality", "Quality")}
        {renderSlider("credibility", "Credibility")}

        <div style={{ padding: "14px 16px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.24)", color: theme.textMuted, lineHeight: 1.7 }}>
          <div style={{ ...labelStyle, marginBottom: "10px" }}>Structured Intake Preview</div>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: theme.textStrong, fontSize: "12px", lineHeight: 1.7, fontFamily: "JetBrains Mono, monospace" }}>
            {JSON.stringify(intakePayload, null, 2)}
          </pre>
        </div>

        {error && (
          <div style={{ padding: "14px 16px", borderRadius: "14px", border: "1px solid rgba(255,120,120,0.35)", background: "rgba(60,10,10,0.18)", color: "#ffb3b3", lineHeight: 1.7 }}>
            {error}
          </div>
        )}

        {requestId && (
          <div style={{ padding: "14px 16px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.24)", color: theme.textMuted, lineHeight: 1.7 }}>
            <div style={{ ...labelStyle, marginBottom: "10px" }}>Request Created</div>
            <div style={{ color: theme.textStrong, marginBottom: "8px" }}>Request ID: {requestId}</div>
            <div>{notificationsQueued} provider notifications queued for delivery review.</div>
          </div>
        )}

        {matches.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={labelStyle}>Top Matches</div>
            {matches.map((match) => (
              <div key={match.slug} style={{ padding: "14px 16px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.24)", color: theme.textMuted, lineHeight: 1.7 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ color: theme.textStrong, fontWeight: 600 }}>{match.name}</div>
                  <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace" }}>Score {match.score}</div>
                </div>
                <div style={{ fontSize: "13px", marginBottom: "8px" }}>Timezone {match.timezone} • Payment {match.payment}</div>
                <ul style={{ margin: 0, paddingLeft: "18px" }}>
                  {match.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <button style={{ ...solidButtonStyle, opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? "progress" : "pointer" }} onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Find Your Matches"}
        </button>
      </div>
    </SiteShell>
  );
}
