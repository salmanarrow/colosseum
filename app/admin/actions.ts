"use server";

import { db } from "@/db";
import { payments, tickets, teams, sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { sendTicketEmail } from "@/lib/email";

// ── Access control ──────────────────────────────────────────────────────────

// Verify a Supabase access token server-side and check the user is in the
// `admins` table. The client can't fake this: the token is validated against
// Supabase Auth, not trusted from the browser. Uses the Auth REST API via
// fetch (supabase-js client construction crashes on Node 20 without ws).
export async function verifyAdminAccess(accessToken: string) {
  try {
    if (!accessToken) return { authorized: false as const };

    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return { authorized: false as const };
    const user: { id?: string } = await res.json();
    if (!user.id) return { authorized: false as const };

    const { admins } = await import("@/db/schema");
    const [admin] = await db
      .select({ id: admins.id, fullName: admins.fullName, role: admins.role })
      .from(admins)
      .where(eq(admins.id, user.id))
      .limit(1);

    if (!admin) return { authorized: false as const };
    return { authorized: true as const, name: admin.fullName, role: admin.role };
  } catch (err) {
    console.error("verifyAdminAccess error:", err);
    return { authorized: false as const };
  }
}

// ── Payments ───────────────────────────────────────────────────────────────

// Create a ticket for a participant and email it. Returns the new ticket id + token.
async function issueAndEmailTicket(opts: {
  participantId: string;
  teamId: string | null;
  tier: "participant" | "basic";
  gameName?: string;
  teamName?: string;
}) {
  const { participants } = await import("@/db/schema");

  const qrToken   = randomUUID();
  const prefix    = opts.tier === "participant" ? "GLAD" : "CIT";
  const ticketNum = `COL-2026-${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}`;

  const [ticket] = await db
    .insert(tickets)
    .values({
      ticketNumber:  ticketNum,
      tier:          opts.tier,
      participantId: opts.participantId,
      teamId:        opts.teamId ?? undefined,
      qrToken,
    })
    .returning({ id: tickets.id });

  const [participant] = await db
    .select({ name: participants.fullName, email: participants.email })
    .from(participants)
    .where(eq(participants.id, opts.participantId))
    .limit(1);

  if (participant) {
    await sendTicketEmail({
      to:            participant.email,
      recipientName: participant.name,
      ticketNumber:  ticketNum,
      tier:          opts.tier,
      gameName:      opts.gameName,
      teamName:      opts.teamName,
      qrToken,
    })
      .then(() => db.update(tickets).set({ emailedAt: new Date() }).where(eq(tickets.id, ticket.id)))
      .catch((err) => console.error("Email send failed:", err));
  }

  return { ticketId: ticket.id, qrToken, ticketNumber: ticketNum };
}

export async function approvePayment(paymentId: string) {
  try {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) return { success: false, error: "Payment not found" };

    await db
      .update(payments)
      .set({ status: "approved", reviewedAt: new Date() })
      .where(eq(payments.id, paymentId));

    const { teamMembers, games } = await import("@/db/schema");

    if (payment.teamId) {
      // Gladiator (team/squad) — issue one participant ticket per member
      const members = await db
        .select({ participantId: teamMembers.participantId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, payment.teamId));

      const [team] = await db
        .select({ gameId: teams.gameId, teamName: teams.teamName })
        .from(teams)
        .where(eq(teams.id, payment.teamId))
        .limit(1);

      let gameName: string | undefined;
      if (team?.gameId) {
        const [g] = await db.select({ name: games.name }).from(games).where(eq(games.id, team.gameId)).limit(1);
        gameName = g?.name;
      }

      for (const member of members) {
        await issueAndEmailTicket({
          participantId: member.participantId,
          teamId:        payment.teamId,
          tier:          "participant",
          gameName,
          teamName:      team?.teamName,
        });
      }

      await db.update(teams).set({ status: "confirmed" }).where(eq(teams.id, payment.teamId));
    } else if (payment.participantId) {
      // Citizen Pass (observer) — issue a single basic ticket
      await issueAndEmailTicket({
        participantId: payment.participantId,
        teamId:        null,
        tier:          "basic",
      });
    }

    revalidatePath("/admin/payments");
    return { success: true };
  } catch (err) {
    console.error("approvePayment error:", err);
    return { success: false, error: "Failed to approve payment." };
  }
}

