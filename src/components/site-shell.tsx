"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { theme } from "@/lib/theme";

type SiteShellProps = {
  children: ReactNode;
  mainStyle?: CSSProperties;
  showFooter?: boolean;
};

export function SiteShell({ children, mainStyle, showFooter = true }: SiteShellProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  useEffect(() => {
    const closeOnDesktop = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false);
      }
    };

    closeOnDesktop();
    window.addEventListener("resize", closeOnDesktop);
    return () => window.removeEventListener("resize", closeOnDesktop);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

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
          className="site-header"
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
          <div className="site-header-top" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link
              className="site-brand"
              href="/"
              onClick={closeMobileMenu}
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

            <button
              type="button"
              className="site-mobile-menu-button"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              style={{
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                border: `1px solid ${theme.border}`,
                background: "rgba(10,18,24,0.88)",
                boxShadow: "0 0 0 1px rgba(0,229,255,0.04) inset",
                cursor: "pointer",
                padding: 0,
                flexShrink: 0,
              }}
            >
              <span style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {[0, 1, 2].map((bar) => (
                  <span
                    key={bar}
                    style={{
                      display: "block",
                      width: "18px",
                      height: "2px",
                      borderRadius: "999px",
                      background: theme.textStrong,
                    }}
                  />
                ))}
              </span>
            </button>
          </div>

          <div
            className="site-status"
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
              className="site-status-text wrap-safe"
              style={{
                fontSize: "11px",
                fontFamily: "JetBrains Mono, monospace",
                letterSpacing: "0.12em",
                color: theme.textStrong,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Systems Active | Accepting Ideas
            </span>
          </div>

          <div className="site-header-links" style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <Link href="#" style={{ fontSize: "14px", color: theme.textMuted, textDecoration: "none", letterSpacing: "0.05em" }}>
              $CRED
            </Link>
            <Link href="#" style={{ fontSize: "14px", color: theme.textMuted, textDecoration: "none", letterSpacing: "0.05em" }}>
              DOCS
            </Link>
            <button
              type="button"
              className="site-connect-button"
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

          {mobileMenuOpen && (
            <div
              className="site-mobile-menu"
              style={{
                display: "none",
                flexDirection: "column",
                gap: "10px",
                padding: "14px",
                borderRadius: "18px",
                border: `1px solid ${theme.border}`,
                background: "rgba(8,14,18,0.96)",
                boxShadow: "0 14px 32px rgba(0,0,0,0.28)",
              }}
            >
              <Link
                href="#"
                onClick={closeMobileMenu}
                className="site-mobile-menu-link"
                style={{
                  textDecoration: "none",
                  color: theme.textStrong,
                  fontSize: "14px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: `1px solid ${theme.border}`,
                  background: "rgba(5,10,14,0.2)",
                }}
              >
                $CRED
              </Link>
              <Link
                href="#"
                onClick={closeMobileMenu}
                className="site-mobile-menu-link"
                style={{
                  textDecoration: "none",
                  color: theme.textStrong,
                  fontSize: "14px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: `1px solid ${theme.border}`,
                  background: "rgba(5,10,14,0.2)",
                }}
              >
                DOCS
              </Link>
              <button
                type="button"
                className="site-mobile-connect"
                onClick={closeMobileMenu}
                style={{
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`,
                  color: theme.bg,
                  fontWeight: 700,
                  borderRadius: "12px",
                  padding: "12px 16px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Connect
              </button>
            </div>
          )}
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
