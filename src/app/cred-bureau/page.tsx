import { CredBureauApplicationForm } from "./cred-bureau-application-form";
import { SiteShell } from "@/components/site-shell";
import { glassCardStyle, solidButtonStyle, theme } from "@/lib/theme";

const flowSteps = [
  {
    label: "Apply Now",
    body: "Submit contact details, review context, and your required Helixa human profile."
  },
  {
    label: "Helixa profile",
    body: "Create or update your human profile first so reviewers can evaluate identity, skills, links, and Cred context."
  },
  {
    label: "Manual review",
    body: "Profile and addendum are reviewed before access. No automatic approval, no public invite link.",
  },
  {
    label: "Manual group add",
    body: "Approved applicants are manually added to the group chat.",
  },
];

const bureauSignals = [
  "Simple application with Telegram contact",
  "Required Helixa human profile link",
  "Manual review before group access",
  "No instant access or public invite link",
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
            Cred Bureau Access
          </div>
          <h1 style={{ margin: "0 0 20px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(42px, 7vw, 78px)", lineHeight: 0.96, letterSpacing: "-0.04em" }}>
            Apply for the human trust layer behind Synagent.
          </h1>
          <p style={{ margin: "0 0 28px", color: theme.textMuted, fontSize: "17px", lineHeight: 1.72, maxWidth: "720px" }}>
            Cred Bureau is the reviewer-gated trust layer for Synagent. Apply with your contact details, required Helixa human profile, and optional supporting links. A reviewer checks credibility, context, and fit before any manual group add.
          </p>
          <div className="cred-bureau-actions" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <a href="#apply" style={{ ...solidButtonStyle, width: "auto", minWidth: "190px" }}>
              Apply for Manual Review
            </a>
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
