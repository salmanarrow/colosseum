import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Passes & Pricing · The Colosseum",
  description:
    "Passes for The Colosseum — Hackathon (5–6 Sept) and E-Gaming, Cosplay & Social Night (2–4 Oct). Separate pricing per track.",
};

type Pass = {
  name: string;
  price: string;
  priceNote?: string;
  icon: string;
  accent: "violet" | "silver";
  perks: string[];
  cant: string[];
  cta: string;
  href: string;
  note: string;
  tba?: boolean;
};

const PHASE_ONE: Pass[] = [
  {
    name: "Hackathon Pass",
    price: "PKR 3,500",
    priceNote: "per participant",
    icon: "💻",
    accent: "violet",
    perks: [
      "Two-day innovation sprint (5–6 Sept)",
      "Team or solo entry",
      "Mentor access & judging panel",
      "Prize eligibility",
      "Entry to the Robotic Exhibition & Auto Show",
      "DJ Night / Jamming access",
    ],
    cant: ["Does not include the October Main Event"],
    cta: "Register for Hackathon",
    href: "/register",
    note: "Pre-Launch phase — 5–6 September 2026.",
  },
  {
    name: "Auto Show Entry",
    price: "By invitation",
    icon: "🏎️",
    accent: "silver",
    perks: [
      "Curated automotive showcase",
      "Invited vehicles only — controlled access",
      "Owner/exhibitor passes issued on approval",
      "Robotic Exhibition & DJ Night access",
    ],
    cant: [],
    cta: "Request Car Registration",
    href: "/sponsor-inquiry",
    note: "Entries are reviewed by the Auto Show team before approval.",
  },
];

const PHASE_TWO: Pass[] = [
  {
    name: "Citizen Pass",
    price: "PKR 1,000",
    priceNote: "all three days",
    icon: "🏛️",
    accent: "violet",
    perks: [
      "Full 3-day Main Event access (2–4 Oct)",
      "E-Gaming Arena — spectate all matches",
      "Cosplay day — attend and enter the contest",
      "Casual Arena & Legacy Lounge — play freely",
      "Brand activations & stalls",
      "Entry QR code via email on confirmation",
    ],
    cant: ["Cannot compete in the 5 prized e-gaming titles"],
    cta: "Get Citizen Pass",
    href: "/register",
    note: "Select 'Observer / Spectator' on the registration form.",
  },
  {
    name: "Gladiator Pass",
    price: "From PKR 1,000",
    priceNote: "per title — see game grid",
    icon: "⚔️",
    accent: "silver",
    perks: [
      "Everything in the Citizen Pass",
      "Right to compete in your chosen e-gaming title",
      "Bracket seeding & match check-in",
      "Prize pool eligibility",
      "Game-station QR for competitor check-in",
    ],
    cant: [],
    cta: "Register as Competitor",
    href: "/register",
    note: "Select 'Competitor / Player' and choose your game. Upgradeable from a Citizen Pass at the venue.",
  },
  {
    name: "Social Night Pass",
    price: "Announcing soon",
    icon: "🌃",
    accent: "violet",
    tba: true,
    perks: [
      "The headline closing experience (4 Oct)",
      "Live entertainment & music",
      "Open to attendees and guests",
    ],
    cant: [],
    cta: "Notify Me",
    href: "/register",
    note: "Pricing is being finalised by the committee.",
  },
  {
    name: "E-Gaming + Social",
    price: "Announcing soon",
    icon: "🎟️",
    accent: "silver",
    tba: true,
    perks: [
      "Citizen Pass for all three Main Event days",
      "Social Night entry included",
      "Bundled at less than buying both separately",
    ],
    cant: [],
    cta: "Notify Me",
    href: "/register",
    note: "Combo pricing is being finalised alongside the Social Night.",
  },
];

