"use server";

import { db } from "@/db";
import { institutionInquiries } from "@/db/schema";

type InquiryPayload = {
  contactName: string;
  email: string;
  phone: string;
  organizationName: string;
  organizationType: "sponsor" | "college" | "university" | "other";
  inquiryType: "sponsorship" | "team_interest" | "partnership" | "other";
  message: string;
};

export async function submitInquiry(payload: InquiryPayload) {
  try {
    await db.insert(institutionInquiries).values({
      contactName: payload.contactName,
      email: payload.email,
      phone: payload.phone || undefined,
      organizationName: payload.organizationName,
      organizationType: payload.organizationType,
      inquiryType: payload.inquiryType,
      message: payload.message || undefined,
      status: "new",
    });
    return { success: true };
  } catch (err) {
    console.error("Inquiry error:", err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
