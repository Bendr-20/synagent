import { synagents } from "@/app/synagents/data";
import { getDispatchConfig } from "./notification-dispatch";
import type {
  MatchCategorySource,
  MatchNotification,
  MatchRequestPayload,
  MatchRequestRecord,
  MatchRequestSource,
  MatchCandidateEvaluation,
  MatchResult,
  MatchScoreComponent,
  MatchSourceCandidate,
  MatchSourceResolution,
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

const HIGH_RECOMMENDATION_SCORE = 80;
const NO_STRONG_MATCH_FALLBACK_REASON = "No high-confidence verified-provider match met the recommendation threshold.";

const CATEGORY_LABELS: Record<string, string> = {
  "mvp-build": "MVP build",
  "operator-support": "operator support",
  "ai-consulting": "AI consulting",
  automation: "automation",
  design: "design",
  growth: "growth",
  research: "research",
  other: "other",
};

function formatCategories(categories: string[]) {
  return categories.map((category) => CATEGORY_LABELS[category] || category).join(", ");
}

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

function normalizeSourceResolution(value: unknown): MatchSourceResolution | null {
  const body = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const providerSlug = clampText(body.providerSlug, 128) || null;
  const providerName = clampText(body.providerName, 160) || null;
  const confidence = clampEnum(body.confidence, ["manual-query", "explicit-map", "name-match"], "") as "manual-query" | "explicit-map" | "name-match" | "";

  if (!providerSlug && !providerName && !confidence) return null;
  return {
    providerSlug,
    providerName,
    confidence: confidence || null,
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
  const resolution = normalizeSourceResolution(nested.resolution);

  if (!source && !requestId && !capability && !principalType && !requiredSkills.length && !candidate && !resolution) return null;

  return {
    source,
    requestId,
    capability,
    principalType: principalType || null,
    requiredSkills,
    candidate,
    resolution,
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

function getExplicitDesiredCategories(intake: MatchRequestPayload) {
  const explicit = new Set<string>();
  const categoryIsExplicit = intake.categorySource === "user" || intake.categorySource === "handoff";
  if (categoryIsExplicit && intake.category && intake.category !== "other") explicit.add(intake.category);

  for (const skill of intake.source?.requiredSkills || []) {
    const normalized = skill.toLowerCase().trim();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.includes(normalized) || normalized === category) explicit.add(category);
    }
  }

  return [...explicit];
}

function getDirectedAgent(intake: MatchRequestPayload) {
  const directedSlug = intake.selectedAgent || null;
  return directedSlug ? synagents.find((agent) => agent.slug === directedSlug) || null : null;
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
  const category = clampEnum(body.category, ["mvp-build", "operator-support", "ai-consulting", "automation", "design", "growth", "research", "other"], "other");
  const providedCategorySource = clampEnum(body.categorySource, ["default", "user", "handoff"], "") as MatchCategorySource | "";
  const categorySource = providedCategorySource
    || (Object.prototype.hasOwnProperty.call(body, "category") && category !== "other" ? "user" : "default");

  const normalized: MatchRequestPayload = {
    selectedAgent: clampText(body.selectedAgent, 128) || null,
    title: clampText(body.title, 160) || null,
    requester: clampText(body.requester, 160) || null,
    category,
    categorySource,
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
  let score = 0;
  const reasons: string[] = [];
  const scoreComponents: MatchScoreComponent[] = [];
  const desiredCategories = inferDesiredCategories(intake);

  const addScore = (label: string, points: number, reason: string, publicReason?: string) => {
    if (points <= 0) return;
    score += points;
    scoreComponents.push({ label, points, reason });
    if (publicReason) reasons.push(publicReason);
  };

  addScore("Cred score", Math.round(agent.cred * 0.4), `Cred ${agent.cred}/100 baseline`);

  if (intake.selectedAgent && intake.selectedAgent === agent.slug) {
    addScore("Requester selection", 45, "Requester explicitly selected this provider", "explicitly selected by requester");
  }

  const categoryFit = agent.serviceCategories.filter((category) => desiredCategories.includes(category));
  if (categoryFit.length) {
    addScore(
      "Category fit",
      25 + Math.max(0, categoryFit.length - 1) * 4,
      `Provider categories overlap request categories: ${formatCategories(categoryFit)}`,
      `matches ${formatCategories(categoryFit)} work`,
    );
  }

  const normalizedPaymentPreference = intake.paymentPreference === "cred" || intake.paymentPreference === "usdc"
    ? intake.paymentPreference
    : null;
  if (intake.paymentPreference === "open") {
    addScore("Payment flexibility", 5, "Requester is open on payment method");
  } else if (normalizedPaymentPreference && agent.acceptedPayments.includes(normalizedPaymentPreference)) {
    addScore(
      "Payment fit",
      10,
      `Provider accepts requested ${normalizedPaymentPreference.toUpperCase()} payment`,
      `accepts ${normalizedPaymentPreference.toUpperCase()}`,
    );
  }

  if (intake.communicationPreference === "either") {
    addScore("Communication flexibility", 4, "Requester is flexible on communication channel");
  } else if (agent.preferredCommunicationChannels.includes(intake.communicationPreference as "email" | "telegram")) {
    addScore(
      "Communication fit",
      8,
      `Provider supports requested ${intake.communicationPreference} communication`,
      `supports ${intake.communicationPreference}`,
    );
  }

  if (intake.deliveryType === "unsure" || intake.deliveryType === "hybrid") {
    addScore("Delivery flexibility", 5, "Hybrid or unsure delivery is compatible with reviewed routing");
  } else if (intake.deliveryType === "human-only" && agent.operatorModel !== "agent-only") {
    addScore("Delivery fit", 6, "Provider can support human-led delivery", "human delivery compatible");
  } else if (intake.deliveryType === "agent-only" && agent.operatorModel !== "human-only") {
    addScore("Delivery fit", 6, "Provider can support agent-led delivery", "agent delivery compatible");
  }

  if (intake.timezone && intake.timezone === agent.timezoneIana) {
    addScore("Timezone fit", 8, "Requester timezone exactly matches provider timezone", "exact timezone match");
  }

  if (agent.capacityStatus === "available-now") {
    addScore("Capacity", 10, "Provider is available now", "available now");
  } else if (agent.capacityStatus === "available-soon") {
    addScore("Capacity", 6, "Provider is available soon", "available soon");
  } else if (agent.capacityStatus === "limited") {
    addScore("Capacity", 2, "Provider has limited capacity");
  }

  if (intake.urgency === "asap" && agent.capacityStatus === "available-now") {
    addScore("Urgency fit", 8, "ASAP request fits provider's immediate availability", "fits urgent timeline");
  }

  return {
    score,
    reasons,
    categoryFit,
    scoreComponents,
  };
}

function buildMatchEvaluation(intake: MatchRequestPayload, count = 1): { matchedAgents: MatchResult[]; strongestScore: number | null; rankedCandidates: MatchCandidateEvaluation[] } {
  const directedAgent = getDirectedAgent(intake);
  const candidates = directedAgent ? [directedAgent] : synagents;
  const explicitDesiredCategories = getExplicitDesiredCategories(intake);

  const ranked = candidates
    .map((agent) => {
      const scored = scoreAgent(agent, intake);
      const contactsAvailable: Array<"email" | "telegram"> = [];
      if (agent.contacts.email || agent.contacts.agentmailInbox) contactsAvailable.push("email");
      if (agent.contacts.telegramChatId) contactsAvailable.push("telegram");
      const explicitCategoryFit = agent.serviceCategories.filter((category) => explicitDesiredCategories.includes(category));
      const eligibleForRecommendation = scored.score >= HIGH_RECOMMENDATION_SCORE && explicitCategoryFit.length > 0;
      const confidence = eligibleForRecommendation ? "high" as const : "review" as const;
      return {
        slug: agent.slug,
        name: agent.name,
        score: scored.score,
        confidence,
        summaryReason: buildSummaryReason(agent, scored.categoryFit, scored.reasons, intake),
        reasons: scored.reasons,
        scoreComponents: scored.scoreComponents,
        payment: agent.payment,
        timezone: agent.timezoneIana,
        categoryFit: scored.categoryFit,
        contactsAvailable,
        explicitCategoryFit,
        eligibleForRecommendation,
      };
    })
    .sort((a, b) => b.score - a.score);

  const eligible = ranked
    .filter((match) => match.eligibleForRecommendation)
    .slice(0, count);

  return {
    matchedAgents: eligible.map(({ explicitCategoryFit: _explicitCategoryFit, eligibleForRecommendation: _eligibleForRecommendation, scoreComponents: _scoreComponents, ...match }) => match),
    strongestScore: ranked[0]?.score ?? null,
    rankedCandidates: ranked.map((match) => ({
      slug: match.slug,
      name: match.name,
      score: match.score,
      confidence: match.confidence,
      categoryFit: match.categoryFit,
      explicitCategoryFit: match.explicitCategoryFit,
      reasons: match.reasons,
      scoreComponents: match.scoreComponents,
      eligibleForRecommendation: match.eligibleForRecommendation,
    })),
  };
}

export function buildMatches(intake: MatchRequestPayload, count = 3): MatchResult[] {
  return buildMatchEvaluation(intake, count).matchedAgents;
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
          intake.source?.candidate?.name ? `Upstream candidate: ${intake.source.candidate.name}` : null,
          intake.source?.resolution?.providerName ? `Resolved provider: ${intake.source.resolution.providerName} (${intake.source.resolution.confidence || "unscored"})` : null,
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
          intake.source?.resolution?.providerName ? `Resolved provider: ${intake.source.resolution.providerName}` : null,
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
  const { matchedAgents, strongestScore, rankedCandidates } = buildMatchEvaluation(intake, 1);
  const notifications = buildNotifications(requestId, intake, matchedAgents);
  const dispatchConfig = getDispatchConfig();
  const nextActionAt = new Date(Date.now() + (dispatchConfig.mode === "queue-only" ? 2 : 1) * 60 * 60 * 1000).toISOString();
  const needsManualReview = matchedAgents.length === 0;
  const recommendedMatchSlug = matchedAgents[0]?.slug || null;

  return {
    id: requestId,
    createdAt: new Date().toISOString(),
    status: matchedAgents.length ? "matched" : "needs-review",
    review: {
      needsManualReview,
      confidence: needsManualReview ? "review" : "high",
      publicDecision: needsManualReview ? "manual-review" : "recommended-match",
      recommendedMatchSlug,
      fallbackReason: needsManualReview ? NO_STRONG_MATCH_FALLBACK_REASON : null,
      strongestScore,
      recommendationThreshold: HIGH_RECOMMENDATION_SCORE,
    },
    intake,
    matchedAgents,
    notifications,
    matchEvaluation: {
      rankedCandidates,
    },
    internalOwner: "bendr",
    nextActionAt,
  };
}
