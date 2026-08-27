import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/db";
import { games } from "@/db/schema";
import { eq } from "drizzle-orm";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

// Read live so published prices can never drift from what checkout charges.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Passes & Pricing · The Colosseum",
  description:
    "Passes for The Colosseum — PreLaunch on 5 September (Hackathon, Auto Show, Robotics, DJ Night, Fireworks) and the Colosseum on 2–4 October (E-Gaming, Cosplay, shows and the concert).",
};

const money = (n: number) => `PKR ${n.toLocaleString()}`;

export default async function TicketsPage() {
  const all = await db
    .select({
      id: games.id, slug: games.slug, name: games.name, format: games.format,
      event: games.event, category: games.category,
      pricePkr: games.pricePkr, priceBasis: games.priceBasis,
      isTeamEvent: games.isTeamEvent, minPlayers: games.minPlayers,
      isFreeActivity: games.isFreeActivity, displayOrder: games.displayOrder,
    })
    .from(games)
    .where(eq(games.active, true))
    .orderBy(games.displayOrder);

  const prelaunch = all.filter((p) => p.event === "prelaunch" && !p.isFreeActivity);
  const gaming    = all.filter((p) => p.event === "colosseum" && p.category === "flagship");
  const cosplay   = all.find((p) => p.category === "cosplay");
  const observer  = all.find((p) => p.slug === "colosseum-observer");
  const freeStuff = all.filter((p) => p.isFreeActivity);

  return (
    <>
      <Nav />
      <main style={{ minHeight: "100vh", padding: "7rem 1.5rem 4rem", position: "relative", overflow: "hidden" }}>
        <div className="blob blob--purple" style={{ width: 520, height: 520, top: "-120px", right: "-150px" }} />
        <div className="blob blob--teal"   style={{ width: 380, height: 380, bottom: "10%", left: "-120px" }} />

        <div style={{ maxWidth: "1000px", margin: "0 auto", position: "relative", zIndex: 1 }}>
          <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.75rem" }}>
            MIUC Flagship Campus H-8, Islamabad
          </p>
          <h1 className="display" style={{ textAlign: "center", fontSize: "clamp(2.5rem, 8vw, 4.5rem)", marginBottom: "1rem" }}>
            Passes &amp; <span className="text-violet-foil">Pricing</span>
          </h1>
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.75, marginBottom: "3.5rem", maxWidth: 640, margin: "0 auto 3.5rem" }}>
            Two separate events, each with its own passes. Pick the one you want —
            every price below is exactly what you pay at checkout.
          </p>

          {/* ── PHASE ONE ─────────────────────────────────────────────── */}
          <section style={{ marginBottom: "4rem" }}>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <p className="eyebrow" style={{ color: "var(--violet)", marginBottom: "0.5rem" }}>Phase One · PreLaunch</p>
              <h2 className="display" style={{ fontSize: "clamp(1.8rem, 5vw, 2.6rem)", color: "var(--text-primary)" }}>
                5 September 2026
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                Auto Show · Hackathon · Robotic Exhibition · DJ Night · Fireworks
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              {prelaunch.map((p) => {
                const isHack = p.category === "hackathon";
                return (
                  <div key={p.id} className={`glass ${isHack ? "glass--teal" : "glass--gold"}`} style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>{isHack ? "💻" : "◈"}</div>
                      <h3 className="display" style={{ fontSize: "1.5rem", color: "var(--text-primary)" }}>{p.name}</h3>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{p.format}</p>
                    </div>
                    <div>
                      <span className="display" style={{ fontSize: "2.2rem", color: isHack ? "var(--violet)" : "var(--silver)" }}>
                        {money(p.pricePkr)}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginLeft: "0.5rem" }}>
                        {p.priceBasis === "per_team" ? `per team (up to ${p.minPlayers === 1 ? 3 : p.minPlayers})` : "per person"}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", flex: 1 }}>
                      {(isHack
                        ? ["Hackathon — CTF and MVP format", "Prize pool", "Auto Show", "Robotic Exhibition", "DJ Night", "Fireworks"]
                        : ["Auto Show", "Robotic Exhibition", "DJ Night", "Fireworks"]
                      ).map((perk) => (
                        <div key={perk} style={{ display: "flex", gap: "0.55rem", fontSize: "0.86rem", color: "var(--text-muted)" }}>
                          <span style={{ color: isHack ? "var(--violet)" : "var(--silver)" }}>▸</span>{perk}
                        </div>
                      ))}
                      {!isHack && (
                        <div style={{ display: "flex", gap: "0.55rem", fontSize: "0.86rem", color: "var(--text-faint)" }}>
                          <span style={{ color: "var(--red-arena)" }}>✕</span>Not competing in the Hackathon
                        </div>
                      )}
                    </div>
                    <Link href="/register" className="btn-primary" style={{ justifyContent: "center" }}>
                      Register →
                    </Link>
                  </div>
                );
              })}

              {/* Auto Show — registration closed */}
              <div className="glass" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem", opacity: 0.9 }}>
                <div>
                  <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>🏎️</div>
                  <h3 className="display" style={{ fontSize: "1.5rem", color: "var(--text-primary)" }}>Auto Show</h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Invited cars only</p>
                </div>
                <div>
                  <span className="display" style={{ fontSize: "1.6rem", color: "var(--text-faint)" }}>Exhibiting is free</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", flex: 1 }}>
                  {["Curated automotive showcase", "Open to all PreLaunch pass holders", "Viewing included with any PreLaunch pass"].map((perk) => (
                    <div key={perk} style={{ display: "flex", gap: "0.55rem", fontSize: "0.86rem", color: "var(--text-muted)" }}>
                      <span style={{ color: "var(--silver)" }}>▸</span>{perk}
                    </div>
                  ))}
                </div>
                <div style={{
                  textAlign: "center", padding: "0.8rem", borderRadius: 999,
                  background: "rgba(255,45,98,0.12)", border: "1px solid rgba(255,45,98,0.4)",
                  color: "var(--red-arena)", fontWeight: 700, fontSize: "0.85rem",
                  letterSpacing: "0.1em", textTransform: "uppercase",
                }}>
                  Registration Closed
                </div>
              </div>
            </div>
          </section>

          {/* ── PHASE TWO ─────────────────────────────────────────────── */}
          <section>
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <p className="eyebrow" style={{ color: "var(--silver)", marginBottom: "0.5rem" }}>Phase Two · The Colosseum</p>
              <h2 className="display" style={{ fontSize: "clamp(1.8rem, 5vw, 2.6rem)", color: "var(--text-primary)" }}>
                2 – 4 October 2026
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                Three days of gaming · Cosplay · Gorilla Show · Jamming · Comedy · Concert
              </p>
            </div>

            {/* E-Gaming — one row per title so nobody thinks a single pass covers everything */}
            <div className="glass" style={{ padding: "1.75rem", marginBottom: "1.25rem" }}>
              <div style={{ marginBottom: "1.25rem" }}>
                <h3 className="display" style={{ fontSize: "1.5rem", color: "var(--text-primary)" }}>🎮 E-Gaming — Choose Your Title</h3>
                <p style={{ fontSize: "0.86rem", color: "var(--text-muted)", marginTop: "0.35rem", lineHeight: 1.6 }}>
                  Each title is entered separately — you register for the game you want to play.
                  There is no combined pass that covers every title.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {gaming.map((g) => (
                  <div key={g.id} style={{
                    display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
                    background: "rgba(22,18,32,0.55)", border: "1px solid var(--border-glass)",
                    borderRadius: 12, padding: "0.85rem 1.1rem",
                  }}>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <p style={{ fontFamily: "var(--font-display)", letterSpacing: "0.04em", textTransform: "uppercase", fontSize: "1rem", color: "var(--text-primary)" }}>
                        {g.name}
                      </p>
                      <p style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                        {g.format}{g.isTeamEvent ? ` · ${g.minPlayers} players` : ""}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-mono)", color: "var(--silver)", fontWeight: 700, fontSize: "1.05rem" }}>
                        {money(g.pricePkr)}
                      </div>
                      <div style={{ fontSize: "0.66rem", color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                        {g.priceBasis === "per_team" ? "per team" : "per person"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/register" className="btn-primary" style={{ justifyContent: "center", width: "100%", marginTop: "1.25rem" }}>
                Choose a Title &amp; Register →
              </Link>
            </div>

            {/* Cosplay + Observer */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              {cosplay && (
                <div className="glass" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>🎭</div>
                    <h3 className="display" style={{ fontSize: "1.5rem", color: "var(--text-primary)" }}>{cosplay.name}</h3>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>{cosplay.format}</p>
                  </div>
                  <div>
                    <span className="display" style={{ fontSize: "2.2rem", color: "var(--silver)" }}>{money(cosplay.pricePkr)}</span>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginLeft: "0.5rem" }}>per person</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", flex: 1 }}>
                    {["Enter the cosplay contest", "Arena floor access", "All three days"].map((perk) => (
                      <div key={perk} style={{ display: "flex", gap: "0.55rem", fontSize: "0.86rem", color: "var(--text-muted)" }}>
                        <span style={{ color: "var(--silver)" }}>▸</span>{perk}
                      </div>
                    ))}
                  </div>
                  <Link href="/register" className="btn-ghost" style={{ justifyContent: "center" }}>Enter Cosplay →</Link>
                </div>
              )}

              {observer && (
                <div className="glass glass--gold" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>◈</div>
                    <h3 className="display" style={{ fontSize: "1.5rem", color: "var(--text-primary)" }}>{observer.name}</h3>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                      For everyone coming to watch, not compete
                    </p>
                  </div>
                  <div>
                    <span className="display" style={{ fontSize: "2.2rem", color: "var(--silver)" }}>{money(observer.pricePkr)}</span>
                    <span style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginLeft: "0.5rem" }}>per person</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", flex: 1 }}>
                    {["The Concert", "Cosplay · Gorilla Show · Jamming", "Comedy Show", "Arena floor — spectating", "All three days"].map((perk) => (
                      <div key={perk} style={{ display: "flex", gap: "0.55rem", fontSize: "0.86rem", color: "var(--text-muted)" }}>
                        <span style={{ color: "var(--silver)" }}>▸</span>{perk}
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: "0.55rem", fontSize: "0.86rem", color: "var(--text-faint)" }}>
                      <span style={{ color: "var(--red-arena)" }}>✕</span>Not competing in any title
                    </div>
                  </div>
                  <Link href="/register" className="btn-primary" style={{ justifyContent: "center" }}>Get Observer Pass →</Link>
                </div>
              )}
            </div>

            {freeStuff.length > 0 && (
              <p style={{ textAlign: "center", color: "var(--text-faint)", fontSize: "0.85rem", lineHeight: 1.7, marginTop: "2rem" }}>
                {freeStuff.map((f) => f.name).join(" · ")} are free to play for anyone holding a Colosseum ticket.
              </p>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
