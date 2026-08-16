"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createManualRegistration, deleteRegistration } from "../actions";

export type Registration = {
  teamId: string;
  teamName: string | null;
  status: string;
  institution: string | null;
  totalPrice: number;
  createdAt: Date;
  gameName: string | null;
  gameCategory: string | null;
  captainName: string | null;
  captainEmail: string | null;
  captainPhone: string | null;
};

export type TicketProduct = {
  id: string; name: string; event: string; category: string;
  pricePkr: number; priceBasis: string; socialsAddonPkr: number;
  isTeamEvent: boolean; minPlayers: number;
};

const STATUS: Record<string, { bg: string; color: string }> = {
  draft:           { bg: "rgba(255,255,255,0.05)", color: "var(--text-faint)" },
  pending_payment: { bg: "rgba(200,205,217,0.12)", color: "var(--silver)" },
  pending_review:  { bg: "rgba(200,205,217,0.12)", color: "var(--silver)" },
  confirmed:       { bg: "rgba(176,38,255,0.12)",  color: "var(--violet)" },
  cancelled:       { bg: "rgba(255,45,98,0.12)",   color: "var(--red-arena)" },
};

function inputStyle(): React.CSSProperties {
  return {
    background: "rgba(22,18,32,0.7)", border: "1px solid var(--border-glass)",
    borderRadius: 10, padding: "0.65rem 0.9rem", color: "var(--text-primary)",
    fontSize: "0.9rem", outline: "none", width: "100%", fontFamily: "var(--font-body)",
  };
}

