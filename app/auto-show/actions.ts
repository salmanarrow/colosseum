"use server";

import { db } from "@/db";
import { autoShowRegistrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

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
    if (!/^image\//.test(file.type)) {
      return { success: false as const, error: "Only image files are accepted." };
    }

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/car-photos/${path}`,
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
      console.error("Car photo upload failed:", res.status, await res.text());
      return { success: false as const, error: "Upload failed. Please try again." };
    }
    return { success: true as const, path };
  } catch (err) {
    console.error("uploadCarPhoto error:", err);
    return { success: false as const, error: "Upload failed. Please try again." };
  }
}

export async function submitAutoShowRegistration(payload: AutoShowPayload) {
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
