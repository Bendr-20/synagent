export type MatchRequestPayload = {
  selectedAgent?: string | null;
  title?: string | null;
  category: string;
  budgetRange: string;
  urgency: string;
  deliveryType: string;
  communicationPreference: string;
  timezone?: string | null;
  confidentiality: string;
  paymentPreference: string;
  desiredOutcome?: string | null;
  brief?: string | null;
  contact: {
    email?: string | null;
    telegram?: string | null;
  };
  priorities: {
    cost: number;
    time: number;
    quality: number;
    credibility: number;
  };
};

export type MatchNotification = {
  id: string;
  requestId: string;
  agentSlug: string;
  channel: "email" | "telegram";
  target: string;
  status: "queued";
  message: string;
  createdAt: string;
};

export type MatchResult = {
  slug: string;
  name: string;
  score: number;
  reasons: string[];
  payment: string;
  timezone: string;
  categoryFit: string[];
  contactsAvailable: Array<"email" | "telegram">;
};

export type MatchRequestRecord = {
  id: string;
  createdAt: string;
  status: "new" | "matched";
  intake: MatchRequestPayload;
  matchedAgents: MatchResult[];
  notifications: MatchNotification[];
  internalOwner: string;
  nextActionAt: string;
};
