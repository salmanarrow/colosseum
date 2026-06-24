import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const TITLES = [
  { name: "Valorant",    format: "5v5",       fee: "PKR 3,500 / player", emoji: "🎯" },
  { name: "PUBG Mobile", format: "4-man Squad", fee: "PKR 2,800 / player", emoji: "🔫" },
  { name: "Free Fire MAX", format: "Squad",    fee: "PKR 2,100 / player", emoji: "🔥" },
  { name: "Tekken 8",   format: "1v1",        fee: "PKR 1,400 / player", emoji: "🥊" },
  { name: "EA FC 26",   format: "1v1",        fee: "PKR 1,400 / player", emoji: "⚽" },
];

const FAQS = [
  {
    q: "Which universities can enter?",
    a: "Any registered college or university in Pakistan. FAST, LUMS, NUST, COMSATS, IBA, AIR University — everyone is welcome. Bring your best.",
  },
  {
    q: "What's the difference between internal and external rates?",
    a: "MIUC and ROOTS campus students pay the internal rate. All other institutions pay the external rate shown above. The difference covers venue logistics and priority registration slots.",
  },
  {
    q: "How does payment work?",
    a: "Register your team online, then pay via bank transfer or through your institution's coordinator. Admin confirms once payment is cleared.",
  },
  {
    q: "Can we send multiple teams from the same university?",
    a: "Yes — no limit per institution. Bring as many squads as you want across different titles.",
  },
  {
    q: "Where is the venue?",
    a: "ROOTS H-8 Flagship Campus, Islamabad. Aug 7–9, 2026.",
  },
];

export default function CompetePage() {
  return (
    <>
      <Nav />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        className="hero-noise"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "8rem 1.5rem 5rem",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        <div className="blob blob--red"    style={{ width: 500, height: 500, top: "-100px",   right: "-120px" }} />
        <div className="blob blob--purple" style={{ width: 380, height: 380, bottom: "40px",  left: "-100px"  }} />

        <p
          className="eyebrow"
          style={{ color: "var(--red-arena)", marginBottom: "1.5rem", position: "relative", zIndex: 2 }}
        >
          🏴 External University Registration
        </p>

        <h1
          className="display"
          style={{
            fontSize: "clamp(3rem, 10vw, 8rem)",
            color: "var(--text-primary)",
            marginBottom: "1.5rem",
            lineHeight: 0.9,
            position: "relative",
            zIndex: 2,
          }}
        >
          Your City.<br />
          <span className="text-red-foil">Our Arena.</span><br />
          Settle It Here.
        </h1>

        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
            lineHeight: 1.7,
            maxWidth: "600px",
            marginBottom: "3rem",
            position: "relative",
            zIndex: 2,
          }}
        >
          The Colosseum is Islamabad's first open collegiate e-sports championship.
          External teams compete for the same titles, same prize pool, same glory.
          The only difference? You'll have to earn it against home turf.
        </p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", position: "relative", zIndex: 2 }}>
          <Link href="/register?type=external" className="btn-danger" style={{ fontSize: "1.1rem", padding: "1rem 2.2rem" }}>
            ⚔️ Register Your Squad Now
          </Link>
          <Link href="#titles" className="btn-ghost" style={{ fontSize: "1.1rem", padding: "1rem 2.2rem", borderColor: "var(--red-arena)", color: "var(--red-arena)" }}>
            View Titles & Fees ↓
          </Link>
        </div>

        {/* Date pill */}
        <div
          className="glass glass--red"
          style={{ marginTop: "4rem", padding: "0.7rem 1.8rem", display: "inline-flex", alignItems: "center", gap: "1rem", fontSize: "0.9rem", color: "var(--text-muted)", position: "relative", zIndex: 2 }}
        >
          <span style={{ color: "var(--red-arena)", fontWeight: 700 }}>Aug 7 – 9, 2026</span>
          <span style={{ color: "var(--border-glass)" }}>|</span>
          ROOTS H-8 Campus, Islamabad
          <span style={{ color: "var(--border-glass)" }}>|</span>
          <span>5 Prized Titles</span>
        </div>
      </section>

      {/* ── WHY COMPETE ──────────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem", borderTop: "1px solid var(--border-glass)" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.75rem" }}>Why You Should Enter</p>
          <h2 className="display" style={{ textAlign: "center", fontSize: "clamp(2rem, 5vw, 4rem)", marginBottom: "3rem" }}>
            What's At Stake
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
            {[
              { icon: "🏆", title: "Prize Pool", desc: "Cash prizes across 5 flagship titles. Winner takes the crown — and the money." },
              { icon: "📺", title: "Media Exposure", desc: "TV channels, streamers, and press covering the event. Win here, get seen nationwide." },
              { icon: "🎮", title: "5 Prized Titles", desc: "Valorant, PUBG Mobile, Free Fire MAX, Tekken 8, EA FC 26. Pick your battlefield." },
              { icon: "🏴", title: "Bragging Rights", desc: "First open collegiate championship in Islamabad. Beat local squads on their own turf." },
            ].map((card) => (
              <div key={card.title} className="glass glass--red" style={{ padding: "1.75rem" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{card.icon}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  {card.title}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TITLES & EXTERNAL FEES ───────────────────────────────────────── */}
      <section id="titles" style={{ padding: "5rem 1.5rem", borderTop: "1px solid var(--border-glass)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.75rem" }}>Titles Open to External Teams</p>
          <h2 className="display" style={{ textAlign: "center", fontSize: "clamp(2rem, 5vw, 4rem)", marginBottom: "3rem" }}>
            Choose Your Game
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
            {TITLES.map((t) => (
              <div key={t.name} className="glass glass--gold" style={{ padding: "1.75rem" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{t.emoji}</div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-primary)", marginBottom: "0.25rem" }}>
                  {t.name}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{t.format}</p>
                <p style={{ fontFamily: "var(--font-mono)", color: "var(--gold)", fontSize: "0.9rem" }}>{t.fee}</p>
                <span style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--red-arena)", display: "block", marginTop: "0.4rem" }}>
                  External Rate
                </span>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", color: "var(--text-faint)", marginTop: "2rem", fontSize: "0.8rem" }}>
            Base access fee (PKR 1,000) is included in all participation fees above. Citizen / spectator passes are also available.
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem", borderTop: "1px solid var(--border-glass)" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.75rem" }}>Common Questions</p>
          <h2 className="display" style={{ textAlign: "center", fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: "3rem" }}>
            FAQ
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {FAQS.map((f) => (
              <div key={f.q} className="glass" style={{ padding: "1.5rem 1.75rem" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--gold)", marginBottom: "0.6rem" }}>
                  {f.q}
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.65 }}>{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "6rem 1.5rem",
          textAlign: "center",
          borderTop: "1px solid var(--border-glass)",
          background: "linear-gradient(180deg, transparent 0%, rgba(139,0,0,0.08) 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="blob blob--red" style={{ width: 400, height: 400, top: "50%", left: "50%", transform: "translate(-50%, -50%)", opacity: 0.15 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 className="display" style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)", marginBottom: "1.5rem" }}>
            Ready to <span className="text-red-foil">Compete?</span>
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", marginBottom: "2.5rem", maxWidth: "480px", margin: "0 auto 2.5rem" }}>
            Registration closes once slots fill. Don't wait — secure your squad's spot now.
          </p>
          <Link href="/register?type=external" className="btn-danger" style={{ fontSize: "1.15rem", padding: "1.1rem 2.5rem" }}>
            ⚔️ Register Your External Squad
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
