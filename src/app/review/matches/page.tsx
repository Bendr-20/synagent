import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { getNotifications, getMatchRequests } from "@/lib/match-store";
import type { MatchNotification, MatchRequestRecord } from "@/lib/match-types";
import { getReviewApiKey } from "@/lib/review-auth";
import { glassCardStyle, outlineButtonStyle, theme } from "@/lib/theme";

export const dynamic = "force-dynamic";

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatUtc(value?: string | null) {
  if (!value) return "Not set";
  return `${new Date(value).toLocaleString("en-US", { timeZone: "UTC" })} UTC`;
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <div style={{ color: theme.textMuted, fontSize: "10px", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "5px" }}>{label}</div>
      <div style={{ color: value ? theme.textStrong : theme.textMuted, fontSize: "14px", lineHeight: 1.5, wordBreak: "break-word" }}>{value || "Not provided"}</div>
    </div>
  );
}

function uniqueNotifications(request: MatchRequestRecord, notifications: MatchNotification[]) {
  const byId = new Map<string, MatchNotification>();
  for (const notification of request.notifications || []) byId.set(notification.id, notification);
  for (const notification of notifications.filter((item) => item.requestId === request.id)) byId.set(notification.id, notification);
  return Array.from(byId.values());
}

function RequestCard({ request, notifications }: { request: MatchRequestRecord; notifications: MatchNotification[] }) {
  const { intake, review } = request;
  const requestNotifications = uniqueNotifications(request, notifications);
  const recommended = request.matchedAgents.find((match) => match.slug === review.recommendedMatchSlug) || request.matchedAgents[0] || null;

  return (
    <article style={{ ...glassCardStyle, display: "grid", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", marginBottom: "8px" }}>{request.id}</div>
          <h2 style={{ margin: 0, color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(24px, 4vw, 34px)", lineHeight: 1.1 }}>{intake.title || "Untitled request"}</h2>
        </div>
        <div style={{ color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", textAlign: "right" }}>
          {request.status} | {formatUtc(request.createdAt)}
        </div>
      </div>

      <div className="cred-bureau-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "14px" }}>
        <Field label="Requester" value={intake.requester} />
        <Field label="Category" value={intake.category} />
        <Field label="Budget" value={intake.budgetRange} />
        <Field label="Urgency" value={intake.urgency} />
        <Field label="Delivery" value={intake.deliveryType} />
        <Field label="Confidentiality" value={intake.confidentiality} />
        <Field label="Payment" value={intake.paymentPreference} />
        <Field label="Next action" value={formatUtc(request.nextActionAt)} />
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 0.55fr)", gap: "16px" }} className="review-match-grid">
        <div style={{ display: "grid", gap: "12px" }}>
          <Field label="Desired outcome" value={intake.desiredOutcome} />
          <Field label="Brief" value={intake.brief} />
          <Field label="Budget note" value={intake.budgetNote} />
        </div>
        <div style={{ ...glassCardStyle, padding: "16px", boxShadow: "none" }}>
          <h3 style={{ margin: "0 0 12px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "20px" }}>Contact</h3>
          <div style={{ display: "grid", gap: "10px" }}>
            <Field label="Email" value={intake.contact.email} />
            <Field label="Telegram" value={intake.contact.telegram} />
            <Field label="Note" value={intake.contact.note} />
          </div>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.7fr) minmax(0, 1fr)", gap: "16px" }} className="review-match-grid">
        <section style={{ ...glassCardStyle, padding: "16px", boxShadow: "none" }}>
          <h3 style={{ margin: "0 0 12px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "20px" }}>Recommended match</h3>
          <div style={{ display: "grid", gap: "10px" }}>
            <Field label="Public decision" value={review.publicDecision} />
            <Field label="Confidence" value={review.confidence} />
            <Field label="Strongest score" value={review.strongestScore} />
            <Field label="Agent" value={recommended ? `${recommended.name} (${recommended.slug})` : "Manual review"} />
          </div>
        </section>

        <section style={{ ...glassCardStyle, padding: "16px", boxShadow: "none" }}>
          <h3 style={{ margin: "0 0 12px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "20px" }}>Ranked candidates</h3>
          {request.matchEvaluation.rankedCandidates.length === 0 ? (
            <div style={{ color: theme.textMuted, lineHeight: 1.6 }}>No ranked candidates stored for this request.</div>
          ) : (
            <div style={{ display: "grid", gap: "10px" }}>
              {request.matchEvaluation.rankedCandidates.map((candidate) => (
                <div key={candidate.slug} style={{ border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "12px", background: "rgba(5,10,14,0.26)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                    <strong style={{ color: theme.textStrong }}>{candidate.name}</strong>
                    <span style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}>{candidate.score} pts</span>
                  </div>
                  <div style={{ color: theme.textMuted, fontSize: "13px", lineHeight: 1.5 }}>{candidate.reasons.join("; ") || "No reasons stored"}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section style={{ ...glassCardStyle, padding: "16px", boxShadow: "none" }}>
        <h3 style={{ margin: "0 0 12px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "20px" }}>Queued notifications</h3>
        {requestNotifications.length === 0 ? (
          <div style={{ color: theme.textMuted, lineHeight: 1.6 }}>No notifications queued for this request.</div>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {requestNotifications.map((notification) => (
              <div key={notification.id} style={{ border: `1px solid ${theme.border}`, borderRadius: "12px", padding: "12px", background: "rgba(5,10,14,0.26)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <strong style={{ color: theme.textStrong }}>{notification.channel} to {notification.agentSlug}</strong>
                  <span style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}>{notification.status}</span>
                </div>
                <Field label="Target" value={notification.target} />
                <Field label="Subject" value={notification.subject} />
              </div>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}

export default async function MatchReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const reviewKey = getSingle(params.key)?.trim() || "";
  const configuredKey = getReviewApiKey();
  const authorized = Boolean(configuredKey && reviewKey === configuredKey);
  const requests = authorized ? getMatchRequests() : [];
  const notifications = authorized ? getNotifications() : [];
  const notificationSummary = notifications.reduce<Record<string, number>>((summary, notification) => {
    summary[notification.status] = (summary[notification.status] || 0) + 1;
    return summary;
  }, {});

  return (
    <SiteShell>
      <section style={{ maxWidth: "1180px", margin: "0 auto", padding: "72px 24px 96px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "12px", color: theme.accent, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "14px" }}>
              Manual Task Review | Reviewer Only
            </div>
            <h1 style={{ margin: "0 0 10px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(34px, 6vw, 62px)", lineHeight: 1 }}>
              Synagent Task Review Queue
            </h1>
            <p style={{ color: theme.textMuted, maxWidth: "780px", lineHeight: 1.7, margin: 0 }}>
              Review submitted task requests, confirm the recommended match, inspect contact details, and check whether provider notifications are still queued.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href={`/review?key=${encodeURIComponent(reviewKey)}`} style={{ ...outlineButtonStyle, width: "auto" }}>
              Reviewer Home
            </Link>
            <Link href={`/review/cred-bureau/rewards?key=${encodeURIComponent(reviewKey)}`} style={{ ...outlineButtonStyle, width: "auto" }}>
              Reward reports
            </Link>
          </div>
        </div>

        {!configuredKey && (
          <div style={{ ...glassCardStyle, color: "#ffc8c8", lineHeight: 1.7 }}>
            Review key is not configured on the server. Set it before reviewing task requests.
          </div>
        )}

        {configuredKey && !authorized && (
          <div style={{ ...glassCardStyle, lineHeight: 1.7 }}>
            <h2 style={{ margin: "0 0 10px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif" }}>Reviewer key required</h2>
            <p style={{ color: theme.textMuted, margin: "0 0 14px" }}>Start at the reviewer console, paste the key once, then open the task queue.</p>
            <Link href="/review" style={{ ...outlineButtonStyle, width: "auto" }}>
              Reviewer Home
            </Link>
          </div>
        )}

        {authorized && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "14px", marginBottom: "18px" }} className="review-console-grid">
              <div style={glassCardStyle}>
                <Field label="Requests" value={requests.length} />
              </div>
              <div style={glassCardStyle}>
                <Field label="Queued notifications" value={notificationSummary.queued || 0} />
              </div>
              <div style={glassCardStyle}>
                <Field label="Needs manual review" value={requests.filter((request) => request.review.needsManualReview).length} />
              </div>
            </div>

            {requests.length === 0 ? (
              <div style={{ ...glassCardStyle, color: theme.textMuted, lineHeight: 1.7 }}>No Synagent task requests yet.</div>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {requests.map((request) => (
                  <RequestCard key={request.id} request={request} notifications={notifications} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </SiteShell>
  );
}
