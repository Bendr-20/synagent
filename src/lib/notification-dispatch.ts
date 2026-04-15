import { synagents } from "@/app/synagents/data";
import { getNotifications, getMatchRequests, updateNotifications } from "@/lib/match-store";
import type { MatchNotification, NotificationDispatchMode } from "@/lib/match-types";

type DispatchConfig = {
  mode: NotificationDispatchMode;
  reviewApiKey: string | null;
  agentMail: {
    enabled: boolean;
    apiKey: string | null;
    inboxId: string | null;
    baseUrl: string;
  };
  telegram: {
    enabled: boolean;
    botToken: string | null;
    baseUrl: string;
  };
};

type DispatchActor = {
  type: "system" | "reviewer";
  label: string;
};

type DispatchResult = {
  notificationId: string;
  channel: MatchNotification["channel"];
  status: MatchNotification["status"];
  target: string;
  providerMessageId?: string | null;
  error?: string | null;
};

function env(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getDispatchConfig(): DispatchConfig {
  const hasAgentMail = Boolean(env("SYNAGENT_AGENTMAIL_API_KEY") && env("SYNAGENT_AGENTMAIL_INBOX_ID"));
  const hasTelegram = Boolean(env("SYNAGENT_TELEGRAM_BOT_TOKEN"));
  const requestedMode = env("SYNAGENT_NOTIFICATION_MODE");
  const mode: NotificationDispatchMode = requestedMode === "live"
    ? "live"
    : hasAgentMail || hasTelegram
      ? "review"
      : "queue-only";

  return {
    mode,
    reviewApiKey: env("SYNAGENT_REVIEW_API_KEY"),
    agentMail: {
      enabled: hasAgentMail,
      apiKey: env("SYNAGENT_AGENTMAIL_API_KEY"),
      inboxId: env("SYNAGENT_AGENTMAIL_INBOX_ID"),
      baseUrl: env("SYNAGENT_AGENTMAIL_BASE_URL") || "https://api.agentmail.to",
    },
    telegram: {
      enabled: hasTelegram,
      botToken: env("SYNAGENT_TELEGRAM_BOT_TOKEN"),
      baseUrl: env("SYNAGENT_TELEGRAM_BASE_URL") || "https://api.telegram.org",
    },
  };
}

function buildEmailHtml(notification: MatchNotification) {
  return [
    `<p>${escapeHtml(notification.message)}</p>`,
    `<p style=\"color:#7c8b96;font-size:12px;\">Request ID: ${escapeHtml(notification.requestId)}</p>`,
  ].join("");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmail(notification: MatchNotification, config: DispatchConfig) {
  if (!config.agentMail.enabled || !config.agentMail.apiKey || !config.agentMail.inboxId) {
    throw new Error("AgentMail is not configured");
  }

  const response = await fetch(`${config.agentMail.baseUrl}/v0/inboxes/${encodeURIComponent(config.agentMail.inboxId)}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.agentMail.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: [notification.target],
      subject: notification.subject || `New Synagent request for ${notification.agentSlug}`,
      text: notification.message,
      html: notification.html || buildEmailHtml(notification),
    }),
  });

  const text = await response.text();
  let payload: Record<string, unknown> | null = null;
  try {
    payload = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error?.toString() || payload?.message?.toString() || text || `AgentMail returned ${response.status}`);
  }

  return {
    providerMessageId:
      payload?.message_id?.toString() ||
      payload?.messageId?.toString() ||
      payload?.id?.toString() ||
      null,
  };
}

async function sendTelegram(notification: MatchNotification, config: DispatchConfig) {
  if (!config.telegram.enabled || !config.telegram.botToken) {
    throw new Error("Telegram bot delivery is not configured");
  }
  if (!/^-?\d+$/.test(notification.target)) {
    throw new Error("Telegram delivery requires a numeric chat ID, not a handle");
  }

  const response = await fetch(`${config.telegram.baseUrl}/bot${config.telegram.botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: notification.target,
      text: notification.message,
      disable_web_page_preview: true,
    }),
  });

  const text = await response.text();
  let payload: Record<string, unknown> | null = null;
  try {
    payload = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.description?.toString() || text || `Telegram returned ${response.status}`);
  }

  const result = payload?.result as { message_id?: number } | undefined;
  return {
    providerMessageId: result?.message_id?.toString() || null,
  };
}

