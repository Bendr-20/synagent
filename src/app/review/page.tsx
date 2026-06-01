import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { glassCardStyle, outlineButtonStyle, theme } from "@/lib/theme";
import { ReviewKeyConsole } from "./review-key-console";

const reviewQueues = [
  {
    label: "Task requests",
    href: "/review/matches",
    description: "Submitted Synagent work requests, match confidence, contacts, and notification state.",
  },
  {
    label: "Access applications",
    href: "/review/cred-bureau",
    description: "Cred Bureau applicant review boxes, Helixa profile links, and decision log.",
  },
  {
    label: "Reward reports",
    href: "/review/cred-bureau/rewards",
    description: "Cred Bureau bug reports, product feedback, evidence, points, and payout export controls.",
  },
];

export default function ReviewerConsolePage() {
  return (
    <SiteShell>
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "72px 24px 96px" }}>
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", color: theme.accent, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "14px" }}>
            Private Operations
          </div>
          <h1 style={{ margin: "0 0 12px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(36px, 6vw, 64px)", lineHeight: 1 }}>
            Reviewer Console
          </h1>
          <p style={{ color: theme.textMuted, maxWidth: "760px", lineHeight: 1.7, margin: 0 }}>
            One browser entry point for reviewer-only queues. Raw reports stay gated because they include contacts, wallets, evidence links, reviewer notes, and untriaged security details.
          </p>
        </div>

        <div style={{ ...glassCardStyle, marginBottom: "22px" }}>
          <ReviewKeyConsole />
        </div>

        <section style={{ display: "grid", gap: "14px" }}>
          <h2 style={{ margin: "0 0 2px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "26px" }}>Queues</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "14px" }} className="review-console-grid">
            {reviewQueues.map((queue) => (
              <Link key={queue.href} href={queue.href} style={{ ...outlineButtonStyle, alignItems: "flex-start", justifyContent: "flex-start", flexDirection: "column", minHeight: "118px" }}>
                <span style={{ color: theme.textStrong }}>{queue.label}</span>
                <span style={{ color: theme.textMuted, fontSize: "12px", letterSpacing: "0.02em", textTransform: "none", fontWeight: 500 }}>{queue.description}</span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </SiteShell>
  );
}
