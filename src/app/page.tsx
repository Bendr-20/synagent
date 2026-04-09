import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { glassCardStyle, outlineButtonStyle, theme } from "@/lib/theme";

type FeaturedProfile = {
  name: string;
  cred: number;
  slug?: string;
};

type ServiceCard = {
  number: string;
  title: string;
  description: string;
  titleColor: string;
  featuredLabel?: string;
  featuredProfiles?: FeaturedProfile[];
  buttonText?: string;
  buttonHref?: string;
};

const serviceCards: ServiceCard[] = [
  {
    number: "01",
    title: "Hire A Human",
    description: "Hire a prompt engineer to design, refine, and optimize AI outputs for fast, reliable execution.",
    titleColor: "#9ff9ff",
    featuredLabel: "Featured Synagents",
    featuredProfiles: [
      { name: "Synagent Atlas", cred: 94, slug: "synagent-atlas" },
      { name: "Promptsmith One", cred: 92, slug: "promptsmith-one" },
      { name: "Signal Forge", cred: 90, slug: "signal-forge" },
      { name: "Builder Core", cred: 89, slug: "builder-core" },
    ],
    buttonText: "Make Your Match",
    buttonHref: "/match",
  },
  {
    number: "02",
    title: "Create An MVP",
    description: "Submit your idea and our AI swarm builds it, humans refine it, and you own everything - code, IP, all of it. Delivered in 7-10 days.",
    titleColor: theme.accent,
    buttonText: "Start Building Now",
    buttonHref: "/match",
  },
  {
    number: "03",
    title: "Human AI Consultants",
    description: "Get strategic guidance on agents, workflows, tooling, and how to actually make the system useful.",
    titleColor: theme.accentDark,
    featuredLabel: "Synagents",
    featuredProfiles: [
      { name: "Synagent Alpha", cred: 91 },
      { name: "Synagent Beta", cred: 88 },
      { name: "Synagent Gamma", cred: 85 },
      { name: "Synagent Delta", cred: 83 },
    ],
    buttonText: "Engage With Synagent",
    buttonHref: "/synagents",
  },
];

function FeaturedProfiles({ label, profiles }: { label: string; profiles: FeaturedProfile[] }) {
  return (
    <div
      style={{
        marginTop: "22px",
        padding: "18px",
        borderRadius: "14px",
        border: "1px solid rgba(0,229,255,0.18)",
        background: "rgba(5,10,14,0.32)",
        boxShadow: "inset 0 0 0 1px rgba(0,229,255,0.03)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontFamily: "JetBrains Mono, monospace",
          letterSpacing: "0.14em",
          color: theme.textMuted,
          textTransform: "uppercase",
          marginBottom: "14px",
        }}
      >
        {label}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {profiles.map((profile, index) => {
          const row = (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: index === profiles.length - 1 ? "0" : "10px",
                borderBottom: index === profiles.length - 1 ? "none" : "1px solid rgba(0,229,255,0.08)",
              }}
            >
              <span style={{ fontSize: "14px", color: theme.textStrong, fontWeight: 500 }}>{profile.name}</span>
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: "JetBrains Mono, monospace",
                  color: theme.accent,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Cred {profile.cred}
              </span>
            </div>
          );

          if (!profile.slug) return <div key={profile.name}>{row}</div>;

          return (
            <Link key={profile.name} href={`/synagents/${profile.slug}`} style={{ textDecoration: "none" }}>
              {row}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MvpFlow() {
  const boxStyle = {
    padding: "10px 12px",
    borderRadius: "12px",
    border: "1px solid rgba(0,229,255,0.18)",
    background: "rgba(5,10,14,0.28)",
    textAlign: "center" as const,
    boxShadow: "inset 0 0 0 1px rgba(0,229,255,0.03)",
    fontFamily: "JetBrains Mono, monospace",
    textTransform: "uppercase" as const,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginTop: "20px" }}>
      <div style={{ ...boxStyle, padding: "12px 14px", color: theme.textStrong, fontSize: "12px", letterSpacing: "0.08em" }}>Your Idea</div>
      <div style={{ color: theme.textMuted, fontSize: "18px", fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>↓</div>
      <div style={{ ...boxStyle, color: theme.accent, fontSize: "11px", letterSpacing: "0.06em" }}>Agent Swarm &gt; Human Refinement</div>
      <div style={{ color: theme.textMuted, fontSize: "18px", fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>↓</div>
      <div style={{ ...boxStyle, color: theme.textStrong, fontSize: "11px", letterSpacing: "0.08em" }}>MVP / Beta</div>
    </div>
  );
}

export default function HomePage() {
  return (
    <SiteShell>
      <section
        className="hero-section"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "88px 24px 47px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "400px",
            background: "radial-gradient(ellipse, rgba(0, 229, 255, 0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <h1 className="hero-title" style={{ fontSize: "56px", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.1, marginBottom: "32px", maxWidth: "760px" }}>
          <span style={{ color: theme.textStrong }}>Build with AI.</span>{" "}
          <span style={{ color: theme.accent }}>Refine with Humans.</span>
        </h1>

        <div style={{ width: "100%", maxWidth: "860px", marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Tell us what you're building or how we can help...."
            style={{
              width: "100%",
              height: "60px",
              padding: "0 22px",
              fontSize: "16px",
              lineHeight: 1,
              borderRadius: "16px",
              background: "linear-gradient(145deg, rgba(10,18,24,0.92), rgba(8,14,18,0.84))",
              border: `1px solid ${theme.border}`,
              color: theme.text,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              outline: "none",
            }}
          />
        </div>

        <div style={{ fontSize: "16px", color: theme.textMuted, marginBottom: "7px", letterSpacing: "0.08em", textTransform: "uppercase" }}>or</div>
      </section>

      <section className="cards-grid" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 88px", display: "flex", gap: "16px", alignItems: "stretch" }}>
        {serviceCards.map((card) => (
          <div key={card.title} style={{ ...glassCardStyle, display: "flex", flexDirection: "column", alignSelf: "stretch", flex: "1 1 0" }}>
            <div style={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.18em", color: theme.textMuted, marginBottom: "18px", textTransform: "uppercase" }}>
              {card.number}
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "16px", fontFamily: "Space Grotesk, sans-serif", color: card.titleColor, letterSpacing: "0.01em" }}>
              {card.title}
            </h2>
            <p style={{ fontSize: "15px", lineHeight: 1.7, color: theme.textMuted, margin: 0 }}>{card.description}</p>

            {card.number === "02" && <MvpFlow />}
            {card.featuredProfiles && card.featuredLabel && <FeaturedProfiles label={card.featuredLabel} profiles={card.featuredProfiles} />}

            <div style={{ flex: 1 }} />

            {card.buttonText && card.buttonHref && (
              <Link href={card.buttonHref} style={{ ...outlineButtonStyle, marginTop: "22px" }}>
                <span>{card.buttonText}</span>
                <span>{">"}</span>
              </Link>
            )}
          </div>
        ))}
      </section>
    </SiteShell>
  );
}
