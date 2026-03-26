"use client";

import { useState } from "react";

const platinum = "#c0c6d0";
const silver = "#8a919c";
const silverLight = "#d4d8e0";
const silverDim = "#5a6170";
const gold = "#c9a84c";

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
  border: "1px solid rgba(201, 168, 76, 0.25)",
  borderRadius: "16px",
  padding: "24px",
  flex: 1,
  minWidth: 0,
};

const btnGold: React.CSSProperties = {
  background: "linear-gradient(135deg, #a8adb8, #cdd1d9, #8e939e)",
  color: "#0a0a0f",
  fontWeight: 700,
  borderRadius: "10px",
  padding: "16px 36px",
  border: "none",
  cursor: "pointer",
  fontSize: "15px",
  boxShadow: "0 2px 20px rgba(180, 190, 205, 0.15)",
  whiteSpace: "nowrap" as const,
};

const btnGlass: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  color: silverLight,
  fontWeight: 600,
  borderRadius: "10px",
  padding: "16px 36px",
  border: "1px solid rgba(201, 168, 76, 0.25)",
  cursor: "pointer",
  fontSize: "15px",
  whiteSpace: "nowrap" as const,
};

const btnWallet: React.CSSProperties = {
  background: "linear-gradient(135deg, #a8adb8, #cdd1d9, #8e939e)",
  color: "#0a0a0f",
  fontWeight: 600,
  borderRadius: "8px",
  padding: "8px 20px",
  border: "none",
  cursor: "pointer",
  fontSize: "14px",
};

const TRENDING = [
  { name: "Bendr 2.0", cred: 72, symbol: "$BENDR", change: "+12.4%" },
  { name: "Quigbot", cred: 65, symbol: "$QUIG", change: "+8.2%" },
  { name: "AgentX", cred: 58, symbol: "$AGX", change: "+5.7%" },
  { name: "NeonMind", cred: 51, symbol: "$NEON", change: "-2.1%" },
  { name: "DataForge", cred: 44, symbol: "$FORGE", change: "+3.9%" },
];

const RECENT = [
  { name: "Solari", symbol: "$SOL1", time: "2m ago" },
  { name: "CodeWeaver", symbol: "$WEAV", time: "8m ago" },
  { name: "Oracle9", symbol: "$ORC9", time: "14m ago" },
  { name: "PixelMind", symbol: "$PIXL", time: "22m ago" },
  { name: "TradeBot", symbol: "$TRDB", time: "31m ago" },
];

const PROFILES = [
  { name: "Bendr 2.0", holders: "1.2K", mcap: "$340K" },
  { name: "Quigbot", holders: "890", mcap: "$210K" },
  { name: "NeonMind", holders: "654", mcap: "$185K" },
  { name: "DataForge", holders: "412", mcap: "$92K" },
  { name: "AgentX", holders: "389", mcap: "$78K" },
];

function credTier(cred: number) {
  if (cred >= 80) return "Preferred";
  if (cred >= 60) return "Prime";
  if (cred >= 40) return "Qualified";
  if (cred >= 20) return "Marginal";
  return "Junk";
}

function AgentRow({ name, right, sub, href }: { name: string; right: string; sub: string; href?: string }) {
  const inner = (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "10px 0",
      borderBottom: "1px solid rgba(255,255,255,0.03)",
      cursor: href ? "pointer" : undefined,
    }}>
      <div style={{
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: 700,
        flexShrink: 0,
        background: "rgba(180, 190, 205, 0.06)",
        color: silver,
        border: "1px solid rgba(180, 190, 205, 0.1)",
      }}>
        {name[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, fontSize: "14px", color: platinum }}>{name}</span>
          <span style={{ fontSize: "12px", fontFamily: "monospace", color: silver }}>{right}</span>
        </div>
        <span style={{ fontSize: "12px", color: silverDim }}>{sub}</span>
      </div>
    </div>
  );
  if (href) return <a href={href} style={{ textDecoration: "none", color: "inherit" }}>{inner}</a>;
  return inner;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "12px 16px",
  color: platinum,
  fontSize: "14px",
  outline: "none",
  fontFamily: "Inter, sans-serif",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: silverDim,
  marginBottom: "6px",
  display: "block",
  letterSpacing: "0.03em",
};

