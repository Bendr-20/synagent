import fs from "node:fs";
import path from "node:path";
import type { MatchConfidence, MatchNotification, MatchRequestRecord } from "./match-types";

const DATA_DIR = path.join(process.cwd(), "data");
const REQUESTS_PATH = path.join(DATA_DIR, "match-requests.json");
const NOTIFICATIONS_PATH = path.join(DATA_DIR, "match-notifications.json");

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
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function inferConfidence(status: unknown, _score?: unknown): MatchConfidence {
  // Legacy persisted records predate the current 80-point threshold. Preserve
  // their previous public matched state rather than downgrading old data.
  if (status === "matched") return "high";
  return "review";
}

function normalizeMatchRequestRecord(record: MatchRequestRecord): MatchRequestRecord {
  const rawRecord = record as MatchRequestRecord & Record<string, any>;
  const matchedAgents = Array.isArray(rawRecord.matchedAgents) ? rawRecord.matchedAgents : [];
  const firstMatch = matchedAgents[0];
  const confidence = rawRecord.review?.confidence || inferConfidence(rawRecord.status, firstMatch?.score ?? rawRecord.review?.strongestScore);
  const publicDecision = rawRecord.review?.publicDecision || (confidence === "high" ? "recommended-match" : "manual-review");

  return {
    ...rawRecord,
    review: {
      needsManualReview: Boolean(rawRecord.review?.needsManualReview ?? rawRecord.status !== "matched"),
      confidence,
      publicDecision,
      recommendedMatchSlug: rawRecord.review?.recommendedMatchSlug ?? (publicDecision === "recommended-match" ? firstMatch?.slug ?? null : null),
      fallbackReason: rawRecord.review?.fallbackReason ?? null,
      strongestScore: rawRecord.review?.strongestScore ?? (typeof firstMatch?.score === "number" ? firstMatch.score : null),
      recommendationThreshold: rawRecord.review?.recommendationThreshold ?? 80,
    },
    matchedAgents: matchedAgents.map((match: Record<string, any>) => ({
      ...match,
      confidence: match.confidence || inferConfidence(rawRecord.status, match.score),
    })) as MatchRequestRecord["matchedAgents"],
    notifications: Array.isArray(rawRecord.notifications) ? rawRecord.notifications : [],
    matchEvaluation: rawRecord.matchEvaluation || { rankedCandidates: [] },
  };
}

export function appendMatchRequest(record: MatchRequestRecord) {
  const requests = readJsonFile<MatchRequestRecord[]>(REQUESTS_PATH, []);
  requests.unshift(record);
  writeJsonFile(REQUESTS_PATH, requests);
  return record;
}

export function appendNotifications(notifications: MatchNotification[]) {
  if (!notifications.length) return notifications;
  const existing = readJsonFile<MatchNotification[]>(NOTIFICATIONS_PATH, []);
  existing.unshift(...notifications);
  writeJsonFile(NOTIFICATIONS_PATH, existing);
  return notifications;
}

export function getMatchRequests() {
  return readJsonFile<MatchRequestRecord[]>(REQUESTS_PATH, []).map(normalizeMatchRequestRecord);
}

export function getNotifications() {
  return readJsonFile<MatchNotification[]>(NOTIFICATIONS_PATH, []);
}

export function updateNotifications(
  updater: (notifications: MatchNotification[]) => MatchNotification[],
) {
  const current = getNotifications();
  const next = updater(current);
  writeJsonFile(NOTIFICATIONS_PATH, next);
  return next;
}
