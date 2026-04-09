"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { solidButtonStyle, glassCardStyle, theme } from "@/lib/theme";
import type { Synagent } from "@/app/synagents/data";

export function MatchClient({ selectedAgent }: { selectedAgent?: Synagent }) {
  const [prefs, setPrefs] = useState({
    cost: 5,
    time: 5,
    quality: 5,
    credibility: 5,
    needs: "",
  });

  const sliderBackground = (value: number) => {
    const pct = ((value - 1) / 9) * 100;
    return `linear-gradient(90deg, ${theme.accent} 0%, ${theme.accent} ${pct}%, rgba(0,229,255,0.12) ${pct}%, rgba(0,229,255,0.12) 100%)`;
  };

  const renderSlider = (key: keyof Omit<typeof prefs, "needs">, label: string) => (
    <div key={key} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "12px", color: theme.textStrong, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
        <span style={{ fontSize: "12px", color: theme.accent, fontFamily: "JetBrains Mono, monospace" }}>{prefs[key]}</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={prefs[key]}
        onChange={(e) => setPrefs((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
        style={{ width: "100%", accentColor: theme.accent, cursor: "pointer", background: sliderBackground(prefs[key]), borderRadius: "999px" }}
      />
    </div>
  );

  return (
    <SiteShell mainStyle={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
      <div style={{ width: "100%", maxWidth: "720px", ...glassCardStyle, borderRadius: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "8px" }}>Match Intake</div>
            <h1 style={{ fontSize: "28px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif" }}>Make Your Match</h1>
            <div style={{ marginTop: "8px", fontSize: "13px", color: theme.textMuted }}>
              (<Link href="/synagents" style={{ color: theme.accent, textDecoration: "none" }}>or Browse Synagents</Link>)
            </div>
          </div>
          <Link href="/" style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(0,229,255,0.26)", background: "rgba(5,10,14,0.18)", color: theme.accent, fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", textDecoration: "none" }}>
            Back
          </Link>
        </div>

        {selectedAgent && (
          <div style={{ padding: "14px 16px", borderRadius: "14px", border: `1px solid ${theme.border}`, background: "rgba(5,10,14,0.24)", color: theme.textMuted, lineHeight: 1.7 }}>
            You are submitting a proposal to <span style={{ color: theme.textStrong, fontWeight: 600 }}>{selectedAgent.name}</span>.
          </div>
        )}

        <p style={{ color: theme.textMuted, lineHeight: 1.7, fontSize: "15px" }}>Set your priorities, describe what you need, and we’ll surface the strongest matches.</p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "2px", marginBottom: "2px" }}>
          <span>Least Important</span>
          <span>Most Important</span>
        </div>

        {renderSlider("cost", "Cost")}
        {renderSlider("time", "Time")}
        {renderSlider("quality", "Quality")}
        {renderSlider("credibility", "Credibility")}

        <div style={{ height: "10px" }} />

        <textarea
          rows={3}
          value={prefs.needs}
          onChange={(e) => setPrefs((prev) => ({ ...prev, needs: e.target.value }))}
          placeholder="Tell us what you're building or how we can help...."
          style={{ width: "100%", minHeight: "92px", background: "rgba(10,18,24,0.9)", border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "14px 16px", color: theme.text, fontSize: "14px", lineHeight: 1.6, outline: "none", resize: "vertical" }}
        />

        <button style={solidButtonStyle}>Find Your Matches</button>
      </div>
    </SiteShell>
  );
}
