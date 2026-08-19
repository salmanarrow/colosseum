"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createManualRegistration, deleteRegistration } from "../actions";

export type TicketRef = { ticketNumber: string; qrToken: string; tier: string; event: string };

export type Registration = {
  paymentId: string;
  teamId: string | null;
  status: string;
  amount: number;
  createdAt: string | Date;
  transactionRef: string | null;
  screenshotUrl: string | null;
  productName: string | null;
  productEvent: string | null;
  teamName: string | null;
  teamStatus: string | null;
  socialsCount: number | null;
  buyerName: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  institution: string | null;
  tickets: TicketRef[];
};

export type TicketProduct = {
  id: string; name: string; event: string; category: string;
  pricePkr: number; priceBasis: string; socialsAddonPkr: number;
  isTeamEvent: boolean; minPlayers: number;
};

const STATUS: Record<string, { bg: string; color: string }> = {
  pending_review: { bg: "rgba(200,205,217,0.12)", color: "var(--silver)" },
  approved:       { bg: "rgba(176,38,255,0.15)",  color: "var(--violet)" },
  rejected:       { bg: "rgba(255,45,98,0.15)",   color: "var(--red-arena)" },
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

  // Search & filters
  const [q, setQ] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [f, setF] = useState({
    productId: "", fullName: "", email: "", phone: "",
    institutionName: "", internal: "external_college",
    teamName: "", wantsSocials: false, markPaid: true, note: "",
    useCustomPrice: false, customPrice: "",
  });
  const set = (k: string, v: unknown) => setF((s) => ({ ...s, [k]: v }));

  const product = products.find((p) => p.id === f.productId);
  const roster = product?.isTeamEvent ? product.minPlayers : 1;
  const standardAmount = product ? product.pricePkr + (f.wantsSocials ? product.socialsAddonPkr * roster : 0) : 0;
  const amount = f.useCustomPrice ? Math.max(0, parseInt(f.customPrice || "0", 10) || 0) : standardAmount;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return registrations.filter((r) => {
      if (eventFilter !== "all" && r.productEvent !== eventFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!needle) return true;
      // Search everything an organiser might have to hand at the desk.
      const hay = [
        r.buyerName, r.buyerEmail, r.buyerPhone, r.institution,
        r.teamName, r.productName, r.transactionRef,
        ...r.tickets.flatMap((t) => [t.ticketNumber, t.qrToken]),
      ].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(needle);
    });
  }, [registrations, q, eventFilter, statusFilter]);

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
      setMsg(f.markPaid ? "Added — pass issued." : "Added as pending payment.");
      setF({ productId: "", fullName: "", email: "", phone: "", institutionName: "", internal: "external_college", teamName: "", wantsSocials: false, markPaid: true, note: "", useCustomPrice: false, customPrice: "" });
      setAdding(false); router.refresh();
    } else setMsg(res.error ?? "Failed.");
    setBusy(false);
  }

  async function remove(teamId: string) {
    setBusy(true);
    const res = await deleteRegistration(teamId);
    setMsg(res.success ? "Registration deleted." : (res.error ?? "Delete failed."));
    setConfirmId(null); setBusy(false); router.refresh();
  }

  const approved = registrations.filter((r) => r.status === "approved").length;
  const pending  = registrations.filter((r) => r.status === "pending_review").length;
  const revenue  = registrations.filter((r) => r.status === "approved").reduce((n, r) => n + r.amount, 0);

  return (
    <div style={{ maxWidth: 1150 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 className="display" style={{ fontSize: "2.2rem", marginBottom: "0.25rem" }}>Registrations</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Every registration across both events — teams, solo entries and observer passes.
          </p>
        </div>
        <button className="btn-primary" style={{ fontSize: "0.875rem" }} onClick={() => { setAdding((a) => !a); setMsg(""); }}>
          {adding ? "✕ Cancel" : "+ Add Registration"}
        </button>
      </div>

      {msg && (
        <p style={{ marginBottom: "1rem", fontSize: "0.85rem", color: /fail|required/i.test(msg) ? "var(--red-arena)" : "var(--violet)" }}>{msg}</p>
      )}

      {adding && (
        <div className="glass glass--gold" style={{ padding: "1.5rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
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
          <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
            {product && product.socialsAddonPkr > 0 && (
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                <input type="checkbox" checked={f.wantsSocials} onChange={(e) => set("wantsSocials", e.target.checked)} style={{ accentColor: "var(--violet)", width: 16, height: 16 }} />
                Concert access (+{(product.socialsAddonPkr * roster).toLocaleString()})
              </label>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <input type="checkbox" checked={f.markPaid} onChange={(e) => set("markPaid", e.target.checked)} style={{ accentColor: "var(--violet)", width: 16, height: 16 }} />
              Mark as paid &amp; issue pass
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <input
                type="checkbox" checked={f.useCustomPrice}
                onChange={(e) => setF((prev) => ({ ...prev, useCustomPrice: e.target.checked, customPrice: e.target.checked ? String(standardAmount) : "" }))}
                style={{ accentColor: "var(--violet)", width: 16, height: 16 }}
              />
              Custom price
            </label>
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              {f.useCustomPrice ? (
                <>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-faint)", textDecoration: "line-through", fontFamily: "var(--font-mono)" }}>{standardAmount.toLocaleString()}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>PKR</span>
                  <input type="number" min={0} value={f.customPrice} onChange={(e) => set("customPrice", e.target.value)}
                    style={{ ...inputStyle(), width: 110, textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--silver)", fontWeight: 700 }} />
                </>
              ) : (
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--silver)", fontWeight: 700 }}>PKR {amount.toLocaleString()}</span>
              )}
            </span>
          </div>
          <button className="btn-primary" disabled={busy} style={{ justifyContent: "center", opacity: busy ? 0.6 : 1 }} onClick={submit}>
            {busy ? "Saving…" : "Create Registration"}
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.85rem", marginBottom: "1.5rem" }}>
        {[["Total", String(registrations.length)], ["Approved", String(approved)], ["Pending", String(pending)], ["Revenue", `PKR ${revenue.toLocaleString()}`]].map(([l, v]) => (
          <div key={l} className="glass" style={{ padding: "1rem", textAlign: "center" }}>
            <div className="display" style={{ fontSize: "1.5rem", color: "var(--silver)" }}>{v}</div>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, phone, team, ticket number, transaction ref…"
          style={{ ...inputStyle(), flex: 1, minWidth: 260 }}
        />
        <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} style={{ ...inputStyle(), width: "auto", minWidth: 170 }}>
          <option value="all">All events</option>
          <option value="prelaunch">PreLaunch · 5 Sept</option>
          <option value="colosseum">Colosseum · 2–4 Oct</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle(), width: "auto", minWidth: 150 }}>
          <option value="all">All statuses</option>
          <option value="pending_review">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <p style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginBottom: "0.75rem" }}>
        Showing {filtered.length} of {registrations.length}
      </p>

      {filtered.length === 0 ? (
        <div className="glass" style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-faint)" }}>
          {registrations.length === 0 ? "No registrations yet." : "Nothing matches that search."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((r) => {
            const st = STATUS[r.status] ?? { bg: "rgba(255,255,255,0.05)", color: "var(--text-muted)" };
            return (
              <div key={r.paymentId} className="glass" style={{ padding: "1.15rem 1.35rem", display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", flexWrap: "wrap" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-primary)" }}>
                      {r.teamName ?? r.buyerName ?? "—"}
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                      {r.productName ?? "—"}
                      {r.productEvent && (
                        <span style={{ color: "var(--text-faint)" }}>
                          {" · "}{r.productEvent === "prelaunch" ? "PreLaunch" : "Colosseum"}
                        </span>
                      )}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ background: st.bg, color: st.color, fontSize: "0.6rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.2rem 0.55rem", borderRadius: 999 }}>
                      {r.status.replace("_", " ")}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--silver)", fontWeight: 700 }}>
                      PKR {r.amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: "0.5rem" }}>
                  {[
                    ["Buyer", r.buyerName],
                    ["Email", r.buyerEmail],
                    ["Phone", r.buyerPhone],
                    ["Institution", r.institution],
                    ["Ref / TXN", r.transactionRef],
                    ["Registered", new Date(r.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <p style={{ fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>{k as string}</p>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-primary)", wordBreak: "break-word" }}>{(v as string) || "—"}</p>
                    </div>
                  ))}
                </div>

                {r.tickets.length > 0 && (
                  <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "0.65rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)" }}>
                      Passes ({r.tickets.length})
                    </span>
                    {r.tickets.map((t) => (
                      <a key={t.qrToken} href={`/api/pass/${t.qrToken}`} target="_blank" rel="noopener"
                        style={{ fontSize: "0.72rem", fontFamily: "var(--font-mono)", color: "var(--violet)", textDecoration: "underline" }}>
                        {t.ticketNumber}
                      </a>
                    ))}
                  </div>
                )}

                {r.teamId && (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    {confirmId === r.teamId ? (
                      <span style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                        <button disabled={busy} onClick={() => remove(r.teamId!)} style={{ background: "var(--red-arena)", color: "#fff", border: "none", borderRadius: 999, padding: "0.3rem 0.8rem", fontSize: "0.72rem", cursor: "pointer" }}>Confirm delete</button>
                        <button onClick={() => setConfirmId(null)} style={{ background: "transparent", border: "none", color: "var(--text-faint)", fontSize: "0.72rem", cursor: "pointer" }}>Cancel</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmId(r.teamId)} style={{ background: "transparent", border: "none", color: "var(--red-arena)", fontSize: "0.75rem", cursor: "pointer" }}>Delete</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
