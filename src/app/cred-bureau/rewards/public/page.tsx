import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { getRewardContributions } from "@/lib/cred-bureau-rewards-store";
import { glassCardStyle, outlineButtonStyle, theme } from "@/lib/theme";

function redactContribution(contribution: any) {
  return {
    id: contribution.id,
    categoryId: contribution.categoryId,
    title: contribution.title,
    status: contribution.status,
    assignedPoints: contribution.assignedPoints,
    createdAt: contribution.createdAt,

  };
}

export default function PublicRewardsRedactedPage() {
  const contributions = getRewardContributions();
  const redacted = contributions.map(redactContribution);
  const bugReports = redacted.filter((c) => c.categoryId === "bug-friction-log");
  const productFeedback = redacted.filter((c) => c.categoryId === "product-feedback");
  const other = redacted.filter((c) => c.categoryId !== "bug-friction-log" && c.categoryId !== "product-feedback");

  return (
    <SiteShell>
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "72px 24px 96px" }}>
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", color: theme.accent, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "14px" }}>
            Public Redacted View
          </div>
          <h1 style={{ margin: "0 0 12px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(34px, 6vw, 62px)", lineHeight: 1 }}>
            Bug Reports & Product Feedback
          </h1>
          <p style={{ color: theme.textMuted, maxWidth: "760px", lineHeight: 1.7, margin: 0 }}>
            Titles and status only — no personal details, payment addresses, proof links, or internal notes. Raw data stays locked behind the reviewer key.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
          <Link href="/cred-bureau/rewards" style={{ ...outlineButtonStyle, width: "auto" }}>
            Submit Report
          </Link>
          <Link href="/cred-bureau/leaderboard" style={{ ...outlineButtonStyle, width: "auto" }}>
            Leaderboard
          </Link>
        </div>

        <div style={{ display: "grid", gap: "20px" }}>
          <section>
            <h2 style={{ margin: "0 0 14px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "26px" }}>
              Bug reports ({bugReports.length})
            </h2>
            {bugReports.length === 0 ? (
              <div style={{ ...glassCardStyle, color: theme.textMuted, lineHeight: 1.7 }}>
                No bug reports yet.
              </div>
            ) : (
              <div className="public-rewards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "14px" }}>
                {bugReports.map((report) => (
                  <article key={report.id} style={{ ...glassCardStyle, padding: "18px" }}>
                    <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", marginBottom: "8px" }}>
                      {report.status}
                    </div>
                    <h3 style={{ margin: "0 0 10px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "20px" }}>
                      {report.title}
                    </h3>
                    <div style={{ color: theme.textMuted, fontSize: "13px", lineHeight: 1.5 }}>
                      {report.assignedPoints} points • {new Date(report.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })} UTC
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 style={{ margin: "0 0 14px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "26px" }}>
              Product feedback ({productFeedback.length})
            </h2>
            {productFeedback.length === 0 ? (
              <div style={{ ...glassCardStyle, color: theme.textMuted, lineHeight: 1.7 }}>
                No product feedback yet.
              </div>
            ) : (
              <div className="public-rewards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "14px" }}>
                {productFeedback.map((report) => (
                  <article key={report.id} style={{ ...glassCardStyle, padding: "18px" }}>
                    <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", marginBottom: "8px" }}>
                      {report.status}
                    </div>
                    <h3 style={{ margin: "0 0 10px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "20px" }}>
                      {report.title}
                    </h3>
                    <div style={{ color: theme.textMuted, fontSize: "13px", lineHeight: 1.5 }}>
                      {report.assignedPoints} points • {new Date(report.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })} UTC
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {other.length > 0 && (
            <section>
              <h2 style={{ margin: "0 0 14px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "26px" }}>
                Other Contributions ({other.length})
              </h2>
              <div className="public-rewards-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "14px" }}>
                {other.map((report) => (
                  <article key={report.id} style={{ ...glassCardStyle, padding: "18px" }}>
                    <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", marginBottom: "8px" }}>
                      {report.status}
                    </div>
                    <h3 style={{ margin: "0 0 10px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "20px" }}>
                      {report.title}
                    </h3>
                    <div style={{ color: theme.textMuted, fontSize: "13px", lineHeight: 1.5 }}>
                      {report.assignedPoints} points • {new Date(report.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })} UTC
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
