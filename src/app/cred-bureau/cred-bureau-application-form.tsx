"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type CSSProperties, type FormEvent, type RefObject } from "react";
import { glassCardStyle, outlineButtonStyle, solidButtonStyle, theme } from "@/lib/theme";

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; applicationId: string; nextStep: string }
  | { kind: "error"; message: string };

type ProfileLoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

type InputRef = RefObject<HTMLInputElement | null>;

const fieldLabelStyle: CSSProperties = {
  fontSize: "11px",
  color: theme.textMuted,
  fontFamily: "JetBrains Mono, monospace",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: "8px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  minHeight: "48px",
  background: "rgba(10,18,24,0.92)",
  border: `1px solid ${theme.border}`,
  borderRadius: "12px",
  padding: "12px 14px",
  color: theme.text,
  fontSize: "14px",
  lineHeight: 1.5,
  outline: "none",
};

function extractHelixaProfileId(value: string) {
  const cleaned = value.trim();
  if (!cleaned) return "";

  try {
    const parsed = cleaned.startsWith("/h/") ? new URL(cleaned, "https://helixa.xyz") : new URL(cleaned);
    const [, type, encodedId, extra] = parsed.pathname.split("/");
    if (parsed.protocol !== "https:" || parsed.hostname.toLowerCase() !== "helixa.xyz" || type !== "h" || !encodedId || extra) return "";
    return decodeURIComponent(encodedId);
  } catch {
    return "";
  }
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function fillIfEmpty(ref: InputRef, value: string) {
  const input = ref.current;
  if (!input || input.value.trim() || !value.trim()) return false;
  input.value = value.trim();
  return true;
}

function normalizeTelegram(value: string) {
  const cleaned = value.replace(/^@/, "").trim();
  return cleaned ? `@${cleaned}` : "";
}

function externalWebsiteFromProfile(profile: any) {
  const url = firstString(profile?.services?.web?.url, profile?.linkedAccounts?.website, profile?.externalIds?.website);
  if (!url || /^https:\/\/helixa\.xyz\/h\//i.test(url)) return "";
  return url;
}

export function CredBureauApplicationForm() {
  const router = useRouter();
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });
  const [profileLoadState, setProfileLoadState] = useState<ProfileLoadState>({ kind: "idle" });
  const nameRef = useRef<HTMLInputElement | null>(null);
  const telegramRef = useRef<HTMLInputElement | null>(null);
  const roleRef = useRef<HTMLInputElement | null>(null);
  const linkedinRef = useRef<HTMLInputElement | null>(null);
  const websiteRef = useRef<HTMLInputElement | null>(null);
  const humanProfileUrlRef = useRef<HTMLInputElement | null>(null);

  async function loadHelixaProfile() {
    const rawProfileUrl = humanProfileUrlRef.current?.value || "";
    const profileId = extractHelixaProfileId(rawProfileUrl);

    if (!profileId) {
      setProfileLoadState({ kind: "error", message: "Paste a Helixa human profile URL like https://helixa.xyz/h/your-profile-id first." });
      return;
    }

    setProfileLoadState({ kind: "loading" });

    try {
      const response = await fetch("https://api.helixa.xyz/api/v2/human/" + encodeURIComponent(profileId), { cache: "no-store" });
      const profile = await response.json().catch(() => null);
      if (!response.ok || !profile) throw new Error(profile?.error || "Helixa profile could not be loaded.");

      const skills = Array.isArray(profile.skills) ? profile.skills : [];
      const serviceCategories = Array.isArray(profile.metadata?.serviceCategories) ? profile.metadata.serviceCategories : [];
      const roleSummary = [...serviceCategories, ...skills].slice(0, 3).join(", ");
      const telegram = normalizeTelegram(firstString(profile.linkedAccounts?.telegram, profile.services?.telegram?.handle));
      const linkedIn = firstString(profile.services?.linkedin?.url, profile.linkedAccounts?.linkedin, profile.externalIds?.linkedin);
      const website = externalWebsiteFromProfile(profile);

      const filled = [
        fillIfEmpty(nameRef, firstString(profile.name, profile.registration?.name)),
        fillIfEmpty(telegramRef, telegram),
        fillIfEmpty(roleRef, roleSummary),
        fillIfEmpty(linkedinRef, linkedIn),
        fillIfEmpty(websiteRef, website),
      ].filter(Boolean).length;

      setProfileLoadState({
        kind: "success",
        message: filled > 0
          ? `Loaded ${profile.name || "Helixa profile"} and filled ${filled} public field${filled === 1 ? "" : "s"}. Add any private contact detail that is still missing.`
          : "Profile loaded. Nothing public was missing here, so add the remaining private contact details manually.",
      });
    } catch (error: any) {
      setProfileLoadState({ kind: "error", message: error?.message || "Helixa profile could not be loaded." });
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setSubmitState({ kind: "submitting" });

    const response = await fetch("/api/cred-bureau/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        applicant: {
          name: String(data.get("name") || ""),
          telegram: String(data.get("telegram") || ""),
          email: String(data.get("email") || ""),
          role: String(data.get("role") || ""),
          linkedinUrl: String(data.get("linkedinUrl") || ""),
          websiteUrl: String(data.get("websiteUrl") || ""),
        },
        humanProfile: {
          url: String(data.get("humanProfileUrl") || ""),
        },
        reviewAddendum: {
          whyJoin: String(data.get("whyJoin") || ""),
          availability: String(data.get("availability") || ""),
          disclosure: String(data.get("disclosure") || ""),
        },
      }),
    });

    const body = await response.json();
    if (!response.ok || !body.success) {
      setSubmitState({ kind: "error", message: body.error || "Application failed. Try again." });
      return;
    }

    form.reset();
    setSubmitState({ kind: "success", applicationId: body.applicationId, nextStep: body.nextStep });
    router.push(`/cred-bureau/received?applicationId=${encodeURIComponent(body.applicationId)}`);
  }

  return (
    <form id="apply" onSubmit={onSubmit} style={{ ...glassCardStyle, display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <div style={{ ...fieldLabelStyle, color: theme.accent }}>Apply to Cred Bureau</div>
        <h2 style={{ margin: "0 0 10px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "28px" }}>Submit for manual review</h2>
        <p style={{ margin: 0, color: theme.textMuted, lineHeight: 1.7 }}>
          Helixa human profile is required for Cred Bureau applications. Create or update your profile first, then submit it with any supporting LinkedIn or website links you want reviewers to see.
        </p>
      </div>

      <div className="cred-bureau-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <label>
          <div style={fieldLabelStyle}>Name</div>
          <input ref={nameRef} name="name" required placeholder="Your name or operator handle" style={inputStyle} />
        </label>
        <label>
          <div style={fieldLabelStyle}>Telegram Handle</div>
          <input ref={telegramRef} name="telegram" placeholder="@username" style={inputStyle} />
        </label>
      </div>

      <div className="cred-bureau-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <label>
          <div style={fieldLabelStyle}>Email</div>
          <input name="email" type="email" placeholder="you@example.com" style={inputStyle} />
        </label>
        <label>
          <div style={fieldLabelStyle}>Role / Fit</div>
          <input ref={roleRef} name="role" placeholder="Reviewer, operator, builder, founder" style={inputStyle} />
        </label>
      </div>

      <div className="cred-bureau-actions" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <a href="https://helixa.xyz/join/human" style={{ ...solidButtonStyle, width: "auto", minWidth: "230px" }}>
          Mint/Create Helixa Profile
        </a>
        <a href="https://helixa.xyz/manage/human" style={{ ...outlineButtonStyle, width: "auto", minWidth: "230px", justifyContent: "center" }}>
          Update Profile
        </a>
      </div>

      <label>
        <div style={fieldLabelStyle}>Helixa Human Profile URL (required)</div>
        <input ref={humanProfileUrlRef} name="humanProfileUrl" required placeholder="https://helixa.xyz/h/your-profile-id" style={inputStyle} />
      </label>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <button
          type="button"
          onClick={loadHelixaProfile}
          disabled={profileLoadState.kind === "loading"}
          style={{ ...outlineButtonStyle, width: "auto", minWidth: "230px", justifyContent: "center", opacity: profileLoadState.kind === "loading" ? 0.72 : 1 }}
        >
          {profileLoadState.kind === "loading" ? "Loading Helixa Profile" : "Load from Helixa Profile"}
        </button>
        <div style={{ color: profileLoadState.kind === "error" ? "#ffc8c8" : theme.textMuted, fontSize: "13px", lineHeight: 1.55 }}>
          {profileLoadState.kind === "success" || profileLoadState.kind === "error"
            ? profileLoadState.message
            : "Paste your Helixa profile URL first. We can pull public name, Telegram, skills, and website so you do not retype profile data."}
        </div>
      </div>

      <div className="cred-bureau-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <label>
          <div style={fieldLabelStyle}>LinkedIn (optional)</div>
          <input ref={linkedinRef} name="linkedinUrl" type="url" placeholder="https://www.linkedin.com/in/yourname" style={inputStyle} />
        </label>
        <label>
          <div style={fieldLabelStyle}>Website / Portfolio (optional)</div>
          <input ref={websiteRef} name="websiteUrl" type="url" placeholder="https://your-site.com" style={inputStyle} />
        </label>
      </div>

      <label>
        <div style={fieldLabelStyle}>Why should this profile be reviewed for Cred Bureau?</div>
        <textarea name="whyJoin" required rows={4} placeholder="Review focus, relevant context, and why you should be in the group." style={{ ...inputStyle, resize: "vertical" }} />
      </label>

      <div className="cred-bureau-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <label>
          <div style={fieldLabelStyle}>Availability</div>
          <input name="availability" placeholder="A few hours/week, nights, weekends" style={inputStyle} />
        </label>
        <label className="cred-bureau-disclosure-field" style={{ gridColumn: "1 / -1" }}>
          <div style={fieldLabelStyle}>Conflict Disclosure</div>
          <textarea name="disclosure" rows={3} placeholder="List any conflicts, affiliations, or review context." style={{ ...inputStyle, resize: "vertical" }} />
        </label>
      </div>

      <button type="submit" disabled={submitState.kind === "submitting"} style={{ ...solidButtonStyle, opacity: submitState.kind === "submitting" ? 0.72 : 1 }}>
        {submitState.kind === "submitting" ? "Submitting for review" : "Submit Application"}
      </button>

      {submitState.kind === "success" && (
        <div style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(0,229,255,0.24)", background: "rgba(0,229,255,0.08)", color: theme.textStrong, lineHeight: 1.6 }}>
          Application received. Reference: <span style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace" }}>{submitState.applicationId}</span>. {submitState.nextStep}
        </div>
      )}

      {submitState.kind === "error" && (
        <div style={{ padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(255,120,120,0.32)", background: "rgba(255,80,80,0.08)", color: "#ffc8c8", lineHeight: 1.6 }}>
          {submitState.message}
        </div>
      )}
    </form>
  );
}
