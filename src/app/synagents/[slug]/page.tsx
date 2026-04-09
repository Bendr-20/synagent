"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { getSynagentBySlug } from "../data";

const bg = "#050a0e";
const border = "#0f2a3a";
const platinum = "#e0f0f8";
const silverLight = "#f0fbff";
const silverDim = "#5a8a9a";
const gold = "#00e5ff";
const goldDark = "#00bcd4";

const parseCoords = (coords: string) => {
  const [latPart, lngPart] = coords.split("/").map((part) => part.trim());
  const latMatch = latPart.match(/([0-9.]+)\s*([NS])/i);
  const lngMatch = lngPart.match(/([0-9.]+)\s*([EW])/i);

  const lat = latMatch
    ? (latMatch[2].toUpperCase() === "S" ? -1 : 1) * Number(latMatch[1])
    : 0;
  const lng = lngMatch
    ? (lngMatch[2].toUpperCase() === "W" ? -1 : 1) * Number(lngMatch[1])
    : 0;

  return { lat, lng };
};

const getMapDelta = (country: string) => {
  if (["United States", "Australia", "Brazil", "India"].includes(country)) return 7;
  if (["Singapore", "Netherlands", "Portugal", "Ireland", "United Kingdom"].includes(country)) return 2.2;
  return 4;
};

