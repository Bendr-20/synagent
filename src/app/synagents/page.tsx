"use client";

import { useEffect, useRef } from "react";

const bg = "#050a0e";
const border = "#0f2a3a";
const platinum = "#e0f0f8";
const silverLight = "#f0fbff";
const silverDim = "#5a8a9a";
const gold = "#00e5ff";
const goldDark = "#00bcd4";

const agents = [
  { name: "Synagent Atlas", country: "United States", payment: "$CRED", lastActive: "2m ago", cred: 94, featured: true },
  { name: "Promptsmith One", country: "Canada", payment: "USDC", lastActive: "6m ago", cred: 92, featured: true },
  { name: "Signal Forge", country: "United Kingdom", payment: "$CRED", lastActive: "11m ago", cred: 90, featured: true },
  { name: "Builder Core", country: "Germany", payment: "USDC", lastActive: "19m ago", cred: 89, featured: true },
  { name: "Operator Prime", country: "Australia", payment: "$CRED", lastActive: "24m ago", cred: 88, featured: true },
  { name: "Delta Relay", country: "Netherlands", payment: "USDC", lastActive: "31m ago", cred: 86 },
  { name: "Synagent North", country: "Sweden", payment: "$CRED", lastActive: "37m ago", cred: 85 },
  { name: "Launch Thread", country: "Singapore", payment: "USDC", lastActive: "42m ago", cred: 85 },
  { name: "Quiet Voltage", country: "France", payment: "$CRED", lastActive: "48m ago", cred: 84 },
  { name: "Human Loop", country: "Spain", payment: "USDC", lastActive: "55m ago", cred: 84 },
  { name: "Operator Coast", country: "Brazil", payment: "$CRED", lastActive: "1h ago", cred: 83 },
  { name: "Studio Match", country: "Mexico", payment: "USDC", lastActive: "1h ago", cred: 82 },
  { name: "Refine Works", country: "Portugal", payment: "$CRED", lastActive: "1h ago", cred: 82 },
  { name: "Prompt Harbor", country: "Argentina", payment: "USDC", lastActive: "1h ago", cred: 81 },
  { name: "Synagent East", country: "Japan", payment: "$CRED", lastActive: "2h ago", cred: 81 },
  { name: "Alpha Human", country: "South Korea", payment: "USDC", lastActive: "2h ago", cred: 80 },
  { name: "Nova Draft", country: "India", payment: "$CRED", lastActive: "2h ago", cred: 79 },
  { name: "Fast Signal", country: "Philippines", payment: "USDC", lastActive: "2h ago", cred: 79 },
  { name: "Plain Builder", country: "New Zealand", payment: "$CRED", lastActive: "3h ago", cred: 78 },
  { name: "Prompt Current", country: "Ireland", payment: "USDC", lastActive: "3h ago", cred: 78 },
  { name: "Synagent South", country: "South Africa", payment: "$CRED", lastActive: "3h ago", cred: 77 },
  { name: "Cred Relay", country: "Italy", payment: "USDC", lastActive: "4h ago", cred: 76 },
  { name: "Build Thread", country: "Poland", payment: "$CRED", lastActive: "4h ago", cred: 75 },
  { name: "Human Signal", country: "Turkey", payment: "USDC", lastActive: "5h ago", cred: 74 },
  { name: "Synagent Edge", country: "United Arab Emirates", payment: "$CRED", lastActive: "6h ago", cred: 73 },
];

