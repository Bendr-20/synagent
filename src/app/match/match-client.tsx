"use client";

import Link from "next/link";
import { useState, type CSSProperties, type ReactNode } from "react";
import { SiteShell } from "@/components/site-shell";
import { solidButtonStyle, glassCardStyle, theme } from "@/lib/theme";
import type { Synagent } from "@/app/synagents/data";
import type { MatchHandoffPrefill, MatchResult, NotificationDispatchMode } from "@/lib/match-types";

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

const categoryKeywordMap: Record<string, string[]> = {
  "mvp-build": ["mvp", "prototype", "build", "frontend", "product", "landing", "website", "app"],
  "operator-support": ["operator", "ops", "support", "assistant", "execution"],
  "ai-consulting": ["ai", "agent", "prompt", "llm", "strategy", "consulting"],
  automation: ["automation", "integration", "workflow", "orchestration", "n8n", "zapier"],
  design: ["design", "ui", "ux", "brand", "copy", "copywriting"],
  growth: ["growth", "launch", "marketing", "distribution", "audience", "sales"],
  research: ["research", "analysis", "intel", "discovery", "investigation"],
};

type PrefState = {
  cost: number;
  time: number;
  quality: number;
  credibility: number;
  requester: string;
  title: string;
  category: string;
  budgetRange: string;
  budgetNote: string;
  urgency: string;
  deliveryType: "human-only" | "agent-only" | "hybrid" | "unsure";
  communicationPreference: string;
  timezone: string;
  confidentiality: string;
  paymentPreference: string;
  email: string;
  telegram: string;
  contactNote: string;
  desiredOutcome: string;
  needs: string;
};

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

function normalizeText(value?: string | null) {
  return (value || "").trim().toLowerCase();
}

function inferCategoryFromHandoff(selectedAgent: Synagent | undefined, handoff?: MatchHandoffPrefill | null) {
  if (selectedAgent?.serviceCategories?.[0]) return selectedAgent.serviceCategories[0];

  const explicit = normalizeText(handoff?.category);
  const allowed = ["mvp-build", "operator-support", "ai-consulting", "automation", "design", "growth", "research", "other"];
  if (allowed.includes(explicit)) return explicit;

  const haystack = normalizeText([
    handoff?.category,
    handoff?.capability,
    handoff?.title,
    handoff?.brief,
    ...(handoff?.requiredSkills || []),
  ].filter(Boolean).join(" "));

  for (const [category, keywords] of Object.entries(categoryKeywordMap)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) return category;
  }

  return selectedAgent ? "operator-support" : "mvp-build";
}

function mapBudgetRange(value?: string | null) {
  const budget = normalizeText(value);
  if (!budget) return "unknown";
  if (budget.includes("under") || budget.includes("<") || budget.includes("500") || budget.includes("1k")) return "under-1k";
  if (budget.includes("1k") || budget.includes("2k") || budget.includes("3k")) return "1k-3k";
  if (budget.includes("5k") || budget.includes("10k")) return "3k-10k";
  if (budget.includes("15k") || budget.includes("20k") || budget.includes("25k")) return "10k-25k";
  if (budget.includes("25k") || budget.includes("50k") || budget.includes("100k") || budget.includes("plus")) return "25k-plus";
  return "unknown";
}

function mapUrgency(value?: string | null) {
  const urgency = normalizeText(value);
  if (!urgency) return "this-month";
  if (urgency === "urgent" || urgency === "high" || urgency.includes("asap") || urgency.includes("today")) return "asap";
  if (urgency.includes("week")) return "this-week";
  if (urgency === "medium" || urgency.includes("month")) return "this-month";
  return "flexible";
}

function mapDeliveryType(selectedAgent: Synagent | undefined, handoff?: MatchHandoffPrefill | null) {
  if (selectedAgent) return selectedAgent.operatorModel;
  if (handoff?.principalType === "human") return "human-only";
  if (handoff?.principalType === "agent") return "agent-only";
  if (handoff?.principalType === "all") return "hybrid";
  return "hybrid";
}

function parseImportedContact(value?: string | null) {
  const contact = (value || "").trim();
  if (!contact) return { email: "", telegram: "", note: "" };
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
    return { email: contact, telegram: "", note: "" };
  }
  if (contact.startsWith("@") || contact.toLowerCase().includes("telegram")) {
    return { email: "", telegram: contact, note: "" };
  }
  return { email: "", telegram: "", note: contact };
}

function buildInitialPrefs(selectedAgent: Synagent | undefined, handoff?: MatchHandoffPrefill | null): PrefState {
  const importedContact = parseImportedContact(handoff?.contact);

  return {
    cost: 5,
    time: handoff?.urgency === "urgent" || handoff?.urgency === "high" ? 8 : 5,
    quality: 6,
    credibility: 7,
    requester: handoff?.requester || "",
    title: handoff?.title || "",
    category: inferCategoryFromHandoff(selectedAgent, handoff),
    budgetRange: mapBudgetRange(handoff?.budget),
    budgetNote: handoff?.budget || "",
    urgency: mapUrgency(handoff?.urgency),
    deliveryType: mapDeliveryType(selectedAgent, handoff),
    communicationPreference: "either",
    timezone: "",
    confidentiality: "private",
    paymentPreference: "usdc",
    email: importedContact.email,
    telegram: importedContact.telegram,
    contactNote: importedContact.note,
    desiredOutcome: handoff?.capability ? `Need strong delivery around ${handoff.capability}.` : "",
    needs: handoff?.brief || "",
  };
}

