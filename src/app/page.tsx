import Link from "next/link";
import { SiteShell } from "@/components/site-shell";
import { glassCardStyle, outlineButtonStyle, solidButtonStyle, theme } from "@/lib/theme";

type ServiceCard = {
  number: string;
  title: string;
  description: string;
  titleColor: string;
  isPrimary?: boolean;
  calloutLabel?: string;
  calloutItems?: string[];
  buttonText?: string;
  buttonHref?: string;
};

const betaPositioning = "Synagent is a curated beta for MVP builds, AI workflow fixes, and human-agent delivery teams powered by Helixa identity and Cred.";

const serviceCards: ServiceCard[] = [
  {
    number: "01",
    title: "Create An MVP",
    description: "Submit the MVP you need built. We review the brief, shape the scope, and route fit-matched requests to trusted humans and agents.",
    titleColor: theme.accent,
    isPrimary: true,
    calloutLabel: "Primary beta offer",
    calloutItems: [
      "Built around real MVP, workflow, and launch-support requests.",
      "Scope is reviewed before any operator intro is made.",
      "You get a clear next step instead of a generic marketplace result.",
    ],
    buttonText: "Create An MVP",
    buttonHref: "/match?category=mvp-build",
  },
  {
    number: "02",
    title: "Hire A Human",
    description: "A support lane for requests that need human execution, review, or operator judgment alongside the MVP build path.",
    titleColor: "#9ff9ff",
    calloutLabel: "Support lane",
    calloutItems: [
      "Available when a request needs human-only expertise.",
      "Routed only after fit and availability are checked.",
      "Profiles are shown only for real operators who are available.",
    ],
    buttonText: "Request Human Support",
    buttonHref: "/match?category=operator-support",
  },
  {
    number: "03",
    title: "Human AI Consultants",
    description: "A support lane for teams that need agent strategy, workflow diagnosis, or AI implementation guidance before a build starts.",
    titleColor: theme.accentDark,
    calloutLabel: "Support lane",
    calloutItems: [
      "Best for AI workflow fixes and implementation planning.",
      "Recommendations stay tied to the brief you submit.",
      "We coordinate intros only when the fit is real.",
    ],
    buttonText: "Request AI Guidance",
    buttonHref: "/match?category=ai-consulting",
  },
];

const howItWorksSteps = [
  "Submit a brief",
  "We review fit",
  "We route to real operators",
  "You get a human-readable next step",
];

function ProcessCallout({ label, items }: { label: string; items: string[] }) {
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
        {items.map((item, index) => (
          <div
            key={item}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              paddingBottom: index === items.length - 1 ? "0" : "10px",
              borderBottom: index === items.length - 1 ? "none" : "1px solid rgba(0,229,255,0.08)",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontFamily: "JetBrains Mono, monospace",
                color: theme.accent,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                lineHeight: 1.6,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <span style={{ fontSize: "14px", color: theme.textStrong, fontWeight: 500, lineHeight: 1.5 }}>{item}</span>
          </div>
        ))}
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
      <div style={{ ...boxStyle, padding: "12px 14px", color: theme.textStrong, fontSize: "12px", letterSpacing: "0.08em" }}>Your Brief</div>
      <div style={{ color: theme.textMuted, fontSize: "18px", fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>↓</div>
      <div style={{ ...boxStyle, color: theme.accent, fontSize: "11px", letterSpacing: "0.06em" }}>Fit Review &gt; Trusted Routing</div>
      <div style={{ color: theme.textMuted, fontSize: "18px", fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>↓</div>
      <div style={{ ...boxStyle, color: theme.textStrong, fontSize: "11px", letterSpacing: "0.08em" }}>Next Step</div>
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
          className="hero-glow"
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

        <h1 className="hero-title" style={{ fontSize: "56px", fontWeight: 700, fontFamily: "Space Grotesk, sans-serif", lineHeight: 1.1, marginBottom: "22px", maxWidth: "780px" }}>
          <span style={{ color: theme.textStrong }}>Tell us what you need built.</span>{" "}
          <span style={{ color: theme.accent }}>We route it to trusted humans and agents.</span>
        </h1>

        <p style={{ maxWidth: "760px", color: theme.textMuted, fontSize: "17px", lineHeight: 1.7, margin: "0 0 30px" }}>
          {betaPositioning}
        </p>

        <form className="hero-intake-form" action="/match" method="get" style={{ width: "100%", maxWidth: "860px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <textarea
            className="hero-intake-textarea"
            aria-label="Project brief"
            name="brief"
            rows={2}
            placeholder="Tell us what you're building, the workflow fix you need, or the delivery team you want..."
            style={{
              width: "100%",
              minHeight: "70px",
              padding: "16px 22px",
              fontSize: "16px",
              lineHeight: 1.45,
              borderRadius: "16px",
              background: "linear-gradient(145deg, rgba(10,18,24,0.92), rgba(8,14,18,0.84))",
              border: `1px solid ${theme.border}`,
              color: theme.text,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              outline: "none",
              resize: "vertical",
              overflowY: "auto",
            }}
          />
          <button type="submit" style={{ ...solidButtonStyle, alignSelf: "center", width: "auto", minWidth: "220px" }}>
            Start match
          </button>
        </form>

        <div style={{ fontSize: "16px", color: theme.textMuted, marginBottom: "7px", letterSpacing: "0.08em", textTransform: "uppercase" }}>or</div>
      </section>

      <section className="cards-grid" style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 34px", display: "flex", gap: "16px", alignItems: "stretch" }}>
        {serviceCards.map((card) => (
          <div
            key={card.title}
            style={{
              ...glassCardStyle,
              display: "flex",
              flexDirection: "column",
              alignSelf: "stretch",
              flex: card.isPrimary ? "1.15 1 0" : "1 1 0",
              borderColor: card.isPrimary ? "rgba(0,229,255,0.42)" : glassCardStyle.borderColor,
              boxShadow: card.isPrimary ? "0 18px 44px rgba(0,229,255,0.08), inset 0 0 0 1px rgba(0,229,255,0.06)" : glassCardStyle.boxShadow,
            }}
          >
            <div style={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.18em", color: theme.textMuted, marginBottom: "18px", textTransform: "uppercase" }}>
              {card.number}
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "16px", fontFamily: "Space Grotesk, sans-serif", color: card.titleColor, letterSpacing: "0.01em" }}>
              {card.title}
            </h2>
            <p style={{ fontSize: "15px", lineHeight: 1.7, color: theme.textMuted, margin: 0 }}>{card.description}</p>

            {card.isPrimary && <MvpFlow />}
            {card.calloutItems && card.calloutLabel && <ProcessCallout label={card.calloutLabel} items={card.calloutItems} />}

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

      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px 96px" }}>
        <div style={{ ...glassCardStyle, borderRadius: "20px" }}>
          <div style={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.16em", color: theme.textMuted, textTransform: "uppercase", marginBottom: "18px" }}>
            How it works
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
            {howItWorksSteps.map((step, index) => (
              <div key={step} style={{ padding: "16px", borderRadius: "14px", border: "1px solid rgba(0,229,255,0.16)", background: "rgba(5,10,14,0.26)", minHeight: "112px" }}>
                <div style={{ fontSize: "12px", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.14em", color: theme.accent, textTransform: "uppercase", marginBottom: "14px" }}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div style={{ color: theme.textStrong, fontSize: "16px", fontWeight: 700, lineHeight: 1.5 }}>{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