export async function rejectPayment(paymentId: string, reason: string) {
  try {
    await db
      .update(payments)
      .set({ status: "rejected", rejectionReason: reason, reviewedAt: new Date() })
      .where(eq(payments.id, paymentId));

    revalidatePath("/admin/payments");
    return { success: true };
  } catch (err) {
    console.error("rejectPayment error:", err);
    return { success: false, error: "Failed to reject payment." };
  }
}

// ── Venue scanner & upgrade ─────────────────────────────────────────────────

// Map today's weekday to an event day (Aug 7–9 2026 = Fri/Sat/Sun).
function eventDay(): "Fri" | "Sat" | "Sun" {
  const d = new Date().getDay(); // 0 = Sun … 6 = Sat
  if (d === 6) return "Sat";
  if (d === 0) return "Sun";
  return "Fri";
}

// Look up a ticket by its QR token (accepts a raw token or a full verify URL).
export async function lookupTicketByToken(tokenOrUrl: string) {
  const { participants, teams, games } = await import("@/db/schema");
  const token = (tokenOrUrl.trim().split("/").filter(Boolean).pop() ?? tokenOrUrl).trim();

  const [row] = await db
    .select({
      ticketId:        tickets.id,
      ticketNumber:    tickets.ticketNumber,
      tier:            tickets.tier,
      qrToken:         tickets.qrToken,
      participantId:   tickets.participantId,
      participantName: participants.fullName,
      institution:     participants.institutionName,
      institutionType: participants.institutionType,
      teamName:        teams.teamName,
      gameName:        games.name,
    })
    .from(tickets)
    .leftJoin(participants, eq(tickets.participantId, participants.id))
    .leftJoin(teams,        eq(tickets.teamId,        teams.id))
    .leftJoin(games,        eq(teams.gameId,          games.id))
    .where(eq(tickets.qrToken, token))
    .limit(1);

  if (!row) return { found: false as const };
  return { found: true as const, ...row };
}

// Log a gate / station scan against a ticket.
export async function logScan(ticketId: string, zone: string) {
  try {
    const { ticketScans } = await import("@/db/schema");
    await db.insert(ticketScans).values({ ticketId, zone, day: eventDay() });
    return { success: true };
  } catch (err) {
    console.error("logScan error:", err);
    return { success: false, error: "Failed to log scan." };
  }
}

// Upgrade a Citizen Pass to a Gladiator Pass on-site: create a team-of-one for
// the chosen game, flip the ticket to participant (same QR), and record the
// cash difference as an approved payment.
export async function upgradeCitizenToGladiator(ticketId: string, gameId: string) {
  try {
    const { participants, games, teamMembers } = await import("@/db/schema");

    const [tk] = await db
      .select({ id: tickets.id, tier: tickets.tier, participantId: tickets.participantId })
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!tk) return { success: false, error: "Ticket not found" };
    if (tk.tier !== "basic") return { success: false, error: "Only a Citizen Pass can be upgraded." };

    const [p] = await db
      .select({
        id: participants.id, name: participants.fullName,
        institutionType: participants.institutionType, institutionName: participants.institutionName,
      })
      .from(participants)
      .where(eq(participants.id, tk.participantId))
      .limit(1);
    if (!p) return { success: false, error: "Participant not found" };

    const [g] = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
    if (!g) return { success: false, error: "Game not found" };

    const isExternal = p.institutionType === "external_college" || p.institutionType === "external_university";
    const difference = g.participationFeePkr + (isExternal ? g.externalSurchargePkr : 0);

    // team-of-one for the chosen title
    const [team] = await db
      .insert(teams)
      .values({
        gameId,
        teamName:             p.name,
        captainParticipantId: p.id,
        institutionName:      p.institutionName,
        institutionType:      p.institutionType,
        status:               "confirmed",
        totalPricePkr:        g.baseFeepkr + difference,
      })
      .returning({ id: teams.id });

    await db.insert(teamMembers).values({ teamId: team.id, participantId: p.id, role: "captain" });

    // flip ticket to participant (keep the same QR — no reprint needed)
    await db.update(tickets).set({ tier: "participant", teamId: team.id }).where(eq(tickets.id, ticketId));

    // record the venue cash upsell
    await db.insert(payments).values({
      amountPkr:      difference,
      teamId:         team.id,
      method:         "other",
      transactionRef: "venue-upgrade-cash",
      status:         "approved",
      reviewedAt:     new Date(),
    });

    revalidatePath("/admin/scan");
    return { success: true, difference, gameName: g.name, isExternal };
  } catch (err) {
    console.error("upgradeCitizenToGladiator error:", err);
    return { success: false, error: "Upgrade failed." };
  }
}

