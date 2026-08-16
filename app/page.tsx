import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Countdown from "@/components/Countdown";
import GameGrid from "@/components/GameGrid";
import Footer from "@/components/Footer";

const STATS = [
  { value: "2", label: "Events" },
  { value: "4", label: "Event Days" },
  { value: "6", label: "Competitions" },
  { value: "2K+", label: "Expected Footfall" },
];

const PHASES = [
  {
    tag: "Event One · PreLaunch",
    dates: "5 September 2026",
    accent: "var(--violet)",
    blurb: "One day of machines, code and music to open the season.",
    tracks: [
      { emoji: "🏎️", name: "Auto Show",          desc: "Curated automotive showcase. Invited cars only." },
      { emoji: "💻", name: "Hackathon",          desc: "CTF and MVP format, with a prize pool on the line." },
      { emoji: "🤖", name: "Robotic Exhibition", desc: "Robotics showcase and live demonstrations." },
      { emoji: "🎧", name: "DJ Night — Tokyo",   desc: "Headline set from DJ Tokyo." },
      { emoji: "🎆", name: "Fireworks",          desc: "The night closes with a full fireworks display." },
    ],
  },
  {
    tag: "Event Two · The Colosseum",
    dates: "2 – 4 October 2026",
    accent: "var(--silver)",
    blurb: "Three straight days of gaming, plus the shows around it.",
    tracks: [
      { emoji: "🎮", name: "Day 1 — 2 Oct", desc: "Qualifying rounds · Gorilla Show · Jamming Session · Comedy Show" },
      { emoji: "⚔️", name: "Day 2 — 3 Oct", desc: "Semi-Finals · Cosplay competition" },
      { emoji: "🏆", name: "Day 3 — 4 Oct", desc: "Finals · Closing Ceremony · Concert" },
    ],
  },
];


