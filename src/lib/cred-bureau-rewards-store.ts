import fs from "node:fs";
import path from "node:path";
import type {
  CredBureauRewardContribution,
  CredBureauRewardContributionStatus,
  CredBureauRewardParticipant,
  CredBureauRewardReviewLogEntry,
  CredBureauRewardSeasonId,
  CredBureauPayoutExportRecord,
  CredBureauPayoutExportRow,
} from "./cred-bureau-rewards-types";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTRIBUTIONS_PATH = path.join(DATA_DIR, "cred-bureau-rewards-contributions.json");
const PARTICIPANTS_PATH = path.join(DATA_DIR, "cred-bureau-rewards-participants.json");
const REVIEW_LOG_PATH = path.join(DATA_DIR, "cred-bureau-rewards-review-log.json");

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, value: T) {
  ensureDataDir();
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function makeContributionId() {
  return `cbrc_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`;
}

function makeReviewLogId(contributionId: string, status: CredBureauRewardContributionStatus) {
  return `cbrl_${contributionId}_${status}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`;
}

function validateWallet(wallet: string): string {
  const trimmed = wallet.trim();
  const regex = /^0x[0-9a-f]{40}$/i;
  if (!regex.test(trimmed)) {
    throw new Error("Wallet must be an EVM address: 0x followed by 40 hex characters");
  }
  return trimmed.toLowerCase();
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned || null;
}

function cleanOptionalUrl(value: unknown, label: string) {
  const cleaned = cleanOptionalString(value);
  if (!cleaned) return null;
  if (!/^https?:\/\//i.test(cleaned)) {
    throw new Error(`${label} must start with http:// or https://.`);
  }
  return cleaned;
}

function isLowEffortSocial(description: string): boolean {
  const trimmed = description.trim();
  // Single emoji or emoji-only
  const emojiOnly = /^[\p{Emoji}\s]+$/u.test(trimmed) && trimmed.trim().split(/\s+/).length === 1;
  // Common low-effort CT phrases
  const lowEffortWords = ["gm", "gn", "based", "wagmi", "ngmi", "lfg", "gm!", "gn!", "gm.", "gn."];
  const singleWord = trimmed.split(/\s+/).length === 1 && lowEffortWords.includes(trimmed.toLowerCase());
  return emojiOnly || singleTeam;
}

function getUtcDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function countSocialContributionsForDay(
  contributions: CredBureauRewardContribution[],
  participantId: string,
  utcDate: string,
): number {
  return contributions.filter((c) => {
    if (c.participantId !== participantId) return false;
    if (!c.socialEvidence) return false;
    if (!c.payoutEligible) return false;
    if (c.status !== "approved") return false;
    const contributionDate = getUtcDateString(new Date(c.createdAt));
    return contributionDate === utcDate;
  }).length;
}

export function buildRewardContribution(payload: {
  participantId: string;
  seasonId: CredBureauRewardSeasonId;
  categoryId: string;
  title: string;
  description: string;
  evidenceUrl?: string | null;
  socialEvidence?: boolean;
  requestedPoints?: number | null;
}): CredBureauRewardContribution {
  const participantId = cleanString(payload.participantId);
  if (!participantId) throw new Error("Participant ID is required");

  const seasonId = payload.seasonId;
  if (!["season-1", "season-2"].includes(seasonId)) {
    throw new Error("Season ID must be 'season-1' or 'season-2'");
  }

  const categoryId = cleanString(payload.categoryId) as any;
  const validCategories = ["matched-task", "task-creation", "bug-friction-log", "product-feedback", "referral", "wildcard"];
  if (!validCategories.includes(categoryId)) {
    throw new Error(`Category must be one of: ${validCategories.join(", ")}`);
  }

  const title = cleanString(payload.title);
  if (!title) throw new Error("Title is required");

  const description = cleanString(payload.description);
  if (!description) throw new Error("Description is required");

  const evidenceUrl = cleanOptionalUrl(payload.evidenceUrl, "Evidence URL");
  const socialEvidence = payload.socialEvidence === true;
  const requestedPoints = typeof payload.requestedPoints === "number" && payload.requestedPoints > 0 ? payload.requestedPoints : null;

  // Check for low-effort social if socialEvidence is true
  let assignedPoints = 0;
  let payoutEligible = true;
  
  if (socialEvidence && isLowEffortSocial(description)) {
    assignedPoints = 0;
    payoutEligible = false;
  }

  return {
    id: makeContributionId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    participantId,
    seasonId,
    categoryId,
    title,
    description,
    evidenceUrl,
    socialEvidence,
    requestedPoints,
    assignedPoints,
    status: "submitted",
    payoutEligible,
  };
}

export function appendRewardContribution(contribution: CredBureauRewardContribution): CredBureauRewardContribution {
  const contributions = readJsonFile<CredBureauRewardContribution[]>(CONTRIBUTIONS_PATH, []);
  contributions.unshift(contribution);
  writeJsonFile(CONTRIBUTIONS_PATH, contributions);
  return contribution;
}

export function getRewardContributions() {
  return readJsonFile<CredBureauRewardContribution[]>(CONTRIBUTIONS_PATH, []);
}

export function getRewardParticipants() {
  return readJsonFile<CredBureauRewardParticipant[]>(PARTICIPANTS_PATH, []);
}

export function getRewardReviewLog() {
  return readJsonFile<CredBureauRewardReviewLogEntry[]>(REVIEW_LOG_PATH, []);
}

function appendRewardReviewLogEntry(
  previous: CredBureauRewardContribution,
  updated: CredBureauRewardContribution,
  status: CredBureauRewardContributionStatus,
  reviewedBy: string,
  reviewerNotes?: string | null,
  antiFarmNotes?: string | null,
) {
  const entry: CredBureauRewardReviewLogEntry = {
    id: makeReviewLogId(updated.id, status),
    contributionId: updated.id,
    participantId: updated.participantId,
    loggedAt: new Date().toISOString(),
    previousStatus: previous.status,
    status,
    assignedPoints: updated.assignedPoints,
    payoutEligible: updated.payoutEligible,
    reviewedBy,
    reviewerNotes: cleanOptionalString(reviewerNotes),
    antiFarmNotes: cleanOptionalString(antiFarmNotes),
  };

  const reviewLog = getRewardReviewLog();
  reviewLog.unshift(entry);
  writeJsonFile(REVIEW_LOG_PATH, reviewLog);
  return entry;
}

export function updateRewardContributionReview(
  id: string,
  status: "approved" | "rejected" | "needs-info",
  reviewedBy: string,
  reviewerNotes?: string | null,
  antiFarmNotes?: string | null,
  assignedPoints?: number,
): { contribution: CredBureauRewardContribution; reviewLogEntry: CredBureauRewardReviewLogEntry } {
  // This function should be called from an API endpoint that validates SYNAGENT_REVIEW token
  // The reviewedBy parameter should come from validated reviewer identity
  
  const contributions = getRewardContributions();
  const index = contributions.findIndex((contribution) => contribution.id === id);
  if (index === -1) throw new Error("Reward contribution not found");

  const previous = contributions[index];
  
  // Only allow transitions from submitted, needs-info
  if (!["submitted", "needs-info"].includes(previous.status)) {
    throw new Error(`Cannot transition from ${previous.status} to ${status}`);
  }

  // Apply daily social cap if approving a social contribution
  let finalAssignedPoints = assignedPoints !== undefined ? assignedPoints : previous.assignedPoints;
  let finalPayoutEligible = previous.payoutEligible;
  let finalReviewerNotes = cleanOptionalString(reviewerNotes);

  if (status === "approved" && previous.socialEvidence) {
    const utcDate = getUtcDateString(new Date(previous.createdAt));
    const existingCount = countSocialContributionsForDay(contributions, previous.participantId, utcDate);

    if (existingCount >= 2) {
      finalAssignedPoints = 0;
      finalPayoutEligible = false;
      finalReviewerNotes = finalReviewerNotes
        ? `${finalReviewerNotes} [Daily social cap reached]`
        : "Daily social cap reached";
    }
  }

  const updated: CredBureauRewardContribution = {
    ...previous,
    updatedAt: new Date().toISOString(),
    status,
    assignedPoints: finalAssignedPoints,
    payoutEligible: finalPayoutEligible,
    reviewerNotes: finalReviewerNotes,
    antiFarmNotes: cleanOptionalString(antiFarmNotes),
    reviewedAt: new Date().toISOString(),
    reviewedBy,
    approvedAt: status === "approved" ? new Date().toISOString() : previous.approvedAt,
    rejectedAt: status === "rejected" ? new Date().toISOString() : previous.rejectedAt,
    needsInfoAt: status === "needs-info" ? new Date().toISOString() : previous.needsInfoAt,
  };

  contributions[index] = updated;
  writeJsonFile(CONTRIBUTIONS_PATH, contributions);

  const reviewLogEntry = appendRewardReviewLogEntry(
    previous,
    updated,
    status,
    reviewedBy,
    reviewerNotes,
    antiFarmNotes,
  );

  return { contribution: updated, reviewLogEntry };
}

export function calculateSeasonPayoutRows(
  seasonId: CredBureauRewardSeasonId,
  seasonTokenPool: string,
  antiFarmReviewNotes: string,
  createdBy: string,
  participants: CredBureauRewardParticipant[],
): CredBureauPayoutExportRecord {
  const contributions = getRewardContributions();
  
  // Filter contributions for this season that are approved and payout eligible
  const seasonContributions = contributions.filter(
    (c) => c.seasonId === seasonId && c.status === "approved" && c.payoutEligible,
  );
  
  // Group contributions by participant
  const participantScores = new Map<string, { totalPoints: number; socialPoints: number }>();
  
  for (const contribution of seasonContributions) {
    if (!participantScores.has(contribution.participantId)) {
      participantScores.set(contribution.participantId, { totalPoints: 0, socialPoints: 0 });
    }
    
    const scores = participantScores.get(contribution.participantId)!;
    scores.totalPoints += contribution.assignedPoints;
    
    if (contribution.socialEvidence) {
      scores.socialPoints += contribution.assignedPoints;
    }
  }
  
  // Apply social evidence cap (15% of total points)
  const cappedScores = new Map<string, number>();
  let totalPoints = 0;
  
  for (const [participantId, scores] of participantScores) {
    const maxSocialPoints = scores.totalPoints * 0.15;
    const excessSocialPoints = Math.max(0, scores.socialPoints - maxSocialPoints);
    const cappedTotal = scores.totalPoints - excessSocialPoints;
    
    cappedScores.set(participantId, cappedTotal);
    totalPoints += cappedTotal;
  }
  
  // Create payout rows
  const rows: CredBureauPayoutExportRow[] = [];
  
  for (const [participantId, points] of cappedScores) {
    const participant = participants.find((p) => p.id === participantId);
    if (!participant) continue;
    
    // Calculate amount (simplified - would need actual token math)
    const amount = (points / Math.max(totalPoints, 1)).toString();
    
    rows.push({
      participantId,
      displayName: participant.displayName,
      wallet: participant.wallet,
      seasonId,
      points,
      amount,
      amountUnits: seasonTokenPool, // Simplified
      reason: `Season ${seasonId} rewards`,
    });
  }
  
  // Create the export record
  const exportRecord: CredBureauPayoutExportRecord = {
    id: `payout_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    seasonId,
    seasonTokenPool,
    totalPoints,
    rowCount: rows.length,
    createdBy,
    antiFarmReviewComplete: true,
    antiFarmReviewNotes,
    rows,
  };
  
  return exportRecord;
}