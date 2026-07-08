import type { Metadata } from "next";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Register · The Colosseum",
  description: "Register for ROOTS × MIUC: The Colosseum — Aug 7–9, 2026.",
};

export default function RegisterPage() {
  return (
    <>
      <div
        style={{
          minHeight: "100vh",
          padding: "7rem 1.5rem 4rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Blobs */}
        <div className="blob blob--purple" style={{ width: 500, height: 500, top: "-100px", right: "-120px" }} />
        <div className="blob blob--teal"   style={{ width: 360, height: 360, bottom: "0",    left: "-100px" }} />

        <div style={{ maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.75rem" }}>
            Aug 7 – 9, 2026 · MIUC Flagship Campus H-8, Islamabad
          </p>
          <h1
            className="display"
            style={{ textAlign: "center", fontSize: "clamp(2.5rem, 7vw, 4.5rem)", marginBottom: "0.5rem" }}
          >
            Enter the Arena
          </h1>
          <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "3rem", fontSize: "0.95rem" }}>
            Registration fee: <strong style={{ color: "var(--gold)" }}>PKR 1,000</strong> for everyone.
            Competitors pay participation fee on top — shown at checkout.
          </p>

          <RegisterForm />
        </div>
      </div>
    </>
  );
}
