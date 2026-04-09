import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { glassCardStyle, theme } from "@/lib/theme";
import { synagents } from "./data";

const eyebrowStyle = {
  fontSize: "12px",
  color: theme.textMuted,
  fontFamily: "JetBrains Mono, monospace",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
};

const mobileMetaLabelStyle = {
  ...eyebrowStyle,
  fontSize: "10px",
  letterSpacing: "0.08em",
  marginBottom: "6px",
};

export default function SynagentsPage() {
  return (
    <SiteShell mainStyle={{ padding: "clamp(24px, 4vw, 36px) clamp(16px, 3vw, 32px) 24px" }}>
      <div className="directory-page" style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <div style={{ ...eyebrowStyle, marginBottom: "8px" }}>Browse Synagents</div>
          <h1 className="directory-title" style={{ fontSize: "34px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif" }}>
            Synagent Directory
          </h1>
        </div>

        <div className="directory-table" style={{ ...glassCardStyle, borderRadius: "20px", padding: 0, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2.2fr 1.4fr 1.2fr 1.2fr 1fr",
              gap: "16px",
              padding: "16px 20px",
              borderBottom: `1px solid ${theme.border}`,
              background: "rgba(5,10,14,0.48)",
              fontSize: "11px",
              color: theme.textMuted,
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            <div>Agent Name</div>
            <div>Country</div>
            <div>Payment Method</div>
            <div>Last Active</div>
            <div>Credibility</div>
          </div>

          {synagents.map((agent, index) => (
            <Link
              key={agent.slug}
              href={`/synagents/${agent.slug}`}
              style={{
                display: "grid",
                gridTemplateColumns: "2.2fr 1.4fr 1.2fr 1.2fr 1fr",
                gap: "16px",
                padding: "16px 20px",
                borderBottom: index === synagents.length - 1 ? "none" : "1px solid rgba(0,229,255,0.08)",
                alignItems: "center",
                background: agent.featured ? "rgba(0,229,255,0.035)" : "transparent",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                {agent.featured && (
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "999px",
                      border: "1px solid rgba(0,229,255,0.18)",
                      color: theme.accent,
                      fontSize: "10px",
                      fontFamily: "JetBrains Mono, monospace",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}
                  >
                    Featured
                  </span>
                )}
                <span style={{ color: theme.textStrong, fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {agent.name}
                </span>
              </div>
              <div style={{ color: theme.text, fontSize: "14px" }}>{agent.country}</div>
              <div style={{ color: theme.accent, fontSize: "13px", fontFamily: "JetBrains Mono, monospace" }}>{agent.payment}</div>
              <div style={{ color: theme.text, fontSize: "13px" }}>{agent.lastActive}</div>
              <div style={{ color: theme.textStrong, fontSize: "13px", fontFamily: "JetBrains Mono, monospace" }}>{agent.cred}</div>
            </Link>
          ))}
        </div>

        <div className="directory-mobile-list">
          {synagents.map((agent) => (
            <Link
              key={agent.slug}
              href={`/synagents/${agent.slug}`}
              className="directory-mobile-card"
              style={{
                ...glassCardStyle,
                borderRadius: "20px",
                textDecoration: "none",
                color: "inherit",
                background: agent.featured
                  ? "linear-gradient(145deg, rgba(10,18,24,0.94), rgba(8,14,18,0.86)), rgba(0,229,255,0.03)"
                  : glassCardStyle.background,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "14px" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: theme.textStrong, fontSize: "18px", fontWeight: 600, lineHeight: 1.25, wordBreak: "break-word" }}>{agent.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                    {agent.featured && (
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "999px",
                          border: "1px solid rgba(0,229,255,0.18)",
                          color: theme.accent,
                          fontSize: "10px",
                          fontFamily: "JetBrains Mono, monospace",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                        }}
                      >
                        Featured
                      </span>
                    )}
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "999px",
                        border: `1px solid ${theme.border}`,
                        color: theme.textMuted,
                        fontSize: "10px",
                        fontFamily: "JetBrains Mono, monospace",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {agent.country}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ ...mobileMetaLabelStyle, marginBottom: "4px" }}>Cred</div>
                  <div style={{ color: theme.textStrong, fontSize: "22px", fontFamily: "JetBrains Mono, monospace" }}>{agent.cred}</div>
                </div>
              </div>

              <div className="directory-mobile-meta">
                <div>
                  <div style={mobileMetaLabelStyle}>Payment</div>
                  <div style={{ color: theme.accent, fontSize: "14px", fontFamily: "JetBrains Mono, monospace" }}>{agent.payment}</div>
                </div>
                <div>
                  <div style={mobileMetaLabelStyle}>Last Active</div>
                  <div style={{ color: theme.textStrong, fontSize: "14px" }}>{agent.lastActive}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "22px" }}>
          <button disabled style={{ padding: "10px 14px", borderRadius: "12px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.18)", color: theme.textMuted, fontSize: "12px", textTransform: "uppercase", cursor: "not-allowed" }}>Previous</button>
          <div style={{ minWidth: "42px", textAlign: "center", padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(0,229,255,0.26)", background: "rgba(0,229,255,0.08)", color: theme.accent, fontSize: "12px", fontFamily: "JetBrains Mono, monospace" }}>1</div>
          <button disabled style={{ padding: "10px 14px", borderRadius: "12px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.18)", color: theme.textMuted, fontSize: "12px", textTransform: "uppercase", cursor: "not-allowed" }}>Next</button>
        </div>
      </div>
    </SiteShell>
  );
}
