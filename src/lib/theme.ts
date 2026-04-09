import type { CSSProperties } from "react";

export const theme = {
  bg: "#050a0e",
  border: "#0f2a3a",
  surface: "#0a1218",
  text: "#e0f0f8",
  textStrong: "#f0fbff",
  textMuted: "#5a8a9a",
  accent: "#00e5ff",
  accentDark: "#00bcd4",
} as const;

export const glassCardStyle: CSSProperties = {
  background: "linear-gradient(145deg, rgba(10,18,24,0.92), rgba(8,14,18,0.82))",
  border: `1px solid ${theme.border}`,
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 20px 45px rgba(0,0,0,0.22)",
};

export const outlineButtonStyle: CSSProperties = {
  width: "100%",
  padding: "14px 18px",
  borderRadius: "12px",
  border: "1px solid rgba(0,229,255,0.26)",
  background: "rgba(5,10,14,0.18)",
  color: theme.accent,
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
  whiteSpace: "normal",
  lineHeight: 1.4,
  textAlign: "left",
  boxShadow: "inset 0 0 0 1px rgba(0,229,255,0.03)",
  textDecoration: "none",
};

export const solidButtonStyle: CSSProperties = {
  width: "100%",
  padding: "14px 18px",
  borderRadius: "12px",
  border: "1px solid rgba(0,229,255,0.26)",
  background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`,
  color: theme.bg,
  fontSize: "13px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
  flexWrap: "wrap",
  whiteSpace: "normal",
  lineHeight: 1.4,
  textAlign: "center",
};
