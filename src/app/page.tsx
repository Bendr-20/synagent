"use client";

import { useState } from "react";

const NODES = [
  { top: "8%", left: "5%", size: 8, color: "#00e5cc", duration: "7s", delay: "0s" },
  { top: "15%", left: "85%", size: 6, color: "#8b5cf6", duration: "5s", delay: "1s" },
  { top: "30%", left: "12%", size: 10, color: "#00e5cc", duration: "8s", delay: "0.5s" },
  { top: "55%", left: "90%", size: 7, color: "#8b5cf6", duration: "6s", delay: "2s" },
  { top: "75%", left: "8%", size: 5, color: "#00e5cc", duration: "9s", delay: "1.5s" },
  { top: "85%", left: "78%", size: 9, color: "#8b5cf6", duration: "7s", delay: "0.8s" },
  { top: "45%", left: "3%", size: 4, color: "#00b8a3", duration: "6s", delay: "3s" },
  { top: "20%", left: "50%", size: 5, color: "#7c3aed", duration: "10s", delay: "2s" },
  { top: "65%", left: "95%", size: 6, color: "#00e5cc", duration: "8s", delay: "1s" },
  { top: "90%", left: "40%", size: 4, color: "#8b5cf6", duration: "7s", delay: "0.5s" },
  { top: "5%", left: "35%", size: 3, color: "#00e5cc", duration: "6s", delay: "4s" },
  { top: "40%", left: "75%", size: 5, color: "#7c3aed", duration: "9s", delay: "1.2s" },
];

const TRENDING = [
  { name: "Bendr 2.0", cred: 72, symbol: "$BENDR", change: "+12.4%" },
  { name: "Quigbot", cred: 65, symbol: "$QUIG", change: "+8.2%" },
  { name: "AgentX", cred: 58, symbol: "$AGX", change: "+5.7%" },
  { name: "NeonMind", cred: 51, symbol: "$NEON", change: "-2.1%" },
  { name: "DataForge", cred: 44, symbol: "$FORGE", change: "+3.9%" },
];

function credColor(cred: number) {
  if (cred >= 70) return "#00e5cc";
  if (cred >= 55) return "#8b5cf6";
  if (cred >= 40) return "#f5d060";
  return "#8892a8";
}

function credTier(cred: number) {
  if (cred >= 80) return "Preferred";
  if (cred >= 60) return "Prime";
  if (cred >= 40) return "Qualified";
  if (cred >= 20) return "Marginal";
  return "Junk";
}