export default function SynagentProfilePage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const params = useParams<{ slug: string }>();
  const agent = getSynagentBySlug(params.slug);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01";
    const fontSize = 14;
    let drops: number[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const columns = Math.floor(canvas.width / fontSize);
      drops = Array(columns).fill(1);
    };

    const drawMatrix = () => {
      ctx.fillStyle = "rgba(5, 10, 14, 0.10)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0, 229, 255, 0.34)";
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1;
      }
    };

    resize();
    const interval = window.setInterval(drawMatrix, 55);
    window.addEventListener("resize", resize);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", resize);
    };
  }, []);

  if (!agent) {
    return (
      <div style={{ minHeight: "100vh", background: bg, color: platinum, display: "flex", alignItems: "center", justifyContent: "center" }}>
        Synagent not found.
      </div>
    );
  }

  const { lat, lng } = parseCoords(agent.coords);
  const delta = getMapDelta(agent.country);
  const bbox = `${(lng - delta).toFixed(4)},${(lat - delta).toFixed(4)},${(lng + delta).toFixed(4)},${(lat + delta).toFixed(4)}`;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;

  return (
    <div style={{ minHeight: "100vh", background: bg, color: platinum, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.18, pointerEvents: "none" }} />
      <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", opacity: 0.22, background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.04) 3px)" }} />

      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 48px", borderBottom: `1px solid ${border}`, background: "rgba(5,10,14,0.72)", backdropFilter: "blur(8px)" }}>
          <a href="/" style={{ fontSize: "20px", letterSpacing: "0.3em", fontWeight: 300, fontFamily: "Space Grotesk, sans-serif", textDecoration: "none", cursor: "pointer" }}>
            <span style={{ color: silverLight }}>SYN</span>
            <span style={{ color: gold }}>AGENT</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 14px", borderRadius: "999px", border: `1px solid ${border}`, background: "rgba(10,18,24,0.88)", boxShadow: "0 0 0 1px rgba(0,229,255,0.04) inset" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: gold, boxShadow: "0 0 12px rgba(0,229,255,0.7)", flexShrink: 0 }} />
            <span style={{ fontSize: "11px", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.12em", color: silverLight, textTransform: "uppercase" }}>
              Systems Active | Accepting Ideas
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <a href="#" style={{ fontSize: "14px", color: silverDim, textDecoration: "none", letterSpacing: "0.05em" }}>$CRED</a>
            <a href="#" style={{ fontSize: "14px", color: silverDim, textDecoration: "none", letterSpacing: "0.05em" }}>DOCS</a>
            <button style={{ background: `linear-gradient(135deg, ${gold}, ${goldDark})`, color: bg, fontWeight: 600, borderRadius: "8px", padding: "8px 20px", border: "none", cursor: "pointer", fontSize: "13px" }}>CONNECT</button>
          </div>
        </nav>

        <main style={{ flex: 1, padding: "36px 32px 24px" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "12px", color: silverDim, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>
                  Synagent Dossier
                </div>
                <h1 style={{ fontSize: "34px", color: silverLight, fontFamily: "Space Grotesk, sans-serif" }}>{agent.name}</h1>
              </div>
              <a href="/synagents" style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(0,229,255,0.26)", background: "rgba(5,10,14,0.18)", color: gold, fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", textDecoration: "none" }}>
                Back to Directory
              </a>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: "20px" }}>
              <div style={{ borderRadius: "20px", border: `1px solid ${border}`, background: "linear-gradient(145deg, rgba(10,18,24,0.94), rgba(8,14,18,0.88))", boxShadow: "0 20px 45px rgba(0,0,0,0.22)", padding: "24px", display: "flex", gap: "18px" }}>
                <div style={{ width: "92px", height: "92px", borderRadius: "18px", border: "1px solid rgba(0,229,255,0.18)", background: "rgba(0,229,255,0.08)", color: gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 700, fontFamily: "JetBrains Mono, monospace", flexShrink: 0 }}>
                  {agent.avatar}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ padding: "4px 8px", borderRadius: "999px", border: "1px solid rgba(0,229,255,0.18)", color: gold, fontSize: "10px", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {agent.featured ? "Featured" : "Active"}
                    </span>
                    <span style={{ padding: "4px 8px", borderRadius: "999px", border: `1px solid ${border}`, color: silverDim, fontSize: "10px", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      {agent.country}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: silverDim, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    Credibility {agent.cred} • Last Active {agent.lastActive}
                  </div>
                  <p style={{ color: silverDim, lineHeight: 1.8, fontSize: "15px" }}>{agent.bio}</p>
                  <a
                    href={`/match?agent=${agent.slug}`}
                    style={{
                      marginTop: "6px",
                      width: "fit-content",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      border: "1px solid rgba(0,229,255,0.26)",
                      background: "rgba(5,10,14,0.18)",
                      color: gold,
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "10px",
                      boxShadow: "inset 0 0 0 1px rgba(0,229,255,0.03)",
                    }}
                  >
                    <span>Submit A Proposal</span>
                    <span>{">"}</span>
                  </a>
                </div>
              </div>

              <div style={{ borderRadius: "20px", border: `1px solid ${border}`, background: "linear-gradient(145deg, rgba(10,18,24,0.94), rgba(8,14,18,0.88))", boxShadow: "0 20px 45px rgba(0,0,0,0.22)", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ fontSize: "12px", color: silverDim, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>Agent Intel</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div style={{ padding: "12px", borderRadius: "14px", border: `1px solid ${border}`, background: "rgba(5,10,14,0.24)" }}>
                    <div style={{ fontSize: "11px", color: silverDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Member Since</div>
                    <div style={{ color: silverLight }}>{agent.memberSince}</div>
                  </div>
                  <div style={{ padding: "12px", borderRadius: "14px", border: `1px solid ${border}`, background: "rgba(5,10,14,0.24)" }}>
                    <div style={{ fontSize: "11px", color: silverDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Payment</div>
                    <div style={{ color: gold, fontFamily: "JetBrains Mono, monospace" }}>{agent.payment}</div>
                  </div>
                </div>
                <div style={{ padding: "12px 14px", borderRadius: "14px", border: `1px solid ${border}`, background: "rgba(5,10,14,0.24)" }}>
                  <div style={{ fontSize: "11px", color: silverDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Contact Methods</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", color: silverLight, fontSize: "14px" }}>
                    <span>X: {agent.contacts.x}</span>
                    <span>Telegram: {agent.contacts.telegram}</span>
                    <span>Email: {agent.contacts.email}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: "20px" }}>
              <div style={{ borderRadius: "20px", border: `1px solid ${border}`, background: "linear-gradient(145deg, rgba(10,18,24,0.94), rgba(8,14,18,0.88))", boxShadow: "0 20px 45px rgba(0,0,0,0.22)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ fontSize: "12px", color: silverDim, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>Location Grid</div>
                <div style={{ position: "relative", minHeight: "260px", borderRadius: "16px", border: `1px solid ${border}`, background: "linear-gradient(145deg, rgba(0,229,255,0.04), rgba(5,10,14,0.28))", overflow: "hidden" }}>
                  <iframe
                    title={`${agent.name} location map`}
                    src={mapSrc}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "260px",
                      border: 0,
                      filter: "invert(0.92) hue-rotate(180deg) saturate(0.55) brightness(0.55) contrast(1.15)",
                    }}
                  />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,10,14,0.16), rgba(5,10,14,0.28))", pointerEvents: "none" }} />
                  <div style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: gold,
                    transform: "translate(-50%, -50%)",
                    boxShadow: "0 0 0 6px rgba(0,229,255,0.14), 0 0 22px rgba(0,229,255,0.9)",
                    pointerEvents: "none",
                  }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ padding: "12px 14px", borderRadius: "14px", border: `1px solid ${border}`, background: "rgba(5,10,14,0.24)" }}>
                    <div style={{ fontSize: "11px", color: silverDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Timezone</div>
                    <div style={{ color: silverLight }}>{agent.timezone}</div>
                  </div>
                  <div style={{ padding: "12px 14px", borderRadius: "14px", border: `1px solid ${border}`, background: "rgba(5,10,14,0.24)" }}>
                    <div style={{ fontSize: "11px", color: silverDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Operational Region</div>
                    <div style={{ color: silverLight }}>{agent.city}, {agent.country}</div>
                  </div>
                </div>
              </div>

              <div style={{ borderRadius: "20px", border: `1px solid ${border}`, background: "linear-gradient(145deg, rgba(10,18,24,0.94), rgba(8,14,18,0.88))", boxShadow: "0 20px 45px rgba(0,0,0,0.22)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ fontSize: "12px", color: silverDim, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>Finished Projects</div>
                {agent.projects.map((project) => (
                  <div key={project.name} style={{ padding: "16px", borderRadius: "16px", border: `1px solid ${border}`, background: "rgba(5,10,14,0.24)", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                      <div>
                        <div style={{ color: silverLight, fontSize: "15px", fontWeight: 600 }}>{project.name}</div>
                        <div style={{ color: silverDim, fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "4px" }}>{project.type}</div>
                      </div>
                      <div style={{ color: gold, fontFamily: "JetBrains Mono, monospace", fontSize: "13px" }}>{project.rating.toFixed(1)}</div>
                    </div>
                    <p style={{ color: silverDim, fontSize: "14px", lineHeight: 1.7 }}>{project.result}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer style={{ textAlign: "center", padding: "32px", borderTop: `1px solid ${border}` }}>
          <p style={{ fontSize: "14px", color: silverDim }}>
            Powered by <span style={{ color: platinum, fontWeight: 600 }}>Helixa</span> on Base
          </p>
        </footer>
      </div>
    </div>
  );
}
