"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approvePayment, rejectPayment, getScreenshotViewUrl } from "../actions";

type TicketRef = { ticketNumber: string; qrToken: string; tier: string; event: string };

type Payment = {
  paymentId:       string;
  amount:          number;
  method:          string;
  transactionRef:  string | null;
  screenshotUrl:   string | null;
  status:          string;
  createdAt:       Date;
  rejectionReason?: string | null;
  teamName:        string | null;
  gameName:        string | null;
  captainName:     string | null;
  captainEmail:    string | null;
  captainPhone?:   string | null;
  institution:     string | null;
  productName?:    string | null;
  productEvent?:   string | null;
  tickets?:        TicketRef[];
};

/** Pre-filled WhatsApp message carrying the pass link — staff press send. */
function waLink(p: Payment, qrToken: string) {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${base}/api/pass/${qrToken}`;
  const eventName =
    p.productEvent === "prelaunch"
      ? "PreLaunch (5 September)"
      : "The Colosseum (2–4 October)";
  const msg = [
    `Assalam-o-Alaikum ${p.captainName ?? ""}`.trim(),
    ``,
    `Your pass for ${eventName} is confirmed — ${p.productName ?? "your ticket"}.`,
    ``,
    `Download your pass here:`,
    url,
    ``,
    `Please show the QR code at the gate. It admits one entry per day and is non-transferable.`,
    ``,
    `— The Colosseum, MIUC Flagship Campus H-8`,
  ].join("\n");
  // Keep digits only; a local 03xx number is Pakistani, so swap the leading 0 for 92.
  let phone = (p.captainPhone ?? "").replace(/[^0-9]/g, "");
  if (phone.startsWith("0")) phone = "92" + phone.slice(1);
  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    pending_review: { bg: "rgba(200,205,217,0.15)",  color: "var(--gold)" },
    approved:       { bg: "rgba(176,38,255,0.15)",   color: "var(--teal)" },
    rejected:       { bg: "rgba(255,45,98,0.15)",   color: "var(--red-arena)" },
  };
  const c = colors[status] ?? { bg: "rgba(255,255,255,0.05)", color: "var(--text-muted)" };
  return (
    <span style={{
      background: c.bg, color: c.color,
      fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase",
      padding: "0.2rem 0.6rem", borderRadius: "999px",
    }}>
      {status.replace("_", " ")}
    </span>
  );
}

function PaymentCard({ p, onAction }: { p: Payment; onAction: () => void }) {
  const [rejecting,  setRejecting]  = useState(false);
  const [reason,     setReason]     = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");

  async function handleApprove() {
    setLoading(true);
    const result = await approvePayment(p.paymentId);
    if (!result.success) setError(result.error ?? "Failed");
    else onAction();
    setLoading(false);
  }

  async function handleReject() {
    if (!reason.trim()) { setError("Enter a rejection reason."); return; }
    setLoading(true);
    const result = await rejectPayment(p.paymentId, reason);
    if (!result.success) setError(result.error ?? "Failed");
    else onAction();
    setLoading(false);
  }

  async function viewReceipt() {
    if (!p.screenshotUrl) return;
    const res = await getScreenshotViewUrl(p.screenshotUrl);
    if (res.success) window.open(res.url, "_blank", "noopener");
    else setError(res.error ?? "Could not open receipt.");
  }

  return (
    <div className="glass" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-primary)" }}>
            {p.teamName ?? "Observer Registration"}
          </p>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            {p.gameName ?? "—"} · {p.institution ?? "—"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <StatusBadge status={p.status} />
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold)", fontSize: "1rem", fontWeight: 700 }}>
            PKR {p.amount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Details grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.5rem" }}>
        {[
          ["Captain",   p.captainName],
          ["Email",     p.captainEmail],
          ["Method",    p.method],
          ["Ref / TXN", p.transactionRef ?? "—"],
          ["Submitted", new Date(p.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })],
        ].map(([label, value]) => (
          <div key={label}>
            <p style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "0.15rem" }}>{label}</p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", fontFamily: label === "Ref / TXN" ? "var(--font-mono)" : "inherit" }}>{value}</p>
          </div>
        ))}
        <div>
          <p style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: "0.15rem" }}>Receipt</p>
          {p.screenshotUrl ? (
            <button
              type="button"
              onClick={viewReceipt}
              style={{ background: "transparent", border: "none", padding: 0, color: "var(--teal)", fontSize: "0.875rem", cursor: "pointer", textDecoration: "underline" }}
            >
              🧾 View screenshot
            </button>
          ) : (
            <p style={{ fontSize: "0.875rem", color: "var(--text-faint)" }}>Not attached</p>
          )}
        </div>
      </div>

      {/* Passes only exist once a payment is verified, so this block is the
          gate: nothing is downloadable until approval has happened. */}
      {p.status === "approved" && (
        <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "0.6rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-faint)", marginRight: "0.2rem" }}>
            {p.tickets && p.tickets.length ? `Passes (${p.tickets.length})` : "Passes"}
          </span>
          {p.tickets && p.tickets.length ? (
            p.tickets.map((t) => (
              <span key={t.qrToken} style={{ display: "inline-flex", gap: "0.35rem", alignItems: "center" }}>
                <a
                  href={`/api/pass/${t.qrToken}`} target="_blank" rel="noopener"
                  title={`Download ${t.ticketNumber}`}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    fontSize: "0.7rem", fontFamily: "var(--font-mono)", color: "var(--violet)",
                    textDecoration: "none", border: "1px solid var(--border-teal)",
                    borderRadius: 999, padding: "0.22rem 0.6rem",
                  }}
                >
                  ⬇ {t.ticketNumber.split("-").slice(-1)[0]}
                </a>
                <a
                  href={waLink(p, t.qrToken)} target="_blank" rel="noopener"
                  title="Send this pass on WhatsApp"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "0.3rem",
                    fontSize: "0.7rem", color: "#25D366", textDecoration: "none",
                    border: "1px solid rgba(37,211,102,0.45)", borderRadius: 999,
                    padding: "0.22rem 0.6rem",
                  }}
                >
                  ✆ WhatsApp
                </a>
              </span>
            ))
          ) : (
            <span style={{ fontSize: "0.72rem", color: "var(--text-faint)" }}>
              No pass recorded for this payment.
            </span>
          )}
        </div>
      )}

      {p.status === "rejected" && p.rejectionReason && (
        <p style={{ fontSize: "0.8rem", color: "var(--red-arena)", borderTop: "1px solid var(--border-glass)", paddingTop: "0.75rem" }}>
          Rejection reason: {p.rejectionReason}
        </p>
      )}

      {/* Actions — only for pending */}
      {p.status === "pending_review" && (
        <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "1rem" }}>
          {!rejecting ? (
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                className="btn-primary"
                style={{ fontSize: "0.875rem", padding: "0.6rem 1.25rem", opacity: loading ? 0.6 : 1 }}
                disabled={loading}
                onClick={handleApprove}
              >
                {loading ? "Processing…" : "✓ Approve"}
              </button>
              <button
                className="btn-ghost"
                style={{ fontSize: "0.875rem", padding: "0.6rem 1.25rem", borderColor: "var(--red-arena)", color: "var(--red-arena)" }}
                onClick={() => setRejecting(true)}
              >
                ✗ Reject
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for rejection…"
                style={{
                  background: "rgba(22,18,32,0.7)", border: "1px solid var(--red-arena)",
                  borderRadius: "8px", padding: "0.65rem 1rem", color: "var(--text-primary)",
                  fontSize: "0.875rem", fontFamily: "var(--font-body)", outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  className="btn-danger"
                  style={{ fontSize: "0.875rem", padding: "0.6rem 1.25rem", opacity: loading ? 0.6 : 1 }}
                  disabled={loading}
                  onClick={handleReject}
                >
                  {loading ? "Rejecting…" : "Confirm Reject"}
                </button>
                <button
                  className="btn-ghost"
                  style={{ fontSize: "0.875rem", padding: "0.6rem 1.25rem" }}
                  onClick={() => { setRejecting(false); setReason(""); setError(""); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {error && <p style={{ color: "var(--red-arena)", fontSize: "0.8rem", marginTop: "0.5rem" }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

export default function PaymentQueue({ pending, history }: { pending: Payment[]; history: Payment[] }) {
  const router = useRouter();
  const refresh = () => router.refresh();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
      {/* Pending */}
      <div>
        <p className="eyebrow" style={{ marginBottom: "1rem", color: "var(--gold)" }}>
          Awaiting Review ({pending.length})
        </p>
        {pending.length === 0 ? (
          <div className="glass" style={{ padding: "2rem", textAlign: "center", color: "var(--text-faint)" }}>
            No pending payments. All clear.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {pending.map((p) => <PaymentCard key={p.paymentId} p={p} onAction={refresh} />)}
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <p className="eyebrow" style={{ marginBottom: "1rem" }}>History</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {history.map((p) => <PaymentCard key={p.paymentId} p={p} onAction={refresh} />)}
          </div>
        </div>
      )}
    </div>
  );
}
