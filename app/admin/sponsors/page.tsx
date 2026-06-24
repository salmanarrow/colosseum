import { getAllSponsors } from "../actions";
import SponsorManager from "./SponsorManager";

export const dynamic = "force-dynamic";

export default async function AdminSponsorsPage() {
  const sponsors = await getAllSponsors();
  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="display" style={{ fontSize: "2.5rem", marginBottom: "0.25rem" }}>Sponsors</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Add and manage sponsors. Changes reflect on the public Sponsors page immediately.
        </p>
      </div>
      <SponsorManager sponsors={sponsors} />
    </div>
  );
}