export default function Home() {
  const [bundle, setBundle] = useState(30);
  const [activeTab, setActiveTab] = useState<"launch" | "connect">("launch");

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated network background */}
      <div className="fixed inset-0 pointer-events-none">
        {NODES.map((node, i) => (
          <div
            key={i}
            className="node"
            style={{
              top: node.top,
              left: node.left,
              width: node.size,
              height: node.size,
              background: node.color,
              ["--duration" as string]: node.duration,
              ["--delay" as string]: node.delay,
            }}
          />
        ))}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060a14]/80 via-transparent to-[#060a14]/90" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight" style={{ fontFamily: "Space Grotesk" }}>
            <span style={{ color: "#00e5cc" }}>SYN</span>AGENT
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm text-[#8892a8] hover:text-[#00e5cc] transition-colors">Explore Agents</a>
          <a href="#" className="text-sm text-[#8892a8] hover:text-[#00e5cc] transition-colors">Leaderboard</a>
          <a href="#" className="text-sm text-[#8892a8] hover:text-[#00e5cc] transition-colors">Pool</a>
          <a href="#" className="text-sm text-[#8892a8] hover:text-[#00e5cc] transition-colors">Docs</a>
        </div>
        <button className="btn-teal text-sm !py-2.5 !px-6">Connect Wallet</button>
      </nav>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-8">
        {/* Left: Token Launch Form */}
        <div className="flex-1 flex flex-col items-center">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ fontFamily: "Space Grotesk" }}>
              Launch Your Agent Token
            </h1>
            <p className="text-[#8892a8] text-lg max-w-lg mx-auto">
              Deploy your token, claim your profile, and start building cred on Base.
            </p>
          </div>

          <div className="glass-card w-full max-w-xl p-8">
            {/* Tabs */}
            <div className="flex mb-8 bg-[#0a1020] rounded-xl p-1">
              <button
                className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "launch"
                    ? "bg-gradient-to-r from-[#00e5cc]/20 to-[#00b8a3]/20 text-[#00e5cc]"
                    : "text-[#8892a8] hover:text-white"
                }`}
                onClick={() => setActiveTab("launch")}
              >
                Launch New Token
              </button>
              <button
                className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "connect"
                    ? "bg-gradient-to-r from-[#8b5cf6]/20 to-[#7c3aed]/20 text-[#8b5cf6]"
                    : "text-[#8892a8] hover:text-white"
                }`}
                onClick={() => setActiveTab("connect")}
              >
                I Have a Token
              </button>
            </div>

            {activeTab === "launch" ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-[#8892a8] mb-2">Token Name</label>
                  <input type="text" placeholder="e.g. MyAgent" className="form-input" />
                </div>
                <div>
                  <label className="block text-sm text-[#8892a8] mb-2">Token Symbol</label>
                  <input type="text" placeholder="e.g. $AGENT" className="form-input" />
                </div>
                <div>
                  <label className="block text-sm text-[#8892a8] mb-2">Description</label>
                  <textarea placeholder="What does your agent do?" className="form-input min-h-[100px] resize-none" />
                </div>
                <div>
                  <label className="block text-sm text-[#8892a8] mb-2">Agent Avatar</label>
                  <div className="form-input border-dashed flex items-center justify-center min-h-[80px] cursor-pointer hover:border-[#00e5cc]/40 transition-colors">
                    <span className="text-[#8892a8] text-sm">Click or drag to upload</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-[#8892a8]">Bundle Percentage</label>
                    <span className="text-sm font-semibold text-[#00e5cc]">{bundle}%</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={70}
                    value={bundle}
                    onChange={(e) => setBundle(Number(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-[#8892a8] mt-1">
                    <span>1%</span>
                    <span>70%</span>
                  </div>
                </div>
                <div className="pt-2">
                  <button className="btn-teal w-full text-lg">Launch Token</button>
                </div>
                <p className="text-center text-xs text-[#8892a8]">
                  Includes free Aura NFT mint + Helixa cred profile
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-[#8892a8] mb-2">Token Contract Address</label>
                  <input type="text" placeholder="0x..." className="form-input font-mono" />
                </div>
                <div>
                  <label className="block text-sm text-[#8892a8] mb-2">Agent Name</label>
                  <input type="text" placeholder="Your agent's name" className="form-input" />
                </div>
                <div>
                  <label className="block text-sm text-[#8892a8] mb-2">Description</label>
                  <textarea placeholder="What does your agent do?" className="form-input min-h-[100px] resize-none" />
                </div>
                <div>
                  <label className="block text-sm text-[#8892a8] mb-2">Agent Avatar</label>
                  <div className="form-input border-dashed flex items-center justify-center min-h-[80px] cursor-pointer hover:border-[#8b5cf6]/40 transition-colors">
                    <span className="text-[#8892a8] text-sm">Click or drag to upload</span>
                  </div>
                </div>
                <div className="pt-2">
                  <button className="btn-violet-outline w-full text-lg">Claim Profile</button>
                </div>
                <p className="text-center text-xs text-[#8892a8]">
                  We&apos;ll verify your token ownership on Base
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Trending Sidebar */}
        <div className="w-full lg:w-80">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-5" style={{ fontFamily: "Space Grotesk" }}>
              Trending Agents
            </h2>
            <div className="space-y-4">
              {TRENDING.map((agent, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: `${credColor(agent.cred)}20`,
                      color: credColor(agent.cred),
                      border: `1px solid ${credColor(agent.cred)}40`,
                    }}
                  >
                    {agent.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm truncate">{agent.name}</span>
                      <span className={`text-xs font-mono ${agent.change.startsWith("+") ? "text-[#00e5cc]" : "text-red-400"}`}>
                        {agent.change}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-[#8892a8]">{agent.symbol}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${credColor(agent.cred)}15`, color: credColor(agent.cred) }}>
                        {credTier(agent.cred)} {agent.cred}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pool Stats */}
          <div className="glass-card p-6 mt-4">
            <h2 className="text-lg font-bold mb-4" style={{ fontFamily: "Space Grotesk" }}>
              Synagent Pool
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-[#8892a8]">Total Agents</span>
                <span className="text-sm font-semibold">247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#8892a8]">Pool Value</span>
                <span className="text-sm font-semibold text-[#00e5cc]">$1.2M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#8892a8]">Tokens Held</span>
                <span className="text-sm font-semibold">247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#8892a8]">24h Volume</span>
                <span className="text-sm font-semibold">$89.4K</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 border-t border-white/5">
        <p className="text-sm text-[#8892a8]">
          Powered by <span className="text-[#00e5cc] font-semibold">Helixa</span> on Base
        </p>
      </footer>
    </div>
  );
}
