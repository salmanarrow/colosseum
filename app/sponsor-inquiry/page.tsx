import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Become a Sponsor · The Colosseum",
  description:
    "Sponsor and partnership inquiries for ROOTS × MIUC: The Colosseum.",
};

export default function SponsorInquiryPage() {
  return (
    <ComingSoon
      title="Partner With Us"
      blurb="The sponsor and institution inquiry form is being built. In the meantime, reach out to the committee directly to discuss title, platinum, gold, silver, and in-kind partnerships."
    />
  );
}
