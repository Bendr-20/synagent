import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { getCredBureauApplications, getCredBureauReviewLog } from "@/lib/cred-bureau-store";
import { getReviewApiKey } from "@/lib/review-auth";
import { glassCardStyle, outlineButtonStyle, theme } from "@/lib/theme";
import { ReviewStatusControls } from "./review-status-controls";

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div style={{ color: theme.textMuted, fontSize: "10px", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "5px" }}>{label}</div>
      <div style={{ color: value ? theme.textStrong : theme.textMuted, fontSize: "14px", lineHeight: 1.5 }}>{value || "Not provided"}</div>
    </div>
  );
}

export default async function CredBureauReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const reviewKey = getSingle(params.key)?.trim() || "";
  const configuredKey = getReviewApiKey();
  const authorized = Boolean(configuredKey && reviewKey === configuredKey);
  const applications = authorized ? getCredBureauApplications() : [];
  const reviewLog = authorized ? getCredBureauReviewLog().slice(0, 25) : [];

  return (
    <SiteShell>
      <section style={{ maxWidth: "1180px", margin: "0 auto", padding: "72px 24px 96px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "12px", color: theme.accent, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "14px" }}>
              Manual Review | No Auto Invite
            </div>
            <h1 style={{ margin: "0 0 10px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(34px, 6vw, 62px)", lineHeight: 1 }}>
              Cred Bureau Review Queue
            </h1>
            <p style={{ color: theme.textMuted, maxWidth: "760px", lineHeight: 1.7, margin: 0 }}>
              Review applicants, inspect their required Helixa human profile and supporting links, copy their Telegram contact, and manually add approved profiles to the group.
            </p>
          </div>
          <Link href="/cred-bureau" style={{ ...outlineButtonStyle, width: "auto" }}>
            Public Application
          </Link>
        </div>

        {!configuredKey && (
          <div style={{ ...glassCardStyle, color: "#ffc8c8", lineHeight: 1.7 }}>
            SYNAGENT_REVIEW_API_KEY is not configured. Set it before reviewing applications.
          </div>
        )}

        {configuredKey && !authorized && (
          <div style={{ ...glassCardStyle, lineHeight: 1.7 }}>
            <h2 style={{ margin: "0 0 10px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif" }}>Reviewer key required</h2>
            <p style={{ color: theme.textMuted, margin: "0 0 14px" }}>Open this page with the temporary reviewer key to load applications.</p>
            <code style={{ color: theme.accent, wordBreak: "break-all" }}>/review/cred-bureau?key=YOUR_REVIEW_KEY</code>
          </div>
        )}

        {authorized && applications.length === 0 && (
          <div style={{ ...glassCardStyle, color: theme.textMuted, lineHeight: 1.7 }}>
            No Cred Bureau applications yet.
          </div>
        )}

        {authorized && applications.length > 0 && (
          <div style={{ display: "grid", gap: "16px" }}>
            {applications.map((application) => (
              <article key={application.id} style={{ ...glassCardStyle, borderColor: application.status === "approved" ? "rgba(0,229,255,0.36)" : theme.border }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <div>
                    <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", marginBottom: "8px" }}>{application.id}</div>
                    <h2 style={{ margin: 0, color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "24px" }}>{application.applicant.name}</h2>
                  </div>
                  <div style={{ color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}>
                    {application.status} | {new Date(application.createdAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC
                  </div>
                </div>

                <div className="cred-bureau-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "14px", marginBottom: "16px" }}>
                  <Field label="Telegram" value={application.applicant.telegram} />
                  <Field label="Email" value={application.applicant.email} />
                  <Field label="Role" value={application.applicant.role} />
                  <Field label="Availability" value={application.reviewAddendum.availability} />
                  <Field label="LinkedIn" value={application.applicant.linkedinUrl} />
                  <Field label="Website" value={application.applicant.websiteUrl} />
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  <Field label="Why review" value={application.reviewAddendum.whyJoin} />
                  <Field label="Disclosure" value={application.reviewAddendum.disclosure} />
                  <a href={application.humanProfile.url || "https://helixa.xyz/join/human"} target="_blank" rel="noreferrer" style={{ color: theme.accent, wordBreak: "break-all" }}>
                    {application.humanProfile.url || "Helixa profile required"}
                  </a>
                </div>

                <ReviewStatusControls application={application} reviewKey={reviewKey} />
              </article>
            ))}
          </div>
        )}

        {authorized && reviewLog.length > 0 && (
          <section style={{ marginTop: "32px" }}>
            <h2 style={{ margin: "0 0 14px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "26px" }}>
              Decision Log
            </h2>
            <div style={{ display: "grid", gap: "12px" }}>
              {reviewLog.map((entry) => (
                <article key={entry.id} style={{ ...glassCardStyle, padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
                    <div>
                      <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", marginBottom: "6px" }}>{entry.applicationId}</div>
                      <div style={{ color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "18px" }}>{entry.applicant.name}</div>
                    </div>
                    <div style={{ color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}>
                      {entry.previousStatus} {'>'} {entry.status} | {new Date(entry.loggedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC
                    </div>
                  </div>
                  <div className="cred-bureau-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px", marginBottom: "10px" }}>
                    <Field label="Telegram" value={entry.applicant.telegram} />
                    <Field label="Email" value={entry.applicant.email} />
                    <Field label="Status" value={entry.status} />
                  </div>
                  <Field label="Reviewer notes" value={entry.reviewerNotes} />
                  <a href={entry.humanProfile.url || "https://helixa.xyz/join/human"} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: "10px", color: theme.accent, wordBreak: "break-all" }}>
                    {entry.humanProfile.url || "Helixa profile required"}
                  </a>
                </article>
              ))}
            </div>
          </section>
        )}
      </section>
    </SiteShell>
  );
}
