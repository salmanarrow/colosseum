import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Countdown from "@/components/Countdown";
import GameGrid from "@/components/GameGrid";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />

      {/* ── Hero ── */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "7rem 1.5rem 4rem",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {/* Decorative blobs */}
        <div
          className="blob blob--purple"
          style={{ width: 520, height: 520, top: "-80px", right: "-120px" }}
        />
        <div
          className="blob blob--teal"
          style={{ width: 380, height: 380, bottom: "60px", left: "-100px" }}
        />
        <div
          className="blob"
          style={{
            width: 300,
            height: 300,
            top: "40%",
            right: "20%",
            background: "#8B0000",
            opacity: 0.25,
          }}
        />

        {/* Institution logos */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "2.5rem",
            position: "relative",
          }}
        >
          <Image
            src="/brand/roots-logo.jpg"
            alt="ROOTS International"
            width={56}
            height={56}
            style={{ borderRadius: "10px", objectFit: "cover" }}
          />
          <span style={{ color: "var(--text-muted)", fontSize: "1.5rem" }}>×</span>
          <Image
            src="/brand/miuc-logo.jpg"
            alt="MIUC"
            width={56}
            height={56}
            style={{ borderRadius: "10px", objectFit: "cover" }}
          />
        </div>

        <p className="eyebrow" style={{ marginBottom: "1.25rem" }}>
          Pakistan's Premier Collegiate E-Sports Championship
        </p>

        {/* Gold-foil hero wordmark */}
        <h1
          className="display text-gold-foil"
          style={{
            fontSize: "clamp(3.5rem, 14vw, 10rem)",
            marginBottom: "0.25rem",
            filter: "drop-shadow(0 0 40px rgba(245,200,66,0.25))",
          }}
        >
          The
        </h1>
        <h1
          className="display text-gold-foil"
          style={{
            fontSize: "clamp(3rem, 12vw, 8.5rem)",
            marginBottom: "1.5rem",
            filter: "drop-shadow(0 0 40px rgba(245,200,66,0.25))",
          }}
        >
          Colosseum
        </h1>

        {/* Event details pill */}
        <div
          className="glass"
          style={{
            padding: "0.6rem 1.5rem",
            marginBottom: "3rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "1rem",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
          }}
        >
          <span style={{ color: "var(--teal)" }}>📍</span>
          ROOTS H-8 Flagship Campus, Islamabad
          <span style={{ color: "var(--border-glass)" }}>|</span>
          <span>3 Days · 9 Titles · 500+ Players</span>
        </div>

        {/* Countdown */}
        <div style={{ marginBottom: "3.5rem" }}>
          <p
            className="eyebrow"
            style={{ marginBottom: "1.25rem", color: "var(--text-muted)" }}
          >
            Tournament Begins In
          </p>
          <Countdown />
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/register" className="btn-primary" style={{ fontSize: "1rem" }}>
            Register Your Squad →
          </Link>
          <Link href="/tickets" className="btn-ghost" style={{ fontSize: "1rem" }}>
            Get Spectator Pass
          </Link>
        </div>

        {/* Glass hero card — ROOTS × MIUC tagline */}
        <div
          className="glass glass--gold"
          style={{
            marginTop: "5rem",
            padding: "2rem 2.5rem",
            maxWidth: "640px",
            textAlign: "center",
          }}
        >
          <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
            The Vision
          </p>
          <blockquote
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1rem",
              lineHeight: 1.7,
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            "Establish the twin cities' first championship built for both
            colleges and universities — a gladiatorial arena that becomes
            Pakistan's flagship campus e-sports property and an annual
            tradition."
          </blockquote>
          <p
            style={{
              marginTop: "1rem",
              fontSize: "0.8rem",
              color: "var(--text-faint)",
              fontFamily: "var(--font-mono)",
            }}
          >
            — Mr. Walid Mushtaq, Executive Sponsor
          </p>
        </div>
      </section>

      {/* ── Game Grid ── */}
      <GameGrid />

      {/* ── Footer ── */}
      <Footer />
    </>
  );
}
