import fs from "node:fs";
import path from "node:path";
import type { CredBureauRewardParticipant } from "./cred-bureau-rewards-types";

const DATA_DIR = path.join(process.cwd(), "data");
const PARTICIPANTS_PATH = path.join(DATA_DIR, "cred-bureau-rewards-participants.json");

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

function makeParticipantId() {
  return `cbrp_${Date.now().toString(36)}_${Math.random().toString(16).slice(2, 8)}`;
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

function normalizeTelegram(value: unknown) {
  const cleaned = cleanString(value);
  if (!cleaned) return "";
  return cleaned.startsWith("@") ? cleaned : `@${cleaned}`;
}

export function buildRewardParticipant(payload: {
  displayName: string;
  telegram?: string | null;
  email?: string | null;
  wallet: string;
  helixaProfileUrl?: string | null;
  applicationId?: string | null;
}): CredBureauRewardParticipant {
  const displayName = cleanString(payload.displayName);
  if (!displayName) throw new Error("Display name is required");

  const wallet = validateWallet(payload.wallet);
  
  const telegram = payload.telegram ? normalizeTelegram(payload.telegram) : null;
  const email = cleanOptionalString(payload.email);
  const helixaProfileUrl = cleanOptionalString(payload.helixaProfileUrl);
  const applicationId = cleanOptionalString(payload.applicationId);

  if (!telegram && !email) {
    throw new Error("Telegram handle or email is required");
  }

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
  const participants = readJsonFile<CredBureauRewardParticipant[]>(PARTICIPANTS_PATH, []);
  participants.unshift(participant);
  writeJsonFile(PARTICIPANTS_PATH, participants);
  return participant;
}

export function getRewardParticipants() {
  return readJsonFile<CredBureauRewardParticipant[]>(PARTICIPANTS_PATH, []);
}

export function updateRewardParticipantStatus(id: string, status: "active" | "suspended") {
  const participants = getRewardParticipants();
  const index = participants.findIndex((participant) => participant.id === id);
  if (index === -1) throw new Error("Reward participant not found");

  const previous = participants[index];
  const updated: CredBureauRewardParticipant = {
    ...previous,
    updatedAt: new Date().toISOString(),
    status,
  };

  participants[index] = updated;
  writeJsonFile(PARTICIPANTS_PATH, participants);
  return updated;
}