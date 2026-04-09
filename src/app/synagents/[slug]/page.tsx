import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { glassCardStyle, outlineButtonStyle, theme } from "@/lib/theme";
import { getSynagentBySlug } from "../data";

function parseCoords(coords: string) {
  const [latPart, lngPart] = coords.split("/").map((part) => part.trim());
  const latMatch = latPart.match(/([0-9.]+)\s*([NS])/i);
  const lngMatch = lngPart.match(/([0-9.]+)\s*([EW])/i);

  const lat = latMatch ? (latMatch[2].toUpperCase() === "S" ? -1 : 1) * Number(latMatch[1]) : 0;
  const lng = lngMatch ? (lngMatch[2].toUpperCase() === "W" ? -1 : 1) * Number(lngMatch[1]) : 0;

  return { lat, lng };
}

function getMapDelta(country: string) {
  if (["United States", "Australia", "Brazil", "India"].includes(country)) return 7;
  if (["Singapore", "Netherlands", "Portugal", "Ireland", "United Kingdom"].includes(country)) return 2.2;
  return 4;
}

function MaskedContact({ value, type = "handle" }: { value: string; type?: "handle" | "email" }) {
  const prefix = type === "handle" && value.startsWith("@") ? "@" : "";
  const core = type === "email" ? value.split("@")[0] : value.replace(/^@/, "");
  const first = core.slice(0, 1);
  const middle = core.slice(1, -1);
  const last = core.slice(-1);

  return (
    <span style={{ display: "inline-flex", alignItems: "center" }}>
      <span>
        {prefix}
        {first}
      </span>
      {middle ? (
        <span style={{ filter: "blur(4px)", opacity: 0.9, userSelect: "none", pointerEvents: "none" }}>{middle}</span>
      ) : null}
      <span>{last}</span>
    </span>
  );
}

const eyebrowStyle = {
  fontSize: "12px",
  color: theme.textMuted,
  fontFamily: "JetBrains Mono, monospace",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
};

