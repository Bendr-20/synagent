import fs from "node:fs";
import path from "node:path";
import { writeJsonFileWithBackup } from "./json-file-backups.js";
import type {
  CredBureauRewardContribution,
  CredBureauRewardContributionStatus,
  CredBureauRewardParticipant,
  CredBureauRewardReviewLogEntry,
  CredBureauRewardSeasonId,
  CredBureauPayoutExportRecord,
  CredBureauPayoutExportRow,
} from "./cred-bureau-rewards-types";

function getDataDir() {
  return process.env.SYNAGENT_DATA_DIR || path.join(process.cwd(), "data");
}

function getContributionsPath() {
  return path.join(getDataDir(), "cred-bureau-rewards-contributions.json");
}

function getParticipantsPath() {
  return path.join(getDataDir(), "cred-bureau-rewards-participants.json");
}

function getReviewLogPath() {
  return path.join(getDataDir(), "cred-bureau-rewards-review-log.json");
}

function ensureDataDir() {
  fs.mkdirSync(getDataDir(), { recursive: true });
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
  writeJsonFileWithBackup(filePath, value);
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
  return trimmed;
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
  return emojiOnly || singleWord;
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

type SuggestedRewardReview = {
  suggestedPoints: number | null;
  suggestedReason: string;
  reviewFlags: string[];
  approveSuggestedAvailable: boolean;
};

const CATEGORY_POINT_RANGES: Record<string, { min: number; max: number; label: string }> = {
  "matched-task": { min: 25, max: 100, label: "Matched-task rewards" },
  "task-creation": { min: 10, max: 40, label: "High-quality task creation" },
  "bug-friction-log": { min: 10, max: 60, label: "Bug reports and friction logs" },
  "product-feedback": { min: 10, max: 50, label: "Product-changing feedback" },
  referral: { min: 10, max: 30, label: "Active referrals" },
  wildcard: { min: 1, max: 250, label: "Wildcard grants" },
};

function clampPointValue(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function hasAnySignal(text: string, signals: string[]) {
  return signals.some((signal) => text.includes(signal));
}

export function buildSuggestedRewardReview(contribution: CredBureauRewardContribution): SuggestedRewardReview {
  const reviewFlags: string[] = [];
  const text = `${contribution.title} ${contribution.description}`.toLowerCase();

  if (contribution.socialEvidence && isLowEffortSocial(contribution.description)) {
    return {
      suggestedPoints: 0,
      suggestedReason: "Low-effort social evidence is excluded by the anti-farm rubric.",
      reviewFlags: ["Low-effort social evidence"],
      approveSuggestedAvailable: true,
    };
  }

  if (contribution.categoryId === "wildcard" && !contribution.requestedPoints) {
    return {
      suggestedPoints: null,
      suggestedReason: "Wildcard grants without requested points need manual reviewer judgment.",
      reviewFlags: ["Wildcard requires manual review"],
      approveSuggestedAvailable: false,
    };
  }

  const range = CATEGORY_POINT_RANGES[contribution.categoryId] || { min: 1, max: 250, label: contribution.categoryId };

  if (contribution.categoryId === "wildcard" && contribution.requestedPoints) {
    const suggestedPoints = clampPointValue(contribution.requestedPoints, 1, 250);
    return {
      suggestedPoints,
      suggestedReason: `Wildcard grant requested ${contribution.requestedPoints}; clamped to ${suggestedPoints} for reviewer confirmation.`,
      reviewFlags,
      approveSuggestedAvailable: true,
    };
  }

  if (contribution.requestedPoints) {
    const suggestedPoints = clampPointValue(contribution.requestedPoints, range.min, range.max);
    return {
      suggestedPoints,
      suggestedReason: `${range.label}: contributor requested ${contribution.requestedPoints}; suggested ${suggestedPoints} within the ${range.min}-${range.max} rubric range.`,
      reviewFlags,
      approveSuggestedAvailable: true,
    };
  }

  let suggestedPoints = range.min;
  const span = range.max - range.min;
  const words = contribution.description.trim().split(/\s+/).filter(Boolean).length;
  if (contribution.evidenceUrl) suggestedPoints += span * 0.25;
  if (words >= 20) suggestedPoints += span * 0.2;
  if (words >= 60) suggestedPoints += span * 0.15;

  if (contribution.categoryId === "bug-friction-log" && hasAnySignal(text, ["critical", "blocking", "security"])) {
    suggestedPoints = range.max;
  } else if (contribution.categoryId === "bug-friction-log" && hasAnySignal(text, ["repro", "reproduction", "workaround", "fix"])) {
    suggestedPoints += span * 0.35;
  }

  if (contribution.categoryId === "matched-task" && hasAnySignal(text, ["complex", "high-impact", "exceptional", "rated"])) {
    suggestedPoints += span * 0.35;
  }

  if (contribution.categoryId === "task-creation" && hasAnySignal(text, ["framework", "deliverables", "success criteria", "comprehensive"])) {
    suggestedPoints += span * 0.35;
  }

  if (contribution.categoryId === "product-feedback" && hasAnySignal(text, ["implementation", "roadmap", "workflow", "design", "mockup"])) {
    suggestedPoints += span * 0.35;
  }

  if (contribution.categoryId === "referral" && hasAnySignal(text, ["active", "contributed", "multiple", "top contributor"])) {
    suggestedPoints += span * 0.35;
  }

  const finalPoints = clampPointValue(suggestedPoints, range.min, range.max);
  return {
    suggestedPoints: finalPoints,
    suggestedReason: `${range.label}: suggested ${finalPoints} points from rubric range ${range.min}-${range.max} based on evidence, detail, and category signals.`,
    reviewFlags,
    approveSuggestedAvailable: true,
  };
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
    assignedPoints: 0,
    status: "submitted",
    payoutEligible: false,
  };
}

export function appendRewardContribution(contribution: CredBureauRewardContribution): CredBureauRewardContribution {
  const contributions = readJsonFile<CredBureauRewardContribution[]>(getContributionsPath(), []);
  contributions.unshift(contribution);
  writeJsonFile(getContributionsPath(), contributions);
  return contribution;
}

export function getRewardContributions() {
  return readJsonFile<CredBureauRewardContribution[]>(getContributionsPath(), []);
}

export function getRewardParticipants() {
  return readJsonFile<CredBureauRewardParticipant[]>(getParticipantsPath(), []);
}

function makeParticipantId() {
  return `cbrp_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`;
}

export function buildRewardParticipant(payload: {
  displayName: string;
  wallet: string;
  telegram?: string | null;
  email?: string | null;
  helixaProfileUrl?: string | null;
  applicationId?: string | null;
}): CredBureauRewardParticipant {
  const displayName = cleanString(payload.displayName);
  if (!displayName) throw new Error("Display name is required");

  const wallet = validateWallet(payload.wallet);
  const telegram = cleanOptionalString(payload.telegram);
  const email = cleanOptionalString(payload.email);
  const helixaProfileUrl = cleanOptionalUrl(payload.helixaProfileUrl, "Helixa profile URL");
  const applicationId = cleanOptionalString(payload.applicationId);

  return {
    id: makeParticipantId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    displayName,
    telegram,
    email,
    wallet,
    helixaProfileUrl,
    applicationId,
    status: "active",
  };
}

export function appendRewardParticipant(participant: CredBureauRewardParticipant): CredBureauRewardParticipant {
  const participants = getRewardParticipants();
  participants.unshift(participant);
  writeJsonFile(getParticipantsPath(), participants);
  return participant;
}

export function updateRewardParticipant(
  id: string,
  updates: {
    displayName?: string;
    telegram?: string | null;
    email?: string | null;
    helixaProfileUrl?: string | null;
    applicationId?: string | null;
    status?: "active" | "suspended";
  }
): CredBureauRewardParticipant {
  const participants = getRewardParticipants();
  const index = participants.findIndex(p => p.id === id);
  if (index === -1) throw new Error("Participant not found");

  const existing = participants[index];
  const updated: CredBureauRewardParticipant = {
    ...existing,
    updatedAt: new Date().toISOString(),
    displayName: updates.displayName ? cleanString(updates.displayName) : existing.displayName,
    telegram: updates.telegram !== undefined ? cleanOptionalString(updates.telegram) : existing.telegram,
    email: updates.email !== undefined ? cleanOptionalString(updates.email) : existing.email,
    helixaProfileUrl: updates.helixaProfileUrl !== undefined ? cleanOptionalUrl(updates.helixaProfileUrl, "Helixa profile URL") : existing.helixaProfileUrl,
    applicationId: updates.applicationId !== undefined ? cleanOptionalString(updates.applicationId) : existing.applicationId,
    status: updates.status || existing.status,
  };

  participants[index] = updated;
  writeJsonFile(getParticipantsPath(), participants);
  return updated;
}

export function getRewardReviewLog() {
  return readJsonFile<CredBureauRewardReviewLogEntry[]>(getReviewLogPath(), []);
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
  writeJsonFile(getReviewLogPath(), reviewLog);
  return entry;
}

export function updateRewardContributionReview(
  id: string,
  status: "approved" | "rejected" | "needs-info",
  reviewedBy: string,
  reviewerNotes?: string | null,
  antiFarmNotes?: string | null,
  assignedPoints?: number,
  useSuggestedPoints = false,
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
  let finalAssignedPoints = status === "approved"
    ? assignedPoints !== undefined ? assignedPoints : previous.assignedPoints
    : 0;

  if (status === "approved" && useSuggestedPoints) {
    const suggestion = buildSuggestedRewardReview(previous);
    if (suggestion.suggestedPoints === null) {
      throw new Error("Suggested points unavailable; manual review required");
    }
    finalAssignedPoints = suggestion.suggestedPoints;
  }
  let finalPayoutEligible = status === "approved" && finalAssignedPoints > 0;
  let finalReviewerNotes = cleanOptionalString(reviewerNotes);

  if (status === "approved" && previous.socialEvidence && isLowEffortSocial(previous.description)) {
    finalAssignedPoints = 0;
    finalPayoutEligible = false;
    finalReviewerNotes = finalReviewerNotes
      ? `${finalReviewerNotes} [Low-effort social evidence excluded]`
      : "Low-effort social evidence excluded";
  }

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
  writeJsonFile(getContributionsPath(), contributions);

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