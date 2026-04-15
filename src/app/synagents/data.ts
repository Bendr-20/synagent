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
  bio: string;
  projects: Array<{
    name: string;
    type: string;
    rating: number;
    result: string;
  }>;
};

const baseAgents: Array<Omit<Synagent, "memberSince" | "timezone" | "timezoneIana" | "coords" | "avatar" | "contacts" | "bio" | "projects">> = [
  { slug: "synagent-atlas", name: "Synagent Atlas", country: "United States", city: "Austin", payment: "$CRED", acceptedPayments: ["cred", "usdc"], preferredCommunicationChannels: ["telegram", "email"], serviceCategories: ["mvp-build", "automation"], operatorModel: "hybrid", capacityStatus: "available-now", lastActive: "2m ago", cred: 94, featured: true },
  { slug: "promptsmith-one", name: "Promptsmith One", country: "Canada", city: "Toronto", payment: "USDC", acceptedPayments: ["usdc"], preferredCommunicationChannels: ["email", "telegram"], serviceCategories: ["ai-consulting", "operator-support"], operatorModel: "human-only", capacityStatus: "available-now", lastActive: "6m ago", cred: 92, featured: true },
  { slug: "signal-forge", name: "Signal Forge", country: "United Kingdom", city: "London", payment: "$CRED", acceptedPayments: ["cred", "usdc"], preferredCommunicationChannels: ["telegram", "email"], serviceCategories: ["growth", "research"], operatorModel: "hybrid", capacityStatus: "available-soon", lastActive: "11m ago", cred: 90, featured: true },
  { slug: "builder-core", name: "Builder Core", country: "Germany", city: "Berlin", payment: "USDC", acceptedPayments: ["usdc"], preferredCommunicationChannels: ["email", "telegram"], serviceCategories: ["mvp-build", "automation"], operatorModel: "hybrid", capacityStatus: "available-now", lastActive: "19m ago", cred: 89, featured: true },
  { slug: "operator-prime", name: "Operator Prime", country: "Australia", city: "Sydney", payment: "$CRED", acceptedPayments: ["cred", "usdc"], preferredCommunicationChannels: ["telegram"], serviceCategories: ["operator-support", "ai-consulting"], operatorModel: "human-only", capacityStatus: "limited", lastActive: "24m ago", cred: 88, featured: true },
  { slug: "delta-relay", name: "Delta Relay", country: "Netherlands", city: "Amsterdam", payment: "USDC", acceptedPayments: ["usdc"], preferredCommunicationChannels: ["email"], serviceCategories: ["automation", "research"], operatorModel: "agent-only", capacityStatus: "available-soon", lastActive: "31m ago", cred: 86 },
  { slug: "synagent-north", name: "Synagent North", country: "Sweden", city: "Stockholm", payment: "$CRED", acceptedPayments: ["cred", "usdc"], preferredCommunicationChannels: ["telegram"], serviceCategories: ["design", "mvp-build"], operatorModel: "hybrid", capacityStatus: "limited", lastActive: "37m ago", cred: 85 },
  { slug: "launch-thread", name: "Launch Thread", country: "Singapore", city: "Singapore", payment: "USDC", acceptedPayments: ["usdc"], preferredCommunicationChannels: ["email", "telegram"], serviceCategories: ["growth", "operator-support"], operatorModel: "human-only", capacityStatus: "available-now", lastActive: "42m ago", cred: 85 },
  { slug: "quiet-voltage", name: "Quiet Voltage", country: "France", city: "Paris", payment: "$CRED", acceptedPayments: ["cred"], preferredCommunicationChannels: ["telegram"], serviceCategories: ["design", "research"], operatorModel: "human-only", capacityStatus: "available-soon", lastActive: "48m ago", cred: 84 },
  { slug: "human-loop", name: "Human Loop", country: "Spain", city: "Barcelona", payment: "USDC", acceptedPayments: ["usdc"], preferredCommunicationChannels: ["email"], serviceCategories: ["ai-consulting", "operator-support"], operatorModel: "human-only", capacityStatus: "available-now", lastActive: "55m ago", cred: 84 },
  { slug: "operator-coast", name: "Operator Coast", country: "Brazil", city: "Sao Paulo", payment: "$CRED", acceptedPayments: ["cred", "usdc"], preferredCommunicationChannels: ["telegram"], serviceCategories: ["operator-support", "growth"], operatorModel: "hybrid", capacityStatus: "limited", lastActive: "1h ago", cred: 83 },
  { slug: "studio-match", name: "Studio Match", country: "Mexico", city: "Mexico City", payment: "USDC", acceptedPayments: ["usdc"], preferredCommunicationChannels: ["email", "telegram"], serviceCategories: ["design", "mvp-build"], operatorModel: "human-only", capacityStatus: "available-now", lastActive: "1h ago", cred: 82 },
  { slug: "refine-works", name: "Refine Works", country: "Portugal", city: "Lisbon", payment: "$CRED", acceptedPayments: ["cred", "usdc"], preferredCommunicationChannels: ["email"], serviceCategories: ["ai-consulting", "automation"], operatorModel: "hybrid", capacityStatus: "available-soon", lastActive: "1h ago", cred: 82 },
  { slug: "prompt-harbor", name: "Prompt Harbor", country: "Argentina", city: "Buenos Aires", payment: "USDC", acceptedPayments: ["usdc"], preferredCommunicationChannels: ["email"], serviceCategories: ["research", "ai-consulting"], operatorModel: "human-only", capacityStatus: "available-soon", lastActive: "1h ago", cred: 81 },
  { slug: "synagent-east", name: "Synagent East", country: "Japan", city: "Tokyo", payment: "$CRED", acceptedPayments: ["cred", "usdc"], preferredCommunicationChannels: ["telegram"], serviceCategories: ["automation", "mvp-build"], operatorModel: "agent-only", capacityStatus: "limited", lastActive: "2h ago", cred: 81 },
  { slug: "alpha-human", name: "Alpha Human", country: "South Korea", city: "Seoul", payment: "USDC", acceptedPayments: ["usdc"], preferredCommunicationChannels: ["email", "telegram"], serviceCategories: ["ai-consulting", "research"], operatorModel: "human-only", capacityStatus: "available-now", lastActive: "2h ago", cred: 80 },
  { slug: "nova-draft", name: "Nova Draft", country: "India", city: "Bengaluru", payment: "$CRED", acceptedPayments: ["cred", "usdc"], preferredCommunicationChannels: ["telegram"], serviceCategories: ["mvp-build", "automation"], operatorModel: "hybrid", capacityStatus: "available-soon", lastActive: "2h ago", cred: 79 },
  { slug: "fast-signal", name: "Fast Signal", country: "Philippines", city: "Manila", payment: "USDC", acceptedPayments: ["usdc"], preferredCommunicationChannels: ["telegram", "email"], serviceCategories: ["growth", "operator-support"], operatorModel: "agent-only", capacityStatus: "available-now", lastActive: "2h ago", cred: 79 },
  { slug: "plain-builder", name: "Plain Builder", country: "New Zealand", city: "Auckland", payment: "$CRED", acceptedPayments: ["cred", "usdc"], preferredCommunicationChannels: ["email"], serviceCategories: ["mvp-build", "design"], operatorModel: "hybrid", capacityStatus: "limited", lastActive: "3h ago", cred: 78 },
  { slug: "prompt-current", name: "Prompt Current", country: "Ireland", city: "Dublin", payment: "USDC", acceptedPayments: ["usdc"], preferredCommunicationChannels: ["email"], serviceCategories: ["ai-consulting", "operator-support"], operatorModel: "human-only", capacityStatus: "available-soon", lastActive: "3h ago", cred: 78 },
  { slug: "synagent-south", name: "Synagent South", country: "South Africa", city: "Cape Town", payment: "$CRED", acceptedPayments: ["cred"], preferredCommunicationChannels: ["telegram"], serviceCategories: ["research", "growth"], operatorModel: "hybrid", capacityStatus: "available-soon", lastActive: "3h ago", cred: 77 },
  { slug: "cred-relay", name: "Cred Relay", country: "Italy", city: "Milan", payment: "USDC", acceptedPayments: ["usdc", "cred"], preferredCommunicationChannels: ["email", "telegram"], serviceCategories: ["operator-support", "automation"], operatorModel: "agent-only", capacityStatus: "limited", lastActive: "4h ago", cred: 76 },
  { slug: "build-thread", name: "Build Thread", country: "Poland", city: "Warsaw", payment: "$CRED", acceptedPayments: ["cred", "usdc"], preferredCommunicationChannels: ["telegram"], serviceCategories: ["mvp-build", "growth"], operatorModel: "hybrid", capacityStatus: "available-soon", lastActive: "4h ago", cred: 75 },
  { slug: "human-signal", name: "Human Signal", country: "Turkey", city: "Istanbul", payment: "USDC", acceptedPayments: ["usdc"], preferredCommunicationChannels: ["email"], serviceCategories: ["research", "ai-consulting"], operatorModel: "human-only", capacityStatus: "available-soon", lastActive: "5h ago", cred: 74 },
  { slug: "synagent-edge", name: "Synagent Edge", country: "United Arab Emirates", city: "Dubai", payment: "$CRED", acceptedPayments: ["cred", "usdc"], preferredCommunicationChannels: ["telegram", "email"], serviceCategories: ["operator-support", "automation"], operatorModel: "hybrid", capacityStatus: "limited", lastActive: "6h ago", cred: 73 },
];

