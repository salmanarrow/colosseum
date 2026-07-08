import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Tickets · The Colosseum",
  description: "Get your pass for ROOTS × MIUC: The Colosseum — Aug 7–9, 2026.",
};

const PASSES = [
  {
    name: "Citizen Pass",
    price: "PKR 1,000",
    icon: "🏛️",
    color: "teal" as const,
    perks: [
      "Full 3-day venue access",
      "E-Sports Arena — spectate all matches",
      "Casual Arena — Forza, Ludo Star, Carrom",
      "Legacy Lounge — Chess, Carrom, Ludo",
      "Entry QR code via email on confirmation",
    ],
    cant: ["Cannot compete in prized titles"],
    cta: "Get Citizen Pass",
    href: "/register",
    note: "Select 'Observer / Spectator' on the registration form.",
  },
  {
    name: "Gladiator Pass",
    price: "From PKR 1,000",
    icon: "⚔️",
    color: "gold" as const,
    perks: [
      "Everything in the Citizen Pass",
      "Right to compete in your chosen title",
      "Bracket seeding & match check-in",
      "Prize pool eligibility",
      "Game-station QR for competitor check-in",
    ],
    cant: [],
    cta: "Register as Competitor",
    href: "/register",
    note: "Select 'Competitor / Player' and choose your game on the registration form.",
  },
];

export default function TicketsPage() {
  return (
    <>
      <Nav />
      <main style={{ minHeight: "100vh", padding: "8rem 1.5rem 5rem", position: "relative", overflow: "hidden" }}>
        <div className="blob blob--purple" style={{ width: 480, height: 480, top: "-80px", right: "-120px" }} />
        <div className="blob blob--teal"   style={{ width: 360, height: 360, bottom: "0",   left: "-100px" }} />

        <div style={{ maxWidth: "900px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.75rem" }}>
            Aug 7 – 9, 2026 · MIUC Flagship Campus H-8, Islamabad
          </p>
          <h1 className="display" style={{ textAlign: "center", fontSize: "clamp(2.5rem, 7vw, 4.5rem)", marginBottom: "0.75rem" }}>
            Get Your Pass
          </h1>
          <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "3.5rem", lineHeight: 1.7, maxWidth: "520px", margin: "0 auto 3.5rem" }}>
            Every attendee — competitor or spectator — holds a valid pass.
            Choose yours below and complete registration to secure your spot.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
            {PASSES.map((pass) => (
              <div
                key={pass.name}
                className={pass.color === "gold" ? "glass glass--gold" : "glass glass--teal"}
                style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "2.2rem" }}>{pass.icon}</span>
                  <div>
                    <p style={{
                      fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase",
                      color: pass.color === "gold" ? "var(--gold)" : "var(--teal)", marginBottom: "0.2rem",
                    }}>
                      Your Pass
                    </p>
                    <h2 className="display" style={{ fontSize: "1.7rem", color: "var(--text-primary)" }}>
                      {pass.name}
                    </h2>
                  </div>
                </div>

                {/* Price */}
                <p style={{
                  fontFamily: "var(--font-mono)", fontSize: "1.6rem", fontWeight: 700,
                  color: pass.color === "gold" ? "var(--gold)" : "var(--teal)",
                }}>
                  {pass.price}
                </p>

                {/* Perks */}
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {pass.perks.map((perk) => (
                    <li key={perk} style={{ display: "flex", gap: "0.6rem", fontSize: "0.875rem", color: "var(--text-muted)", alignItems: "flex-start" }}>
                      <span style={{ color: pass.color === "gold" ? "var(--gold)" : "var(--teal)", flexShrink: 0, marginTop: "1px" }}>✓</span>
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

                {/* Disclaimer */}
                <div style={{
                  background: pass.color === "gold" ? "rgba(245,200,66,0.06)" : "rgba(0,194,168,0.06)",
                  border: `1px solid ${pass.color === "gold" ? "rgba(245,200,66,0.2)" : "rgba(0,194,168,0.2)"}`,
                  borderRadius: "8px", padding: "0.75rem 1rem",
                  fontSize: "0.78rem", color: "var(--text-faint)", lineHeight: 1.6,
                }}>
                  ℹ️ {pass.note}
                </div>

                <Link
                  href={pass.href}
                  className={pass.color === "gold" ? "btn-primary" : "btn-ghost"}
                  style={{ justifyContent: "center", fontSize: "0.95rem", marginTop: "auto",
                    ...(pass.color === "teal" ? { borderColor: "var(--teal)", color: "var(--teal)" } : {}),
                  }}
                >
                  {pass.cta} →
                </Link>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <div className="glass" style={{ marginTop: "2.5rem", padding: "1.25rem 1.75rem", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.65 }}>
              All passes are subject to payment verification. Your entry QR code is issued once payment is confirmed by the team.
              Passes are non-transferable. For external university teams,{" "}
              <Link href="/compete" style={{ color: "var(--red-arena)" }}>register here</Link>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
