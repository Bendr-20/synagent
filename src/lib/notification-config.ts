import type { NotificationDispatchMode } from "./match-types";

export type DispatchConfig = {
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

function env(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function getDispatchConfig(): DispatchConfig {
  const hasAgentMail = Boolean(env("SYNAGENT_AGENTMAIL_API_KEY") && env("SYNAGENT_AGENTMAIL_INBOX_ID"));
  const hasTelegram = Boolean(env("SYNAGENT_TELEGRAM_BOT_TOKEN"));
  const requestedMode = env("SYNAGENT_NOTIFICATION_MODE");
  const mode: NotificationDispatchMode = requestedMode === "queue-only"
    ? "queue-only"
    : requestedMode === "live"
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
