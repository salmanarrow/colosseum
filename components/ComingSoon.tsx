import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function ComingSoon({
  title,
  blurb,
}: {
  title: string;
  blurb: string;
}) {
  return (
    <>
      <Nav />
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "8rem 1.5rem 4rem",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <div
          className="blob blob--teal"
          style={{ width: 420, height: 420, top: "10%", left: "-120px" }}
        />
        <div
          className="blob blob--purple"
          style={{ width: 420, height: 420, bottom: "5%", right: "-120px" }}
        />

        <div
          className="glass glass--gold"
          style={{
            padding: "3rem 2.5rem",
            maxWidth: "560px",
            position: "relative",
          }}
        >
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>
            Coming Soon
          </p>
          <h1
            className="display text-gold-foil"
            style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)", marginBottom: "1.25rem" }}
          >
            {title}
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "1rem",
              lineHeight: 1.7,
              marginBottom: "2rem",
            }}
          >
            {blurb}
          </p>
          <Link href="/" className="btn-ghost">
            ← Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
