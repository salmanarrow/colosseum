"use server";

import { db } from "@/db";
import { payments, tickets, teams, sponsors } from "@/db/schema";
import { eq, sql as sqlExpr } from "drizzle-orm";
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

  let delivered = false;
  let deliveryError: string | null = null;

  if (participant) {
    await sendTicketEmail({
      to:            participant.email,
      recipientName: participant.name,
      ticketNumber:  ticketNum,
      tier:          opts.tier,
      event:         opts.event,
      gameName:      opts.gameName,
      teamName:      opts.teamName,
      qrToken,
    })
      .then(async () => {
        await db.update(tickets).set({ emailedAt: new Date() }).where(eq(tickets.id, ticket.id));
        delivered = true;
      })
      .catch((err: unknown) => {
        // Never fatal — the pass is stored and downloadable from the admin area,
        // so a mail outage must not block issuing it. But it must be visible.
        deliveryError = err instanceof Error ? err.message : String(err);
        console.error("Email send failed:", deliveryError);
      });
  }

  return { ticketId: ticket.id, qrToken, ticketNumber: ticketNum, delivered, deliveryError };
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
    const results: { delivered: boolean; deliveryError: string | null }[] = [];

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
        results.push(await issueAndEmailTicket({
          participantId: member.participantId,
          teamId:        payment.teamId,
          tier,
          event:         team?.event ?? "colosseum",
          socials:       (team?.socialsCount ?? 0) > 0,
          gameName,
          teamName:      team?.teamName,
        }));
      }

      await db.update(teams).set({ status: "confirmed" }).where(eq(teams.id, payment.teamId));
    } else if (payment.participantId) {
      // Observer pass — no team, so event and tier come from the product
      // recorded on the payment. Hardcoding "colosseum" previously issued
      // PreLaunch buyers a pass showing the wrong dates.
      let evt: "prelaunch" | "colosseum" = "colosseum";
      let tr: "observer" | "cosplay" | "hackathon" | "game_entry" = "observer";
      if (payment.productId) {
        const [prod] = await db
          .select({ event: games.event, category: games.category })
          .from(games).where(eq(games.id, payment.productId)).limit(1);
        if (prod) {
          evt = prod.event;
          tr = prod.category === "hackathon" ? "hackathon"
             : prod.category === "cosplay"   ? "cosplay"
             : prod.category === "pass"      ? "observer" : "game_entry";
        }
      }
      results.push(await issueAndEmailTicket({
        participantId: payment.participantId,
        teamId: null,
        tier: tr,
        event: evt,
      }));
    }

    revalidatePath("/admin/payments");
    revalidatePath("/admin/registrations");

    const issued = results.length;
    const sent = results.filter((r) => r.delivered).length;
    const firstError = results.find((r) => r.deliveryError)?.deliveryError ?? null;
    return {
      success: true,
      // Surfaced so an admin knows at once whether to send the pass by hand.
      deliveryNote:
        issued === 0
          ? null
          : sent === issued
            ? `${issued} pass${issued > 1 ? "es" : ""} issued and emailed.`
            : `${issued} pass${issued > 1 ? "es" : ""} issued, but ${issued - sent} could not be emailed${firstError ? ` — ${firstError}` : ""}. Send it manually below.`,
    };
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
      event:           tickets.event,
      socials:         tickets.socials,
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
  const { participants, teams, games, tickets: tk } = await import("@/db/schema");

  const rows = await db
    .select({
      paymentId:      payments.id,
      amount:         payments.amountPkr,
      method:         payments.method,
      transactionRef: payments.transactionRef,
      screenshotUrl:  payments.screenshotUrl,
      status:         payments.status,
      createdAt:      payments.createdAt,
      rejectionReason: payments.rejectionReason,
      teamId:         payments.teamId,
      participantId:  payments.participantId,
      productName:    games.name,
      productEvent:   games.event,
      teamName:       teams.teamName,
      gameName:       games.name,
      captainName:    participants.fullName,
      captainEmail:   participants.email,
      captainPhone:   participants.phone,
      institution:    participants.institutionName,
    })
    .from(payments)
    .leftJoin(teams,  eq(payments.teamId, teams.id))
    .leftJoin(games,  eq(payments.productId, games.id))
    .leftJoin(
      participants,
      sqlExpr`${participants.id} = coalesce(${teams.captainParticipantId}, ${payments.participantId})`
    )
    .orderBy(payments.createdAt);

  // Passes exist only after approval, so this is naturally empty until verified.
  const allTickets = await db
    .select({
      participantId: tk.participantId, teamId: tk.teamId,
      id: tk.id, ticketNumber: tk.ticketNumber, qrToken: tk.qrToken, tier: tk.tier, event: tk.event, emailedAt: tk.emailedAt,
    })
    .from(tk);

  return rows.map((r) => ({
    ...r,
    tickets: allTickets.filter((t) =>
      r.teamId ? t.teamId === r.teamId : t.participantId === r.participantId && !t.teamId
    ),
  }));
}

