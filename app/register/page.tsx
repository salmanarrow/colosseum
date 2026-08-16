import type { Metadata } from "next";
import { db } from "@/db";
import { games } from "@/db/schema";
import { eq } from "drizzle-orm";
import RegisterForm, { type Product } from "./RegisterForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Register · The Colosseum",
  description:
    "Register for the MIUC Colosseum — PreLaunch 5 Sept (Auto Show, Hackathon, DJ Tokyo, Fireworks) and The Colosseum 2–4 Oct (three days of gaming, cosplay and a concert).",
};

export default async function RegisterPage() {
  const rows = await db
    .select({
      id: games.id,
      slug: games.slug,
      name: games.name,
      format: games.format,
      event: games.event,
      category: games.category,
      isTeamEvent: games.isTeamEvent,
      minPlayers: games.minPlayers,
      maxPlayers: games.maxPlayers,
      pricePkr: games.pricePkr,
      priceBasis: games.priceBasis,
      socialsAddonPkr: games.socialsAddonPkr,
      isFreeActivity: games.isFreeActivity,
      displayOrder: games.displayOrder,
    })
    .from(games)
    .where(eq(games.active, true))
    .orderBy(games.displayOrder);

  // Free side activities aren't ticketed — they don't belong in the picker.
  const products: Product[] = rows.filter((r) => !r.isFreeActivity);

  return (
    <div style={{ minHeight: "100vh", padding: "7rem 1.5rem 4rem", position: "relative", overflow: "hidden" }}>
      <div className="blob blob--purple" style={{ width: 500, height: 500, top: "-100px", right: "-120px" }} />
      <div className="blob blob--teal"   style={{ width: 360, height: 360, bottom: "0",    left: "-100px" }} />

      <div style={{ maxWidth: "680px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.75rem" }}>
          MIUC Flagship Campus H-8, Islamabad
        </p>
        <h1 className="display" style={{ textAlign: "center", fontSize: "clamp(2.5rem, 7vw, 4.5rem)", marginBottom: "0.75rem" }}>
          Enter the Arena
        </h1>
        <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "3rem", fontSize: "0.95rem", lineHeight: 1.7 }}>
          Two events, two ticket sets. Pick your event, choose a pass, and pay —
          your QR code is emailed once payment is confirmed.
        </p>

        <RegisterForm products={products} />
      </div>
    </div>
  );
}
