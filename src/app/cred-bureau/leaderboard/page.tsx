import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { getRewardContributions, getRewardParticipants } from "@/lib/cred-bureau-rewards-store";
import { buildCredBureauLeaderboard } from "@/lib/cred-bureau-rewards-scoring";
import { glassCardStyle, theme } from "@/lib/theme";

export const dynamic = "force-dynamic";

function approvedCountForParticipant(personId: string) {
  return getRewardContributions().filter((item) => item.participantId === personId && item.status === "approved").length;
}

export default function CredBureauLeaderboardPage() {
  const participants = getRewardParticipants();
  const contributions = getRewardContributions();
  const rows = buildCredBureauLeaderboard(participants, contributions);

  return (
    <SiteShell>
      <section style={{ maxWidth: "980px", margin: "0 auto", padding: "88px 24px 96px" }}>
        <div style={{ ...glassCardStyle, marginBottom: "18px" }}>
          <div style={{ fontSize: "12px", color: theme.accent, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "18px" }}>
            Cred Bureau leaderboard
          </div>
          <h1 style={{ margin: "0 0 16px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(38px, 6vw, 68px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
            Public leaderboard
          </h1>
          <p style={{ color: theme.textMuted, lineHeight: 1.7, margin: 0, maxWidth: "720px" }}>
            Public standings show rank, name, total points, and a public completed work view for each contributor. Private review data stays hidden.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="cred-bureau-leaderboard-card cred-bureau-leaderboard-header-card" style={{ display: "grid", gridTemplateColumns: "80px 1fr 190px", gap: "14px", alignItems: "center", padding: "12px 18px", color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <div>Rank</div>
            <div>Name</div>
            <div style={{ textAlign: "right" }}>Total points</div>
          </div>

          {rows.length === 0 ? (
            <div style={{ ...glassCardStyle, color: theme.textMuted, lineHeight: 1.6 }}>
              No approved contributions yet. The leaderboard will populate after manual review starts.
            </div>
          ) : (
            rows.map((row, index) => {
              const completedCount = approvedCountForParticipant(row.participantId);
              return (
                <Link
                  key={row.participantId}
                  href={`/cred-bureau/leaderboard/${row.participantId}`}
                  className={`cred-bureau-leaderboard-card cred-bureau-leaderboard-card--${index % 3}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 190px",
                    gap: "14px",
                    alignItems: "center",
                    padding: "20px",
                    borderRadius: "20px",
                    border: "1px solid rgba(0,229,255,0.16)",
                    color: theme.textStrong,
                    textDecoration: "none",
                    boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
                  }}
                >
                  <div style={{ color: index < 3 ? theme.accent : theme.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: "20px", fontWeight: 800 }}>
                    {index + 1}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "clamp(20px, 4vw, 30px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "6px" }}>{row.displayName}</div>
                    <div style={{ color: theme.textMuted, fontSize: "13px", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                      Completed work: {completedCount} approved {completedCount === 1 ? "task" : "tasks"} • View completed work
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "clamp(30px, 7vw, 48px)", fontWeight: 900, lineHeight: 1 }}>
                      {row.points}
                    </div>
                    <div style={{ color: theme.textMuted, fontSize: "11px", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: "6px" }}>
                      Total points
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </SiteShell>
  );
}
