"use server";

import { db } from "@/db";
import { participants, teams, teamMembers, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

type Teammate = { fullName: string; email: string; phone: string };

export type RegistrationPayload = {
  // Personal
  fullName: string;
  email: string;
  phone: string;
  institutionName: string;
  institutionType: "roots" | "miuc" | "external_college" | "external_university";
  // Role
  role: "observer" | "competitor";
  // Competitor only
  gameSlug?: string;
  gameId?: string;
  teamName?: string;
  isTeamGame?: boolean;
  teammates?: Teammate[];
  totalFeePkr: number;
  // Payment
  transactionRef: string;
  screenshotPath?: string;
};

// Upload a payment screenshot to the private Supabase Storage bucket.
// Called from the client with FormData before submitRegistration; returns the
// storage path to persist on the payment row. Uses the Storage REST API with
// the service role key (server only).
export async function uploadPaymentScreenshot(formData: FormData) {
  try {
    const file = formData.get("screenshot");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false as const, error: "No file received." };
    }
    if (file.size > 8 * 1024 * 1024) {
      return { success: false as const, error: "File is larger than 8 MB." };
    }
    if (!/^image\//.test(file.type)) {
      return { success: false as const, error: "Only image files are accepted." };
    }

    const ext  = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/payment-screenshots/${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": file.type,
        },
        body: Buffer.from(await file.arrayBuffer()),
      }
    );

    if (!res.ok) {
      console.error("Screenshot upload failed:", res.status, await res.text());
      return { success: false as const, error: "Upload failed. Please try again." };
    }
    return { success: true as const, path };
  } catch (err) {
    console.error("uploadPaymentScreenshot error:", err);
    return { success: false as const, error: "Upload failed. Please try again." };
  }
}

export async function submitRegistration(payload: RegistrationPayload) {
  try {
    // 1. Upsert participant (dedup by email)
    const existing = await db
      .select()
      .from(participants)
      .where(eq(participants.email, payload.email))
      .limit(1);

    let participantId: string;

    if (existing.length > 0) {
      participantId = existing[0].id;
    } else {
      const [newParticipant] = await db
        .insert(participants)
        .values({
          fullName: payload.fullName,
          email: payload.email,
          phone: payload.phone,
          institutionName: payload.institutionName,
          institutionType: payload.institutionType,
        })
        .returning({ id: participants.id });
      participantId = newParticipant.id;
    }

    let teamId: string | null = null;

    if (payload.role === "competitor" && payload.gameId) {
      // 2. Create team
      const [newTeam] = await db
        .insert(teams)
        .values({
          gameId: payload.gameId,
          teamName: payload.teamName ?? payload.fullName,
          captainParticipantId: participantId,
          institutionName: payload.institutionName,
          institutionType: payload.institutionType,
          status: "pending_payment",
          totalPricePkr: payload.totalFeePkr,
        })
        .returning({ id: teams.id });
      teamId = newTeam.id;

      // 3. Add captain as team member
      await db.insert(teamMembers).values({
        teamId,
        participantId,
        role: "captain",
      });

      // 4. Add teammates
      if (payload.isTeamGame && payload.teammates && payload.teammates.length > 0) {
        for (const tm of payload.teammates) {
          // Upsert teammate participant
          const existingTm = await db
            .select()
            .from(participants)
            .where(eq(participants.email, tm.email))
            .limit(1);

          let tmId: string;
          if (existingTm.length > 0) {
            tmId = existingTm[0].id;
          } else {
            const [newTm] = await db
              .insert(participants)
              .values({
                fullName: tm.fullName,
                email: tm.email,
                phone: tm.phone,
                institutionName: payload.institutionName,
                institutionType: payload.institutionType,
              })
              .returning({ id: participants.id });
            tmId = newTm.id;
          }

          await db.insert(teamMembers).values({
            teamId,
            participantId: tmId,
            role: "member",
            confirmationToken: randomUUID(),
            invitedAt: new Date(),
          });
        }
      }
    }

    // 5. Create payment row.
    //    Competitor → linked via teamId. Observer (Citizen Pass) → linked via
    //    participantId so a basic ticket can be issued to them on approval.
    await db.insert(payments).values({
      amountPkr: payload.totalFeePkr,
      teamId: teamId ?? undefined,
      participantId: teamId ? undefined : participantId,
      method: "bank_transfer",
      transactionRef: payload.transactionRef,
      screenshotUrl: payload.screenshotPath,
      status: "pending_review",
    });

    return { success: true };
  } catch (err) {
    console.error("Registration error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// Fetch game id by slug (called client-side before submit)
export async function getGameIdBySlug(slug: string) {
  const { games } = await import("@/db/schema");
  const result = await db
    .select({ id: games.id })
    .from(games)
    .where(eq(games.slug, slug))
    .limit(1);
  return result[0]?.id ?? null;
}
