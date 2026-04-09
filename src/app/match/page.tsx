"use client";

import { useEffect, useRef, useState } from "react";

const bg = "#050a0e";
const border = "#0f2a3a";
const platinum = "#e0f0f8";
const silverLight = "#f0fbff";
const silverDim = "#5a8a9a";
const gold = "#00e5ff";
const goldDark = "#00bcd4";

export default function MatchPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [prefs, setPrefs] = useState({
    cost: 5,
    time: 5,
    quality: 5,
    credibility: 5,
    needs: "",
  });

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

  const slider = (key: "cost" | "time" | "quality" | "credibility", label: string) => (
    <div key={key} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{
          fontSize: "12px",
          color: silverLight,
          fontFamily: "JetBrains Mono, monospace",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          {label}
        </span>
        <span style={{
          fontSize: "12px",
          color: gold,
          fontFamily: "JetBrains Mono, monospace",
        }}>
          {prefs[key]}
        </span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={prefs[key]}
        onChange={(e) => setPrefs((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
        style={{ width: "100%" }}
      />
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: bg,
      color: platinum,
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px",
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

      <div style={{
        position: "relative",
        zIndex: 2,
        width: "100%",
        maxWidth: "720px",
        padding: "28px",
        borderRadius: "20px",
        border: `1px solid ${border}`,
        background: "linear-gradient(145deg, rgba(10,18,24,0.94), rgba(8,14,18,0.88))",
        boxShadow: "0 20px 45px rgba(0,0,0,0.22)",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <div>
            <div style={{
              fontSize: "12px",
              color: silverDim,
              fontFamily: "JetBrains Mono, monospace",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}>
              Match Intake
            </div>
            <h1 style={{ fontSize: "28px", color: silverLight, fontFamily: "Space Grotesk, sans-serif" }}>
              Make Your Match
            </h1>
          </div>
          <button
            onClick={() => window.location.href = "/"}
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
            }}
          >
            Back
          </button>
        </div>

        <p style={{ color: silverDim, lineHeight: 1.7, fontSize: "15px" }}>
          Set your priorities, describe what you need, and we’ll surface the strongest matches.
        </p>

        {slider("cost", "Cost")}
        {slider("time", "Time")}
        {slider("quality", "Quality")}
        {slider("credibility", "Credibility")}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{
            fontSize: "12px",
            color: silverLight,
            fontFamily: "JetBrains Mono, monospace",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            What do you need?
          </span>
          <input
            type="text"
            value={prefs.needs}
            onChange={(e) => setPrefs((prev) => ({ ...prev, needs: e.target.value }))}
            placeholder="Describe what you need help with..."
            style={{
              width: "100%",
              height: "48px",
              background: "rgba(10,18,24,0.9)",
              border: `1px solid ${border}`,
              borderRadius: "10px",
              padding: "12px 16px",
              color: platinum,
              fontSize: "14px",
              outline: "none",
            }}
          />
        </div>

        <button style={{
          width: "100%",
          marginTop: "4px",
          padding: "14px 18px",
          borderRadius: "12px",
          border: "1px solid rgba(0,229,255,0.26)",
          background: `linear-gradient(135deg, ${gold}, ${goldDark})`,
          color: bg,
          fontSize: "13px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          cursor: "pointer",
        }}>
          Find Your Matches
        </button>
      </div>
    </div>
  );
}
