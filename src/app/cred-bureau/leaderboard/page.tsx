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

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div className="cred-bureau-leaderboard-row cred-bureau-leaderboard-header-card" style={{ display: "grid", gridTemplateColumns: "56px minmax(0,1fr) 140px 116px", gap: "12px", alignItems: "center", padding: "8px 12px", color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <div>Rank</div>
            <div>Name</div>
            <div>Completed</div>
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
                  className={`cred-bureau-leaderboard-row cred-bureau-leaderboard-card cred-bureau-leaderboard-card--${index % 4}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "56px minmax(0,1fr) 140px 116px",
                    gap: "12px",
                    alignItems: "center",
                    minHeight: "48px",
                    padding: "7px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(0,229,255,0.12)",
                    color: theme.textStrong,
                    textDecoration: "none",
                    boxShadow: "0 6px 14px rgba(0,0,0,0.14)",
                  }}
                >
                  <div style={{ color: index < 3 ? theme.accent : theme.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: "15px", fontWeight: 800 }}>
                    {index + 1}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "15px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.displayName}</div>
                    <div style={{ color: theme.textMuted, fontSize: "9.5px", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      View completed work
                    </div>
                  </div>
                  <div style={{ color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: "11px", fontWeight: 700 }}>
                    {completedCount} approved
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "20px", fontWeight: 900, lineHeight: 1 }}>
                      {row.points}
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
