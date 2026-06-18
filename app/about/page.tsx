import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "About · The Colosseum",
  description:
    "ROOTS × MIUC: The Colosseum — a 3-day nationwide collegiate e-sports championship in Islamabad–Rawalpindi. Learn the story, the format, and the host institutions.",
};

const FACTS = [
  { value: "3", label: "Days of Competition" },
  { value: "9", label: "Game Titles" },
  { value: "500+", label: "Players Expected" },
  { value: "5K", label: "Footfall" },
];

const FLAGSHIP = [
  "Valorant (5v5)",
  "PUBG Mobile (Squad)",
  "Free Fire MAX (Squad)",
  "Tekken 8 (1v1)",
  "EA FC 26 (1v1)",
];

const FESTIVAL = ["Forza (Racing)", "Ludo Star", "Chess", "Carrom"];

export default function AboutPage() {
  return (
    <>
      <Nav />
      <main style={{ position: "relative", overflow: "hidden" }}>
        <div
          className="blob blob--purple"
          style={{ width: 480, height: 480, top: "-100px", right: "-140px" }}
        />

        {/* Header */}
        <section
          style={{
            maxWidth: "820px",
            margin: "0 auto",
            padding: "9rem 1.5rem 3rem",
            textAlign: "center",
          }}
        >
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>
            The Story
          </p>
          <h1
            className="display"
            style={{
              fontSize: "clamp(3rem, 10vw, 6rem)",
              color: "var(--text-primary)",
              marginBottom: "1.5rem",
            }}
          >
            About the <span className="text-gold-foil">Arena</span>
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "1.125rem",
              lineHeight: 1.8,
            }}
          >
            <strong style={{ color: "var(--text-primary)" }}>
              ROOTS × MIUC: The Colosseum
            </strong>{" "}
            is a 3-day nationwide collegiate e-sports championship hosted across
            the twin cities of Islamabad and Rawalpindi. Built for both colleges
            and universities, it brings together Pakistan&apos;s most competitive
            campus gamers under one roof — a gladiatorial arena where squads rise,
            rivalries ignite, and champions are crowned.
          </p>
        </section>

        {/* Stat band */}
        <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "1rem 1.5rem 4rem" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "1rem",
            }}
          >
            {FACTS.map((f) => (
              <div
                key={f.label}
                className="glass"
                style={{ padding: "1.75rem 1rem", textAlign: "center" }}
              >
                <div
                  className="display text-gold-foil"
                  style={{ fontSize: "clamp(2.5rem, 6vw, 3.5rem)" }}
                >
                  {f.value}
                </div>
                <p
                  className="eyebrow"
                  style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}
                >
                  {f.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Format: Flagship vs Festival */}
        <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "1rem 1.5rem 4rem" }}>
          <h2
            className="display"
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              color: "var(--text-primary)",
              textAlign: "center",
              marginBottom: "2.5rem",
            }}
          >
            The Format
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <div className="glass glass--gold" style={{ padding: "2rem" }}>
              <p className="eyebrow" style={{ color: "var(--gold)", marginBottom: "0.75rem" }}>
                Flagship Competitive
              </p>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "1.25rem" }}>
                The marquee bracket. Five high-stakes titles where squads battle
                through seeded brackets for the championship. Each carries a
                participation fee on top of the base entry.
              </p>
              <ul style={{ listStyle: "none", display: "grid", gap: "0.6rem" }}>
                {FLAGSHIP.map((g) => (
                  <li
                    key={g}
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "0.95rem",
                      display: "flex",
                      gap: "0.6rem",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: "var(--gold)" }}>▸</span> {g}
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass" style={{ padding: "2rem" }}>
              <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
                Festival &amp; Legacy
              </p>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "1.25rem" }}>
                The casual heart of the event. Drop-in queues for board and legacy
                games — included free with the PKR 1,000 base entry. No squad
                required, just show up and play.
              </p>
              <ul style={{ listStyle: "none", display: "grid", gap: "0.6rem" }}>
                {FESTIVAL.map((g) => (
                  <li
                    key={g}
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "0.95rem",
                      display: "flex",
                      gap: "0.6rem",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ color: "var(--teal)" }}>▸</span> {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Host institutions */}
        <section style={{ maxWidth: "1000px", margin: "0 auto", padding: "1rem 1.5rem 5rem" }}>
          <h2
            className="display"
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              color: "var(--text-primary)",
              textAlign: "center",
              marginBottom: "2.5rem",
            }}
          >
            The Hosts
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "1.5rem",
            }}
          >
            <div className="glass" style={{ padding: "2rem", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
              <Image
                src="/brand/roots-logo.jpg"
                alt="ROOTS International Schools & Colleges"
                width={64}
                height={64}
                style={{ borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
              />
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", letterSpacing: "0.04em", fontSize: "1.3rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                  ROOTS International
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                  Host venue and flagship campus. The ROOTS H-8 Flagship Campus in
                  Islamabad becomes the arena floor for all three days of
                  competition.
                </p>
              </div>
            </div>

            <div className="glass" style={{ padding: "2rem", display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
              <Image
                src="/brand/miuc-logo.jpg"
                alt="Metropolitan International United College"
                width={64}
                height={64}
                style={{ borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
              />
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", letterSpacing: "0.04em", fontSize: "1.3rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                  MIUC
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
                  Metropolitan International United College — co-host and the brand
                  behind the championship&apos;s teal-and-purple identity.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", marginTop: "3.5rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" className="btn-primary">
              Register Your Squad →
            </Link>
            <Link href="/vision" className="btn-ghost">
              Read the Vision
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