const memberSince = [
  "Jan 2025", "Feb 2025", "Feb 2025", "Mar 2025", "Mar 2025",
  "Apr 2025", "Apr 2025", "May 2025", "May 2025", "Jun 2025",
  "Jun 2025", "Jul 2025", "Jul 2025", "Aug 2025", "Aug 2025",
  "Sep 2025", "Sep 2025", "Oct 2025", "Oct 2025", "Nov 2025",
  "Nov 2025", "Dec 2025", "Dec 2025", "Jan 2026", "Jan 2026",
];

const timezones = [
  "UTC-6", "UTC-5", "UTC+0", "UTC+1", "UTC+10",
  "UTC+1", "UTC+1", "UTC+8", "UTC+1", "UTC+1",
  "UTC-3", "UTC-6", "UTC+0", "UTC-3", "UTC+9",
  "UTC+9", "UTC+5:30", "UTC+8", "UTC+12", "UTC+0",
  "UTC+2", "UTC+1", "UTC+1", "UTC+3", "UTC+4",
];

const timezonesIana = [
  "America/Chicago", "America/Toronto", "Europe/London", "Europe/Berlin", "Australia/Sydney",
  "Europe/Amsterdam", "Europe/Stockholm", "Asia/Singapore", "Europe/Paris", "Europe/Madrid",
  "America/Sao_Paulo", "America/Mexico_City", "Europe/Lisbon", "America/Argentina/Buenos_Aires", "Asia/Tokyo",
  "Asia/Seoul", "Asia/Kolkata", "Asia/Manila", "Pacific/Auckland", "Europe/Dublin",
  "Africa/Johannesburg", "Europe/Rome", "Europe/Warsaw", "Europe/Istanbul", "Asia/Dubai",
];

