import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Sponsors · The Colosseum",
  description:
    "Partners powering ROOTS × MIUC: The Colosseum. Become a sponsor of Pakistan's flagship campus e-sports championship.",
};

type Tier = "title" | "platinum" | "gold" | "silver" | "in_kind";

type Sponsor = {
  name: string;
  tier: Tier;
  logoUrl?: string | null;
  websiteUrl?: string | null;
};

// TODO: replace with a query against the `sponsors` table (Supabase/Drizzle).
// Admins add sponsors there; this page + the homepage wall read from it.
// Render name-only styled cards until a logo_url is supplied.
const SPONSORS: Sponsor[] = [];

const TIER_META: Record<Tier, { label: string; gold: boolean }> = {
  title: { label: "Title Partner", gold: true },
  platinum: { label: "Platinum", gold: true },
  gold: { label: "Gold", gold: true },
  silver: { label: "Silver", gold: false },
  in_kind: { label: "In-Kind Partners", gold: false },
};

const TIER_ORDER: Tier[] = ["title", "platinum", "gold", "silver", "in_kind"];

function SponsorCard({ s }: { s: Sponsor }) {
  return (
    <div
      className={TIER_META[s.tier].gold ? "glass glass--gold" : "glass"}
      style={{
        padding: "1.75rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "120px",
        textAlign: "center",
      }}
    >
      {/* logo support arrives with the sponsors table; name-only for now */}
      <span
        style={{
          fontFamily: "var(--font-display)",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          fontSize: "1.4rem",
          color: "var(--text-primary)",
        }}
      >
        {s.name}
      </span>
    </div>
  );
}

export default function SponsorsPage() {
  const hasSponsors = SPONSORS.length > 0;

  return (
    <>
      <Nav />
      <main style={{ position: "relative", overflow: "hidden" }}>
        <div
          className="blob blob--teal"
          style={{ width: 480, height: 480, top: "-100px", right: "-140px" }}
        />

        <section
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "9rem 1.5rem 2rem",
            textAlign: "center",
          }}
        >
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>
            Our Partners
          </p>
          <h1
            className="display"
            style={{
              fontSize: "clamp(3rem, 10vw, 6rem)",
              color: "var(--text-primary)",
              marginBottom: "1.5rem",
            }}
          >
            <span className="text-gold-foil">Sponsors</span>
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.125rem", lineHeight: 1.8 }}>
            The brands and institutions powering Pakistan&apos;s flagship campus
            e-sports championship.
          </p>
        </section>

        {/* Tiers */}
        <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
          {hasSponsors ? (
            TIER_ORDER.map((tier) => {
              const inTier = SPONSORS.filter((s) => s.tier === tier);
              if (inTier.length === 0) return null;
              return (
                <div key={tier} style={{ marginBottom: "3rem" }}>
                  <p
                    className="eyebrow"
                    style={{
                      textAlign: "center",
                      marginBottom: "1.5rem",
                      color: TIER_META[tier].gold ? "var(--gold)" : "var(--teal)",
                    }}
                  >
                    {TIER_META[tier].label}
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        tier === "title"
                          ? "minmax(0, 480px)"
                          : "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "1rem",
                      justifyContent: "center",
                    }}
                  >
                    {inTier.map((s) => (
                      <SponsorCard key={s.name} s={s} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div
              className="glass glass--gold"
              style={{ padding: "3rem 2.5rem", textAlign: "center", maxWidth: "560px", margin: "0 auto" }}
            >
              <h2
                className="display"
                style={{ fontSize: "clamp(1.8rem, 5vw, 2.5rem)", color: "var(--text-primary)", marginBottom: "1rem" }}
              >
                Be the <span className="text-gold-foil">First</span>
              </h2>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "2rem" }}>
                Sponsor slots for The Colosseum are opening now. Put your brand in
                front of 500+ players and thousands of attendees across three days.
              </p>
              <Link href="/sponsor-inquiry" className="btn-primary">
                Become a Sponsor →
              </Link>
            </div>
          )}
        </section>

        {hasSponsors && (
          <section style={{ textAlign: "center", padding: "0 1.5rem 5rem" }}>
            <Link href="/sponsor-inquiry" className="btn-ghost">
              Become a Sponsor →
            </Link>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
