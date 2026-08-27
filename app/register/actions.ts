"use server";

import { db } from "@/db";
import { participants, teams, teamMembers, payments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { resolveImage } from "@/lib/imageType";

type Teammate = { fullName: string; email: string; phone: string };

export type RegistrationPayload = {
  // What they bought (a row in `games` — the ticket-product catalogue)
  productId: string;
  event: "prelaunch" | "colosseum";
  // Who they are
  fullName: string;
  email: string;
  phone: string;
  institutionName: string;
  institutionType: "roots" | "miuc" | "external_college" | "external_university";
  // Team products only
  teamName?: string;
  teammates?: Teammate[];
  // Concert (socials) add-on
  wantsSocials: boolean;
  socialsCount: number;
  // Money
  totalPkr: number;
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
    // Don't trust file.type — phones routinely send an empty MIME type for
    // HEIC and other formats, which used to get the receipt rejected outright.
    // Read the bytes once and identify the image from its actual content.
    const bytes = Buffer.from(await file.arrayBuffer());
    const kind = resolveImage(file.name, file.type, bytes);
    if (!kind.ok) return { success: false as const, error: kind.reason };

    // Most likely production misconfiguration — name it plainly rather than
    // returning a generic failure the organisers can't act on.
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("upload: SUPABASE_SERVICE_ROLE_KEY is not set");
      return { success: false as const, error: "Server storage isn't configured (missing service key). Please tell the organisers." };
    }

    const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${kind.ext}`;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/payment-screenshots/${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": kind.mime,
        },
        body: bytes,
      }
    );

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("Screenshot upload failed:", res.status, detail);
      let msg = `Upload failed (${res.status})`;
      if (res.status === 400 && /mime/i.test(detail)) msg = "That image format isn't supported — try a JPG or PNG.";
      else if (res.status === 401 || res.status === 403) msg = "Storage rejected the upload (auth). Please tell the organisers.";
      else if (res.status === 413) msg = "That image is too large — try a smaller screenshot.";
      else if (detail) msg += `: ${detail.slice(0, 140)}`;
      return { success: false as const, error: msg };
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

    // 2. Look up the product to decide how to record this registration.
    const { games } = await import("@/db/schema");
    const [product] = await db
      .select({
        id: games.id,
        category: games.category,
        isTeamEvent: games.isTeamEvent,
        minPlayers: games.minPlayers,
        pricePkr: games.pricePkr,
        socialsAddonPkr: games.socialsAddonPkr,
        event: games.event,
      })
      .from(games)
      .where(eq(games.id, payload.productId))
      .limit(1);

    if (!product) return { success: false, error: "That ticket is no longer available." };

    // NEVER trust the price from the browser — recompute it from the catalogue.
    // `totalPkr` arrives in the request body, so a crafted POST could otherwise
    // register for PKR 1 and still land in the queue looking legitimate.
    const rosterSize = product.isTeamEvent ? product.minPlayers : 1;
    const serverTotal =
      product.pricePkr + (payload.wantsSocials ? product.socialsAddonPkr * rosterSize : 0);
    if (serverTotal !== payload.totalPkr) {
      console.warn(
        `Price mismatch on ${product.id}: client sent ${payload.totalPkr}, server computed ${serverTotal}. Using server value.`
      );
    }

    // Observer passes ("pass") have no game/team — everything else creates a
    // team row (a team-of-one for solo entries) so the ticket carries its title.
    const isObserverPass = product.category === "pass";
    let teamId: string | null = null;

    if (!isObserverPass) {
      const [newTeam] = await db
        .insert(teams)
        .values({
          gameId: product.id,
          teamName: payload.teamName ?? payload.fullName,
          captainParticipantId: participantId,
          institutionName: payload.institutionName,
          institutionType: payload.institutionType,
          status: "pending_payment",
          event: product.event,
          socialsCount: payload.socialsCount,
          totalPricePkr: serverTotal,
        })
        .returning({ id: teams.id });
      teamId = newTeam.id;

      await db.insert(teamMembers).values({
        teamId,
        participantId,
        role: "captain",
      });

      if (product.isTeamEvent && payload.teammates && payload.teammates.length > 0) {
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

    // 3. Create the payment row.
    //    Ticketed competitions link via teamId; observer passes link via
    //    participantId so a pass can still be issued to them on approval.
    await db.insert(payments).values({
      amountPkr: serverTotal,
      productId: payload.productId,
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
