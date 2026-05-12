import Link from "next/link";
import { CredBureauApplicationForm } from "./cred-bureau-application-form";
import { SiteShell } from "@/components/site-shell";
import { glassCardStyle, outlineButtonStyle, solidButtonStyle, theme } from "@/lib/theme";

const flowSteps = [
  {
    label: "Apply Now",
    body: "Submit contact details, review context, and an optional Helixa human profile."
  },
  {
    label: "Optional profile",
    body: "Link or mint a Helixa human profile when you are ready. It helps review, but does not block submission."
  },
  {
    label: "Manual review",
    body: "Profile and addendum are reviewed before access. No auto-approval, no public invite link.",
  },
  {
    label: "Manual group add",
    body: "Approved applicants are manually added to the group chat.",
  },
];

const bureauSignals = [
  "Simple application with Telegram contact",
  "Optional Helixa human profile link or mint",
  "Manual review before group access",
];

export default function CredBureauPage() {
  return (
    <SiteShell>
      <section
        className="cred-bureau-hero"
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          padding: "88px 24px 38px",
          display: "grid",
          gridTemplateColumns: "1.08fr 0.92fr",
          gap: "28px",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: "12px", color: theme.accent, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "18px" }}>
            Cred Bureau Closed Beta
          </div>
          <h1 style={{ margin: "0 0 20px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(42px, 7vw, 78px)", lineHeight: 0.96, letterSpacing: "-0.04em" }}>
            Join the human trust layer behind Synagent beta.
          </h1>
          <p style={{ margin: "0 0 28px", color: theme.textMuted, fontSize: "17px", lineHeight: 1.72, maxWidth: "720px" }}>
            Cred Bureau is invite-only access for Synagent beta reviewers and operators. Apply with your contact details and optional Helixa human profile. Approved applicants are manually added to the group chat.
          </p>
          <div className="cred-bureau-actions" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <a href="#apply" style={{ ...solidButtonStyle, width: "auto", minWidth: "190px" }}>
              Apply to Cred Bureau
            </a>
            <Link href="/match?category=mvp-build" style={{ ...outlineButtonStyle, width: "auto", minWidth: "210px" }}>
              <span>View Synagent Beta</span>
              <span>{">"}</span>
            </Link>
          </div>
        </div>

        <div style={{ ...glassCardStyle, borderColor: "rgba(0,229,255,0.32)", boxShadow: "0 18px 44px rgba(0,229,255,0.08), inset 0 0 0 1px rgba(0,229,255,0.05)" }}>
          <div style={{ fontSize: "11px", color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "16px" }}>
            Access model
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {bureauSignals.map((signal, index) => (
              <div key={signal} style={{ display: "flex", gap: "12px", alignItems: "flex-start", paddingBottom: index === bureauSignals.length - 1 ? 0 : "14px", borderBottom: index === bureauSignals.length - 1 ? "none" : "1px solid rgba(0,229,255,0.08)" }}>
                <span style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", lineHeight: 1.6 }}>{String(index + 1).padStart(2, "0")}</span>
                <span style={{ color: theme.textStrong, lineHeight: 1.6 }}>{signal}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 24px 38px" }}>
        <div className="cred-bureau-flow" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "14px" }}>
          {flowSteps.map((step, index) => (
            <div key={step.label} style={{ ...glassCardStyle, padding: "20px", minHeight: "168px" }}>
              <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", marginBottom: "14px" }}>{String(index + 1).padStart(2, "0")}</div>
              <h2 style={{ color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "20px", margin: "0 0 10px" }}>{step.label}</h2>
              <p style={{ color: theme.textMuted, lineHeight: 1.65, margin: 0, fontSize: "14px" }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: "920px", margin: "0 auto", padding: "0 24px 96px" }}>
        <CredBureauApplicationForm />
      </section>
    </SiteShell>
  );
}
