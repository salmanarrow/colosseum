import { getAllRegistrations } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:           { bg: "rgba(255,255,255,0.05)", color: "var(--text-faint)" },
  pending_payment: { bg: "rgba(245,200,66,0.12)",  color: "var(--gold)" },
  pending_review:  { bg: "rgba(245,200,66,0.12)",  color: "var(--gold)" },
  confirmed:       { bg: "rgba(0,194,168,0.12)",   color: "var(--teal)" },
  cancelled:       { bg: "rgba(255,45,45,0.12)",   color: "var(--red-arena)" },
};

export default async function RegistrationsPage() {
  const registrations = await getAllRegistrations();

  const confirmed = registrations.filter((r) => r.status === "confirmed").length;
  const pending   = registrations.filter((r) => ["pending_payment", "pending_review"].includes(r.status)).length;

  return (
    <div style={{ maxWidth: "1100px" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="display" style={{ fontSize: "2.5rem", marginBottom: "0.25rem" }}>Registrations</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>All team and individual registrations.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
        {[
          { label: "Total",     value: registrations.length, color: "var(--text-primary)" },
          { label: "Confirmed", value: confirmed,             color: "var(--teal)" },
          { label: "Pending",   value: pending,               color: "var(--gold)" },
        ].map((s) => (
          <div key={s.label} className="glass" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: s.color }}>{s.value}</div>
            <div style={{ fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)", marginTop: "0.25rem" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {registrations.length === 0 ? (
        <div className="glass" style={{ padding: "3rem", textAlign: "center", color: "var(--text-faint)" }}>
          No registrations yet.
        </div>
      ) : (
        <div className="glass" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-glass)" }}>
                {["Team / Name", "Game", "Captain", "Institution", "Amount", "Status", "Date"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0.75rem 1rem", textAlign: "left",
                      fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase",
                      color: "var(--text-faint)", fontWeight: 600, whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => {
                const sc = STATUS_COLORS[r.status] ?? STATUS_COLORS.draft;
                return (
                  <tr key={r.teamId} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                    <td style={{ padding: "0.9rem 1rem", color: "var(--text-primary)", fontWeight: 600 }}>
                      {r.teamName}
                    </td>
                    <td style={{ padding: "0.9rem 1rem", color: "var(--text-muted)" }}>
                      {r.gameName ?? "—"}
                    </td>
                    <td style={{ padding: "0.9rem 1rem" }}>
                      <div style={{ color: "var(--text-primary)" }}>{r.captainName}</div>
                      <div style={{ color: "var(--text-faint)", fontSize: "0.78rem" }}>{r.captainEmail}</div>
                    </td>
                    <td style={{ padding: "0.9rem 1rem", color: "var(--text-muted)", fontSize: "0.8rem", maxWidth: "180px" }}>
                      {r.institution}
                    </td>
                    <td style={{ padding: "0.9rem 1rem", fontFamily: "var(--font-mono)", color: "var(--gold)", whiteSpace: "nowrap" }}>
                      PKR {r.totalPrice.toLocaleString()}
                    </td>
                    <td style={{ padding: "0.9rem 1rem" }}>
                      <span style={{
                        background: sc.bg, color: sc.color,
                        fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase",
                        padding: "0.2rem 0.6rem", borderRadius: "999px", whiteSpace: "nowrap",
                      }}>
                        {r.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "0.9rem 1rem", color: "var(--text-faint)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                      {new Date(r.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