export async function getAllRegistrations() {
  const { participants, teams, games } = await import("@/db/schema");

  // Driven by `payments`, because every registration creates one — team-based
  // or not. Listing teams alone hid observer passes entirely.
  const rows = await db
    .select({
      paymentId:    payments.id,
      teamId:       teams.id,
      status:       payments.status,
      amount:       payments.amountPkr,
      createdAt:    payments.createdAt,
      transactionRef: payments.transactionRef,
      screenshotUrl:  payments.screenshotUrl,
      productName:  games.name,
      productEvent: games.event,
      teamName:     teams.teamName,
      teamStatus:   teams.status,
      socialsCount: teams.socialsCount,
      buyerName:    participants.fullName,
      buyerEmail:   participants.email,
      buyerPhone:   participants.phone,
      institution:  participants.institutionName,
    })
    .from(payments)
    .leftJoin(teams, eq(payments.teamId, teams.id))
    .leftJoin(games, eq(payments.productId, games.id))
    // The buyer is the team captain when there is a team, else the direct payer.
    .leftJoin(
      participants,
      sqlExpr`${participants.id} = coalesce(${teams.captainParticipantId}, ${payments.participantId})`
    )
    .orderBy(payments.createdAt);

  // Attach issued passes so admins can see and reprint them.
  const { tickets: tk } = await import("@/db/schema");
  const allTickets = await db
    .select({
      participantId: tk.participantId, teamId: tk.teamId,
      id: tk.id, ticketNumber: tk.ticketNumber, qrToken: tk.qrToken, tier: tk.tier, event: tk.event, emailedAt: tk.emailedAt,
    })
    .from(tk);

  return rows.map((r) => ({
    ...r,
    tickets: allTickets.filter((t) =>
      r.teamId ? t.teamId === r.teamId : false
    ),
  }));
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
      productId: input.productId,
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
// Keyed on the PAYMENT, not the team: observer passes have no team row, so a
// team-keyed delete could never remove them. Deletes in FK order.
// The participant record is kept if they still have other registrations.
export async function deleteRegistration(paymentId: string) {
  try {
    const { teamMembers, ticketScans, participants } = await import("@/db/schema");
    const { inArray, and, isNull } = await import("drizzle-orm");

    const [payment] = await db
      .select({ id: payments.id, teamId: payments.teamId, participantId: payments.participantId })
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);
    if (!payment) return { success: false, error: "Registration not found." };

    // Collect the passes issued for this registration.
    const ticketRows = payment.teamId
      ? await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.teamId, payment.teamId))
      : payment.participantId
        ? await db.select({ id: tickets.id }).from(tickets)
            .where(and(eq(tickets.participantId, payment.participantId), isNull(tickets.teamId)))
        : [];
    const ticketIds = ticketRows.map((t) => t.id);

    if (ticketIds.length) {
      await db.delete(ticketScans).where(inArray(ticketScans.ticketId, ticketIds));
      await db.delete(tickets).where(inArray(tickets.id, ticketIds));
    }

    // Remember the roster before the team goes, so orphaned people can be tidied.
    let memberIds: string[] = [];
    if (payment.teamId) {
      memberIds = (await db.select({ participantId: teamMembers.participantId })
        .from(teamMembers).where(eq(teamMembers.teamId, payment.teamId)))
        .map((m) => m.participantId);
      await db.delete(teamMembers).where(eq(teamMembers.teamId, payment.teamId));
    }

    await db.delete(payments).where(eq(payments.id, paymentId));
    if (payment.teamId) await db.delete(teams).where(eq(teams.id, payment.teamId));

    // Drop participants left with no payments, no team membership and no passes.
    const candidates = [...memberIds, ...(payment.participantId ? [payment.participantId] : [])];
    for (const pid of [...new Set(candidates)]) {
      const [stillPaying]  = await db.select({ id: payments.id }).from(payments).where(eq(payments.participantId, pid)).limit(1);
      const [stillOnTeam]  = await db.select({ id: teamMembers.id }).from(teamMembers).where(eq(teamMembers.participantId, pid)).limit(1);
      const [stillTicketed] = await db.select({ id: tickets.id }).from(tickets).where(eq(tickets.participantId, pid)).limit(1);
      const [isCaptain]    = await db.select({ id: teams.id }).from(teams).where(eq(teams.captainParticipantId, pid)).limit(1);
      if (!stillPaying && !stillOnTeam && !stillTicketed && !isCaptain) {
        await db.delete(participants).where(eq(participants.id, pid));
      }
    }

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

