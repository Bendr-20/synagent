import assert from "node:assert/strict";
import test from "node:test";

const ENV_KEYS = [
  "SYNAGENT_NOTIFICATION_MODE",
  "SYNAGENT_AGENTMAIL_API_KEY",
  "SYNAGENT_AGENTMAIL_INBOX_ID",
  "SYNAGENT_TELEGRAM_BOT_TOKEN",
  "SYNAGENT_TELEGRAM_BASE_URL",
];

const originalEnv = new Map(ENV_KEYS.map((key) => [key, process.env[key]]));

test.afterEach(() => {
  for (const key of ENV_KEYS) {
    const original = originalEnv.get(key);
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
});

async function loadNotificationConfig() {
  return import(new URL("./notification-config.ts", import.meta.url).href);
}

test("notification mode stays queue-only when delivery secrets are missing", async () => {
  const { getDispatchConfig } = await loadNotificationConfig();

  process.env.SYNAGENT_NOTIFICATION_MODE = "review";
  delete process.env.SYNAGENT_AGENTMAIL_API_KEY;
  delete process.env.SYNAGENT_AGENTMAIL_INBOX_ID;
  delete process.env.SYNAGENT_TELEGRAM_BOT_TOKEN;

  const config = getDispatchConfig();

  assert.equal(config.mode, "queue-only");
  assert.equal(config.agentMail.enabled, false);
  assert.equal(config.telegram.enabled, false);
});

test("explicit queue-only mode overrides configured delivery providers", async () => {
  const { getDispatchConfig } = await loadNotificationConfig();

  process.env.SYNAGENT_NOTIFICATION_MODE = "queue-only";
  process.env.SYNAGENT_AGENTMAIL_API_KEY = "agentmail-key";
  process.env.SYNAGENT_AGENTMAIL_INBOX_ID = "agentmail-inbox";
  process.env.SYNAGENT_TELEGRAM_BOT_TOKEN = "telegram-token";

  const config = getDispatchConfig();

  assert.equal(config.mode, "queue-only");
  assert.equal(config.agentMail.enabled, true);
  assert.equal(config.telegram.enabled, true);
});
