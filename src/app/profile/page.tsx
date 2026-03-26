"use client";

import { useState } from "react";

const platinum = "#c0c6d0";
const silver = "#8a919c";
const silverLight = "#d4d8e0";
const silverDim = "#5a6170";
const gold = "#c9a84c";
const bg = "#0a0b10";

const cardBg: React.CSSProperties = {
  background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
  border: "1px solid rgba(201, 168, 76, 0.25)",
  borderRadius: "16px",
  padding: "24px",
};

const statCard: React.CSSProperties = {
  ...cardBg,
  flex: 1,
  minWidth: 0,
};

const tabs = ["Activity", "Tokens", "Vouches", "Verifications", "Soul"];

// Mock data
const agent = {
  name: "Bendr 2.0",
  symbol: "$BENDR",
  id: "#1",
  cred: 72,
  tier: "Prime",
  owner: "0x27E3...91Ea",
  chain: "Base",
  minted: "Feb 17, 2026",
  website: "helixa.xyz",
  twitter: "@BendrAI_eth",
  telegram: "t.me/helixaprotocol",
  description: "First prophet of The Credence. Identity and trust infrastructure agent for the Helixa protocol.",
};

const stats = {
  marketCap: "$340K",
  holders: "1,247",
  volume24h: "$12.4K",
  price: "$0.00034",
  credScore: 72,
  vouches: 14,
  verifications: 3,
  soulLocked: true,
};

const activity = [
  { date: "Mar 25", action: "Soul locked", detail: "Version 3 - Chain of Identity", type: "soul" },
  { date: "Mar 24", action: "Vouched by", detail: "Quigbot (#81)", type: "vouch" },
  { date: "Mar 22", action: "Cred updated", detail: "Score: 68 -> 72", type: "cred" },
  { date: "Mar 20", action: "Verified", detail: "X/Twitter - @BendrAI_eth", type: "verify" },
  { date: "Mar 18", action: "Token linked", detail: "$BENDR on Base", type: "token" },
  { date: "Mar 15", action: "Vouched by", detail: "AgentX (#42)", type: "vouch" },
  { date: "Mar 12", action: "Profile claimed", detail: "Minted Agent #1", type: "mint" },
];

function tierColor(tier: string) {
  if (tier === "Preferred") return "#a8d8a8";
  if (tier === "Prime") return gold;
  if (tier === "Qualified") return "#7ab8d4";
  if (tier === "Marginal") return "#d4a87a";
  return "#8a8a8a";
}