// ── Admin account management ────────────────────────────────────────────────
// These mutate who can access the dashboard, so every one of them re-verifies
// the CALLER server-side. The layout only gates the UI; a crafted request
// could otherwise call these directly, which would be privilege escalation.

async function requireSuperAdmin(accessToken: string) {
  const me = await verifyAdminAccess(accessToken);
  if (!me.authorized) return { ok: false as const, error: "Not signed in as an admin." };
  if (me.role !== "super_admin") return { ok: false as const, error: "Only a super admin can manage admin accounts." };

  // Resolve the caller's own id so we can stop them deleting themselves.
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const user: { id?: string } = await res.json();
  return { ok: true as const, callerId: user.id ?? "" };
}

export async function listAdmins(accessToken: string) {
  const gate = await requireSuperAdmin(accessToken);
  if (!gate.ok) return { success: false as const, error: gate.error, admins: [] };

  const { admins } = await import("@/db/schema");
  const rows = await db
    .select({ id: admins.id, email: admins.email, fullName: admins.fullName, role: admins.role, createdAt: admins.createdAt })
    .from(admins)
    .orderBy(admins.createdAt);

  // Fold in last-sign-in from Supabase Auth so you can see who has actually used their account.
  let lastSeen: Record<string, string | null> = {};
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: "no-store",
    });
    const { users } = (await r.json()) as { users: { id: string; last_sign_in_at: string | null }[] };
    lastSeen = Object.fromEntries(users.map((u) => [u.id, u.last_sign_in_at]));
  } catch { /* non-fatal — the list still renders */ }

  return {
    success: true as const,
    callerId: gate.callerId,
    admins: rows.map((a) => ({ ...a, lastSignInAt: lastSeen[a.id] ?? null })),
  };
}

export async function createAdmin(accessToken: string, input: {
  email: string; password: string; fullName: string; role: "admin" | "super_admin";
}) {
  const gate = await requireSuperAdmin(accessToken);
  if (!gate.ok) return { success: false, error: gate.error };

  if (!/\S+@\S+\.\S+/.test(input.email)) return { success: false, error: "Enter a valid email." };
  if (input.password.length < 8) return { success: false, error: "Password must be at least 8 characters." };

  try {
    const { admins } = await import("@/db/schema");

    // 1. Create the Supabase Auth user (email pre-confirmed so they can sign in at once)
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: input.email, password: input.password, email_confirm: true }),
    });
    const created = (await res.json()) as { id?: string; msg?: string; message?: string; error_description?: string };
    if (!res.ok || !created.id) {
      return { success: false, error: created.msg ?? created.message ?? created.error_description ?? "Could not create the login." };
    }

    // 2. Grant dashboard access
    await db.insert(admins).values({
      id: created.id,
      email: input.email,
      fullName: input.fullName || input.email.split("@")[0],
      role: input.role,
    });

    revalidatePath("/admin/admins");
    return { success: true };
  } catch (err) {
    console.error("createAdmin error:", err);
    return { success: false, error: "Failed to create admin." };
  }
}

