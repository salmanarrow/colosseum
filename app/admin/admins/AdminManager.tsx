"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { listAdmins, createAdmin, updateAdminRole, removeAdmin, setAdminPassword } from "../actions";

type AdminRow = {
  id: string; email: string; fullName: string;
  role: "admin" | "super_admin";
  createdAt: string | Date;
  lastSignInAt: string | null;
};

function field(): React.CSSProperties {
  return {
    background: "rgba(22,18,32,0.7)", border: "1px solid var(--border-glass)",
    borderRadius: 10, padding: "0.65rem 0.9rem", color: "var(--text-primary)",
    fontSize: "0.9rem", outline: "none", width: "100%", fontFamily: "var(--font-body)",
  };
}

export default function AdminManager() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [callerId, setCallerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ email: "", password: "", fullName: "", role: "admin" as "admin" | "super_admin" });
  const [pwFor, setPwFor] = useState<string | null>(null);
  const [newPw, setNewPw] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const token = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? "";
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await listAdmins(await token());
    if (res.success) {
      setRows(res.admins as AdminRow[]);
      setCallerId(res.callerId ?? "");
      setDenied("");
    } else {
      setDenied(res.error ?? "Not permitted.");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function doCreate() {
    setBusy(true); setMsg("");
    const res = await createAdmin(await token(), f);
    setMsg(res.success ? `Admin created — ${f.email} can sign in now.` : (res.error ?? "Failed."));
    if (res.success) {
      setF({ email: "", password: "", fullName: "", role: "admin" });
      setAdding(false);
      await load();
    }
    setBusy(false);
  }

  async function doRole(id: string, role: "admin" | "super_admin") {
    setBusy(true); setMsg("");
    const res = await updateAdminRole(await token(), id, role);
    setMsg(res.success ? "Role updated." : (res.error ?? "Failed."));
    if (res.success) await load();
    setBusy(false);
  }

  async function doRemove(id: string) {
    setBusy(true); setMsg("");
    const res = await removeAdmin(await token(), id, true);
    setMsg(res.success ? "Access removed." : (res.error ?? "Failed."));
    setConfirmId(null);
    if (res.success) await load();
    setBusy(false);
  }

  async function doPassword(id: string) {
    setBusy(true); setMsg("");
    const res = await setAdminPassword(await token(), id, newPw);
    setMsg(res.success ? "Password updated." : (res.error ?? "Failed."));
    if (res.success) { setPwFor(null); setNewPw(""); }
    setBusy(false);
  }

  if (loading) {
    return <p style={{ color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>Loading admins…</p>;
  }

  if (denied) {
    return (
      <div className="glass glass--red" style={{ padding: "2rem", maxWidth: 520 }}>
        <p className="eyebrow" style={{ color: "var(--red-arena)", marginBottom: "0.5rem" }}>Not Permitted</p>
        <p style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>{denied}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem" }}>
        <div>
          <h1 className="display" style={{ fontSize: "2.2rem", marginBottom: "0.25rem" }}>Admin Access</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Who can reach this dashboard. Creating an admin makes a working login immediately — no Supabase dashboard needed.
          </p>
        </div>
        <button className="btn-primary" style={{ fontSize: "0.875rem" }} onClick={() => { setAdding((a) => !a); setMsg(""); }}>
          {adding ? "✕ Cancel" : "+ Add Admin"}
        </button>
      </div>

      {msg && (
        <p style={{ marginBottom: "1.25rem", fontSize: "0.85rem", color: /fail|not |only|cannot/i.test(msg) ? "var(--red-arena)" : "var(--violet)" }}>
          {msg}
        </p>
      )}

      {adding && (
        <div className="glass glass--gold" style={{ padding: "1.5rem", marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          <p className="eyebrow" style={{ color: "var(--silver)" }}>New Admin</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            <input placeholder="Full name" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} style={field()} />
            <input placeholder="Email *" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} style={field()} />
            <input placeholder="Password (min 8) *" type="text" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} style={field()} />
            <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as "admin" | "super_admin" })} style={field()}>
              <option value="admin">Admin — day-to-day</option>
              <option value="super_admin">Super admin — can manage admins</option>
            </select>
          </div>
          <p style={{ fontSize: "0.76rem", color: "var(--text-faint)", lineHeight: 1.6 }}>
            Give them the password directly and ask them to change it after first sign-in.
          </p>
          <button className="btn-primary" disabled={busy} style={{ justifyContent: "center", opacity: busy ? 0.6 : 1 }} onClick={doCreate}>
            {busy ? "Creating…" : "Create Admin"}
          </button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        {rows.map((a) => {
          const isMe = a.id === callerId;
          return (
            <div key={a.id} className="glass" style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1.05rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-primary)" }}>
                    {a.fullName}
                    {isMe && <span style={{ fontSize: "0.62rem", color: "var(--violet)", letterSpacing: "0.14em", marginLeft: "0.5rem" }}>· YOU</span>}
                  </p>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>{a.email}</p>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-faint)", marginTop: "0.25rem", fontFamily: "var(--font-mono)" }}>
                    {a.lastSignInAt
                      ? `last sign-in ${new Date(a.lastSignInAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}`
                      : "never signed in"}
                  </p>
                </div>
                <span style={{
                  background: a.role === "super_admin" ? "rgba(176,38,255,0.15)" : "rgba(200,205,217,0.12)",
                  color: a.role === "super_admin" ? "var(--violet)" : "var(--silver)",
                  fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase",
                  padding: "0.22rem 0.65rem", borderRadius: 999, whiteSpace: "nowrap", height: "fit-content",
                }}>
                  {a.role.replace("_", " ")}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", borderTop: "1px solid var(--border-glass)", paddingTop: "0.85rem" }}>
                <button
                  className="btn-ghost" disabled={busy}
                  style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem" }}
                  onClick={() => doRole(a.id, a.role === "super_admin" ? "admin" : "super_admin")}
                >
                  {a.role === "super_admin" ? "Make Admin" : "Make Super Admin"}
                </button>

                <button
                  className="btn-ghost"
                  style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem", borderColor: "var(--silver)", color: "var(--silver)" }}
                  onClick={() => { setPwFor(pwFor === a.id ? null : a.id); setNewPw(""); }}
                >
                  Set Password
                </button>

                {!isMe && (
                  confirmId === a.id ? (
                    <span style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                      <button
                        disabled={busy} onClick={() => doRemove(a.id)}
                        style={{ background: "var(--red-arena)", color: "#fff", border: "none", borderRadius: 999, padding: "0.4rem 0.9rem", fontSize: "0.78rem", cursor: "pointer" }}
                      >
                        Confirm remove
                      </button>
                      <button onClick={() => setConfirmId(null)} style={{ background: "transparent", border: "none", color: "var(--text-faint)", fontSize: "0.78rem", cursor: "pointer" }}>
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      className="btn-ghost"
                      style={{ fontSize: "0.78rem", padding: "0.4rem 0.9rem", borderColor: "var(--red-arena)", color: "var(--red-arena)" }}
                      onClick={() => setConfirmId(a.id)}
                    >
                      Remove Access
                    </button>
                  )
                )}
              </div>

              {pwFor === a.id && (
                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                  <input
                    placeholder="New password (min 8)" type="text" value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    style={{ ...field(), flex: 1, minWidth: 200 }}
                  />
                  <button className="btn-primary" disabled={busy} style={{ fontSize: "0.8rem", padding: "0.5rem 1.1rem" }} onClick={() => doPassword(a.id)}>
                    Save
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
