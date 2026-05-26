import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { glassCardStyle, outlineButtonStyle, solidButtonStyle, theme } from "@/lib/theme";
import { RewardSubmissionForm } from "./reward-submission-form";

const rewardsOpen = process.env.NEXT_PUBLIC_CRED_BUREAU_REWARDS_OPEN === "1";

const allocationRows = [
  ["50%", "Matched-task rewards", "Posted task, accepted, completed, rated"],
  ["15%", "High-quality task creation", "Tasks other testers actually want to take"],
  ["15%", "Bug reports and friction logs", "Clear reports that improve the product"],
  ["10%", "Product-changing feedback", "Feedback that directly changes product"],
  ["5%", "Active referrals", "Referrals that become active matched users"],
  ["5%", "Wildcard grants", "Manual grants for unusually valuable work"],
];

export default function CredBureauRewardsPage() {
  return (
    <SiteShell>
      <section style={{ maxWidth: "1180px", margin: "0 auto", padding: "88px 24px 34px" }}>
        <nav className="cred-bureau-toggle" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", padding: "8px 14px", borderRadius: "999px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.5)" }}>
          <Link
            href="/cred-bureau/rewards"
            style={{ fontSize: "13px", color: theme.textStrong, fontWeight: 900, textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            Rewards
          </Link>
          <span style={{ color: theme.textMuted, fontSize: "11px", fontWeight: 700 }}>|</span>
          <Link
            href="/cred-bureau/leaderboard"
            style={{ fontSize: "13px", color: theme.textMuted, fontWeight: 700, textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase" }}
          >
            Public leaderboard
          </Link>
        </nav>
        <div className="cred-bureau-rewards-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "22px", alignItems: "stretch" }}>
          <div style={{ ...glassCardStyle, borderColor: "rgba(0,229,255,0.32)" }}>
            <div style={{ fontSize: "12px", color: theme.accent, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "18px" }}>
              Cred Bureau Rewards
            </div>
            <h1 style={{ margin: "0 0 18px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(38px, 6vw, 70px)", lineHeight: 0.98, letterSpacing: "-0.04em" }}>
              Cred Bureau Rewards
            </h1>
            <p style={{ margin: "0 0 22px", color: theme.textMuted, fontSize: "17px", lineHeight: 1.72 }}>
              The rewards layer is being wired up now. The public pool is 1% of the $CRED supply across 2 seasons, 3 weeks each, with a 40/60 season split and a weekly checkpoint cadence.
            </p>
            <p style={{ margin: "0 0 26px", color: theme.textMuted, fontSize: "15px", lineHeight: 1.7 }}>
              Rewards are earned through matched tasks, high-quality task creation, bug reports and friction logs, product-changing feedback, active referrals, and wildcard grants. Social contributions are supporting evidence only. Every contribution requires manual review before payouts.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <Link href="/cred-bureau" style={{ ...solidButtonStyle, width: "auto", minWidth: "210px" }}>
                Last chance to apply
              </Link>
              <Link href="/cred-bureau/leaderboard" style={{ ...outlineButtonStyle, width: "auto", minWidth: "190px" }}>
                View leaderboard
              </Link>
            </div>
          </div>

          <div style={{ ...glassCardStyle }}>
            <div style={{ fontSize: "11px", color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "16px" }}>
              Allocation model
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {allocationRows.map(([share, label, body]) => (
                <div key={label} style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid rgba(0,229,255,0.08)" }}>
                  <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "13px" }}>{share}</div>
                  <div>
                    <div style={{ color: theme.textStrong, fontWeight: 700, marginBottom: "4px" }}>{label}</div>
                    <div style={{ color: theme.textMuted, fontSize: "13px", lineHeight: 1.55 }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: "980px", margin: "0 auto", padding: "0 24px 96px" }}>
        <div style={{ ...glassCardStyle }}>
          <h2 style={{ color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", margin: "0 0 12px", fontSize: "28px" }}>
            Contribution submission
          </h2>
          <p style={{ color: theme.textMuted, lineHeight: 1.65, margin: "0 0 22px" }}>
            Submit work for review once rewards open. A contribution ID confirms receipt, then it stays pending manual review. No payout is promised from submission alone.
          </p>
          {rewardsOpen ? (
            <RewardSubmissionForm />
          ) : (
            <div style={{ padding: "18px", borderRadius: "14px", border: "1px solid rgba(0,229,255,0.18)", background: "rgba(5,10,14,0.34)", color: theme.textStrong }}>
              Submissions opening soon. Apply to Cred Bureau now so you are ready when the first season starts.
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