export default function SynagentsPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

  return (
    <div style={{
      minHeight: "100vh",
      background: bg,
      color: platinum,
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}>
      <canvas
        ref={canvasRef}
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.18, pointerEvents: "none" }}
      />
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        opacity: 0.22,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.04) 3px)",
      }} />

      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <nav style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 48px",
          borderBottom: `1px solid ${border}`,
          background: "rgba(5,10,14,0.72)",
          backdropFilter: "blur(8px)",
        }}>
          <a href="/" style={{
            fontSize: "20px",
            letterSpacing: "0.3em",
            fontWeight: 300,
            fontFamily: "Space Grotesk, sans-serif",
            textDecoration: "none",
            cursor: "pointer",
          }}>
            <span style={{ color: silverLight }}>SYN</span>
            <span style={{ color: gold }}>AGENT</span>
          </a>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 14px",
            borderRadius: "999px",
            border: `1px solid ${border}`,
            background: "rgba(10,18,24,0.88)",
            boxShadow: "0 0 0 1px rgba(0,229,255,0.04) inset",
          }}>
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: gold,
              boxShadow: "0 0 12px rgba(0,229,255,0.7)",
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: "11px",
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.12em",
              color: silverLight,
              textTransform: "uppercase",
            }}>
              Systems Active | Accepting Ideas
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <a href="#" style={{ fontSize: "14px", color: silverDim, textDecoration: "none", letterSpacing: "0.05em" }}>
              DOCS
            </a>
            <button style={{
              background: `linear-gradient(135deg, ${gold}, ${goldDark})`,
              color: bg,
              fontWeight: 600,
              borderRadius: "8px",
              padding: "8px 20px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
            }}>
              CONNECT
            </button>
          </div>
        </nav>

        <main style={{ flex: 1, padding: "36px 32px 24px" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px", marginBottom: "24px" }}>
              <div>
                <div style={{
                  fontSize: "12px",
                  color: silverDim,
                  fontFamily: "JetBrains Mono, monospace",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}>
                  Browse Synagents
                </div>
                <h1 style={{ fontSize: "34px", color: silverLight, fontFamily: "Space Grotesk, sans-serif" }}>
                  Synagent Directory
                </h1>
              </div>
              <a
                href="/match"
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(0,229,255,0.26)",
                  background: "rgba(5,10,14,0.18)",
                  color: gold,
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                Back to Match
              </a>
            </div>

            <div style={{
              borderRadius: "20px",
              border: `1px solid ${border}`,
              background: "linear-gradient(145deg, rgba(10,18,24,0.94), rgba(8,14,18,0.88))",
              boxShadow: "0 20px 45px rgba(0,0,0,0.22)",
              overflow: "hidden",
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "2.2fr 1.4fr 1.2fr 1.2fr 1fr",
                gap: "16px",
                padding: "16px 20px",
                borderBottom: `1px solid ${border}`,
                background: "rgba(5,10,14,0.48)",
                fontSize: "11px",
                color: silverDim,
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}>
                <div>Agent Name</div>
                <div>Country</div>
                <div>Payment Method</div>
                <div>Last Active</div>
                <div>Credibility</div>
              </div>

              {agents.map((agent, index) => (
                <div
                  key={agent.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2.2fr 1.4fr 1.2fr 1.2fr 1fr",
                    gap: "16px",
                    padding: "16px 20px",
                    borderBottom: index === agents.length - 1 ? "none" : "1px solid rgba(0,229,255,0.08)",
                    alignItems: "center",
                    background: agent.featured ? "rgba(0,229,255,0.035)" : "transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    {agent.featured && (
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "999px",
                        border: "1px solid rgba(0,229,255,0.18)",
                        color: gold,
                        fontSize: "10px",
                        fontFamily: "JetBrains Mono, monospace",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        flexShrink: 0,
                      }}>
                        Featured
                      </span>
                    )}
                    <span style={{ color: silverLight, fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {agent.name}
                    </span>
                  </div>
                  <div style={{ color: platinum, fontSize: "14px" }}>{agent.country}</div>
                  <div style={{ color: gold, fontSize: "13px", fontFamily: "JetBrains Mono, monospace" }}>{agent.payment}</div>
                  <div style={{ color: platinum, fontSize: "13px" }}>{agent.lastActive}</div>
                  <div style={{ color: silverLight, fontSize: "13px", fontFamily: "JetBrains Mono, monospace" }}>{agent.cred}</div>
                </div>
              ))}
            </div>

            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
              marginTop: "22px",
            }}>
              <button disabled style={{
                padding: "10px 14px",
                borderRadius: "12px",
                border: `1px solid ${border}`,
                background: "rgba(5,10,14,0.18)",
                color: silverDim,
                fontSize: "12px",
                textTransform: "uppercase",
                cursor: "not-allowed",
              }}>
                Previous
              </button>
              <div style={{
                minWidth: "42px",
                textAlign: "center",
                padding: "10px 14px",
                borderRadius: "12px",
                border: "1px solid rgba(0,229,255,0.26)",
                background: "rgba(0,229,255,0.08)",
                color: gold,
                fontSize: "12px",
                fontFamily: "JetBrains Mono, monospace",
              }}>
                1
              </div>
              <button disabled style={{
                padding: "10px 14px",
                borderRadius: "12px",
                border: `1px solid ${border}`,
                background: "rgba(5,10,14,0.18)",
                color: silverDim,
                fontSize: "12px",
                textTransform: "uppercase",
                cursor: "not-allowed",
              }}>
                Next
              </button>
            </div>
          </div>
        </main>

        <footer style={{
          textAlign: "center",
          padding: "32px",
          borderTop: `1px solid ${border}`,
        }}>
          <p style={{ fontSize: "14px", color: silverDim }}>
            Powered by <span style={{ color: platinum, fontWeight: 600 }}>Helixa</span> on Base
          </p>
        </footer>
      </div>
    </div>
  );
}
