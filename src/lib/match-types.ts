export type MatchSourceCandidate = {
  id?: string | null;
  type?: "agent" | "human" | null;
  name?: string | null;
};

export type MatchSourceResolution = {
  providerSlug?: string | null;
  providerName?: string | null;
  confidence?: "manual-query" | "explicit-map" | "name-match" | null;
};

export type MatchRequestSource = {
  source?: string | null;
  requestId?: string | null;
  capability?: string | null;
  principalType?: "all" | "agent" | "human" | null;
  requiredSkills: string[];
  candidate?: MatchSourceCandidate | null;
  resolution?: MatchSourceResolution | null;
};

export type MatchHandoffPrefill = {
  source?: string | null;
  requestId?: string | null;
  title?: string | null;
  brief?: string | null;
  requester?: string | null;
  contact?: string | null;
  budget?: string | null;
  urgency?: string | null;
  category?: string | null;
  capability?: string | null;
  principalType?: "all" | "agent" | "human" | null;
  requiredSkills: string[];
  candidate?: MatchSourceCandidate | null;
  resolution?: MatchSourceResolution | null;
};

export type MatchCategorySource = "default" | "user" | "handoff";

export type MatchRequestPayload = {
  selectedAgent?: string | null;
  title?: string | null;
  requester?: string | null;
  category: string;
  categorySource?: MatchCategorySource;
  budgetRange: string;
  budgetNote?: string | null;
  urgency: string;
  deliveryType: string;
  communicationPreference: string;
  timezone?: string | null;
  confidentiality: string;
  paymentPreference: string;
  desiredOutcome?: string | null;
  brief?: string | null;
  source?: MatchRequestSource | null;
  contact: {
    email?: string | null;
    telegram?: string | null;
    note?: string | null;
  };
  priorities: {
    cost: number;
    time: number;
    quality: number;
    credibility: number;
  };
};

export type MatchNotificationStatus = "queued" | "sent" | "failed" | "skipped";

export type MatchRequestStatus = "new" | "matched" | "needs-review";

export type MatchConfidence = "high" | "review";

export type MatchPublicDecision = "recommended-match" | "manual-review";

export type MatchReviewMetadata = {
  needsManualReview: boolean;
  confidence: MatchConfidence;
  publicDecision: MatchPublicDecision;
  recommendedMatchSlug?: string | null;
  fallbackReason?: string | null;
  strongestScore?: number | null;
  recommendationThreshold?: number | null;
};

export type MatchScoreComponent = {
  label: string;
  points: number;
  reason: string;
};

export type MatchCandidateEvaluation = {
  slug: string;
  name: string;
  score: number;
  confidence: MatchConfidence;
  categoryFit: string[];
  explicitCategoryFit: string[];
  reasons: string[];
  scoreComponents: MatchScoreComponent[];
  eligibleForRecommendation: boolean;
};

export type MatchNotification = {
  id: string;
  requestId: string;
  agentSlug: string;
  channel: "email" | "telegram";
  target: string;
  status: MatchNotificationStatus;
  subject?: string | null;
  html?: string | null;
  message: string;
  createdAt: string;
  attempts: number;
  lastAttemptAt?: string | null;
  dispatchedAt?: string | null;
  providerMessageId?: string | null;
  lastError?: string | null;
};

export type MatchResult = {
  slug: string;
  name: string;
  score: number;
  confidence: MatchConfidence;
  summaryReason: string;
  reasons: string[];
  payment: string;
  timezone: string;
  categoryFit: string[];
  contactsAvailable: Array<"email" | "telegram">;
};

export type MatchRequestRecord = {
  id: string;
  createdAt: string;
  status: MatchRequestStatus;
  review: MatchReviewMetadata;
  intake: MatchRequestPayload;
  matchedAgents: MatchResult[];
  notifications: MatchNotification[];
  matchEvaluation: {
    rankedCandidates: MatchCandidateEvaluation[];
  };
  internalOwner: string;
  nextActionAt: string;
};

export type NotificationDispatchMode = "queue-only" | "review" | "live";

export type MatchApiResponse =
  | {
      success: true;
      requestId: string;
      status: MatchRequestStatus;
      review: MatchReviewMetadata;
      matchedAgents: MatchResult[];
      notificationsQueued: number;
      notificationMode: NotificationDispatchMode;
      dispatchEndpoint: string;
      nextActionAt: string;
    }
  | {
      success: false;
      error: string;
    };
