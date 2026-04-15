import fs from "node:fs";
import path from "node:path";
import type { MatchNotification, MatchRequestRecord } from "./match-types";

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
  return readJsonFile<MatchRequestRecord[]>(REQUESTS_PATH, []);
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