function LaunchSection() {
  const [form, setForm] = useState({
    name: "",
    symbol: "",
    description: "",
    vault: "",
    vesting: "",
    website: "",
    twitter: "",
    telegram: "",
    discord: "",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none",
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%235a6170' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    paddingRight: "36px",
  };

  return (
    <section id="launch" style={{
      maxWidth: "640px",
      margin: "0 auto",
      padding: "0 24px 80px",
    }}>
      <div style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
        border: "1px solid rgba(201, 168, 76, 0.25)",
        borderRadius: "20px",
        padding: "40px",
      }}>
        <h2 style={{
          fontSize: "28px",
          fontWeight: 700,
          fontFamily: "Space Grotesk, sans-serif",
          color: silverLight,
          margin: "0 0 32px 0",
        }}>
          Launch Token
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={labelStyle}>Agent Name</label>
            <input style={inputStyle} placeholder="e.g. Bendr 2.0" value={form.name} onChange={set("name")} />
          </div>

          <div>
            <label style={labelStyle}>Token Symbol</label>
            <input style={inputStyle} placeholder="e.g. BENDR" value={form.symbol} onChange={set("symbol")} />
          </div>

          <div>
            <label style={labelStyle}>Total Supply</label>
            <input
              style={{ ...inputStyle, color: silverDim, cursor: "not-allowed" }}
              value="1,000,000,000"
              disabled
            />
          </div>

          <div>
            <label style={labelStyle}>Token Description</label>
            <textarea
              style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
              placeholder="What does your agent do?"
              value={form.description}
              onChange={set("description")}
            />
          </div>

          <div>
            <label style={labelStyle}>Vault (bundle amount, up to 70% of supply)</label>
            <div style={{ position: "relative" }}>
              <input
                style={inputStyle}
                type="number"
                min="0"
                max="70"
                placeholder="e.g. 30"
                value={form.vault}
                onChange={set("vault")}
              />
              <span style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: silverDim,
                fontSize: "13px",
                pointerEvents: "none",
              }}>%</span>
            </div>
            {form.vault && Number(form.vault) > 0 && (
              <span style={{ fontSize: "11px", color: silverDim, marginTop: "4px", display: "block" }}>
                {(Number(form.vault) / 100 * 1_000_000_000).toLocaleString()} tokens vaulted
              </span>
            )}
          </div>

          <div>
            <label style={labelStyle}>Vault Vesting</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { value: "30", label: "30 days" },
                { value: "60", label: "60 days" },
                { value: "90", label: "90 days" },
                { value: "180", label: "180 days" },
                { value: "365", label: "1 year" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm((f) => ({ ...f, vesting: f.vesting === opt.value ? "" : opt.value }))}
                  style={{
                    background: form.vesting === opt.value
                      ? `linear-gradient(135deg, ${gold}, #d4b85c)`
                      : "rgba(255,255,255,0.04)",
                    color: form.vesting === opt.value ? "#0a0a0f" : silverDim,
                    border: form.vesting === opt.value
                      ? "1px solid transparent"
                      : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "8px",
                    padding: "10px 18px",
                    fontSize: "13px",
                    fontWeight: form.vesting === opt.value ? 700 : 500,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Website (optional)</label>
              <input style={inputStyle} placeholder="https://" value={form.website} onChange={set("website")} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>X (Twitter) (optional)</label>
              <input style={inputStyle} placeholder="@handle" value={form.twitter} onChange={set("twitter")} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Telegram (optional)</label>
              <input style={inputStyle} placeholder="https://t.me/..." value={form.telegram} onChange={set("telegram")} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Discord (optional)</label>
              <input style={inputStyle} placeholder="https://discord.gg/..." value={form.discord} onChange={set("discord")} />
            </div>
          </div>

          <div style={{
            padding: "14px 16px",
            borderRadius: "10px",
            background: "rgba(201, 168, 76, 0.06)",
            border: "1px solid rgba(201, 168, 76, 0.15)",
          }}>
            <p style={{ fontSize: "12px", color: silverDim, margin: 0, lineHeight: 1.5 }}>
              5% of your token supply goes to the <span style={{ color: gold, fontWeight: 600 }}>Synagent Pool</span>.
              Your token launches on Base via bonding curve.
            </p>
          </div>

          <button
            style={{
              ...btnGold,
              width: "100%",
              padding: "16px",
              fontSize: "16px",
              marginTop: "4px",
            }}
            onClick={() => {
              alert("Token launch coming soon - connect wallet first");
            }}
          >
            Launch on Base
          </button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [showLaunch, setShowLaunch] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #08080c 0%, #0c0e14 25%, #10131a 50%, #0c0e14 75%, #08080c 100%)",
      color: platinum,
    }}>
      {/* Nav */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 48px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
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
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          {["SYNAGENT POOL", "DOCS"].map((item) => (
            <a key={item} href="#" style={{ fontSize: "14px", color: silverDim, textDecoration: "none", letterSpacing: "0.05em" }}>
              {item}
            </a>
          ))}
          <button style={btnWallet}>CONNECT WALLET</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px 72px",
        textAlign: "center",
        position: "relative",
      }}>
        {/* Subtle radial glow */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "400px",
          background: "radial-gradient(ellipse, rgba(180, 190, 210, 0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <h1 style={{
          fontSize: "56px",
          fontWeight: 700,
          fontFamily: "Space Grotesk, sans-serif",
          lineHeight: 1.1,
          marginBottom: "20px",
          background: "linear-gradient(135deg, #c8cdd6, #e8ecf2, #a0a6b2)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          maxWidth: "700px",
        }}>
          Launch. Validate. Monetize.
        </h1>
        <p style={{
          color: silverDim,
          fontSize: "18px",
          maxWidth: "520px",
          lineHeight: 1.6,
          marginBottom: "40px",
        }}>
          Launch your agent token, claim your on-chain profile, and build credentials that follow you everywhere.
        </p>
        <div style={{ display: "flex", gap: "16px" }}>
          <button style={btnGold} onClick={() => {
            setShowLaunch(true);
            setTimeout(() => document.getElementById("launch")?.scrollIntoView({ behavior: "smooth" }), 50);
          }}>
            Launch token and claim your profile
          </button>
          <button style={btnGlass}>
            I have a token and want to claim my profile
          </button>
        </div>
      </section>

      {/* Launch Form - hidden until button clicked */}
      {showLaunch && <LaunchSection />}

      {/* 4 Column Cards */}
      <section style={{
        maxWidth: "1320px",
        margin: "0 auto",
        padding: "0 24px 80px",
        display: "flex",
        gap: "16px",
      }}>
        {/* Trending Agents */}
        <div style={cardStyle}>
          <h3 style={{
            fontSize: "15px",
            fontWeight: 700,
            marginBottom: "16px",
            fontFamily: "Space Grotesk, sans-serif",
            color: silverLight,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            Trending Agents
          </h3>
          {TRENDING.map((a, i) => (
            <AgentRow
              key={i}
              name={a.name}
              right={a.change}
              sub={`${a.symbol} · ${credTier(a.cred)} ${a.cred}`}
              href={a.name === "Bendr 2.0" ? "/profile" : undefined}
            />
          ))}
        </div>

        {/* Recently Launched */}
        <div style={cardStyle}>
          <h3 style={{
            fontSize: "15px",
            fontWeight: 700,
            marginBottom: "16px",
            fontFamily: "Space Grotesk, sans-serif",
            color: silverLight,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            Recently Launched
          </h3>
          {RECENT.map((a, i) => (
            <AgentRow
              key={i}
              name={a.name}
              right={a.time}
              sub={a.symbol}
            />
          ))}
        </div>

        {/* Popular Profiles */}
        <div style={cardStyle}>
          <h3 style={{
            fontSize: "15px",
            fontWeight: 700,
            marginBottom: "16px",
            fontFamily: "Space Grotesk, sans-serif",
            color: silverLight,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            Credibility
          </h3>
          {PROFILES.map((a, i) => (
            <AgentRow
              key={i}
              name={a.name}
              right={a.mcap}
              sub={`${a.holders} holders`}
              href={a.name === "Bendr 2.0" ? "/profile" : undefined}
            />
          ))}
        </div>

        {/* Synagent Pool */}
        <div style={cardStyle}>
          <h3 style={{
            fontSize: "15px",
            fontWeight: 700,
            marginBottom: "16px",
            fontFamily: "Space Grotesk, sans-serif",
            color: silverLight,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>
            Synagent Pool
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
            {[
              { label: "Total Agents", value: "247" },
              { label: "Pool Value", value: "$1.2M" },
              { label: "Tokens Held", value: "247" },
              { label: "24h Volume", value: "$89.4K" },
              { label: "Avg Cred", value: "54" },
            ].map((stat, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
              }}>
                <span style={{ fontSize: "13px", color: silverDim }}>{stat.label}</span>
                <span style={{ fontSize: "14px", fontWeight: 600, color: platinum, fontFamily: "monospace" }}>{stat.value}</span>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: "20px",
            padding: "16px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(168,173,184,0.1), rgba(205,209,217,0.06))",
            border: "1px solid rgba(180,190,205,0.12)",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "12px", color: silverDim, marginBottom: "4px" }}>
              5% of every launched token
            </p>
            <p style={{ fontSize: "12px", color: silverDim }}>
              feeds the Synagent Pool
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        textAlign: "center",
        padding: "32px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
      }}>
        <p style={{ fontSize: "14px", color: silverDim }}>
          Powered by <span style={{ color: platinum, fontWeight: 600 }}>Helixa</span> on Base
        </p>
      </footer>

    </div>
  );
}
