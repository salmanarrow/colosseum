"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveCar, rejectCar, getCarPhotoUrl } from "../actions";

export type CarEntry = {
  id: string;
  ownerName: string; ownerEmail: string; ownerPhone: string;
  institutionName: string | null;
  carMake: string; carModel: string; carYear: string | null;
  plateNumber: string; category: string | null; modifications: string | null;
  photoUrl: string | null;
  status: string;
  rejectionReason: string | null;
  createdAt: Date;
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  pending:    { bg: "rgba(200,205,217,0.15)", color: "var(--silver)" },
  approved:   { bg: "rgba(176,38,255,0.15)",  color: "var(--violet)" },
  rejected:   { bg: "rgba(255,45,98,0.15)",   color: "var(--red-arena)" },
  checked_in: { bg: "rgba(176,38,255,0.25)",  color: "var(--violet-bright)" },
};

function CarCard({ car, onDone }: { car: CarEntry; onDone: () => void }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const s = STATUS_STYLE[car.status] ?? { bg: "rgba(255,255,255,0.05)", color: "var(--text-muted)" };

  async function viewPhoto() {
    if (!car.photoUrl) return;
    const res = await getCarPhotoUrl(car.photoUrl);
    if (res.success) window.open(res.url, "_blank", "noopener");
    else setErr(res.error ?? "Could not open photo.");
  }

  return (
    <div className="glass" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1.15rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-primary)" }}>
            {car.carMake} {car.carModel}{car.carYear ? ` · ${car.carYear}` : ""}
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--violet)", letterSpacing: "0.08em", marginTop: "0.2rem" }}>
            {car.plateNumber}
          </p>
        </div>
        <span style={{
          background: s.bg, color: s.color, fontSize: "0.65rem", letterSpacing: "0.15em",
          textTransform: "uppercase", padding: "0.2rem 0.6rem", borderRadius: "999px",
        }}>{car.status.replace("_", " ")}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.5rem" }}>
        {[
          ["Owner", car.ownerName],
          ["Email", car.ownerEmail],
          ["Phone", car.ownerPhone],
          ["Institution / Club", car.institutionName ?? "—"],
          ["Category", car.category ?? "—"],
          ["Applied", new Date(car.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })],
        ].map(([k, v]) => (
          <div key={k}>
            <p style={{ fontSize: "0.63rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "0.15rem" }}>{k}</p>
            <p style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{v}</p>
          </div>
        ))}
        <div>
          <p style={{ fontSize: "0.63rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "0.15rem" }}>Photo</p>
          {car.photoUrl ? (
            <button type="button" onClick={viewPhoto} style={{ background: "none", border: "none", padding: 0, color: "var(--violet)", fontSize: "0.85rem", cursor: "pointer", textDecoration: "underline" }}>
              🚗 View photo
            </button>
          ) : <p style={{ fontSize: "0.85rem", color: "var(--text-faint)" }}>None</p>}
        </div>
      </div>

      {car.modifications && (
        <div style={{ background: "rgba(22,18,32,0.5)", borderRadius: 10, padding: "0.75rem 1rem" }}>
          <p style={{ fontSize: "0.63rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "0.25rem" }}>Modifications</p>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>{car.modifications}</p>
        </div>
      )}

      {car.status === "rejected" && car.rejectionReason && (
        <p style={{ fontSize: "0.8rem", color: "var(--red-arena)", borderTop: "1px solid var(--border-glass)", paddingTop: "0.75rem" }}>
          Rejected: {car.rejectionReason}
        </p>
      )}

      {car.status === "pending" && (
        <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "1rem" }}>
          {!rejecting ? (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                className="btn-primary" disabled={busy}
                style={{ fontSize: "0.85rem", padding: "0.55rem 1.2rem", opacity: busy ? 0.6 : 1 }}
                onClick={async () => {
                  setBusy(true);
                  const r = await approveCar(car.id);
                  if (!r.success) setErr(r.error ?? "Failed"); else onDone();
                  setBusy(false);
                }}
              >{busy ? "Approving…" : "✓ Invite & Issue Pass"}</button>
              <button
                className="btn-ghost"
                style={{ fontSize: "0.85rem", padding: "0.55rem 1.2rem", borderColor: "var(--red-arena)", color: "var(--red-arena)" }}
                onClick={() => setRejecting(true)}
              >✗ Reject</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (sent to your records, not the owner)…"
                style={{
                  background: "rgba(22,18,32,0.7)", border: "1px solid var(--red-arena)",
                  borderRadius: 8, padding: "0.6rem 1rem", color: "var(--text-primary)",
                  fontSize: "0.85rem", outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  className="btn-danger" disabled={busy}
                  style={{ fontSize: "0.85rem", padding: "0.55rem 1.2rem" }}
                  onClick={async () => {
                    if (!reason.trim()) { setErr("Enter a reason."); return; }
                    setBusy(true);
                    const r = await rejectCar(car.id, reason);
                    if (!r.success) setErr(r.error ?? "Failed"); else onDone();
                    setBusy(false);
                  }}
                >Confirm Reject</button>
                <button className="btn-ghost" style={{ fontSize: "0.85rem", padding: "0.55rem 1.2rem" }}
                  onClick={() => { setRejecting(false); setReason(""); setErr(""); }}>Cancel</button>
              </div>
            </div>
          )}
          {err && <p style={{ color: "var(--red-arena)", fontSize: "0.8rem", marginTop: "0.5rem" }}>{err}</p>}
        </div>
      )}
    </div>
  );
}

export default function CarQueue({ cars }: { cars: CarEntry[] }) {
  const router = useRouter();
  const refresh = () => router.refresh();

  const pending = cars.filter((c) => c.status === "pending");
  const rest = cars.filter((c) => c.status !== "pending");

  const counts = {
    pending: pending.length,
    approved: cars.filter((c) => c.status === "approved" || c.status === "checked_in").length,
    rejected: cars.filter((c) => c.status === "rejected").length,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1rem" }}>
        {[["Pending", counts.pending], ["Invited", counts.approved], ["Rejected", counts.rejected], ["Total", cars.length]].map(([l, n]) => (
          <div key={l} className="glass" style={{ padding: "1rem", textAlign: "center" }}>
            <div className="display" style={{ fontSize: "1.8rem", color: "var(--silver)" }}>{n}</div>
            <div style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)" }}>{l}</div>
          </div>
        ))}
      </div>

      <div>
        <p className="eyebrow" style={{ marginBottom: "1rem", color: "var(--silver)" }}>Awaiting Review ({pending.length})</p>
        {pending.length === 0 ? (
          <div className="glass" style={{ padding: "2rem", textAlign: "center", color: "var(--text-faint)" }}>
            No entries awaiting review.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {pending.map((c) => <CarCard key={c.id} car={c} onDone={refresh} />)}
          </div>
        )}
      </div>

      {rest.length > 0 && (
        <div>
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>Reviewed</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {rest.map((c) => <CarCard key={c.id} car={c} onDone={refresh} />)}
          </div>
        </div>
      )}
    </div>
  );
}
