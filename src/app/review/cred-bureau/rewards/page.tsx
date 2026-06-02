import fs from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { CRED_BUREAU_REWARD_CONFIG } from "@/lib/cred-bureau-rewards-config";
import { buildCredBureauLeaderboard } from "@/lib/cred-bureau-rewards-scoring";
import { buildSuggestedRewardReview, getRewardContributions, getRewardParticipants } from "@/lib/cred-bureau-rewards-store";
import type {
  CredBureauRewardContribution,
  CredBureauRewardParticipant,
  CredBureauRewardSeasonId,
  CredBureauPayoutExportRecord,
} from "@/lib/cred-bureau-rewards-types";
import { getReviewApiKey } from "@/lib/review-auth";
import { glassCardStyle, outlineButtonStyle, solidButtonStyle, theme } from "@/lib/theme";
import { PayoutExportControls, RewardReviewControls } from "./reward-review-controls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getDataDir() {
  return process.env.SYNAGENT_DATA_DIR || path.join(process.cwd(), "data");
}

function getPayoutExportsPath() {
  return path.join(getDataDir(), "cred-bureau-payout-exports.json");
}

const reviewOpsDocUrl = "https://github.com/Bendr-20/synagent/blob/main/docs/cred-bureau-review-ops.md";

function getSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isSeasonId(value: string | undefined): value is CredBureauRewardSeasonId {
  return value === "season-1" || value === "season-2";
}

function categoryLabel(id: string) {
  return CRED_BUREAU_REWARD_CONFIG.categories.find((category) => category.id === id)?.label || id;
}

function formatUtc(value?: string | null) {
  if (!value) return "Not set";
  return `${new Date(value).toLocaleString("en-US", { timeZone: "UTC" })} UTC`;
}

function readPayoutExports(): CredBureauPayoutExportRecord[] {
  try {
    return JSON.parse(fs.readFileSync(getPayoutExportsPath(), "utf8")) as CredBureauPayoutExportRecord[];
  } catch {
    return [];
  }
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  const rendered = value === 0 ? "0" : value || "Not provided";
  return (
    <div>
      <div style={{ color: theme.textMuted, fontSize: "10px", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "5px" }}>{label}</div>
      <div style={{ color: value === 0 || value ? theme.textStrong : theme.textMuted, fontSize: "14px", lineHeight: 1.5, overflowWrap: "anywhere" }}>{rendered}</div>
    </div>
  );
}

function participantName(participant: CredBureauRewardParticipant | undefined, contribution: CredBureauRewardContribution) {
  return participant?.displayName || `Unknown participant (${contribution.participantId})`;
}

type SuggestedRewardReview = ReturnType<typeof buildSuggestedRewardReview>;

