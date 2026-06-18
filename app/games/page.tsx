import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import GameGrid from "@/components/GameGrid";

export const metadata: Metadata = {
  title: "Games · The Colosseum",
  description:
    "All 9 titles at ROOTS × MIUC: The Colosseum — five flagship competitive games and four festival/legacy titles.",
};

export default function GamesPage() {
  return (
    <>
      <Nav />
      <main style={{ position: "relative", overflow: "hidden", paddingTop: "6rem" }}>
        <div
          className="blob blob--purple"
          style={{ width: 480, height: 480, top: "0", left: "-140px" }}
        />
        <GameGrid />
        <div style={{ textAlign: "center", padding: "0 1.5rem 5rem" }}>
          <Link href="/register" className="btn-primary">
            Register Your Squad →
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
