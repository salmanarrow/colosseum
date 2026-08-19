import { NextRequest } from "next/server";
import { db } from "@/db";
import { tickets, participants, teams, games } from "@/db/schema";
import { eq } from "drizzle-orm";
import { renderPassPdf } from "@/lib/passPdf";

export const dynamic = "force-dynamic";

/**
 * Printable pass by QR token: /api/pass/<qrToken>
 * The token is the holder's own secret (it's what's in their QR), so this is
 * safe to hand out — anyone with the token already holds the pass. Lets staff
 * reprint at the desk and lets a holder re-download without an account.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;

  const [row] = await db
    .select({
      tier: tickets.tier,
      event: tickets.event,
      socials: tickets.socials,
      ticketNumber: tickets.ticketNumber,
      qrToken: tickets.qrToken,
      holderName: participants.fullName,
      institution: participants.institutionName,
      teamName: teams.teamName,
      gameName: games.name,
    })
    .from(tickets)
    .leftJoin(participants, eq(tickets.participantId, participants.id))
    .leftJoin(teams, eq(tickets.teamId, teams.id))
    .leftJoin(games, eq(teams.gameId, games.id))
    .where(eq(tickets.qrToken, token))
    .limit(1);

  if (!row) return new Response("Pass not found", { status: 404 });

  const tier = (["hackathon", "game_entry", "observer", "cosplay"].includes(row.tier)
    ? row.tier
    : "observer") as "hackathon" | "game_entry" | "observer" | "cosplay";

  const pdf = await renderPassPdf({
    tier,
    event: row.event,
    holderName: row.holderName ?? "Guest",
    ticketNumber: row.ticketNumber,
    qrToken: row.qrToken,
    institution: row.institution ?? undefined,
    gameName: row.gameName ?? undefined,
    teamName: row.teamName ?? undefined,
    socials: row.socials,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="colosseum-pass-${row.ticketNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