// List active games for the upgrade picker (flagship titles that cost extra).
export async function getUpgradeableGames() {
  const { games } = await import("@/db/schema");
  return db
    .select({
      id: games.id, slug: games.slug, name: games.name, category: games.category,
      participationFeePkr: games.participationFeePkr, externalSurchargePkr: games.externalSurchargePkr,
    })
    .from(games)
    .where(eq(games.active, true))
    .orderBy(games.category, games.name);
}

// ── Sponsors ───────────────────────────────────────────────────────────────

export async function addSponsor(data: {
  name: string;
  tier: "title" | "platinum" | "gold" | "silver" | "in_kind";
  websiteUrl?: string;
  logoUrl?: string;
  displayOrder: number;
}) {
  try {
    await db.insert(sponsors).values({
      name: data.name,
      tier: data.tier,
      websiteUrl: data.websiteUrl || undefined,
      logoUrl: data.logoUrl || undefined,
      displayOrder: data.displayOrder,
      active: true,
    });
    revalidatePath("/admin/sponsors");
    revalidatePath("/sponsors");
    return { success: true };
  } catch (err) {
    console.error("addSponsor error:", err);
    return { success: false, error: "Failed to add sponsor." };
  }
}

export async function toggleSponsor(sponsorId: string, active: boolean) {
  try {
    await db
      .update(sponsors)
      .set({ active })
      .where(eq(sponsors.id, sponsorId));
    revalidatePath("/admin/sponsors");
    revalidatePath("/sponsors");
    return { success: true };
  } catch (err) {
    console.error("toggleSponsor error:", err);
    return { success: false, error: "Failed to update sponsor." };
  }
}

// ── Data fetchers (used by admin pages) ───────────────────────────────────

export async function getPendingPayments() {
  const { participants, teams, games } = await import("@/db/schema");

  return db
    .select({
      paymentId:      payments.id,
      amount:         payments.amountPkr,
      method:         payments.method,
      transactionRef: payments.transactionRef,
      status:         payments.status,
      createdAt:      payments.createdAt,
      teamId:         payments.teamId,
      teamName:       teams.teamName,
      gameName:       games.name,
      captainName:    participants.fullName,
      captainEmail:   participants.email,
      captainPhone:   participants.phone,
      institution:    teams.institutionName,
    })
    .from(payments)
    .leftJoin(teams,        eq(payments.teamId,               teams.id))
    .leftJoin(games,        eq(teams.gameId,                  games.id))
    .leftJoin(participants, eq(teams.captainParticipantId,    participants.id))
    .where(eq(payments.status, "pending_review"))
    .orderBy(payments.createdAt);
}

export async function getAllPayments() {
  const { participants, teams, games } = await import("@/db/schema");

  return db
    .select({
      paymentId:      payments.id,
      amount:         payments.amountPkr,
      method:         payments.method,
      transactionRef: payments.transactionRef,
      status:         payments.status,
      createdAt:      payments.createdAt,
      rejectionReason: payments.rejectionReason,
      teamName:       teams.teamName,
      gameName:       games.name,
      captainName:    participants.fullName,
      captainEmail:   participants.email,
      institution:    teams.institutionName,
    })
    .from(payments)
    .leftJoin(teams,        eq(payments.teamId,               teams.id))
    .leftJoin(games,        eq(teams.gameId,                  games.id))
    .leftJoin(participants, eq(teams.captainParticipantId,    participants.id))
    .orderBy(payments.createdAt);
}

export async function getAllRegistrations() {
  const { participants, teams, games, teamMembers } = await import("@/db/schema");

  return db
    .select({
      teamId:       teams.id,
      teamName:     teams.teamName,
      status:       teams.status,
      institution:  teams.institutionName,
      totalPrice:   teams.totalPricePkr,
      createdAt:    teams.createdAt,
      gameName:     games.name,
      gameCategory: games.category,
      captainName:  participants.fullName,
      captainEmail: participants.email,
      captainPhone: participants.phone,
    })
    .from(teams)
    .leftJoin(games,        eq(teams.gameId,               games.id))
    .leftJoin(participants, eq(teams.captainParticipantId, participants.id))
    .orderBy(teams.createdAt);
}

export async function getAllSponsors() {
  return db
    .select()
    .from(sponsors)
    .orderBy(sponsors.displayOrder);
}
