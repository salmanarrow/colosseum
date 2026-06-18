import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = {
  title: "Register · The Colosseum",
  description: "Register your squad for ROOTS × MIUC: The Colosseum.",
};

export default function RegisterPage() {
  return (
    <ComingSoon
      title="Register Your Squad"
      blurb="Squad registration opens soon. Pick your game, build your roster, invite your teammates, and lock your spot in the bracket. Check back shortly."
    />
  );
}
