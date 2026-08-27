"use server";

import { db } from "@/db";
import { autoShowRegistrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { resolveImage } from "@/lib/imageType";

export type AutoShowPayload = {
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  institutionName?: string;
  carMake: string;
  carModel: string;
  carYear?: string;
  plateNumber: string;
  category?: string;
  modifications?: string;
  photoPath?: string;
};

// Upload a car photo to the private `car-photos` bucket (server only).
export async function uploadCarPhoto(formData: FormData) {
  try {
    const file = formData.get("photo");
    if (!(file instanceof File) || file.size === 0) {
      return { success: false as const, error: "No file received." };
    }
    if (file.size > 8 * 1024 * 1024) {
      return { success: false as const, error: "Photo must be under 8 MB." };
    }
    // Identify the image from its bytes — phones often send a blank MIME type.
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
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/car-photos/${path}`,
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
      console.error("Car photo upload failed:", res.status, detail);
      return { success: false as const, error: `Upload failed (${res.status})${detail ? ": " + detail.slice(0, 140) : ""}` };
    }
    return { success: true as const, path };
  } catch (err) {
    console.error("uploadCarPhoto error:", err);
    return { success: false as const, error: "Upload failed. Please try again." };
  }
}

// Registration is CLOSED. The form is gone from the page, but this is a public
// HTTP endpoint — refuse here too so a direct POST cannot slip an entry in.
const AUTO_SHOW_REGISTRATION_OPEN = false;

export async function submitAutoShowRegistration(payload: AutoShowPayload) {
  if (!AUTO_SHOW_REGISTRATION_OPEN) {
    return { success: false, error: "Auto Show registration is closed." };
  }
  try {
    // One entry per plate — resubmitting updates the existing application
    // rather than creating a duplicate for the review queue.
    const [existing] = await db
      .select({ id: autoShowRegistrations.id, status: autoShowRegistrations.status })
      .from(autoShowRegistrations)
      .where(eq(autoShowRegistrations.plateNumber, payload.plateNumber.trim().toUpperCase()))
      .limit(1);

    if (existing) {
      if (existing.status === "approved" || existing.status === "checked_in") {
        return { success: false, error: "This vehicle is already registered and approved." };
      }
      await db
        .update(autoShowRegistrations)
        .set({
          ownerName: payload.ownerName,
          ownerEmail: payload.ownerEmail,
          ownerPhone: payload.ownerPhone,
          institutionName: payload.institutionName,
          carMake: payload.carMake,
          carModel: payload.carModel,
          carYear: payload.carYear,
          category: payload.category,
          modifications: payload.modifications,
          photoUrl: payload.photoPath,
          status: "pending",
          rejectionReason: null,
        })
        .where(eq(autoShowRegistrations.id, existing.id));
      return { success: true };
    }

    await db.insert(autoShowRegistrations).values({
      ownerName: payload.ownerName,
      ownerEmail: payload.ownerEmail,
      ownerPhone: payload.ownerPhone,
      institutionName: payload.institutionName,
      carMake: payload.carMake,
      carModel: payload.carModel,
      carYear: payload.carYear,
      plateNumber: payload.plateNumber.trim().toUpperCase(),
      category: payload.category,
      modifications: payload.modifications,
      photoUrl: payload.photoPath,
      status: "pending",
    });

    return { success: true };
  } catch (err) {
    console.error("submitAutoShowRegistration error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
