import fs from "node:fs";
import path from "node:path";
import type { CredBureauApplicationPayload, CredBureauApplicationRecord, CredBureauApplicationStatus, CredBureauHumanProfileRef } from "./cred-bureau-types";

const DATA_DIR = path.join(process.cwd(), "data");
const APPLICATIONS_PATH = path.join(DATA_DIR, "cred-bureau-applications.json");

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

function makeApplicationId() {
  return `cba_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeTelegram(value: unknown) {
  const cleaned = cleanString(value);
  if (!cleaned) return "";
  return cleaned.startsWith("@") ? cleaned : `@${cleaned}`;
}

function normalizeHelixaProfileUrl(url: string | null, id: string | null) {
  if (url?.startsWith("/h/")) return `https://helixa.xyz${url}`;
  if (url) return url;
  if (id) return `https://helixa.xyz/h/${encodeURIComponent(id)}`;
  return null;
}

function buildHumanProfileRef(profile: CredBureauApplicationPayload["humanProfile"]): CredBureauHumanProfileRef {
  const id = cleanOptionalString(profile?.id);
  const url = normalizeHelixaProfileUrl(cleanOptionalString(profile?.url), id);
  const wallet = cleanOptionalString(profile?.wallet);
  const handle = cleanOptionalString(profile?.handle);

  if (url && !/^https:\/\/helixa\.xyz\/h\/[A-Za-z0-9._:-]+\/?$/i.test(url)) {
    throw new Error("Use a Helixa human profile URL like https://helixa.xyz/h/your-profile-id.");
  }

  return { id, url, wallet, handle };
}

function buildApplicant(payload: CredBureauApplicationPayload) {
  const name = cleanString(payload.applicant?.name);
  const telegram = normalizeTelegram(payload.applicant?.telegram);
  const email = cleanOptionalString(payload.applicant?.email);
  const role = cleanOptionalString(payload.applicant?.role);

  if (!name) throw new Error("Applicant name is required for Cred Bureau review.");
  if (!telegram && !email) throw new Error("Telegram handle or email is required so approved applicants can be contacted manually.");

  return { name, telegram, email, role };
}

export function buildCredBureauApplicationRecord(payload: CredBureauApplicationPayload): CredBureauApplicationRecord {
  const applicant = buildApplicant(payload);
  const humanProfile = buildHumanProfileRef(payload.humanProfile);
  const whyJoin = cleanString(payload.reviewAddendum?.whyJoin);
  const profileMissing = !humanProfile.url && !humanProfile.id && !humanProfile.wallet && !humanProfile.handle;

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
      profileRequired: !profileMissing,
      profileMissing,
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

export function updateCredBureauApplicationStatus(id: string, status: CredBureauApplicationStatus, reviewerNotes?: string | null) {
  const applications = getCredBureauApplications();
  const index = applications.findIndex((application) => application.id === id);
  if (index === -1) throw new Error("Cred Bureau application not found");

  const updated: CredBureauApplicationRecord = {
    ...applications[index],
    status,
    review: {
      ...applications[index].review,
      reviewerNotes: cleanOptionalString(reviewerNotes),
    },
  };

  applications[index] = updated;
  writeJsonFile(APPLICATIONS_PATH, applications);
  return updated;
}