export default function RegistrationManager({
  registrations, products,
}: { registrations: Registration[]; products: TicketProduct[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [f, setF] = useState({
    productId: "", fullName: "", email: "", phone: "",
    institutionName: "", internal: "external_college",
    teamName: "", wantsSocials: false, markPaid: true, note: "",
  });
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const product = products.find((p) => p.id === f.productId);
  const roster = product?.isTeamEvent ? product.minPlayers : 1;
  const amount = product ? product.pricePkr + (f.wantsSocials ? product.socialsAddonPkr * roster : 0) : 0;

  async function submit() {
    if (!f.productId || !f.fullName.trim() || !/\S+@\S+\.\S+/.test(f.email) || !f.phone.trim()) {
      setMsg("Ticket, name, a valid email and phone are required."); return;
    }
    setBusy(true); setMsg("");
    const res = await createManualRegistration({
      productId: f.productId, fullName: f.fullName, email: f.email, phone: f.phone,
      institutionName: f.institutionName || "—",
      institutionType: f.internal as "roots" | "miuc" | "external_college" | "external_university",
      teamName: f.teamName || undefined,
      wantsSocials: f.wantsSocials, amountPkr: amount, markPaid: f.markPaid, note: f.note || undefined,
    });
    if (res.success) {
      setMsg(f.markPaid ? "Added — pass issued and emailed." : "Added as pending payment.");
      setF({ productId: "", fullName: "", email: "", phone: "", institutionName: "", internal: "external_college", teamName: "", wantsSocials: false, markPaid: true, note: "" });
      setAdding(false);
      router.refresh();
    } else setMsg(res.error ?? "Failed.");
    setBusy(false);
  }

  async function remove(teamId: string) {
    setBusy(true);
    const res = await deleteRegistration(teamId);
    setMsg(res.success ? "Registration deleted." : (res.error ?? "Delete failed."));
    setConfirmId(null);
    setBusy(false);
    router.refresh();
  }

  const confirmed = registrations.filter((r) => r.status === "confirmed").length;
  const pending = registrations.filter((r) => ["pending_payment", "pending_review"].includes(r.status)).length;

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <h1 className="display" style={{ fontSize: "2.2rem", marginBottom: "0.25rem" }}>Registrations</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            View, add and remove entries. Adding as paid issues the QR pass immediately.
          </p>
        </div>
        <button className="btn-primary" style={{ fontSize: "0.875rem" }} onClick={() => { setAdding((a) => !a); setMsg(""); }}>
          {adding ? "✕ Cancel" : "+ Add Registration"}
        </button>
      </div>

      {msg && (
        <p style={{ marginBottom: "1.25rem", fontSize: "0.85rem", color: msg.includes("Failed") || msg.includes("required") ? "var(--red-arena)" : "var(--violet)" }}>
          {msg}
        </p>
      )}

      {/* Manual add */}
      {adding && (
        <div className="glass glass--gold" style={{ padding: "1.5rem", marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p className="eyebrow" style={{ color: "var(--silver)" }}>New Registration</p>

          <select value={f.productId} onChange={(e) => set("productId", e.target.value)} style={{ ...inputStyle(), color: f.productId ? "var(--text-primary)" : "var(--text-faint)" }}>
            <option value="">Select a ticket…</option>
            {["prelaunch", "colosseum"].map((ev) => (
              <optgroup key={ev} label={ev === "prelaunch" ? "PreLaunch · 5 Sept" : "The Colosseum · 2–4 Oct"}>
                {products.filter((p) => p.event === ev).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — PKR {p.pricePkr.toLocaleString()}</option>
                ))}
              </optgroup>
            ))}
          </select>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            <input placeholder="Full name *" value={f.fullName} onChange={(e) => set("fullName", e.target.value)} style={inputStyle()} />
            <input placeholder="Email *" type="email" value={f.email} onChange={(e) => set("email", e.target.value)} style={inputStyle()} />
            <input placeholder="Phone *" value={f.phone} onChange={(e) => set("phone", e.target.value)} style={inputStyle()} />
            <input placeholder="Institution" value={f.institutionName} onChange={(e) => set("institutionName", e.target.value)} style={inputStyle()} />
            {product?.isTeamEvent && (
              <input placeholder="Team name" value={f.teamName} onChange={(e) => set("teamName", e.target.value)} style={inputStyle()} />
            )}
            <select value={f.internal} onChange={(e) => set("internal", e.target.value)} style={inputStyle()}>
              <option value="miuc">MIUC</option>
              <option value="roots">ROOTS</option>
              <option value="external_college">External college</option>
              <option value="external_university">External university</option>
            </select>
          </div>

          <input placeholder="Note / reference (e.g. cash at desk)" value={f.note} onChange={(e) => set("note", e.target.value)} style={inputStyle()} />

          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
            {product && product.socialsAddonPkr > 0 && (
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                <input type="checkbox" checked={f.wantsSocials} onChange={(e) => set("wantsSocials", e.target.checked)} style={{ accentColor: "var(--violet)", width: 16, height: 16 }} />
                Concert access (+{(product.socialsAddonPkr * roster).toLocaleString()})
              </label>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <input type="checkbox" checked={f.markPaid} onChange={(e) => set("markPaid", e.target.checked)} style={{ accentColor: "var(--violet)", width: 16, height: 16 }} />
              Mark as paid &amp; issue pass now
            </label>
            <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", color: "var(--silver)", fontWeight: 700 }}>
              PKR {amount.toLocaleString()}
            </span>
          </div>

          <button className="btn-primary" disabled={busy} style={{ justifyContent: "center", opacity: busy ? 0.6 : 1 }} onClick={submit}>
            {busy ? "Saving…" : "Create Registration"}
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[["Total", registrations.length], ["Confirmed", confirmed], ["Pending", pending]].map(([l, v]) => (
          <div key={l as string} className="glass" style={{ padding: "1.25rem", textAlign: "center" }}>
            <div className="display" style={{ fontSize: "2rem", color: "var(--silver)" }}>{v as number}</div>
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)" }}>{l as string}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {registrations.length === 0 ? (
        <div className="glass" style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-faint)" }}>
          No registrations yet.
        </div>
      ) : (
        <div className="glass" style={{ padding: "0.5rem", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", minWidth: 820 }}>
            <thead>
              <tr>
                {["Team / Name", "Ticket", "Captain", "Institution", "Amount", "Status", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "0.75rem", fontSize: "0.63rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)", borderBottom: "1px solid var(--border-glass)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => {
                const s = STATUS[r.status] ?? { bg: "rgba(255,255,255,0.05)", color: "var(--text-muted)" };
                return (
                  <tr key={r.teamId}>
                    <td style={{ padding: "0.75rem", borderBottom: "1px solid var(--border-glass)", color: "var(--text-primary)" }}>{r.teamName ?? "—"}</td>
                    <td style={{ padding: "0.75rem", borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)" }}>{r.gameName ?? "—"}</td>
                    <td style={{ padding: "0.75rem", borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)" }}>
                      {r.captainName ?? "—"}<br />
                      <span style={{ fontSize: "0.72rem", color: "var(--text-faint)" }}>{r.captainEmail}</span>
                    </td>
                    <td style={{ padding: "0.75rem", borderBottom: "1px solid var(--border-glass)", color: "var(--text-muted)" }}>{r.institution ?? "—"}</td>
                    <td style={{ padding: "0.75rem", borderBottom: "1px solid var(--border-glass)", fontFamily: "var(--font-mono)", color: "var(--silver)" }}>{r.totalPrice.toLocaleString()}</td>
                    <td style={{ padding: "0.75rem", borderBottom: "1px solid var(--border-glass)" }}>
                      <span style={{ background: s.bg, color: s.color, fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.2rem 0.55rem", borderRadius: 999 }}>
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", borderBottom: "1px solid var(--border-glass)", whiteSpace: "nowrap" }}>
                      {confirmId === r.teamId ? (
                        <span style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
                          <button disabled={busy} onClick={() => remove(r.teamId)} style={{ background: "var(--red-arena)", color: "#fff", border: "none", borderRadius: 6, padding: "0.3rem 0.6rem", fontSize: "0.72rem", cursor: "pointer" }}>
                            Confirm
                          </button>
                          <button onClick={() => setConfirmId(null)} style={{ background: "transparent", color: "var(--text-faint)", border: "none", fontSize: "0.72rem", cursor: "pointer" }}>
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmId(r.teamId)} style={{ background: "transparent", border: "none", color: "var(--red-arena)", fontSize: "0.78rem", cursor: "pointer" }}>
                          Delete
                        </button>
                      )}
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
