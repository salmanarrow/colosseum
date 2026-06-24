import { getAllPayments } from "../actions";
import PaymentQueue from "./PaymentQueue";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const payments = await getAllPayments();
  const pending  = payments.filter((p) => p.status === "pending_review");
  const rest     = payments.filter((p) => p.status !== "pending_review");

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="display" style={{ fontSize: "2.5rem", marginBottom: "0.25rem" }}>Payment Queue</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          Approve or reject incoming registration payments.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {[
          { label: "Pending",  value: pending.length,                                   color: "var(--gold)" },
          { label: "Approved", value: payments.filter((p) => p.status === "approved").length,  color: "var(--teal)" },
          { label: "Rejected", value: payments.filter((p) => p.status === "rejected").length,  color: "var(--red-arena)" },
          { label: "Total",    value: payments.length,                                   color: "var(--text-primary)" },
        ].map((s) => (
          <div key={s.label} className="glass" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)", marginTop: "0.25rem" }}>{s.label}</div>
          </div>
        ))}
      </div>

      <PaymentQueue pending={pending} history={rest} />
    </div>
  );
}
