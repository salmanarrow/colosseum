"use server";

import { db } from "@/db";
import { payments, tickets, teams, sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { sendTicketEmail } from "@/lib/email";

// ── Payments ───────────────────────────────────────────────────────────────

export async function approvePayment(paymentId: string) {
  try {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .limit(1);

    if (!payment) return { success: false, error: "Payment not found" };

    // Mark payment approved
    await db
      .update(payments)
      .set({ status: "approved", reviewedAt: new Date() })
      .where(eq(payments.id, paymentId));

    // If team-based, get participants and issue tickets
    if (payment.teamId) {
      const { teamMembers, participants } = await import("@/db/schema");

      const members = await db
        .select({ participantId: teamMembers.participantId, role: teamMembers.role })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, payment.teamId));

      const [team] = await db
        .select({ gameId: teams.gameId })
        .from(teams)
        .where(eq(teams.id, payment.teamId))
        .limit(1);

      // Issue one ticket per team member and email each one
      for (const member of members) {
        const qrToken   = randomUUID();
        const ticketNum = `COL-2026-${Date.now()}-${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}`;

        await db.insert(tickets).values({
          ticketNumber: ticketNum,
          tier: "participant",
          participantId: member.participantId,
          teamId: payment.teamId,
          qrToken,
        });

        // Fetch participant details for email
        const { participants } = await import("@/db/schema");
        const [participant] = await db
          .select({ name: participants.fullName, email: participants.email })
          .from(participants)
          .where(eq(participants.id, member.participantId))
          .limit(1);

        if (participant) {
          await sendTicketEmail({
            to:            participant.email,
            recipientName: participant.name,
            ticketNumber:  ticketNum,
            tier:          "participant",
            gameName:      undefined, // fetched below
            qrToken,
          }).catch((err) => console.error("Email send failed:", err));
        }
      }

      // Update team status
      await db
        .update(teams)
        .set({ status: "confirmed" })
        .where(eq(teams.id, payment.teamId));
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