export default async function SynagentProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = getSynagentBySlug(slug);
  if (!agent) notFound();

  const { lat, lng } = parseCoords(agent.coords);
  const delta = getMapDelta(agent.country);
  const bbox = `${(lng - delta).toFixed(4)},${(lat - delta).toFixed(4)},${(lng + delta).toFixed(4)},${(lat + delta).toFixed(4)}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;

  return (
    <SiteShell mainStyle={{ padding: "clamp(24px, 4vw, 36px) clamp(16px, 3vw, 32px) 24px" }}>
      <div className="dossier-page" style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div className="dossier-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px" }}>
          <div>
            <div style={{ ...eyebrowStyle, marginBottom: "8px" }}>Synagent Dossier</div>
            <h1 className="dossier-title" style={{ fontSize: "34px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", wordBreak: "break-word" }}>
              {agent.name}
            </h1>
          </div>
          <Link className="dossier-back-link" href="/synagents" style={{ ...outlineButtonStyle, width: "auto", padding: "10px 14px", marginTop: 0 }}>
            <span>Back to Directory</span>
          </Link>
        </div>

        <div className="dossier-top-grid" style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: "20px" }}>
          <div className="dossier-hero-card" style={{ ...glassCardStyle, borderRadius: "20px", display: "flex", gap: "18px" }}>
            <div
              style={{
                width: "92px",
                height: "92px",
                borderRadius: "18px",
                border: "1px solid rgba(0,229,255,0.18)",
                background: "rgba(0,229,255,0.08)",
                color: theme.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 700,
                fontFamily: "JetBrains Mono, monospace",
                flexShrink: 0,
              }}
            >
              {agent.avatar}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
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
                  {agent.featured ? "Featured" : "Active"}
                </span>
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
              <div className="dossier-subhead" style={{ fontSize: "13px", color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Credibility {agent.cred} • Last Active {agent.lastActive}
              </div>
              <p style={{ color: theme.textMuted, lineHeight: 1.8, fontSize: "15px", margin: 0 }}>{agent.bio}</p>
              <Link className="dossier-cta" href={`/match?agent=${agent.slug}`} style={{ ...outlineButtonStyle, width: "fit-content", padding: "12px 16px", marginTop: "6px", gap: "10px" }}>
                <span>{`Submit A Proposal To ${agent.name}`}</span>
                <span>{">"}</span>
              </Link>
            </div>
          </div>

          <div style={{ ...glassCardStyle, borderRadius: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={eyebrowStyle}>Agent Intel</div>
            <div className="dossier-intel-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ padding: "12px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.24)" }}>
                <div style={{ fontSize: "11px", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Member Since</div>
                <div style={{ color: theme.textStrong }}>{agent.memberSince}</div>
              </div>
              <div style={{ padding: "12px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.24)" }}>
                <div style={{ fontSize: "11px", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Payment</div>
                <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace" }}>{agent.payment}</div>
              </div>
            </div>
            <div style={{ padding: "12px 14px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.24)" }}>
              <div style={{ fontSize: "11px", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Contact Methods</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", color: theme.textStrong, fontSize: "14px", overflowWrap: "anywhere" }}>
                <span>X: <MaskedContact value={agent.contacts.x} /></span>
                <span>Telegram: <MaskedContact value={agent.contacts.telegram} /></span>
                <span>Email: <MaskedContact value={agent.contacts.email} type="email" /></span>
              </div>
            </div>
          </div>
        </div>

        <div className="dossier-bottom-grid" style={{ display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: "20px" }}>
          <div style={{ ...glassCardStyle, borderRadius: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={eyebrowStyle}>Location Grid</div>
            <div style={{ position: "relative", minHeight: "260px", borderRadius: "16px", border: `1px solid ${theme.border}`, background: "linear-gradient(145deg, rgba(0,229,255,0.04), rgba(5,10,14,0.28))", overflow: "hidden" }}>
              <iframe
                title={`${agent.name} location map`}
                src={mapSrc}
                loading="lazy"
                style={{ width: "100%", height: "260px", border: 0, filter: "invert(0.92) hue-rotate(180deg) saturate(0.55) brightness(0.55) contrast(1.15)" }}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,10,14,0.16), rgba(5,10,14,0.28))", pointerEvents: "none" }} />
              <div style={{ position: "absolute", left: "50%", top: "50%", width: "14px", height: "14px", borderRadius: "50%", background: theme.accent, transform: "translate(-50%, -50%)", boxShadow: "0 0 0 6px rgba(0,229,255,0.14), 0 0 22px rgba(0,229,255,0.9)", pointerEvents: "none" }} />
            </div>
            <div className="dossier-location-meta" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ padding: "12px 14px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.24)" }}>
                <div style={{ fontSize: "11px", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Timezone</div>
                <div style={{ color: theme.textStrong }}>{agent.timezone}</div>
              </div>
              <div style={{ padding: "12px 14px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.24)" }}>
                <div style={{ fontSize: "11px", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Operational Region</div>
                <div style={{ color: theme.textStrong }}>{agent.city}, {agent.country}</div>
              </div>
            </div>
          </div>

          <div style={{ ...glassCardStyle, borderRadius: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={eyebrowStyle}>Finished Projects</div>
            {agent.projects.map((project) => (
              <div key={project.name} style={{ padding: "16px", borderRadius: "16px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.24)", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="dossier-project-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <div>
                    <div style={{ color: theme.textStrong, fontSize: "15px", fontWeight: 600 }}>{project.name}</div>
                    <div style={{ color: theme.textMuted, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "4px" }}>{project.type}</div>
                  </div>
                  <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "13px", flexShrink: 0 }}>{project.rating.toFixed(1)}</div>
                </div>
                <p style={{ color: theme.textMuted, fontSize: "14px", lineHeight: 1.7, margin: 0 }}>{project.result}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
