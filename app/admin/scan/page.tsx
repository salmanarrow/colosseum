import { getUpgradeableGames } from "../actions";
import Scanner from "./Scanner";

export const dynamic = "force-dynamic";

export default async function ScanPage() {
  const games = await getUpgradeableGames();
  const flagship = games.filter((g) => g.category === "flagship");

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      <h1 className="display" style={{ fontSize: "2rem", marginBottom: "0.35rem" }}>Gate Scanner</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
        Scan a ticket QR to verify entry, log a gate scan, or upgrade a Citizen Pass to a Gladiator Pass on-site.
      </p>
      <Scanner games={flagship} />
    </div>
  );
}
