import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Auto Show · The Colosseum",
  description:
    "Exhibit your car at The Colosseum PreLaunch Auto Show — 5 September 2026, MIUC Flagship Campus H-8, Islamabad. Invited cars only; free to exhibit.",
};

export default function AutoShowPage() {
  return (
    <>
      <Nav />
      <main style={{ minHeight: "100vh", padding: "7rem 1.5rem 4rem", position: "relative", overflow: "hidden" }}>
        <div className="blob blob--purple" style={{ width: 520, height: 520, top: "-120px", right: "-140px" }} />
        <div className="blob blob--teal"   style={{ width: 340, height: 340, bottom: "10%", left: "-110px" }} />

        <div style={{ maxWidth: "700px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.75rem" }}>
            PreLaunch · 5 September 2026
          </p>
          <h1 className="display" style={{ textAlign: "center", fontSize: "clamp(2.5rem, 8vw, 4.5rem)", marginBottom: "1rem" }}>
            The <span className="text-violet-foil">Auto Show</span>
          </h1>
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.75, marginBottom: "2.5rem" }}>
            A curated line-up of the twin cities&apos; best builds, parked under the lights at
            MIUC H-8. <strong style={{ color: "var(--silver)" }}>Invited cars only</strong>. Registration is now closed — the line-up is confirmed.
          </p>

          {/* Quick facts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", marginBottom: "2.5rem" }}>
            {[
              ["🏁", "Line-up confirmed"],
              ["✅", "Invited exhibitors"],
              ["🎫", "Vehicle gate pass"],
              ["🎆", "Stay for DJ Tokyo"],
            ].map(([icon, label]) => (
              <div key={label} className="glass" style={{ padding: "1rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.4rem", marginBottom: "0.3rem" }}>{icon}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Registration is CLOSED — the form is not rendered at all, so no
              vehicle can be submitted even if someone finds the old markup. */}
          <div className="glass glass--red" style={{ padding: "2.5rem 2rem", textAlign: "center" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🏁</div>
            <p className="display" style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", color: "var(--red-arena)", marginBottom: "0.75rem" }}>
              Auto Show Registration Closed
            </p>
            <p style={{ color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 460, margin: "0 auto" }}>
              Entries for the Auto Show are now closed and the line-up is confirmed.
              Selected exhibitors have been contacted directly with their vehicle gate pass.
            </p>
            <p style={{ color: "var(--text-faint)", fontSize: "0.85rem", lineHeight: 1.7, marginTop: "1.25rem" }}>
              You can still see the cars on the day — the Auto Show is included with
              any PreLaunch pass.
            </p>
            <a href="/tickets" className="btn-primary" style={{ justifyContent: "center", marginTop: "1.5rem", textDecoration: "none" }}>
              View PreLaunch Passes →
            </a>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