export function MatchClient({ selectedAgent, handoff }: { selectedAgent?: Synagent; handoff?: MatchHandoffPrefill | null }) {
  const [prefs, setPrefs] = useState<PrefState>(() => buildInitialPrefs(selectedAgent, handoff));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [notificationsQueued, setNotificationsQueued] = useState<number>(0);
  const [notificationMode, setNotificationMode] = useState<NotificationDispatchMode>("queue-only");
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
    requester: prefs.requester || null,
    title: prefs.title || null,
    category: prefs.category,
    budgetRange: prefs.budgetRange,
    budgetNote: prefs.budgetNote || null,
    urgency: prefs.urgency,
    deliveryType: prefs.deliveryType,
    communicationPreference: prefs.communicationPreference,
    timezone: prefs.timezone || null,
    confidentiality: prefs.confidentiality,
    paymentPreference: prefs.paymentPreference,
    desiredOutcome: prefs.desiredOutcome || null,
    brief: prefs.needs || null,
    source: handoff ? {
      source: handoff.source || null,
      requestId: handoff.requestId || null,
      capability: handoff.capability || null,
      principalType: handoff.principalType || null,
      requiredSkills: handoff.requiredSkills || [],
      candidate: handoff.candidate || null,
      resolution: handoff.resolution || null,
    } : null,
    contact: {
      email: prefs.email || null,
      telegram: prefs.telegram || null,
      note: prefs.contactNote || null,
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
      setNotificationMode(data.notificationMode || "queue-only");
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

        {handoff?.source && (
          <div style={{ padding: "14px 16px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.24)", color: theme.textMuted, lineHeight: 1.7 }}>
            <div style={{ ...labelStyle, marginBottom: "10px" }}>Imported Context</div>
            <div style={{ color: theme.textStrong, fontWeight: 600, marginBottom: "6px" }}>Imported from {handoff.source === "helixa-mcp" ? "Helixa MCP" : handoff.source}</div>
            <div>
              {handoff.requestId ? `Source request ${handoff.requestId}. ` : ""}
              {handoff.capability ? `Capability hint: ${handoff.capability}. ` : ""}
              {handoff.requiredSkills.length ? `Required skills: ${handoff.requiredSkills.join(", ")}. ` : ""}
              {handoff.candidate?.name ? `Suggested candidate: ${handoff.candidate.name}. ` : ""}
              {handoff.resolution?.providerName ? `Resolved provider: ${handoff.resolution.providerName} (${handoff.resolution.confidence}).` : ""}
            </div>
          </div>
        )}

        {selectedAgent && (
          <div style={{ padding: "14px 16px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.24)", color: theme.textMuted, lineHeight: 1.7 }}>
            <span style={{ color: theme.textStrong, fontWeight: 600 }}>{selectedAgent.name}</span> is selected as the target provider.
            {handoff?.resolution?.confidence ? ` This came through a ${handoff.resolution.confidence} provider resolution.` : ""}
          </div>
        )}

        <p style={{ color: theme.textMuted, lineHeight: 1.7, fontSize: "15px" }}>
          Tell us what you need, how urgent it is, how you want to work, and how to reach you. This creates a real request record, keeps imported Helixa context intact, and prepares provider notifications for review or dispatch.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <Field label="Requester">
            <input value={prefs.requester} onChange={(e) => setPrefs((prev) => ({ ...prev, requester: e.target.value }))} placeholder="Your name or team" style={inputStyle} />
          </Field>
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
          <Field label="Budget Note">
            <input value={prefs.budgetNote} onChange={(e) => setPrefs((prev) => ({ ...prev, budgetNote: e.target.value }))} placeholder="Budget context, pricing notes, constraints" style={inputStyle} />
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
            <select value={prefs.deliveryType} onChange={(e) => setPrefs((prev) => ({ ...prev, deliveryType: e.target.value as PrefState["deliveryType"] }))} style={inputStyle}>
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
          <Field label="Contact Note">
            <input value={prefs.contactNote} onChange={(e) => setPrefs((prev) => ({ ...prev, contactNote: e.target.value }))} placeholder="Optional contact context or fallback note" style={inputStyle} />
          </Field>
        </div>

        <Field label="Desired Outcome">
          <textarea rows={2} value={prefs.desiredOutcome} onChange={(e) => setPrefs((prev) => ({ ...prev, desiredOutcome: e.target.value }))} placeholder="What does success look like for this project?" style={{ ...inputStyle, minHeight: "84px", resize: "vertical" }} />
        </Field>

        <Field label="Project Brief">
          <textarea rows={4} value={prefs.needs} onChange={(e) => setPrefs((prev) => ({ ...prev, needs: e.target.value }))} placeholder="Tell us what you're building, what is blocked, what kind of help you want, and any constraints that matter..." style={{ ...inputStyle, minHeight: "120px", resize: "vertical" }} />
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
            <div>
              {notificationsQueued} provider notifications {notificationMode === "queue-only" ? "queued" : notificationMode === "review" ? "queued for review" : "ready for live dispatch"}.
            </div>
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
                <div style={{ color: theme.textStrong, marginBottom: "8px" }}>{match.summaryReason}</div>
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
