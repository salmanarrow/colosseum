import { getAutoShowRegistrations } from "../actions";
import CarQueue, { type CarEntry } from "./CarQueue";

export const dynamic = "force-dynamic";

export default async function AutoShowAdminPage() {
  const cars = (await getAutoShowRegistrations()) as unknown as CarEntry[];

  return (
    <div>
      <h1 className="display" style={{ fontSize: "2rem", marginBottom: "0.35rem" }}>Auto Show</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "2rem" }}>
        PreLaunch · 5 September 2026 · invited cars only. Approving an entry issues a
        vehicle gate pass and emails it to the owner.
      </p>
      <CarQueue cars={cars} />
    </div>
  );
}