async function dispatchNotification(notification: MatchNotification, config: DispatchConfig) {
  if (notification.channel === "email") {
    return sendEmail(notification, config);
  }
  return sendTelegram(notification, config);
}

export function assertDispatchAuthorized(authHeader: string | null, config = getDispatchConfig()) {
  if (!config.reviewApiKey) {
    throw new Error("SYNAGENT_REVIEW_API_KEY is not configured");
  }
  const expected = `Bearer ${config.reviewApiKey}`;
  if (authHeader !== expected) {
    throw new Error("Unauthorized dispatch request");
  }
}

export async function dispatchQueuedNotifications(options: {
  requestId: string;
  actor: DispatchActor;
  notificationIds?: string[];
}) {
  const config = getDispatchConfig();
  if (config.mode === "queue-only") {
    throw new Error("Dispatch providers are not configured");
  }

  const request = getMatchRequests().find((entry) => entry.id === options.requestId);
  if (!request) {
    throw new Error("Match request not found");
  }

  const allNotifications = getNotifications();
  const targetIds = new Set(options.notificationIds?.length ? options.notificationIds : request.notifications.map((notification) => notification.id));
  const queued = allNotifications.filter((notification) => notification.requestId === options.requestId && targetIds.has(notification.id) && notification.status === "queued");

  const updates = new Map<string, MatchNotification>();
  const results: DispatchResult[] = [];
  const attemptedAt = new Date().toISOString();

  for (const notification of queued) {
    const nextAttempt = notification.attempts + 1;
    try {
      const delivered = await dispatchNotification(notification, config);
      const updated: MatchNotification = {
        ...notification,
        status: "sent",
        attempts: nextAttempt,
        lastAttemptAt: attemptedAt,
        dispatchedAt: attemptedAt,
        providerMessageId: delivered.providerMessageId,
        lastError: null,
      };
      updates.set(notification.id, updated);
      results.push({
        notificationId: notification.id,
        channel: notification.channel,
        target: notification.target,
        status: updated.status,
        providerMessageId: updated.providerMessageId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Dispatch failed";
      const shouldSkip =
        (notification.channel === "telegram" && message.includes("numeric chat ID")) ||
        (notification.channel === "telegram" && message.includes("not configured")) ||
        (notification.channel === "email" && message.includes("not configured"));
      const updated: MatchNotification = {
        ...notification,
        status: shouldSkip ? "skipped" : "failed",
        attempts: nextAttempt,
        lastAttemptAt: attemptedAt,
        providerMessageId: null,
        lastError: `${options.actor.label}: ${message}`,
      };
      updates.set(notification.id, updated);
      results.push({
        notificationId: notification.id,
        channel: notification.channel,
        target: notification.target,
        status: updated.status,
        error: updated.lastError,
      });
    }
  }

  const notifications = updateNotifications((current) =>
    current.map((notification) => updates.get(notification.id) || notification),
  );

  return {
    requestId: request.id,
    dispatchMode: config.mode,
    actor: options.actor,
    attemptedAt,
    attempted: queued.length,
    sent: results.filter((result) => result.status === "sent").length,
    failed: results.filter((result) => result.status === "failed").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    results,
    notifications: notifications.filter((notification) => notification.requestId === request.id),
  };
}

export function getNotificationSummary() {
  const config = getDispatchConfig();
  const notifications = getNotifications();
  return {
    mode: config.mode,
    queued: notifications.filter((notification) => notification.status === "queued").length,
    sent: notifications.filter((notification) => notification.status === "sent").length,
    failed: notifications.filter((notification) => notification.status === "failed").length,
    skipped: notifications.filter((notification) => notification.status === "skipped").length,
    providers: {
      email: config.agentMail.enabled,
      telegram: config.telegram.enabled,
    },
  };
}

export function getAgentDeliveryTarget(agentSlug: string, channel: MatchNotification["channel"]) {
  const agent = synagents.find((entry) => entry.slug === agentSlug);
  if (!agent) return null;
  if (channel === "email") return agent.contacts.email || null;
  return agent.contacts.telegramChatId || agent.contacts.telegram || null;
}