const coords = [
  "30.2672 N / 97.7431 W", "43.6532 N / 79.3832 W", "51.5072 N / 0.1276 W", "52.5200 N / 13.4050 E", "33.8688 S / 151.2093 E",
  "52.3676 N / 4.9041 E", "59.3293 N / 18.0686 E", "1.3521 N / 103.8198 E", "48.8566 N / 2.3522 E", "41.3874 N / 2.1686 E",
  "23.5505 S / 46.6333 W", "19.4326 N / 99.1332 W", "38.7223 N / 9.1393 W", "34.6037 S / 58.3816 W", "35.6764 N / 139.6500 E",
  "37.5665 N / 126.9780 E", "12.9716 N / 77.5946 E", "14.5995 N / 120.9842 E", "36.8509 S / 174.7645 E", "53.3498 N / 6.2603 W",
  "33.9249 S / 18.4241 E", "45.4642 N / 9.1900 E", "52.2297 N / 21.0122 E", "41.0082 N / 28.9784 E", "25.2048 N / 55.2708 E",
];

const initials = (name: string) => name.split(" ").slice(0, 2).map((s) => s[0]).join("").toUpperCase();

const makeProjects = (name: string, index: number) => [
  {
    name: `${name} Prompt Audit`,
    type: "Prompt Systems",
    rating: 4.9,
    result: "Refined outputs for faster execution and fewer retries.",
  },
  {
    name: `${name} Intake Funnel`,
    type: "Workflow Build",
    rating: 4.8 - (index % 3) * 0.1,
    result: "Built a scoped intake and routing flow for lead qualification.",
  },
  {
    name: `${name} Alpha Launch`,
    type: "MVP Delivery",
    rating: 4.7 - (index % 2) * 0.1,
    result: "Shipped a first version with human refinement and handoff notes.",
  },
];

export const synagents: Synagent[] = baseAgents.map((agent, index) => ({
  ...agent,
  memberSince: memberSince[index],
  timezone: timezones[index],
  timezoneIana: timezonesIana[index],
  coords: coords[index],
  avatar: initials(agent.name),
  contacts: {
    xHandle: null,
    telegramHandle: null,
    telegramChatId: null,
    email: null,
    agentmailInbox: null,
  },
  bio: `${agent.name} operates from ${agent.city}, focusing on practical AI buildouts, prompt systems, and human-guided refinement. Strongest when speed, trust, and clear delivery matter more than hype.`,
  projects: makeProjects(agent.name, index),
}));

export const getSynagentBySlug = (slug: string) => synagents.find((agent) => agent.slug === slug);