export async function updateAdminRole(accessToken: string, adminId: string, role: "admin" | "super_admin") {
  const gate = await requireSuperAdmin(accessToken);
  if (!gate.ok) return { success: false, error: gate.error };

  try {
    const { admins } = await import("@/db/schema");
    // Never let the last super admin demote themselves out of existence.
    if (role === "admin") {
      const supers = await db.select({ id: admins.id }).from(admins).where(eq(admins.role, "super_admin"));
      if (supers.length <= 1 && supers.some((s) => s.id === adminId)) {
        return { success: false, error: "This is the only super admin — promote someone else first." };
      }
    }
    await db.update(admins).set({ role }).where(eq(admins.id, adminId));
    revalidatePath("/admin/admins");
    return { success: true };
  } catch (err) {
    console.error("updateAdminRole error:", err);
    return { success: false, error: "Failed to update role." };
  }
}

export async function removeAdmin(accessToken: string, adminId: string, deleteLogin: boolean) {
  const gate = await requireSuperAdmin(accessToken);
  if (!gate.ok) return { success: false, error: gate.error };
  if (adminId === gate.callerId) return { success: false, error: "You cannot remove your own access." };

  try {
    const { admins } = await import("@/db/schema");
    const supers = await db.select({ id: admins.id }).from(admins).where(eq(admins.role, "super_admin"));
    if (supers.length <= 1 && supers.some((s) => s.id === adminId)) {
      return { success: false, error: "This is the only super admin — promote someone else first." };
    }

    // Revoke dashboard access
    await db.delete(admins).where(eq(admins.id, adminId));

    // Optionally delete the underlying login too
    if (deleteLogin) {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${adminId}`, {
        method: "DELETE",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }).catch((e) => console.error("auth user delete failed:", e));
    }

    revalidatePath("/admin/admins");
    return { success: true };
  } catch (err) {
    console.error("removeAdmin error:", err);
    return { success: false, error: "Failed to remove admin." };
  }
}

// Set a new password for an admin (also used to recover a forgotten one).
export async function setAdminPassword(accessToken: string, adminId: string, password: string) {
  const gate = await requireSuperAdmin(accessToken);
  if (!gate.ok) return { success: false, error: gate.error };
  if (password.length < 8) return { success: false, error: "Password must be at least 8 characters." };

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${adminId}`, {
      method: "PUT",
      headers: {
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) return { success: false, error: "Could not set the password." };
    return { success: true };
  } catch (err) {
    console.error("setAdminPassword error:", err);
    return { success: false, error: "Failed to set password." };
  }
}

// ── Pass delivery ───────────────────────────────────────────────────────────

/**
 * Re-send a single pass by email. Needed because auto-delivery on approval is
 * best-effort: a mail outage or a typo'd address must be recoverable without
 * deleting and re-approving the whole registration.
 */
export async function resendPass(ticketId: string) {
  try {
    const { participants, teams, games } = await import("@/db/schema");

    const [row] = await db
      .select({
        ticketNumber: tickets.ticketNumber,
        tier:         tickets.tier,
        event:        tickets.event,
        qrToken:      tickets.qrToken,
        name:         participants.fullName,
        email:        participants.email,
        teamName:     teams.teamName,
        gameName:     games.name,
      })
      .from(tickets)
      .leftJoin(participants, eq(tickets.participantId, participants.id))
      .leftJoin(teams,        eq(tickets.teamId,        teams.id))
      .leftJoin(games,        eq(teams.gameId,          games.id))
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!row) return { success: false, error: "Pass not found." };
    if (!row.email) return { success: false, error: "No email address on file for this holder." };

    const tier = (["hackathon", "game_entry", "observer", "cosplay"].includes(row.tier)
      ? row.tier : "observer") as "hackathon" | "game_entry" | "observer" | "cosplay";

    await sendTicketEmail({
      to:            row.email,
      recipientName: row.name ?? "Guest",
      ticketNumber:  row.ticketNumber,
      tier,
      event:         row.event,
      gameName:      row.gameName ?? undefined,
      teamName:      row.teamName ?? undefined,
      qrToken:       row.qrToken,
    });

    await db.update(tickets).set({ emailedAt: new Date() }).where(eq(tickets.id, ticketId));
    revalidatePath("/admin/registrations");
    revalidatePath("/admin/payments");
    return { success: true, sentTo: row.email };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("resendPass error:", msg);
    return { success: false, error: msg };
  }
}
