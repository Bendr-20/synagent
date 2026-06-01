"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { outlineButtonStyle, solidButtonStyle, theme } from "@/lib/theme";

const storageKey = "synagent-review-key";

const destinations = [
  {
    label: "Task requests",
    route: "/review/matches",
    description: "Synagent task intake, matches, contacts, and queued notifications.",
  },
  {
    label: "Access applications",
    route: "/review/cred-bureau",
    description: "Cred Bureau applicant review boxes and decision log.",
  },
  {
    label: "Reward reports",
    route: "/review/cred-bureau/rewards",
    description: "Bug reports, product feedback, points, anti-farm notes, and payout exports.",
  },
];

export function ReviewKeyConsole() {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get("key")?.trim();
    const savedKey = window.localStorage.getItem(storageKey)?.trim();
    const nextKey = urlKey || savedKey || "";

    if (nextKey) setKey(nextKey);
  }, []);

  function openRoute(route: string) {
    const trimmed = key.trim();

    if (!trimmed) {
      setMessage("Paste reviewer key once before opening a queue.");
      return;
    }

    localStorage.setItem("synagent-review-key", trimmed);
    router.push(`${route}?key=${encodeURIComponent(trimmed)}`);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    openRoute("/review/matches");
  }

  return (
    <div style={{ display: "grid", gap: "18px" }}>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "12px" }}>
        <label htmlFor="review-key" style={{ color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "20px", fontWeight: 700 }}>
          Paste reviewer key once
        </label>
        <p style={{ color: theme.textMuted, margin: 0, lineHeight: 1.7 }}>
          The key stays in this browser and is only added to reviewer URLs. Do not screenshot or paste it into the group chat.
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "stretch" }}>
          <input
            id="review-key"
            type="password"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder="reviewer key"
            autoComplete="off"
            style={{
              flex: "1 1 280px",
              borderRadius: "12px",
              border: `1px solid ${theme.border}`,
              background: "rgba(5,10,14,0.74)",
              color: theme.textStrong,
              padding: "14px 16px",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <button type="submit" style={{ ...solidButtonStyle, width: "auto", minWidth: "180px" }}>
            Open task queue
          </button>
        </div>
        {message && <div style={{ color: "#ffc8c8", fontSize: "13px", lineHeight: 1.5 }}>{message}</div>}
      </form>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "14px" }} className="review-console-grid">
        {destinations.map((destination) => (
          <a
            key={destination.route}
            href={destination.route}
            onClick={(event) => {
              event.preventDefault();
              openRoute(destination.route);
            }}
            style={{ ...outlineButtonStyle, alignItems: "flex-start", justifyContent: "flex-start", minHeight: "128px", flexDirection: "column" }}
          >
            <span style={{ color: theme.textStrong }}>{destination.label}</span>
            <span style={{ color: theme.textMuted, fontSize: "12px", letterSpacing: "0.02em", textTransform: "none", fontWeight: 500 }}>{destination.description}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
