import { synagents } from "@/app/synagents/data";
import { getDispatchConfig } from "./notification-dispatch";
import type {
  MatchNotification,
  MatchRequestPayload,
  MatchRequestRecord,
  MatchRequestSource,
  MatchResult,
  MatchSourceCandidate,
} from "./match-types";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "mvp-build": ["mvp", "prototype", "build", "frontend", "fullstack", "landing", "product", "app", "website", "ship"],
  "operator-support": ["operator", "ops", "support", "assistant", "workflow", "execution", "backoffice"],
  "ai-consulting": ["ai", "agent", "prompt", "llm", "strategy", "advisory", "consulting"],
  automation: ["automation", "integrations", "integration", "zapier", "n8n", "pipes", "orchestration"],
  design: ["design", "brand", "ui", "ux", "copy", "copywriting", "creative"],
  growth: ["growth", "launch", "distribution", "marketing", "audience", "sales"],
  research: ["research", "analysis", "intel", "discovery", "thesis", "investigation"],
};

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

function clampList(value: unknown, maxItems = 12, maxLength = 64) {
  const raw = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];

  return raw
    .map((item) => clampText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeText(value: unknown) {
  return clampText(value, 3000).toLowerCase();
}

function toKeywordTerms(value: unknown) {
  const stopwords = new Set(["with", "that", "this", "from", "need", "needs", "help", "human", "agent", "work", "want", "into", "for", "and", "the", "you", "your", "our"]);
  return normalizeText(value)
    .split(/[^a-z0-9+#.-]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !stopwords.has(term))
    .slice(0, 18);
}

function parseContactNote(value: string | null) {
  if (!value) return { email: null, telegram: null, note: null };
  const trimmed = value.trim();
  if (emailRegex.test(trimmed)) {
    return { email: trimmed.toLowerCase(), telegram: null, note: null };
  }
  if (trimmed.startsWith("@") || trimmed.toLowerCase().includes("telegram")) {
    return { email: null, telegram: trimmed, note: null };
  }
  return { email: null, telegram: null, note: trimmed };
}

function normalizeSourceCandidate(value: unknown): MatchSourceCandidate | null {
  const body = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const id = clampText(body.id, 128) || null;
  const type = clampEnum(body.type, ["agent", "human"], "") as "agent" | "human" | "";
  const name = clampText(body.name, 160) || null;

  if (!id && !type && !name) return null;
  return {
    id,
    type: type || null,
    name,
  };
}

function normalizeSource(input: Record<string, unknown>): MatchRequestSource | null {
  const nested = input.source && typeof input.source === "object" ? (input.source as Record<string, unknown>) : {};
  const source = clampText(nested.source ?? input.source, 64) || null;
  const requestId = clampText(nested.requestId ?? input.requestId, 64) || null;
  const capability = clampText(nested.capability ?? input.capability, 64) || null;
  const principalType = clampEnum(nested.principalType ?? input.principalType, ["all", "agent", "human"], "") as "all" | "agent" | "human" | "";
  const requiredSkills = clampList(nested.requiredSkills ?? input.requiredSkills, 12, 64);
  const candidate = normalizeSourceCandidate(nested.candidate ?? {
    id: input.candidateId,
    type: input.candidateType,
    name: input.candidateName,
  });

  if (!source && !requestId && !capability && !principalType && !requiredSkills.length && !candidate) return null;

  return {
    source,
    requestId,
    capability,
    principalType: principalType || null,
    requiredSkills,
    candidate,
  };
}

function inferDesiredCategories(intake: MatchRequestPayload) {
  const desired = new Set<string>();
  if (intake.category && intake.category !== "other") desired.add(intake.category);

  const haystack = normalizeText([
    intake.title,
    intake.desiredOutcome,
    intake.brief,
    intake.source?.capability,
    ...(intake.source?.requiredSkills || []),
  ].filter(Boolean).join(" "));

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      desired.add(category);
    }
  }

  return [...desired];
}

function buildSummaryReason(agent: (typeof synagents)[number], categoryFit: string[], reasons: string[], intake: MatchRequestPayload) {
  if (intake.selectedAgent && intake.selectedAgent === agent.slug) {
    return `${agent.name} was explicitly chosen and still fits the request.`;
  }

  const primaryCategory = categoryFit[0];
  const availabilityReason = reasons.find((reason) => reason.startsWith("available"));
  const channelReason = reasons.find((reason) => reason.startsWith("supports "));
  const urgencyReason = reasons.find((reason) => reason === "fits urgent timeline");

  if (primaryCategory && availabilityReason) {
    return `${agent.name} fits ${primaryCategory} work and is ${availabilityReason}.`;
  }
  if (primaryCategory && channelReason) {
    return `${agent.name} fits ${primaryCategory} work and can work over ${channelReason.replace("supports ", "")}.`;
  }
  if (primaryCategory) {
    return `${agent.name} looks strongest for ${primaryCategory} work based on fit and Cred.`;
  }
  if (urgencyReason) {
    return `${agent.name} stands out because it can handle urgent work quickly.`;
  }
  return `${agent.name} ranks well on trust, availability, and overall delivery fit.`;
}

export function normalizeMatchPayload(input: unknown): MatchRequestPayload {
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const contact = body.contact && typeof body.contact === "object" ? (body.contact as Record<string, unknown>) : {};
  const priorities = body.priorities && typeof body.priorities === "object" ? (body.priorities as Record<string, unknown>) : {};
  const parsedContactNote = parseContactNote(clampText(contact.note ?? body.contactNote, 256) || null);
  const source = normalizeSource(body);

  const normalized: MatchRequestPayload = {
    selectedAgent: clampText(body.selectedAgent, 128) || null,
    title: clampText(body.title, 160) || null,
    requester: clampText(body.requester, 160) || null,
    category: clampEnum(body.category, ["mvp-build", "operator-support", "ai-consulting", "automation", "design", "growth", "research", "other"], "other"),
    budgetRange: clampEnum(body.budgetRange, ["under-1k", "1k-3k", "3k-10k", "10k-25k", "25k-plus", "unknown"], "unknown"),
    budgetNote: clampText(body.budgetNote ?? body.budget, 128) || null,
    urgency: clampEnum(body.urgency, ["asap", "this-week", "this-month", "flexible"], "flexible"),
    deliveryType: clampEnum(body.deliveryType, ["human-only", "agent-only", "hybrid", "unsure"], "unsure"),
    communicationPreference: clampEnum(body.communicationPreference, ["email", "telegram", "either", "scheduled-call"], "either"),
    timezone: clampText(body.timezone, 64) || null,
    confidentiality: clampEnum(body.confidentiality, ["public", "private", "nda-required"], "private"),
    paymentPreference: clampEnum(body.paymentPreference, ["usd", "usdc", "cred", "open"], "open"),
    desiredOutcome: clampText(body.desiredOutcome, 512) || null,
    brief: clampText(body.brief ?? body.needs, 3000) || null,
    source,
    contact: {
      email: typeof contact.email === "string" && emailRegex.test(contact.email.trim()) ? contact.email.trim().toLowerCase() : parsedContactNote.email,
      telegram: clampText(contact.telegram, 64) || parsedContactNote.telegram,
      note: parsedContactNote.note,
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
  const desiredCategories = inferDesiredCategories(intake);

  if (intake.selectedAgent && intake.selectedAgent === agent.slug) {
    score += 45;
    reasons.push("explicitly selected by requester");
  }

  const categoryFit = agent.serviceCategories.filter((category) => desiredCategories.includes(category));
  if (categoryFit.length) {
    score += 25 + Math.max(0, categoryFit.length - 1) * 4;
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
      if (agent.contacts.email || agent.contacts.agentmailInbox) contactsAvailable.push("email");
      if (agent.contacts.telegramChatId) contactsAvailable.push("telegram");
      return {
        slug: agent.slug,
        name: agent.name,
        score: scored.score,
        summaryReason: buildSummaryReason(agent, scored.categoryFit, scored.reasons, intake),
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
    const requesterLine = intake.contact.email || intake.contact.telegram || intake.contact.note || "Requester contact captured in Synagent";

    const emailTarget = agent.contacts.email || agent.contacts.agentmailInbox;

    if (emailTarget) {
      notifications.push({
        id: `${requestId}:${match.slug}:email`,
        requestId,
        agentSlug: match.slug,
        channel: "email",
        target: emailTarget,
        status: "queued",
        subject: `New Synagent request: ${summary}`,
        html: null,
        message: [
          `A new Synagent request matched to ${agent.name}.`,
          `Summary: ${summary}`,
          `Category: ${intake.category}`,
          `Budget: ${intake.budgetRange}`,
          intake.budgetNote ? `Budget note: ${intake.budgetNote}` : null,
          `Urgency: ${intake.urgency}`,
          `Delivery: ${intake.deliveryType}`,
          `Confidentiality: ${intake.confidentiality}`,
          `Preferred channel: ${intake.communicationPreference}`,
          intake.source?.source ? `Source: ${intake.source.source}` : null,
          intake.source?.requestId ? `Source request ID: ${intake.source.requestId}` : null,
          intake.source?.capability ? `Capability hint: ${intake.source.capability}` : null,
          intake.source?.requiredSkills.length ? `Required skills: ${intake.source.requiredSkills.join(", ")}` : null,
          `Requester: ${requesterLine}`,
          `Request ID: ${requestId}`,
        ].filter(Boolean).join("\n"),
        createdAt: now,
        attempts: 0,
        lastAttemptAt: null,
        dispatchedAt: null,
        providerMessageId: null,
        lastError: null,
      });
    }

    if (agent.contacts.telegramChatId) {
      notifications.push({
        id: `${requestId}:${match.slug}:telegram`,
        requestId,
        agentSlug: match.slug,
        channel: "telegram",
        target: agent.contacts.telegramChatId,
        status: "queued",
        subject: null,
        html: null,
        message: [
          `New Synagent match for ${agent.name}`,
          `Summary: ${summary}`,
          `Budget: ${intake.budgetRange}`,
          `Urgency: ${intake.urgency}`,
          intake.source?.capability ? `Capability: ${intake.source.capability}` : null,
          `Preferred channel: ${intake.communicationPreference}`,
          `Request ID: ${requestId}`,
        ].filter(Boolean).join("\n"),
        createdAt: now,
        attempts: 0,
        lastAttemptAt: null,
        dispatchedAt: null,
        providerMessageId: null,
        lastError: null,
      });
    }
  }

  return notifications;
}

export function buildRequestRecord(intake: MatchRequestPayload): MatchRequestRecord {
  const requestId = `req_${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}_${crypto.randomUUID().slice(0, 8)}`;
  const matchedAgents = buildMatches(intake, 3);
  const notifications = buildNotifications(requestId, intake, matchedAgents);
  const dispatchConfig = getDispatchConfig();
  const nextActionAt = new Date(Date.now() + (dispatchConfig.mode === "queue-only" ? 2 : 1) * 60 * 60 * 1000).toISOString();

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