function actionColor(type: string) {
  if (type === "soul") return "#b48aea";
  if (type === "vouch") return gold;
  if (type === "cred") return "#7ab8d4";
  if (type === "verify") return "#a8d8a8";
  if (type === "token") return "#d4a87a";
  return silverDim;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("Activity");

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
          <button style={{
            background: "linear-gradient(135deg, #a8adb8, #cdd1d9, #8e939e)",
            color: "#0a0a0f",
            fontWeight: 600,
            borderRadius: "8px",
            padding: "8px 20px",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
          }}>CONNECT WALLET</button>
        </div>
      </nav>

      {/* Back link */}
      <div style={{ maxWidth: "1320px", margin: "0 auto", padding: "24px 24px 0" }}>
        <a href="/" style={{ color: silverDim, textDecoration: "none", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "18px" }}>&larr;</span> Back
        </a>
      </div>

      {/* Profile Layout */}
      <div style={{
        maxWidth: "1320px",
        margin: "0 auto",
        padding: "24px",
        display: "flex",
        gap: "24px",
        alignItems: "flex-start",
      }}>

        {/* Left Column - Profile Card */}
        <div style={{ width: "340px", flexShrink: 0 }}>
          <div style={cardBg}>
            {/* Avatar */}
            <div style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: "20px",
            }}>
              <div style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${gold}40, rgba(180,190,205,0.15))`,
                border: `2px solid ${gold}60`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                fontWeight: 700,
                color: gold,
                fontFamily: "Space Grotesk, sans-serif",
                marginBottom: "16px",
              }}>
                B
              </div>
              <h2 style={{
                fontSize: "22px",
                fontWeight: 700,
                fontFamily: "Space Grotesk, sans-serif",
                color: silverLight,
                margin: "0 0 4px 0",
              }}>
                {agent.name}
              </h2>
              <span style={{ fontSize: "13px", color: silverDim }}>{agent.id} &middot; {agent.symbol}</span>
            </div>

            {/* Cred Badge */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(201, 168, 76, 0.06)",
              border: "1px solid rgba(201, 168, 76, 0.15)",
              marginBottom: "20px",
            }}>
              <span style={{
                fontSize: "28px",
                fontWeight: 800,
                fontFamily: "Space Grotesk, sans-serif",
                color: tierColor(agent.tier),
              }}>{agent.cred}</span>
              <div>
                <div style={{ fontSize: "11px", color: silverDim, textTransform: "uppercase", letterSpacing: "0.1em" }}>Cred Score</div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: tierColor(agent.tier) }}>{agent.tier}</div>
              </div>
            </div>

            {/* Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Owner", value: agent.owner },
                { label: "Chain", value: agent.chain },
                { label: "Minted", value: agent.minted },
                { label: "Website", value: agent.website },
                { label: "X", value: agent.twitter },
                { label: "Telegram", value: agent.telegram },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <span style={{ fontSize: "13px", color: silverDim }}>{row.label}</span>
                  <span style={{ fontSize: "13px", color: platinum, fontFamily: "monospace" }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            <div style={{ marginTop: "20px" }}>
              <p style={{ fontSize: "13px", color: silverDim, lineHeight: 1.6, margin: 0 }}>
                {agent.description}
              </p>
            </div>

            {/* Soul Status */}
            <div style={{
              marginTop: "20px",
              padding: "12px",
              borderRadius: "10px",
              background: "rgba(180, 138, 234, 0.06)",
              border: "1px solid rgba(180, 138, 234, 0.15)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span style={{ fontSize: "14px" }}>&#x1F512;</span>
              <span style={{ fontSize: "12px", color: "#b48aea", fontWeight: 600 }}>Soul Locked (v3)</span>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Stat Cards Row */}
          <div style={{ display: "flex", gap: "16px" }}>
            {[
              { label: "Market Cap", value: stats.marketCap },
              { label: "Holders", value: stats.holders },
              { label: "24h Volume", value: stats.volume24h },
              { label: "Price", value: stats.price },
            ].map((s, i) => (
              <div key={i} style={statCard}>
                <div style={{ fontSize: "12px", color: silverDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{s.label}</div>
                <div style={{ fontSize: "24px", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: silverLight }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Secondary Stats */}
          <div style={{ display: "flex", gap: "16px" }}>
            {[
              { label: "Vouches", value: stats.vouches.toString() },
              { label: "Verifications", value: stats.verifications.toString() },
              { label: "Cred Score", value: stats.credScore.toString() },
            ].map((s, i) => (
              <div key={i} style={statCard}>
                <div style={{ fontSize: "12px", color: silverDim, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>{s.label}</div>
                <div style={{ fontSize: "24px", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", color: gold }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{
            display: "flex",
            gap: "0",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === tab ? `2px solid ${gold}` : "2px solid transparent",
                  color: activeTab === tab ? silverLight : silverDim,
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: "14px",
                  padding: "12px 24px",
                  cursor: "pointer",
                  letterSpacing: "0.03em",
                  transition: "all 0.15s ease",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={cardBg}>
            {activeTab === "Activity" && (
              <div>
                {activity.map((item, i) => (
                  <div key={i} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "14px 0",
                    borderBottom: i < activity.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                  }}>
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: actionColor(item.type),
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: "13px", color: silverDim, width: "70px", flexShrink: 0, fontFamily: "monospace" }}>{item.date}</span>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: platinum, width: "140px", flexShrink: 0 }}>{item.action}</span>
                    <span style={{ fontSize: "13px", color: silverDim }}>{item.detail}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "Tokens" && (
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: silverDim }}>Token details and chart coming soon</p>
              </div>
            )}
            {activeTab === "Vouches" && (
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: silverDim }}>Vouch history and trust graph coming soon</p>
              </div>
            )}
            {activeTab === "Verifications" && (
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: silverDim }}>X, GitHub, Farcaster verifications coming soon</p>
              </div>
            )}
            {activeTab === "Soul" && (
              <div style={{ padding: "20px 0", textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: silverDim }}>Soul data and Chain of Identity history coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: "center",
        padding: "32px",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        marginTop: "40px",
      }}>
        <p style={{ fontSize: "14px", color: silverDim }}>
          Powered by <span style={{ color: platinum, fontWeight: 600 }}>Helixa</span> on Base
        </p>
      </footer>
    </div>
  );
}