function PassCard({ pass }: { pass: Pass }) {
  const accentVar = pass.accent === "silver" ? "var(--silver)" : "var(--violet)";
  const tintBg = pass.accent === "silver" ? "rgba(200,205,217,0.06)" : "rgba(176,38,255,0.06)";
  const tintBorder = pass.accent === "silver" ? "rgba(200,205,217,0.2)" : "rgba(176,38,255,0.2)";

  return (
    <div
      className={pass.accent === "silver" ? "glass glass--gold" : "glass glass--teal"}
      style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem", opacity: pass.tba ? 0.85 : 1 }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ fontSize: "2.2rem" }}>{pass.icon}</span>
        <div>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: accentVar, marginBottom: "0.2rem" }}>
            {pass.tba ? "Coming Soon" : "Your Pass"}
          </p>
          <h3 className="display" style={{ fontSize: "1.6rem", color: "var(--text-primary)" }}>{pass.name}</h3>
        </div>
      </div>

      <div>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: pass.tba ? "1.05rem" : "1.6rem", fontWeight: 700, color: accentVar }}>
          {pass.price}
        </p>
        {pass.priceNote && (
          <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginTop: "0.2rem" }}>{pass.priceNote}</p>
        )}
      </div>

      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {pass.perks.map((perk) => (
          <li key={perk} style={{ display: "flex", gap: "0.6rem", fontSize: "0.875rem", color: "var(--text-muted)", alignItems: "flex-start" }}>
            <span style={{ color: accentVar, flexShrink: 0, marginTop: "1px" }}>✓</span>
            {perk}
          </li>
        ))}
        {pass.cant.map((item) => (
          <li key={item} style={{ display: "flex", gap: "0.6rem", fontSize: "0.875rem", color: "var(--text-faint)", alignItems: "flex-start" }}>
            <span style={{ flexShrink: 0, marginTop: "1px" }}>✗</span>
            {item}
          </li>
        ))}
      </ul>

      <div style={{
        background: tintBg, border: `1px solid ${tintBorder}`, borderRadius: "8px",
        padding: "0.75rem 1rem", fontSize: "0.78rem", color: "var(--text-faint)", lineHeight: 1.6,
      }}>
        ℹ️ {pass.note}
      </div>

      <Link
        href={pass.href}
        className={pass.accent === "silver" ? "btn-primary" : "btn-ghost"}
        style={{
          justifyContent: "center", fontSize: "0.95rem", marginTop: "auto",
          ...(pass.accent === "violet" ? { borderColor: "var(--violet)", color: "var(--violet)" } : {}),
        }}
      >
        {pass.cta} →
      </Link>
    </div>
  );
}

function PhaseBlock({ tag, dates, blurb, passes }: { tag: string; dates: string; blurb: string; passes: Pass[] }) {
  return (
    <section style={{ marginBottom: "4rem" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <p className="eyebrow" style={{ marginBottom: "0.4rem" }}>{tag}</p>
        <h2 className="display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "var(--text-primary)", marginBottom: "0.4rem" }}>
          {dates}
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>{blurb}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: "1.5rem" }}>
        {passes.map((p) => <PassCard key={p.name} pass={p} />)}
      </div>
    </section>
  );
}

export default function TicketsPage() {
  return (
    <>
      <Nav />
      <main style={{ minHeight: "100vh", padding: "8rem 1.5rem 5rem", position: "relative", overflow: "hidden" }}>
        <div className="blob blob--purple" style={{ width: 480, height: 480, top: "-80px", right: "-120px" }} />
        <div className="blob blob--teal"   style={{ width: 360, height: 360, bottom: "0",   left: "-100px" }} />

        <div style={{ maxWidth: "1080px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.75rem" }}>
            MIUC Flagship Campus H-8, Islamabad
          </p>
          <h1 className="display" style={{ textAlign: "center", fontSize: "clamp(2.5rem, 7vw, 4.5rem)", marginBottom: "0.75rem" }}>
            Passes &amp; <span className="text-violet-foil">Pricing</span>
          </h1>
          <p style={{ textAlign: "center", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: "600px", margin: "0 auto 3.5rem" }}>
            Each track is ticketed separately. Buy only the phase you want — or both.
            Cosplay is included with every Main Event pass.
          </p>

          <PhaseBlock
            tag="Phase One · Pre-Launch"
            dates="5 – 6 September 2026"
            blurb="Hackathon · Robotic Exhibition · Auto Show · DJ Night / Jamming"
            passes={PHASE_ONE}
          />

          <PhaseBlock
            tag="Phase Two · Main Event"
            dates="2 – 4 October 2026"
            blurb="E-Gaming · Cosplay · Social Night · Brand activations & stalls"
            passes={PHASE_TWO}
          />

          <div className="glass" style={{ padding: "1.25rem 1.75rem", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.65 }}>
              All passes are subject to payment verification — your entry QR code is issued once payment is confirmed.
              Passes are non-transferable. Internal rates apply to MIUC and ROOTS students (any campus); external
              institutions pay the external rate shown at registration. Brands and stall enquiries:{" "}
              <Link href="/sponsor-inquiry" style={{ color: "var(--violet)" }}>get in touch</Link>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
