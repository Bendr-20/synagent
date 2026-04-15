import { synagents } from "@/app/synagents/data";
import type { MatchNotification, MatchRequestPayload, MatchRequestRecord, MatchResult } from "./match-types";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clampText(value: unknown, max = 512) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function clampEnum(value: unknown, allowed: string[], fallback: string) {
  const next = typeof value === "string" ? value.trim() : "";
  return allowed.includes(next) ? next : fallback;
}

function clampPriority(value: unknown) {
  const next = Number(value);
  if (!Number.isFinite(next)) return 5;
  return Math.min(10, Math.max(1, Math.round(next)));
}

export function normalizeMatchPayload(input: unknown): MatchRequestPayload {
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const contact = body.contact && typeof body.contact === "object" ? (body.contact as Record<string, unknown>) : {};
  const priorities = body.priorities && typeof body.priorities === "object" ? (body.priorities as Record<string, unknown>) : {};

  const normalized: MatchRequestPayload = {
    selectedAgent: clampText(body.selectedAgent, 128) || null,
    title: clampText(body.title, 160) || null,
    category: clampEnum(body.category, ["mvp-build", "operator-support", "ai-consulting", "automation", "design", "growth", "research", "other"], "other"),
    budgetRange: clampEnum(body.budgetRange, ["under-1k", "1k-3k", "3k-10k", "10k-25k", "25k-plus", "unknown"], "unknown"),
    urgency: clampEnum(body.urgency, ["asap", "this-week", "this-month", "flexible"], "flexible"),
    deliveryType: clampEnum(body.deliveryType, ["human-only", "agent-only", "hybrid", "unsure"], "unsure"),
    communicationPreference: clampEnum(body.communicationPreference, ["email", "telegram", "either", "scheduled-call"], "either"),
    timezone: clampText(body.timezone, 64) || null,
    confidentiality: clampEnum(body.confidentiality, ["public", "private", "nda-required"], "private"),
    paymentPreference: clampEnum(body.paymentPreference, ["usd", "usdc", "cred", "open"], "open"),
    desiredOutcome: clampText(body.desiredOutcome, 512) || null,
    brief: clampText(body.brief ?? body.needs, 3000) || null,
    contact: {
      email: typeof contact.email === "string" && emailRegex.test(contact.email.trim()) ? contact.email.trim().toLowerCase() : null,
      telegram: clampText(contact.telegram, 64) || null,
    },
    priorities: {
      cost: clampPriority(priorities.cost),
      time: clampPriority(priorities.time),
      quality: clampPriority(priorities.quality),
      credibility: clampPriority(priorities.credibility),
    },
  };

  if (!normalized.contact.email && !normalized.contact.telegram) {
    throw new Error("At least one contact method is required, email or Telegram");
  }
  if (!normalized.title && !normalized.brief) {
    throw new Error("A title or project brief is required");
  }

  return normalized;
}

