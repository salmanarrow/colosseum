import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Vision · The Colosseum",
  description:
    "The vision behind ROOTS × MIUC: The Colosseum, as set out by executive sponsor Mr. Walid Mushtaq.",
};

export default function VisionPage() {
  return (
    <>
      <Nav />
      <main style={{ position: "relative", overflow: "hidden" }}>
        <div
          className="blob blob--purple"
          style={{ width: 520, height: 520, top: "-120px", left: "-140px" }}
        />
        <div
          className="blob blob--teal"
          style={{ width: 380, height: 380, bottom: "10%", right: "-120px" }}
        />

        {/* Hero quote */}
        <section
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "9rem 1.5rem 3rem",
            textAlign: "center",
          }}
        >
          <p className="eyebrow" style={{ marginBottom: "1.25rem" }}>
            The Vision
          </p>
          <h1
            className="display"
            style={{
              fontSize: "clamp(2.5rem, 8vw, 5rem)",
              color: "var(--text-primary)",
              marginBottom: "2.5rem",
            }}
          >
            Building Pakistan&apos;s
            <br />
            <span className="text-gold-foil">Campus Arena</span>
          </h1>

          <div
            className="glass glass--gold"
            style={{ padding: "3rem 2.5rem", maxWidth: "720px", margin: "0 auto" }}
          >
            <span
              className="display text-gold-foil"
              style={{ fontSize: "4rem", lineHeight: 0.5, display: "block", marginBottom: "1rem" }}
            >
              &ldquo;
            </span>
            <blockquote
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
                lineHeight: 1.6,
                color: "var(--text-primary)",
                fontStyle: "italic",
              }}
            >
              Establish the twin cities&apos; first championship built for both
              colleges and universities — a gladiatorial arena that becomes
              Pakistan&apos;s flagship campus e-sports property and an annual
              tradition.
            </blockquote>
          </div>
        </section>

        {/* Portrait + bio */}
        <section
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "2rem 1.5rem 5rem",
          }}
        >
          <div
            className="glass"
            style={{
              padding: "2.5rem",
              display: "grid",
              gridTemplateColumns: "minmax(0, 200px) 1fr",
              gap: "2.5rem",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Image
                src="/brand/walid-mushtaq.jpg"
                alt="Mr. Walid Mushtaq"
                width={200}
                height={240}
                style={{
                  borderRadius: "14px",
                  objectFit: "cover",
                  border: "1px solid var(--border-gold)",
                  width: "100%",
                  maxWidth: "200px",
                  height: "auto",
                }}
              />
            </div>
            <div>
              <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>
                Executive Sponsor
              </p>
              <h2
                className="display"
                style={{
                  fontSize: "clamp(1.8rem, 5vw, 2.75rem)",
                  color: "var(--text-primary)",
                  marginBottom: "1rem",
                }}
              >
                Mr. Walid Mushtaq
              </h2>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.8, fontSize: "1rem" }}>
                As executive sponsor of The Colosseum, Mr. Walid Mushtaq champions
                a singular ambition: to give Pakistan&apos;s collegiate gamers a
                stage worthy of their talent. The Colosseum is conceived not as a
                one-off tournament, but as the foundation of a lasting institution —
                an annual property that grows with every edition and sets the
                national benchmark for campus e-sports.
              </p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "3.5rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/register" className="btn-primary">
              Join the Arena →
            </Link>
            <Link href="/about" className="btn-ghost">
              Learn More
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