function ContributionCard({ contribution, participant, reviewKey, suggestion }: { contribution: CredBureauRewardContribution; participant?: CredBureauRewardParticipant; reviewKey: string; suggestion: SuggestedRewardReview }) {
  const profileLink = participant?.helixaProfileUrl;

  return (
    <article className="cred-bureau-reward-review-card" style={{ ...glassCardStyle, borderColor: contribution.status === "approved" ? "rgba(0,229,255,0.36)" : contribution.status === "rejected" ? "rgba(255,120,120,0.3)" : theme.border }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div>
          <div style={{ color: theme.accent, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", marginBottom: "8px" }}>{contribution.id}</div>
          <h3 style={{ margin: "0 0 8px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "24px" }}>{contribution.title}</h3>
          {profileLink ? (
            <a href={profileLink} target="_blank" rel="noreferrer" style={{ color: theme.accent, overflowWrap: "anywhere" }}>
              {participantName(participant, contribution)} Helixa profile
            </a>
          ) : (
            <div style={{ color: theme.textMuted }}>{participantName(participant, contribution)} · Helixa profile not provided</div>
          )}
        </div>
        <div style={{ color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: "12px", textAlign: "right" }}>
          <div>{contribution.status}</div>
          <div>{formatUtc(contribution.createdAt)}</div>
        </div>
      </div>

      <div className="cred-bureau-reward-review-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "14px", marginBottom: "16px" }}>
        <Field label="Season" value={contribution.seasonId} />
        <Field label="Category" value={categoryLabel(contribution.categoryId)} />
        <Field label="Requested points" value={contribution.requestedPoints ?? null} />
        <Field label="Suggested points" value={suggestion.suggestedPoints ?? "Manual review"} />
        <Field label="Assigned points" value={contribution.assignedPoints} />
        <Field label="Payout eligible" value={contribution.payoutEligible ? "Yes" : "No"} />
        <Field label="Social evidence" value={contribution.socialEvidence ? "Yes" : "No"} />
        <Field label="Wallet" value={participant?.wallet} />
        <Field label="Telegram" value={participant?.telegram} />
        <Field label="Email" value={participant?.email} />
        <Field label="Reviewed by" value={contribution.reviewedBy} />
        <Field label="Reviewed at" value={formatUtc(contribution.reviewedAt)} />
      </div>

      <div style={{ display: "grid", gap: "12px", marginBottom: "16px" }}>
        <Field label="Description" value={contribution.description} />
        <Field label="Suggested reason" value={suggestion.suggestedReason} />
        {suggestion.reviewFlags.length > 0 && <Field label="Review flags" value={suggestion.reviewFlags.join("; ")} />}
        {contribution.evidenceUrl && (
          <a href={contribution.evidenceUrl} target="_blank" rel="noreferrer" style={{ color: theme.accent, overflowWrap: "anywhere" }}>
            Evidence link
          </a>
        )}
        <Field label="Reviewer notes" value={contribution.reviewerNotes} />
        <Field label="Anti-farm notes" value={contribution.antiFarmNotes} />
      </div>

      <RewardReviewControls contribution={contribution} reviewKey={reviewKey} suggestion={suggestion} />
    </article>
  );
}

function WeeklyCheckpoint({ activeSeason, contributions, participants }: { activeSeason: CredBureauRewardSeasonId; contributions: CredBureauRewardContribution[]; participants: CredBureauRewardParticipant[] }) {
  const activeSeasonConfig = CRED_BUREAU_REWARD_CONFIG.seasons.find((season) => season.id === activeSeason);
  const activeSeasonContributions = contributions.filter((contribution) => contribution.seasonId === activeSeason);
  const approved = activeSeasonContributions.filter((contribution) => contribution.status === "approved");
  const approvedPoints = approved.reduce((sum, contribution) => sum + contribution.assignedPoints, 0);
  const submittedAwaitingCount = activeSeasonContributions.filter((contribution) => contribution.status === "submitted").length;
  const needsInfoCount = activeSeasonContributions.filter((contribution) => contribution.status === "needs-info").length;
  const leaderboard = buildCredBureauLeaderboard(participants, contributions, activeSeason).slice(0, 10);

  const approvedByCategory = CRED_BUREAU_REWARD_CONFIG.categories.map((category) => ({
    category,
    count: approved.filter((contribution) => contribution.categoryId === category.id).length,
    points: approved.filter((contribution) => contribution.categoryId === category.id).reduce((sum, contribution) => sum + contribution.assignedPoints, 0),
  }));

  return (
    <section style={{ ...glassCardStyle, marginBottom: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", flexWrap: "wrap", marginBottom: "18px" }}>
        <div>
          <div style={{ fontSize: "12px", color: theme.accent, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "10px" }}>
            Weekly checkpoint
          </div>
          <h2 style={{ margin: 0, color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "28px" }}>Weekly checkpoint section</h2>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a href={`${reviewOpsDocUrl}#weekly-recap-template`} target="_blank" rel="noreferrer" style={{ ...outlineButtonStyle, width: "auto" }}>
            Weekly recap prompt/template
          </a>
          <a href={`${reviewOpsDocUrl}#final-winners-post-template`} target="_blank" rel="noreferrer" style={{ ...outlineButtonStyle, width: "auto" }}>
            Final winners post prompt/template
          </a>
        </div>
      </div>

      <div className="cred-bureau-reward-review-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "14px", marginBottom: "18px" }}>
        <Field label="Active season" value={activeSeasonConfig?.label || activeSeason} />
        <Field label="Current approved points" value={approvedPoints} />
        <Field label="Submitted count awaiting review" value={submittedAwaitingCount} />
        <Field label="Needs-info count" value={needsInfoCount} />
      </div>

      <div className="cred-bureau-reward-review-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ border: "1px solid rgba(0,229,255,0.12)", borderRadius: "14px", padding: "16px", background: "rgba(5,10,14,0.22)" }}>
          <h3 style={{ margin: "0 0 12px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif" }}>Approved count by category</h3>
          <div style={{ display: "grid", gap: "8px" }}>
            {approvedByCategory.map(({ category, count, points }) => (
              <div key={category.id} style={{ display: "flex", justifyContent: "space-between", gap: "12px", color: theme.textMuted, fontSize: "13px" }}>
                <span>{category.label}</span>
                <span style={{ color: theme.textStrong }}>{count} / {points} pts</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ border: "1px solid rgba(0,229,255,0.12)", borderRadius: "14px", padding: "16px", background: "rgba(5,10,14,0.22)" }}>
          <h3 style={{ margin: "0 0 12px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif" }}>Current top 10 leaderboard</h3>
          {leaderboard.length === 0 ? (
            <div style={{ color: theme.textMuted, fontSize: "13px" }}>No approved contributors yet.</div>
          ) : (
            <div style={{ display: "grid", gap: "8px" }}>
              {leaderboard.map((row, index) => (
                <div key={row.participantId} style={{ display: "grid", gridTemplateColumns: "34px 1fr auto", gap: "10px", color: theme.textMuted, fontSize: "13px" }}>
                  <span style={{ color: theme.accent }}>{index + 1}</span>
                  <span style={{ color: theme.textStrong }}>{row.displayName}</span>
                  <span>{row.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link href={href} style={{ ...(active ? solidButtonStyle : outlineButtonStyle), width: "auto", minWidth: "130px" }}>
      {children}
    </Link>
  );
}

export default async function CredBureauRewardsReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const reviewKey = getSingle(params.key)?.trim() || "";
  const configuredKey = getReviewApiKey();
  const authorized = Boolean(configuredKey && reviewKey === configuredKey);
  const requestedSeason = getSingle(params.season);
  const activeSeason = isSeasonId(requestedSeason) ? requestedSeason : "season-1";
  const requestedReviewed = getSingle(params.reviewed);
  const reviewedFilter: "all" | "approved" | "rejected" = requestedReviewed === "approved" || requestedReviewed === "rejected" ? requestedReviewed : "all";

  const contributions = authorized ? getRewardContributions() : [];
  const participants = authorized ? getRewardParticipants() : [];
  const participantById = new Map(participants.map((participant) => [participant.id, participant]));
  const payoutExports = authorized ? readPayoutExports().slice().reverse().slice(0, 12).map((exportRecord) => ({
    id: exportRecord.id,
    createdAt: exportRecord.createdAt,
    seasonId: exportRecord.seasonId,
    seasonTokenPool: exportRecord.seasonTokenPool,
    totalPoints: exportRecord.totalPoints,
    rowCount: exportRecord.rowCount,
    createdBy: exportRecord.createdBy,
  })) : [];

  const statusWeight: Record<string, number> = { submitted: 0, "needs-info": 1, approved: 2, rejected: 3 };
  const sortedContributions = contributions.slice().sort((a, b) => {
    const statusDelta = statusWeight[a.status] - statusWeight[b.status];
    if (statusDelta !== 0) return statusDelta;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const contributionQueue = sortedContributions.filter((contribution) => contribution.status === "submitted" || contribution.status === "needs-info");
  const reviewedContributions = sortedContributions.filter((contribution) => contribution.status === "approved" || contribution.status === "rejected");
  const visibleReviewedContributions = reviewedFilter === "all" ? reviewedContributions : reviewedContributions.filter((contribution) => contribution.status === reviewedFilter);

  const baseReviewHref = `/review/cred-bureau/rewards?key=${encodeURIComponent(reviewKey)}&season=${activeSeason}`;

  return (
    <SiteShell>
      <section style={{ maxWidth: "1180px", margin: "0 auto", padding: "72px 24px 96px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "12px", color: theme.accent, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "14px" }}>
              Manual Rewards Review | Reviewer Only
            </div>
            <h1 style={{ margin: "0 0 10px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "clamp(34px, 6vw, 62px)", lineHeight: 1 }}>
              Cred Bureau Rewards Review Queue
            </h1>
            <p style={{ color: theme.textMuted, maxWidth: "780px", lineHeight: 1.7, margin: 0 }}>
              Review submitted contributions, assign points, record anti-farm notes, prepare weekly checkpoint copy, and create manual payout exports after confirmation.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link href="/review" style={{ ...outlineButtonStyle, width: "auto" }}>
              Reviewer Home
            </Link>
            <Link href="/cred-bureau/rewards" style={{ ...outlineButtonStyle, width: "auto" }}>
              Public rewards
            </Link>
            {authorized && (
              <Link href={`/review/cred-bureau?key=${encodeURIComponent(reviewKey)}`} style={{ ...outlineButtonStyle, width: "auto" }}>
                Applicant queue
              </Link>
            )}
          </div>
        </div>

        {!configuredKey && (
          <div style={{ ...glassCardStyle, color: "#ffc8c8", lineHeight: 1.7 }}>
            SYNAGENT_REVIEW_API_KEY is not configured. Set it before reviewing reward contributions.
          </div>
        )}

        {configuredKey && !authorized && (
          <div style={{ ...glassCardStyle, lineHeight: 1.7 }}>
            <h2 style={{ margin: "0 0 10px", color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif" }}>Reviewer key required</h2>
            <p style={{ color: theme.textMuted, margin: "0 0 14px" }}>Start at Reviewer Home, paste the key once, then open reward reports.</p>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
              <Link href="/review" style={{ ...outlineButtonStyle, width: "auto" }}>
                Reviewer Home
              </Link>
              <code style={{ color: theme.accent, wordBreak: "break-all" }}>/review/cred-bureau/rewards?key=YOUR_REVIEW_KEY</code>
            </div>
          </div>
        )}

        {authorized && (
          <>
            <div style={{ ...glassCardStyle, marginBottom: "18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: theme.textMuted, fontSize: "12px", fontFamily: "JetBrains Mono, monospace", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px" }}>Active season</div>
                  <div style={{ color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "22px" }}>{CRED_BUREAU_REWARD_CONFIG.seasons.find((season) => season.id === activeSeason)?.label || activeSeason}</div>
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {CRED_BUREAU_REWARD_CONFIG.seasons.map((season) => (
                    <FilterLink key={season.id} href={`/review/cred-bureau/rewards?key=${encodeURIComponent(reviewKey)}&season=${season.id}`} active={season.id === activeSeason}>
                      {season.label}
                    </FilterLink>
                  ))}
                </div>
              </div>
            </div>

            <WeeklyCheckpoint activeSeason={activeSeason} contributions={contributions} participants={participants} />

            <section style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "14px" }}>
                <h2 style={{ margin: 0, color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "28px" }}>Contribution queue</h2>
                <div style={{ color: theme.textMuted, fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}>
                  submitted + needs-info first · {contributionQueue.length} open
                </div>
              </div>

              {contributionQueue.length === 0 ? (
                <div style={{ ...glassCardStyle, color: theme.textMuted, lineHeight: 1.7 }}>No submitted or needs-info reward contributions are waiting for review.</div>
              ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                  {contributionQueue.map((contribution) => (
                    <ContributionCard key={contribution.id} contribution={contribution} participant={participantById.get(contribution.participantId)} reviewKey={reviewKey} suggestion={buildSuggestedRewardReview(contribution)} />
                  ))}
                </div>
              )}
            </section>

            <section style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "14px" }}>
                <h2 style={{ margin: 0, color: theme.textStrong, fontFamily: "Space Grotesk, sans-serif", fontSize: "28px" }}>Approved/rejected history</h2>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <FilterLink href={`${baseReviewHref}&reviewed=all`} active={reviewedFilter === "all"}>All</FilterLink>
                  <FilterLink href={`${baseReviewHref}&reviewed=approved`} active={reviewedFilter === "approved"}>Approved</FilterLink>
                  <FilterLink href={`${baseReviewHref}&reviewed=rejected`} active={reviewedFilter === "rejected"}>Rejected</FilterLink>
                </div>
              </div>

              {visibleReviewedContributions.length === 0 ? (
                <div style={{ ...glassCardStyle, color: theme.textMuted, lineHeight: 1.7 }}>No reviewed reward contributions match this filter yet.</div>
              ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                  {visibleReviewedContributions.map((contribution) => (
                    <ContributionCard key={contribution.id} contribution={contribution} participant={participantById.get(contribution.participantId)} reviewKey={reviewKey} suggestion={buildSuggestedRewardReview(contribution)} />
                  ))}
                </div>
              )}
            </section>

            <PayoutExportControls reviewKey={reviewKey} activeSeason={activeSeason} exports={payoutExports} />
          </>
        )}
      </section>
    </SiteShell>
  );
}
