"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { theme } from "@/lib/theme";

type SiteShellProps = {
  children: ReactNode;
  mainStyle?: CSSProperties;
  showFooter?: boolean;
};

export function SiteShell({ children, mainStyle, showFooter = true }: SiteShellProps) {
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

      for (let i = 0; i < drops.length; i += 1) {
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
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        color: theme.text,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.18, pointerEvents: "none" }}
      />
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          opacity: 0.22,
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,229,255,0.04) 3px)",
        }}
      />

      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 48px",
            borderBottom: `1px solid ${theme.border}`,
            background: "rgba(5,10,14,0.72)",
            backdropFilter: "blur(8px)",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: "20px",
              letterSpacing: "0.3em",
              fontWeight: 300,
              fontFamily: "Space Grotesk, sans-serif",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            <span style={{ color: theme.textStrong }}>SYN</span>
            <span style={{ color: theme.accent }}>AGENT</span>
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "8px 14px",
              borderRadius: "999px",
              border: `1px solid ${theme.border}`,
              background: "rgba(10,18,24,0.88)",
              boxShadow: "0 0 0 1px rgba(0,229,255,0.04) inset",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: theme.accent,
                boxShadow: "0 0 12px rgba(0,229,255,0.7)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "11px",
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.12em",
                color: theme.textStrong,
                textTransform: "uppercase",
              }}
            >
              Systems Active | Accepting Ideas
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <Link href="#" style={{ fontSize: "14px", color: theme.textMuted, textDecoration: "none", letterSpacing: "0.05em" }}>
              $CRED
            </Link>
            <Link href="#" style={{ fontSize: "14px", color: theme.textMuted, textDecoration: "none", letterSpacing: "0.05em" }}>
              DOCS
            </Link>
            <button
              style={{
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`,
                color: theme.bg,
                fontWeight: 600,
                borderRadius: "8px",
                padding: "8px 20px",
                border: "none",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              CONNECT
            </button>
          </div>
        </header>

        <main style={{ flex: 1, ...mainStyle }}>{children}</main>

        {showFooter && (
          <footer style={{ textAlign: "center", padding: "32px", borderTop: `1px solid ${theme.border}` }}>
            <p style={{ fontSize: "14px", color: theme.textMuted }}>
              Powered by <span style={{ color: theme.text, fontWeight: 600 }}>Helixa</span> on Base
            </p>
          </footer>
        )}
      </div>
    </div>
  );
}