export default function HomePage() {
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
          padding: "7rem 1.5rem 4rem",
          position: "relative",
          overflow: "hidden",
          textAlign: "center",
        }}
      >
        {/* Decorative blobs */}
        <div className="blob blob--purple" style={{ width: 600, height: 600, top: "-120px", right: "-160px" }} />
        <div className="blob blob--teal"   style={{ width: 420, height: 420, bottom: "40px",  left: "-120px" }} />
        <div className="blob blob--red"    style={{ width: 320, height: 320, top: "35%",      right: "15%" }} />

        {/* Institution logos */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.5rem", position: "relative", zIndex: 2 }}>
          <Image src="/brand/miuc-logo.png" alt="MIUC — host & organizer" width={3086} height={1820} style={{ height: "66px", width: "auto" }} />
          <span style={{ color: "var(--text-faint)", fontSize: "1.5rem" }}>×</span>
          <Image src="/brand/roots-logo-white.png" alt="ROOTS International — venue" width={263} height={70} style={{ height: "40px", width: "auto" }} />
        </div>

        <p className="eyebrow" style={{ marginBottom: "1.25rem", position: "relative", zIndex: 2 }}>
          Tech · Machines · Gaming · Culture
        </p>

        <h1 style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }}>
          MIUC Colosseum — PreLaunch (Auto Show, Hackathon, DJ Tokyo, Fireworks) and three days of gaming
        </h1>

        {/* Emblem */}
        <div style={{ position: "relative", zIndex: 2 }}>
          <Image
            src="/brand/colosseum-emblem.png"
            alt="The Colosseum"
            width={1254}
            height={1254}
            priority
            style={{
              width: "100%",
              maxWidth: "540px",
              height: "auto",
              marginBottom: "1.5rem",
              filter: "drop-shadow(0 0 80px rgba(200,205,217,0.28)) drop-shadow(0 0 24px rgba(255,45,98,0.15))",
              WebkitMaskImage: "radial-gradient(ellipse 78% 78% at 50% 50%, #000 58%, transparent 90%)",
              maskImage:       "radial-gradient(ellipse 78% 78% at 50% 50%, #000 58%, transparent 90%)",
            }}
          />
        </div>

        {/* Date + venue pill */}
        <div
          className="glass"
          style={{
            padding: "0.6rem 1.5rem",
            marginBottom: "2.5rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "1rem",
            fontSize: "0.875rem",
            color: "var(--text-muted)",
            position: "relative",
            zIndex: 2,
          }}
        >
          <span style={{ color: "var(--violet)" }}>◈</span>
          <span style={{ color: "var(--silver)", fontWeight: 700 }}>Sept 5 · Oct 2–4, 2026</span>
          <span style={{ color: "var(--border-glass)" }}>|</span>
          MIUC Flagship Campus H-8, Islamabad
          <span style={{ color: "var(--border-glass)" }}>|</span>
          <span>2 Events · 5 Sept + 2–4 Oct</span>
        </div>

        {/* Countdown */}
        <div style={{ marginBottom: "3rem", position: "relative", zIndex: 2 }}>
          <Countdown />
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", position: "relative", zIndex: 2, marginBottom: "1.5rem" }}>
          <Link href="/register" className="btn-primary" style={{ fontSize: "1.05rem", padding: "0.9rem 2rem" }}>
            ◈ Register Now
          </Link>
          <Link href="/tickets" className="btn-ghost" style={{ fontSize: "1.05rem", padding: "0.9rem 2rem" }}>
            View Passes & Pricing
          </Link>
          <Link href="/sponsor-inquiry" className="btn-ghost" style={{ fontSize: "1.05rem", padding: "0.9rem 2rem", borderColor: "var(--silver)", color: "var(--silver)" }}>
            Sponsor / Stall Enquiry
          </Link>
        </div>

        {/* Vision quote */}
        <div
          className="glass glass--gold"
          style={{ marginTop: "3.5rem", padding: "2rem 2.5rem", maxWidth: "640px", textAlign: "center", position: "relative", zIndex: 2 }}
        >
          <p className="eyebrow" style={{ marginBottom: "0.75rem" }}>The Vision</p>
          <blockquote style={{ fontFamily: "var(--font-body)", fontSize: "1rem", lineHeight: 1.7, color: "var(--text-muted)", fontStyle: "italic" }}>
            "Establish the twin cities' first championship built for both colleges and universities — a gladiatorial arena that becomes Pakistan's flagship campus e-sports property and an annual tradition."
          </blockquote>
          <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>
            — Mr. Walid Mushtaq, Executive Sponsor
          </p>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(90deg, rgba(176,38,255,0.08) 0%, rgba(122,23,184,0.08) 100%)",
          borderTop: "1px solid var(--border-glass)",
          borderBottom: "1px solid var(--border-glass)",
          padding: "3rem 1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: "2rem",
          }}
        >
          {STATS.map((s) => (
            <div key={s.label} className="stat-card">
              <span className="stat-value text-gold-foil">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── TWO-PHASE PROGRAMME ──────────────────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem", position: "relative", overflow: "hidden" }}>
        <div className="blob blob--purple" style={{ width: 460, height: 460, top: "10%", left: "-160px" }} />
        <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <p className="eyebrow" style={{ marginBottom: "1rem" }}>The Programme</p>
            <h2 className="display" style={{ fontSize: "clamp(2.5rem, 7vw, 4.5rem)", color: "var(--text-primary)" }}>
              Two Phases.<br /><span className="text-violet-foil">One Colosseum.</span>
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            {PHASES.map((phase) => (
              <div key={phase.tag} className="glass" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <p className="eyebrow" style={{ color: phase.accent, marginBottom: "0.5rem" }}>{phase.tag}</p>
                  <h3 className="display" style={{ fontSize: "1.9rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                    {phase.dates}
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", lineHeight: 1.6 }}>{phase.blurb}</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {phase.tracks.map((t) => (
                    <div
                      key={t.name}
                      style={{
                        display: "flex", gap: "0.9rem", alignItems: "flex-start",
                        background: "rgba(22,18,32,0.5)", border: "1px solid var(--border-glass)",
                        borderRadius: "12px", padding: "0.9rem 1rem",
                      }}
                    >
                      <span style={{ fontSize: "1.4rem", lineHeight: 1.2 }}>{t.emoji}</span>
                      <div>
                        <p style={{ fontFamily: "var(--font-display)", letterSpacing: "0.04em", textTransform: "uppercase", fontSize: "1rem", color: "var(--text-primary)" }}>
                          {t.name}
                        </p>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.5, marginTop: "0.15rem" }}>
                          {t.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAME GRID ────────────────────────────────────────────────────── */}
      <GameGrid />

      {/* ── EXTERNAL UNIVERSITY CALLOUT ──────────────────────────────────── */}
      <section style={{ padding: "5rem 1.5rem", position: "relative", overflow: "hidden" }}>
        <div className="blob blob--red" style={{ width: 400, height: 400, top: "-100px", left: "-80px" }} />
        <div className="blob blob--purple" style={{ width: 300, height: 300, bottom: "-60px", right: "-60px" }} />
        <div style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
          <p className="eyebrow" style={{ color: "var(--red-arena)", marginBottom: "1rem" }}>
            🏴 Open to All Universities
          </p>
          <h2
            className="display"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", color: "var(--text-primary)", marginBottom: "1.5rem" }}
          >
            Your Campus.<br />
            <span className="text-red-foil">Their Arena.</span><br />
            Your Move.
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: "560px", margin: "0 auto 2.5rem" }}>
            FAST, LUMS, NUST, COMSATS, IBA — we don't care what your badge says.
            If your squad has the skill, bring it. External teams are welcome. Prove you're the best.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/compete" className="btn-danger" style={{ fontSize: "1.05rem" }}>
              ⚔️ Register as External Team
            </Link>
            <Link href="/games" className="btn-ghost" style={{ fontSize: "1.05rem", borderColor: "var(--red-arena)", color: "var(--red-arena)" }}>
              View All Titles & Prizes
            </Link>
          </div>
        </div>
      </section>


      <Footer />
    </>
  );
}
