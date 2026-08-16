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
  tier: "hackathon" | "game_entry" | "observer" | "cosplay";
  event: "prelaunch" | "colosseum";
  socials?: boolean;
  gameName?: string;
  teamName?: string;
}) {
  const { participants } = await import("@/db/schema");

  const PREFIX = { hackathon: "HACK", game_entry: "GAME", observer: "OBS", cosplay: "COS" } as const;
  const qrToken   = randomUUID();
  const prefix    = PREFIX[opts.tier];
  const ticketNum = `COL-2026-${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}`;

  const [ticket] = await db
    .insert(tickets)
    .values({
      ticketNumber:  ticketNum,
      tier:          opts.tier,
      participantId: opts.participantId,
      teamId:        opts.teamId ?? undefined,
      event:         opts.event,
      socials:       opts.socials ?? false,
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
      // Ticketed competition — one pass per roster member (team-of-one for solos)
      const members = await db
        .select({ participantId: teamMembers.participantId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, payment.teamId));

      const [team] = await db
        .select({
          gameId: teams.gameId, teamName: teams.teamName,
          event: teams.event, socialsCount: teams.socialsCount,
        })
        .from(teams)
        .where(eq(teams.id, payment.teamId))
        .limit(1);

      let gameName: string | undefined;
      let category = "flagship";
      if (team?.gameId) {
        const [g] = await db
          .select({ name: games.name, category: games.category })
          .from(games)
          .where(eq(games.id, team.gameId))
          .limit(1);
        gameName = g?.name;
        category = g?.category ?? "flagship";
      }

      const tier =
        category === "hackathon" ? "hackathon" as const :
        category === "cosplay"   ? "cosplay"   as const :
                                   "game_entry" as const;

      for (const member of members) {
        await issueAndEmailTicket({
          participantId: member.participantId,
          teamId:        payment.teamId,
          tier,
          event:         team?.event ?? "colosseum",
          socials:       (team?.socialsCount ?? 0) > 0,
          gameName,
          teamName:      team?.teamName,
        });
      }

      await db.update(teams).set({ status: "confirmed" }).where(eq(teams.id, payment.teamId));
    } else if (payment.participantId) {
      // Observer pass — a single ticket, no team/game attached.
      await issueAndEmailTicket({
        participantId: payment.participantId,
        teamId:        null,
        tier:          "observer",
        event:         "colosseum",
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

// ── Payment screenshots ─────────────────────────────────────────────────────

// Create a short-lived signed URL so an admin can view a receipt from the
// private payment-screenshots bucket.
export async function getScreenshotViewUrl(path: string) {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const res = await fetch(`${base}/storage/v1/object/sign/payment-screenshots/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 3600 }),
    });
    if (!res.ok) {
      console.error("sign screenshot failed:", res.status, await res.text());
      return { success: false as const, error: "Could not open receipt." };
    }
    const { signedURL } = (await res.json()) as { signedURL: string };
    return { success: true as const, url: `${base}/storage/v1${signedURL}` };
  } catch (err) {
    console.error("getScreenshotViewUrl error:", err);
    return { success: false as const, error: "Could not open receipt." };
  }
}

// ── Venue scanner & upgrade ─────────────────────────────────────────────────

// Map today's weekday to an event day (PreLaunch 5 Sept = Sat; Colosseum 2–4 Oct = Fri/Sat/Sun).
function eventDay(): "Fri" | "Sat" | "Sun" {
  const d = new Date().getDay(); // 0 = Sun … 6 = Sat
  if (d === 6) return "Sat";
  if (d === 0) return "Sun";
  return "Fri";
}

// Which event we're scanning for. PreLaunch is 5 Sept; anything from
// 20 Sept onward is the Colosseum. Both fall on overlapping weekdays, so the
// date — not the weekday — decides.
function currentEvent(): "prelaunch" | "colosseum" {
  const now = new Date();
  return now < new Date("2026-09-20T00:00:00+05:00") ? "prelaunch" : "colosseum";
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
// Log a gate / station scan. A ticket may enter ONCE per day at a given zone —
// re-scanning the same QR the same day is rejected, which is what stops one
// pass being shared between people. Multi-day passes still work each day.
export async function logScan(ticketId: string, zone: string) {
  try {
    const { ticketScans } = await import("@/db/schema");
    const { and } = await import("drizzle-orm");
    const day = eventDay();
    const event = currentEvent();

    const [prior] = await db
      .select({ scannedAt: ticketScans.scannedAt })
      .from(ticketScans)
      .where(and(
        eq(ticketScans.ticketId, ticketId),
        eq(ticketScans.zone, zone),
        eq(ticketScans.event, event),
        eq(ticketScans.day, day),
      ))
      .limit(1);

    if (prior) {
      return {
        success: false as const,
        alreadyScanned: true as const,
        scannedAt: prior.scannedAt?.toISOString() ?? null,
        error: "This pass has already been used today.",
      };
    }

    await db.insert(ticketScans).values({ ticketId, zone, event, day });
    return { success: true as const, alreadyScanned: false as const };
  } catch (err) {
    // The unique index is the real guard — a race between two scanners lands here.
    if (String(err).includes("ticket_scans_one_entry_idx")) {
      return {
        success: false as const,
        alreadyScanned: true as const,
        scannedAt: null,
        error: "This pass has already been used today.",
      };
    }
    console.error("logScan error:", err);
    return { success: false as const, alreadyScanned: false as const, scannedAt: null, error: "Failed to log scan." };
  }
}

// Scan history for a ticket — shown to staff so they can see prior entries.
export async function getScanHistory(ticketId: string) {
  const { ticketScans } = await import("@/db/schema");
  return db
    .select({ zone: ticketScans.zone, event: ticketScans.event, day: ticketScans.day, scannedAt: ticketScans.scannedAt })
    .from(ticketScans)
    .where(eq(ticketScans.ticketId, ticketId))
    .orderBy(ticketScans.scannedAt);
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
      screenshotUrl:  payments.screenshotUrl,
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
      screenshotUrl:  payments.screenshotUrl,
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

// ── Auto Show (PreLaunch) ───────────────────────────────────────────────────

export async function getAutoShowRegistrations() {
  const { autoShowRegistrations } = await import("@/db/schema");
  return db.select().from(autoShowRegistrations).orderBy(autoShowRegistrations.createdAt);
}

// Signed URL so an admin can view a car photo from the private bucket.
export async function getCarPhotoUrl(path: string) {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const res = await fetch(`${base}/storage/v1/object/sign/car-photos/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: 3600 }),
    });
    if (!res.ok) return { success: false as const, error: "Could not open photo." };
    const { signedURL } = (await res.json()) as { signedURL: string };
    return { success: true as const, url: `${base}/storage/v1${signedURL}` };
  } catch (err) {
    console.error("getCarPhotoUrl error:", err);
    return { success: false as const, error: "Could not open photo." };
  }
}

// Approve a car: issue its vehicle gate pass and email the owner.
export async function approveCar(id: string) {
  try {
    const { autoShowRegistrations } = await import("@/db/schema");
    const [car] = await db
      .select()
      .from(autoShowRegistrations)
      .where(eq(autoShowRegistrations.id, id))
      .limit(1);
    if (!car) return { success: false, error: "Entry not found." };

    const qrToken = car.qrToken ?? randomUUID();
    await db
      .update(autoShowRegistrations)
      .set({ status: "approved", qrToken, reviewedAt: new Date(), rejectionReason: null })
      .where(eq(autoShowRegistrations.id, id));

    const { sendVehiclePassEmail } = await import("@/lib/email");
    await sendVehiclePassEmail({
      to: car.ownerEmail,
      ownerName: car.ownerName,
      car: `${car.carMake} ${car.carModel}${car.carYear ? ` (${car.carYear})` : ""}`,
      plate: car.plateNumber,
      qrToken,
    }).catch((err) => console.error("Vehicle pass email failed:", err));

    revalidatePath("/admin/autoshow");
    return { success: true };
  } catch (err) {
    console.error("approveCar error:", err);
    return { success: false, error: "Failed to approve entry." };
  }
}

export async function rejectCar(id: string, reason: string) {
  try {
    const { autoShowRegistrations } = await import("@/db/schema");
    await db
      .update(autoShowRegistrations)
      .set({ status: "rejected", rejectionReason: reason, reviewedAt: new Date() })
      .where(eq(autoShowRegistrations.id, id));
    revalidatePath("/admin/autoshow");
    return { success: true };
  } catch (err) {
    console.error("rejectCar error:", err);
    return { success: false, error: "Failed to reject entry." };
  }
}

// ── Registrations: manual create / delete ───────────────────────────────────

// Add a registration by hand — walk-ins, desk sales, or fixing a bad entry.
// If markPaid is true the payment is recorded as approved and the pass is
// issued + emailed immediately, exactly as an approval would.
export async function createManualRegistration(input: {
  productId: string;
  fullName: string;
  email: string;
  phone: string;
  institutionName: string;
  institutionType: "roots" | "miuc" | "external_college" | "external_university";
  teamName?: string;
  wantsSocials: boolean;
  amountPkr: number;
  markPaid: boolean;
  note?: string;
}) {
  try {
    const { participants, teamMembers, games } = await import("@/db/schema");

    const [product] = await db
      .select({ id: games.id, name: games.name, category: games.category, event: games.event, isTeamEvent: games.isTeamEvent })
      .from(games).where(eq(games.id, input.productId)).limit(1);
    if (!product) return { success: false, error: "Ticket product not found." };

    // Dedup participant by email
    const [existing] = await db.select({ id: participants.id })
      .from(participants).where(eq(participants.email, input.email)).limit(1);

    const participantId = existing?.id ?? (await db.insert(participants).values({
      fullName: input.fullName, email: input.email, phone: input.phone,
      institutionName: input.institutionName, institutionType: input.institutionType,
    }).returning({ id: participants.id }))[0].id;

    const isObserverPass = product.category === "pass";
    let teamId: string | null = null;

    if (!isObserverPass) {
      const [team] = await db.insert(teams).values({
        gameId: product.id,
        teamName: input.teamName || input.fullName,
        captainParticipantId: participantId,
        institutionName: input.institutionName,
        institutionType: input.institutionType,
        status: input.markPaid ? "confirmed" : "pending_payment",
        event: product.event,
        socialsCount: input.wantsSocials ? 1 : 0,
        totalPricePkr: input.amountPkr,
      }).returning({ id: teams.id });
      teamId = team.id;
      await db.insert(teamMembers).values({ teamId, participantId, role: "captain" });
    }

    await db.insert(payments).values({
      amountPkr: input.amountPkr,
      teamId: teamId ?? undefined,
      participantId: teamId ? undefined : participantId,
      method: "other",
      transactionRef: input.note || "manual entry by admin",
      status: input.markPaid ? "approved" : "pending_review",
      reviewedAt: input.markPaid ? new Date() : undefined,
    });

    if (input.markPaid) {
      const tier =
        product.category === "hackathon" ? "hackathon" as const :
        product.category === "cosplay"   ? "cosplay"   as const :
        isObserverPass                   ? "observer"  as const :
                                           "game_entry" as const;
      await issueAndEmailTicket({
        participantId, teamId, tier,
        event: product.event,
        socials: input.wantsSocials,
        gameName: isObserverPass ? undefined : product.name,
        teamName: input.teamName || undefined,
      });
    }

    revalidatePath("/admin/registrations");
    revalidatePath("/admin/payments");
    return { success: true };
  } catch (err) {
    console.error("createManualRegistration error:", err);
    return { success: false, error: "Failed to create registration." };
  }
}

// Permanently remove a registration and everything hanging off it.
// Deletes in FK order: scans -> tickets -> members -> payments -> team.
export async function deleteRegistration(teamId: string) {
  try {
    const { teamMembers, ticketScans } = await import("@/db/schema");
    const { inArray } = await import("drizzle-orm");

    const ticketIds = (await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.teamId, teamId))).map((t) => t.id);
    if (ticketIds.length) {
      await db.delete(ticketScans).where(inArray(ticketScans.ticketId, ticketIds));
      await db.delete(tickets).where(inArray(tickets.id, ticketIds));
    }
    await db.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
    await db.delete(payments).where(eq(payments.teamId, teamId));
    await db.delete(teams).where(eq(teams.id, teamId));

    revalidatePath("/admin/registrations");
    revalidatePath("/admin/payments");
    return { success: true };
  } catch (err) {
    console.error("deleteRegistration error:", err);
    return { success: false, error: "Failed to delete registration." };
  }
}

// Ticket products for the manual-entry picker.
export async function getTicketProducts() {
  const { games } = await import("@/db/schema");
  const { and } = await import("drizzle-orm");
  return db.select({
      id: games.id, name: games.name, event: games.event, category: games.category,
      pricePkr: games.pricePkr, priceBasis: games.priceBasis, socialsAddonPkr: games.socialsAddonPkr,
      isTeamEvent: games.isTeamEvent, minPlayers: games.minPlayers,
    })
    .from(games)
    .where(and(eq(games.active, true), eq(games.isFreeActivity, false)))
    .orderBy(games.displayOrder);
}
