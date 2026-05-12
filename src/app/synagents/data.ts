export type Synagent = {
  slug: string;
  name: string;
  country: string;
  city: string;
  payment: "$CRED" | "USDC";
  acceptedPayments: Array<"cred" | "usdc">;
  preferredCommunicationChannels: Array<"email" | "telegram">;
  serviceCategories: string[];
  operatorModel: "human-only" | "agent-only" | "hybrid";
  capacityStatus: "available-now" | "available-soon" | "limited";
  lastActive: string;
  cred: number;
  featured?: boolean;
  memberSince: string;
  timezone: string;
  timezoneIana: string;
  coords: string;
  avatar: string;
  contacts: {
    xHandle?: string | null;
    telegramHandle?: string | null;
    telegramChatId?: string | null;
    email?: string | null;
    agentmailInbox?: string | null;
  };
  helixaProfile?: {
    entityType: "human" | "agent" | "organization";
    id: string;
    url: string;
    apiUrl: string;
    credLabel?: string | null;
    credScore?: number | null;
  } | null;
  launchStatus?: "live" | "profile-pending";
  bio: string;
  projects: Array<{
    name: string;
    type: string;
    rating: number;
    result: string;
  }>;
};

const initials = (name: string) => name.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();

const realSynagents: Synagent[] = [
  {
    slug: "degeneer",
    name: "Degeneer",
    country: "India",
    city: "Remote",
    payment: "USDC",
    acceptedPayments: ["usdc", "cred"],
    preferredCommunicationChannels: ["email"],
    serviceCategories: ["mvp-build", "automation", "design"],
    operatorModel: "human-only",
    capacityStatus: "available-now",
    lastActive: "recently",
    cred: 72,
    featured: true,
    memberSince: "Apr 2026",
    timezone: "UTC",
    timezoneIana: "Etc/UTC",
    coords: "22.5937 N / 78.9629 E",
    avatar: initials("Degeneer"),
    contacts: {
      xHandle: "@degeneer03",
      telegramHandle: null,
      telegramChatId: null,
      email: "risavdeb03@gmail.com",
      agentmailInbox: null,
    },
    helixaProfile: null,
    launchStatus: "profile-pending",
    bio: "Degen dev open to work on product audits, automation builds, and fast-moving MVP cleanup. Strong fit for teams that need a practical technical review, shipped fixes, and direct written feedback without a lot of ceremony.",
    projects: [
      {
        name: "Platform Audit Sprint",
        type: "Product Audit",
        rating: 4.8,
        result: "Reviewed flow, friction points, and technical gaps, then turned the audit into a concrete repair checklist.",
      },
      {
        name: "Automation Cleanup",
        type: "Automation",
        rating: 4.7,
        result: "Tightened broken workflow edges and reduced manual handoffs for a faster operating loop.",
      },
      {
        name: "MVP Polish Pass",
        type: "MVP Build",
        rating: 4.7,
        result: "Shipped focused UX and product fixes so the first user path felt clearer and more trustworthy.",
      },
    ],
  },
];

export const synagents: Synagent[] = realSynagents;

export const getSynagentBySlug = (slug: string) => synagents.find((agent) => agent.slug === slug);
