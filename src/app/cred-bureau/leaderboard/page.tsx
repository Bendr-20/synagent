import { SiteShell } from "@/components/site-shell";
import { getRewardContributions, getRewardParticipants } from "@/lib/cred-bureau-rewards-store";
import { buildCredBureauLeaderboard } from "@/lib/cred-bureau-rewards-scoring";
import { glassCardStyle, theme } from "@/lib/theme";

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

function publicStatsForParticipant(personId: string) {
  const approved = getRewardContributions().filter((item) => item.participantId === personId && item.status === "approved");
  const categoryPoints = new Map<string, number>();
  for (const item of approved) {
    categoryPoints.set(item.categoryId, (categoryPoints.get(item.categoryId) || 0) + item.assignedPoints);
  }
  const topCategory = [...categoryPoints.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return {
    totalApprovedContributions: approved.length,
    topCategory: topCategory ? categoryLabel(topCategory) : "No approved work yet",
  };
}

export default function CredBureauLeaderboardPage() {
  const participants = getRewardParticipants();
  const contributions = getRewardContributions();
  const rows = buildCredBureauLeaderboard(participants, contributions);

  return (
    <SiteShell>
      <section style={{ maxWidth: "1180px", margin: "0 auto", padding: "88px 24px 96px" }}>
        <div style={{ ...glassCardStyle, marginBottom: "18px" }}>
          <div style={{ fontSize: "12px", color: theme.accent, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "18px" }}>
            Cred Bureau leaderboard
          </div>
          <h1 style={{ margin: "0 0 16px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(38px, 6vw, 68px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
            Public leaderboard
          </h1>
          <p style={{ color: theme.textMuted, lineHeight: 1.7, margin: 0, maxWidth: "760px" }}>
            Public standings show only reviewed contribution signal: rank, display name, season points, total approved contributions, top category, and last approved contribution date.
          </p>
        </div>

        <div style={{ ...glassCardStyle, padding: "0", overflow: "hidden" }}>
          <div className="cred-bureau-leaderboard-header cred-bureau-leaderboard-row" style={{ display: "grid", gridTemplateColumns: "72px 1.2fr 0.9fr 1fr 1fr 1fr", gap: "12px", padding: "16px 18px", borderBottom: "1px solid rgba(0,229,255,0.14)", color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <div>Rank</div>
            <div>Display name</div>
            <div>Season points</div>
            <div>Total approved contributions</div>
            <div>Top category</div>
            <div>Last approved contribution date</div>
          </div>

          {rows.length === 0 ? (
            <div style={{ padding: "26px 18px", color: theme.textMuted, lineHeight: 1.6 }}>
              No approved contributions yet. The leaderboard will populate after manual review starts.
            </div>
          ) : (
            rows.map((row, index) => {
              const stats = publicStatsForParticipant(row.participantId);
              return (
                <div key={row.participantId} className="cred-bureau-leaderboard-row" style={{ display: "grid", gridTemplateColumns: "72px 1.2fr 0.9fr 1fr 1fr 1fr", gap: "12px", padding: "16px 18px", borderBottom: index === rows.length - 1 ? "none" : "1px solid rgba(0,229,255,0.08)", color: theme.textStrong, alignItems: "center" }}>
                  <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace" }}>{index + 1}</div>
                  <div>{row.displayName}</div>
                  <div>{row.points}</div>
                  <div>{stats.totalApprovedContributions}</div>
                  <div>{stats.topCategory}</div>
                  <div>{row.lastApprovedAt ? new Date(row.lastApprovedAt).toLocaleDateString("en-US", { timeZone: "UTC" }) : "Pending"}</div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </SiteShell>
  );
}
