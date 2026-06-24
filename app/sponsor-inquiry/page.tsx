import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SponsorForm from "./SponsorForm";

export const metadata: Metadata = {
  title: "Partner With Us · The Colosseum",
  description: "Sponsorship and partnership inquiries for ROOTS × MIUC: The Colosseum.",
};

export default function SponsorInquiryPage() {
  return (
    <>
      <Nav />
      <main style={{ minHeight: "100vh", padding: "8rem 1.5rem 5rem", position: "relative", overflow: "hidden" }}>
        <div className="blob blob--purple" style={{ width: 480, height: 480, top: "-80px", right: "-120px" }} />
        <div className="blob blob--teal"   style={{ width: 360, height: 360, bottom: "0",   left: "-100px" }} />

        <div style={{ maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.75rem" }}>Get Involved</p>
          <h1 className="display" style={{ textAlign: "center", fontSize: "clamp(2.5rem, 7vw, 4.5rem)", marginBottom: "1rem" }}>
            Partner With <span className="text-gold-foil">Us</span>
          </h1>
          <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "3rem", lineHeight: 1.7, fontSize: "0.95rem" }}>
            Put your brand in front of 500+ players and thousands of attendees across three days.
            Sponsorship, media partnerships, institution tie-ups — fill in the form and we'll be in touch.
          </p>
          <SponsorForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
