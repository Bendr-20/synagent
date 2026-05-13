import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { glassCardStyle, outlineButtonStyle, theme } from "@/lib/theme";

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CredBureauReceivedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const applicationId = getSingle(params.applicationId)?.trim() || "";

  return (
    <SiteShell>
      <section style={{ maxWidth: "760px", margin: "0 auto", padding: "92px 24px 112px" }}>
        <div style={{ ...glassCardStyle, textAlign: "center", display: "grid", gap: "18px" }}>
          <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", letterSpacing: "0.16em", textTransform: "uppercase" }}>
            Cred Bureau Application
          </div>
          <h1 style={{ margin: 0, color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(36px, 7vw, 68px)", lineHeight: 0.95 }}>
            Application Received
          </h1>
          <p style={{ margin: 0, color: theme.textMuted, lineHeight: 1.8, fontSize: "16px" }}>
            We received your Cred Bureau application and it is under review. The Synagent team will review your Helixa profile, Cred context, and supporting links before manually contacting approved applicants.
          </p>
          {applicationId && (
            <div style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${theme.border}`, color: theme.textStrong, fontFamily: "JetBrains Mono, monospace", wordBreak: "break-all" }}>
              Reference: <span style={{ color: theme.accent }}>{applicationId}</span>
            </div>
          )}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginTop: "8px" }}>
            <Link href="/cred-bureau" style={{ ...outlineButtonStyle, width: "auto" }}>
              Back to Cred Bureau
            </Link>
            <a href="https://helixa.xyz/manage/human" style={{ ...outlineButtonStyle, width: "auto" }}>
              Update Helixa Profile
            </a>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
