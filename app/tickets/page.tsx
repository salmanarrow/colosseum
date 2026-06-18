import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Tickets · The Colosseum",
  description: "Get your spectator pass for ROOTS × MIUC: The Colosseum.",
};

export default function TicketsPage() {
  return (
    <ComingSoon
      title="Spectator Passes"
      blurb="Day passes and 3-day passes for the arena floor are on their way. ROOTS and MIUC students get free mandatory attendance passes — that flow is coming too."
    />
  );
}
