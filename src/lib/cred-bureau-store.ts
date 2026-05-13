import fs from "node:fs";
import path from "node:path";
import type { CredBureauApplicationPayload, CredBureauApplicationRecord, CredBureauApplicationStatus, CredBureauHumanProfileRef, CredBureauReviewLogEntry } from "./cred-bureau-types";

const DATA_DIR = path.join(process.cwd(), "data");
const APPLICATIONS_PATH = path.join(DATA_DIR, "cred-bureau-applications.json");
const REVIEW_LOG_PATH = path.join(DATA_DIR, "cred-bureau-review-log.json");

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

function makeApplicationId() {
  return `cba_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`;
}

function makeReviewLogId(applicationId: string, status: CredBureauApplicationStatus) {
  return `cbl_${applicationId}_${status}_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeTelegram(value: unknown) {
  const cleaned = cleanString(value);
  if (!cleaned) return "";
  return cleaned.startsWith("@") ? cleaned : `@${cleaned}`;
}

function extractHelixaHumanProfileId(url: string | null) {
  if (!url) return null;

  try {
    const parsed = url.startsWith("/h/") ? new URL(url, "https://helixa.xyz") : new URL(url);
    const isHelixa = parsed.protocol === "https:" && parsed.hostname.toLowerCase() === "helixa.xyz";
    const [, type, encodedId, extra] = parsed.pathname.split("/");
    if (!isHelixa || type !== "h" || !encodedId || extra) return null;
    return decodeURIComponent(encodedId);
  } catch {
    return null;
  }
}

function normalizeHelixaProfileUrl(url: string | null, id: string | null) {
  const profileId = id || extractHelixaHumanProfileId(url);
  if (profileId) return `https://helixa.xyz/h/${encodeURIComponent(profileId)}`;
  return null;
}

function buildHumanProfileRef(profile: CredBureauApplicationPayload["humanProfile"]): CredBureauHumanProfileRef {
  const id = cleanOptionalString(profile?.id);
  const url = normalizeHelixaProfileUrl(cleanOptionalString(profile?.url), id);
  const wallet = cleanOptionalString(profile?.wallet);
  const handle = cleanOptionalString(profile?.handle);

  if (!url && !id && !wallet && !handle) {
    throw new Error("A Helixa human profile URL is required before Cred Bureau review.");
  }

  if (!url) {
    throw new Error("Use a Helixa human profile URL like https://helixa.xyz/h/your-profile-id.");
  }

  return { id: id || extractHelixaHumanProfileId(url), url, wallet, handle };
}

function buildApplicant(payload: CredBureauApplicationPayload) {
  const name = cleanString(payload.applicant?.name);
  const telegram = normalizeTelegram(payload.applicant?.telegram);
  const email = cleanOptionalString(payload.applicant?.email);
  const role = cleanOptionalString(payload.applicant?.role);
  const linkedinUrl = cleanOptionalUrl(payload.applicant?.linkedinUrl, "LinkedIn URL");
  const websiteUrl = cleanOptionalUrl(payload.applicant?.websiteUrl, "Website URL");

  if (!name) throw new Error("Applicant name is required for Cred Bureau review.");
  if (!telegram && !email) throw new Error("Telegram handle or email is required so approved applicants can be contacted manually.");

  return { name, telegram, email, role, linkedinUrl, websiteUrl };
}

export function buildCredBureauApplicationRecord(payload: CredBureauApplicationPayload): CredBureauApplicationRecord {
  const applicant = buildApplicant(payload);
  const humanProfile = buildHumanProfileRef(payload.humanProfile);
  const whyJoin = cleanString(payload.reviewAddendum?.whyJoin);

  if (!whyJoin) throw new Error("Tell us why you want Cred Bureau review.");

  return {
    id: makeApplicationId(),
    createdAt: new Date().toISOString(),
    status: "pending-review",
    applicant,
    humanProfile,
    reviewAddendum: {
      whyJoin,
      availability: cleanOptionalString(payload.reviewAddendum?.availability),
      disclosure: cleanOptionalString(payload.reviewAddendum?.disclosure),
    },
    review: {
      profileRequired: true,
      profileMissing: false,
      profileMustBeUpdated: true,
      manualReviewRequired: true,
      manualGroupAddRequired: true,
      autoInviteSent: false,
      reviewerNotes: null,
    },
  };
}

export function appendCredBureauApplication(record: CredBureauApplicationRecord) {
  const applications = readJsonFile<CredBureauApplicationRecord[]>(APPLICATIONS_PATH, []);
  applications.unshift(record);
  writeJsonFile(APPLICATIONS_PATH, applications);
  return record;
}

export function getCredBureauApplications() {
  return readJsonFile<CredBureauApplicationRecord[]>(APPLICATIONS_PATH, []);
}

export function getCredBureauReviewLog() {
  return readJsonFile<CredBureauReviewLogEntry[]>(REVIEW_LOG_PATH, []);
}

function appendCredBureauReviewLogEntry(
  previous: CredBureauApplicationRecord,
  updated: CredBureauApplicationRecord,
  status: CredBureauApplicationStatus,
  reviewerNotes?: string | null,
) {
  const entry: CredBureauReviewLogEntry = {
    id: makeReviewLogId(updated.id, status),
    applicationId: updated.id,
    loggedAt: new Date().toISOString(),
    previousStatus: previous.status,
    status,
    reviewerNotes: cleanOptionalString(reviewerNotes),
    applicant: { ...updated.applicant },
    humanProfile: { ...updated.humanProfile },
    reviewAddendum: { ...updated.reviewAddendum },
    applicationSnapshot: JSON.parse(JSON.stringify(updated)),
  };

  const reviewLog = getCredBureauReviewLog();
  reviewLog.unshift(entry);
  writeJsonFile(REVIEW_LOG_PATH, reviewLog);
  return entry;
}

export function updateCredBureauApplicationStatus(id: string, status: CredBureauApplicationStatus, reviewerNotes?: string | null) {
  const applications = getCredBureauApplications();
  const index = applications.findIndex((application) => application.id === id);
  if (index === -1) throw new Error("Cred Bureau application not found");

  const previous = applications[index];
  const updated: CredBureauApplicationRecord = {
    ...previous,
    status,
    review: {
      ...previous.review,
      reviewerNotes: cleanOptionalString(reviewerNotes),
    },
  };

  applications[index] = updated;
  writeJsonFile(APPLICATIONS_PATH, applications);

  const reviewLogEntry = status === "approved" || status === "rejected"
    ? appendCredBureauReviewLogEntry(previous, updated, status, reviewerNotes)
    : null;

  return { application: updated, reviewLogEntry };
}
