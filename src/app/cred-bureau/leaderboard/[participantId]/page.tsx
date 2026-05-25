import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { getRewardContributions, getRewardParticipants } from "@/lib/cred-bureau-rewards-store";
import { glassCardStyle, outlineButtonStyle, theme } from "@/lib/theme";

export const dynamic = "force-dynamic";

function categoryLabel(id: string) {
  const labels: Record<string, string> = {
    "matched-task": "Matched task",
    "task-creation": "Task creation",
    "bug-friction-log": "Bug and friction log",
    "product-feedback": "Product feedback",
    referral: "Referral",
    wildcard: "Wildcard",
  };
  return labels[id] || "Reviewed work";
}

export default async function CredBureauContributorPage({ params }: { params: Promise<{ participantId: string }> }) {
  const { participantId } = await params;
  const participant = getRewardParticipants().find((person) => person.id === participantId);
  if (!participant) notFound();

  const approved = getRewardContributions()
    .filter((item) => item.participantId === participantId && item.status === "approved")
    .sort((a, b) => new Date(b.approvedAt ?? b.createdAt).getTime() - new Date(a.approvedAt ?? a.createdAt).getTime());

  const totalPoints = approved.reduce((sum, item) => sum + item.assignedPoints, 0);

  return (
    <SiteShell>
      <section style={{ maxWidth: "980px", margin: "0 auto", padding: "88px 24px 96px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", flexWrap: "wrap", marginBottom: "18px" }}>
          <div>
            <div style={{ fontSize: "12px", color: theme.accent, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "12px" }}>
              Completed work
            </div>
            <h1 style={{ margin: 0, color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(36px, 6vw, 64px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
              {participant.displayName}
            </h1>
          </div>
          <Link href="/cred-bureau/leaderboard" style={{ ...outlineButtonStyle, width: "auto", padding: "12px 16px" }}>
            Back to leaderboard
          </Link>
        </div>

        <div className="cred-bureau-contributor-summary" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
          <div style={{ ...glassCardStyle }}>
            <div style={{ color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
              Points awarded
            </div>
            <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "48px", fontWeight: 900, lineHeight: 1 }}>{totalPoints}</div>
          </div>
          <div style={{ ...glassCardStyle }}>
            <div style={{ color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
              Approved contributions
            </div>
            <div style={{ color: theme.textStrong, fontFamily: "JetBrains Mono, monospace", fontSize: "48px", fontWeight: 900, lineHeight: 1 }}>{approved.length}</div>
          </div>
        </div>

        <div style={{ ...glassCardStyle }}>
          <h2 style={{ margin: "0 0 16px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "28px" }}>Completed work</h2>
          {approved.length === 0 ? (
            <p style={{ color: theme.textMuted, margin: 0 }}>No approved work is public for this contributor yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {approved.map((item) => (
                <div key={item.id} className="cred-bureau-completed-work-card" style={{ padding: "16px", borderRadius: "16px", border: "1px solid rgba(0,229,255,0.12)", background: "rgba(5,10,14,0.28)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "8px" }}>
                    <div style={{ color: theme.textStrong, fontWeight: 800, fontSize: "18px" }}>{item.title}</div>
                    <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontWeight: 900 }}>{item.assignedPoints} pts</div>
                  </div>
                  <div style={{ color: theme.textMuted, lineHeight: 1.65, marginBottom: "10px" }}>{item.description}</div>
                  <div style={{ color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {categoryLabel(item.categoryId)} • Approved {new Date(item.approvedAt ?? item.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