function scoreAgent(agent: (typeof synagents)[number], intake: MatchRequestPayload) {
  let score = Math.round(agent.cred * 0.4);
  const reasons: string[] = [];

  if (intake.selectedAgent && intake.selectedAgent === agent.slug) {
    score += 45;
    reasons.push("explicitly selected by requester");
  }

  const categoryFit = agent.serviceCategories.filter((category) => category === intake.category);
  if (categoryFit.length) {
    score += 25;
    reasons.push(`strong category fit: ${categoryFit.join(", ")}`);
  }

  const normalizedPaymentPreference = intake.paymentPreference === "cred" || intake.paymentPreference === "usdc"
    ? intake.paymentPreference
    : null;
  if (intake.paymentPreference === "open") {
    score += 5;
  } else if (normalizedPaymentPreference && agent.acceptedPayments.includes(normalizedPaymentPreference)) {
    score += 10;
    reasons.push(`accepts ${normalizedPaymentPreference.toUpperCase()}`);
  }

  if (intake.communicationPreference === "either") {
    score += 4;
  } else if (agent.preferredCommunicationChannels.includes(intake.communicationPreference as "email" | "telegram")) {
    score += 8;
    reasons.push(`supports ${intake.communicationPreference}`);
  }

  if (intake.deliveryType === "unsure" || intake.deliveryType === "hybrid") {
    score += 5;
  } else if (intake.deliveryType === "human-only" && agent.operatorModel !== "agent-only") {
    score += 6;
    reasons.push("human delivery compatible");
  } else if (intake.deliveryType === "agent-only" && agent.operatorModel !== "human-only") {
    score += 6;
    reasons.push("agent delivery compatible");
  }

  if (intake.timezone && intake.timezone === agent.timezoneIana) {
    score += 8;
    reasons.push("exact timezone match");
  }

  if (agent.capacityStatus === "available-now") {
    score += 10;
    reasons.push("available now");
  } else if (agent.capacityStatus === "available-soon") {
    score += 6;
    reasons.push("available soon");
  } else if (agent.capacityStatus === "limited") {
    score += 2;
  }

  if (intake.urgency === "asap" && agent.capacityStatus === "available-now") {
    score += 8;
    reasons.push("fits urgent timeline");
  }

  return {
    score,
    reasons,
    categoryFit,
  };
}

export function buildMatches(intake: MatchRequestPayload, count = 3): MatchResult[] {
  return synagents
    .map((agent) => {
      const scored = scoreAgent(agent, intake);
      const contactsAvailable: Array<"email" | "telegram"> = [];
      if (agent.contacts.email) contactsAvailable.push("email");
      if (agent.contacts.telegram) contactsAvailable.push("telegram");
      return {
        slug: agent.slug,
        name: agent.name,
        score: scored.score,
        reasons: scored.reasons,
        payment: agent.payment,
        timezone: agent.timezoneIana,
        categoryFit: scored.categoryFit,
        contactsAvailable,
      } satisfies MatchResult;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

export function buildNotifications(requestId: string, intake: MatchRequestPayload, matches: MatchResult[]): MatchNotification[] {
  const now = new Date().toISOString();
  const notifications: MatchNotification[] = [];

  for (const match of matches) {
    const agent = synagents.find((entry) => entry.slug === match.slug);
    if (!agent) continue;
    const summary = intake.title || intake.desiredOutcome || intake.brief || "New Synagent request";

    if (agent.contacts.email) {
      notifications.push({
        id: `${requestId}:${match.slug}:email`,
        requestId,
        agentSlug: match.slug,
        channel: "email",
        target: agent.contacts.email,
        status: "queued",
        message: `New Synagent match request: ${summary}. Budget ${intake.budgetRange}, urgency ${intake.urgency}, requester prefers ${intake.communicationPreference}.`,
        createdAt: now,
      });
    }

    if (agent.contacts.telegram) {
      notifications.push({
        id: `${requestId}:${match.slug}:telegram`,
        requestId,
        agentSlug: match.slug,
        channel: "telegram",
        target: agent.contacts.telegram,
        status: "queued",
        message: `New Synagent request matched to ${agent.name}: ${summary}. Budget ${intake.budgetRange}, urgency ${intake.urgency}.`,
        createdAt: now,
      });
    }
  }

  return notifications;
}

export function buildRequestRecord(intake: MatchRequestPayload): MatchRequestRecord {
  const requestId = `req_${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}_${crypto.randomUUID().slice(0, 8)}`;
  const matchedAgents = buildMatches(intake, 3);
  const notifications = buildNotifications(requestId, intake, matchedAgents);
  const nextActionAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

  return {
    id: requestId,
    createdAt: new Date().toISOString(),
    status: matchedAgents.length ? "matched" : "new",
    intake,
    matchedAgents,
    notifications,
    internalOwner: "bendr",
    nextActionAt,
  };
}
