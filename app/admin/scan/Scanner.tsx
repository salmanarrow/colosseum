"use client";

import { useEffect, useRef, useState } from "react";
import { lookupTicketByToken, logScan, upgradeCitizenToGladiator } from "../actions";

type Game = {
  id: string; slug: string; name: string; category: string;
  participationFeePkr: number; externalSurchargePkr: number;
};

type Lookup = Awaited<ReturnType<typeof lookupTicketByToken>>;
type FoundTicket = Extract<Lookup, { found: true }>;

export default function Scanner({ games }: { games: Game[] }) {
  const [ticket, setTicket]   = useState<FoundTicket | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [manual, setManual]   = useState("");
  const [busy, setBusy]       = useState(false);
  const [toast, setToast]     = useState("");
  const [gameId, setGameId]   = useState("");
  const [camError, setCamError] = useState("");
  const scannerRef = useRef<{ stop: () => Promise<void>; clear: () => void } | null>(null);
  const startedRef = useRef(false);

  const isExternal =
    ticket?.institutionType === "external_college" || ticket?.institutionType === "external_university";

  const selectedGame = games.find((g) => g.id === gameId);
  const difference = selectedGame
    ? selectedGame.participationFeePkr + (isExternal ? selectedGame.externalSurchargePkr : 0)
    : 0;

  // ── Camera lifecycle ──────────────────────────────────────────────────────
  async function startCamera() {
    if (startedRef.current || ticket || notFound) return;
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const instance = new Html5Qrcode("qr-reader");
      scannerRef.current = instance;
      startedRef.current = true;
      await instance.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        async (decoded: string) => { await handleToken(decoded); },
        () => {} // ignore per-frame decode errors
      );
    } catch (err) {
      startedRef.current = false;
      setCamError("Camera unavailable — use manual entry below. (" + (err as Error).message + ")");
    }
  }

  async function stopCamera() {
    const inst = scannerRef.current;
    scannerRef.current = null;
    startedRef.current = false;
    if (inst) { try { await inst.stop(); inst.clear(); } catch { /* already stopped */ } }
  }

  useEffect(() => {
    startCamera();
    return () => { stopCamera(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  async function handleToken(tokenOrUrl: string) {
    if (busy) return;
    setBusy(true);
    setToast("");
    await stopCamera();
    try {
      const res = await lookupTicketByToken(tokenOrUrl);
      if (res.found) { setTicket(res); setNotFound(false); }
      else { setTicket(null); setNotFound(true); }
    } finally {
      setBusy(false);
    }
  }

  async function doLogScan() {
    if (!ticket) return;
    setBusy(true);
    const res = await logScan(ticket.ticketId, "gate");
    setToast(res.success ? "✅ Gate entry logged" : (res.error ?? "Failed"));
    setBusy(false);
  }

  async function doUpgrade() {
    if (!ticket || !gameId) return;
    setBusy(true);
    const res = await upgradeCitizenToGladiator(ticket.ticketId, gameId);
    if (res.success) {
      setToast(`✅ Upgraded to Gladiator — ${res.gameName} · collected PKR ${res.difference?.toLocaleString()}`);
      setTicket({ ...ticket, tier: "participant", gameName: res.gameName ?? ticket.gameName });
    } else {
      setToast(res.error ?? "Upgrade failed");
    }
    setBusy(false);
  }

  function reset() {
    setTicket(null); setNotFound(false); setManual(""); setGameId(""); setToast(""); setCamError("");
    // restart camera on next tick
    setTimeout(() => startCamera(), 50);
  }

  const tierLabel = ticket?.tier === "participant" ? "Gladiator Pass ⚔️"
    : ticket?.tier === "basic" ? "Citizen Pass 🏛️" : "Spectator 🎟️";

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Camera viewport — shown only while scanning */}
      {!ticket && !notFound && (
        <div className="glass" style={{ padding: "1rem" }}>
          <div id="qr-reader" style={{ width: "100%", borderRadius: 12, overflow: "hidden" }} />
          {camError && <p style={{ color: "var(--gold)", fontSize: "0.8rem", marginTop: "0.75rem", lineHeight: 1.5 }}>{camError}</p>}

          {/* Manual fallback */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Paste QR token or URL"
              style={{
                flex: 1, background: "rgba(20,35,50,0.7)", border: "1px solid var(--border-glass)",
                borderRadius: 10, padding: "0.6rem 0.9rem", color: "var(--text-primary)", fontSize: "0.85rem",
                fontFamily: "var(--font-mono)", outline: "none",
              }}
              onKeyDown={(e) => { if (e.key === "Enter" && manual.trim()) handleToken(manual.trim()); }}
            />
            <button className="btn-ghost" disabled={busy || !manual.trim()} onClick={() => handleToken(manual.trim())} style={{ fontSize: "0.85rem" }}>
              Look up
            </button>
          </div>
        </div>
      )}

      {/* Not found */}
      {notFound && (
        <div className="glass glass--red" style={{ padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>❌</div>
          <p className="eyebrow" style={{ color: "var(--red-arena)" }}>Invalid Ticket</p>
          <p style={{ color: "var(--text-muted)", margin: "0.5rem 0 1.25rem" }}>No ticket matches that code.</p>
          <button className="btn-primary" onClick={reset} style={{ justifyContent: "center" }}>Scan Another</button>
        </div>
      )}

      {/* Ticket card */}
      {ticket && (
        <div className={`glass ${ticket.tier === "participant" ? "glass--gold" : "glass--teal"}`} style={{ padding: "1.75rem" }}>
          <p className="eyebrow" style={{ color: ticket.tier === "participant" ? "var(--gold)" : "var(--teal)" }}>{tierLabel}</p>
          <h2 className="display" style={{ fontSize: "1.6rem", margin: "0.25rem 0 1rem" }}>{ticket.participantName}</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
            {[
              ["Institution", ticket.institution],
              ["Ticket No.",  ticket.ticketNumber],
              ...(ticket.gameName ? [["Game", ticket.gameName] as [string, string]] : []),
              ...(ticket.teamName ? [["Team", ticket.teamName] as [string, string]] : []),
              ["Rate", isExternal ? "External" : "Internal (MIUC/RIS)"],
            ].map(([label, value]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.4rem" }}>
                <span style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-faint)" }}>{label}</span>
                <span style={{ fontSize: "0.88rem", color: "var(--text-primary)", textAlign: "right" }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Gate entry */}
          <button className="btn-primary" disabled={busy} onClick={doLogScan} style={{ width: "100%", justifyContent: "center", marginBottom: "1rem" }}>
            ✅ Log Gate Entry
          </button>

          {/* Upgrade (Citizen only) */}
          {ticket.tier === "basic" && (
            <div style={{ borderTop: "1px solid var(--border-glass)", paddingTop: "1.25rem" }}>
              <p className="eyebrow" style={{ color: "var(--gold)", marginBottom: "0.6rem" }}>Upgrade to Gladiator</p>
              <select
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                style={{
                  width: "100%", background: "rgba(20,35,50,0.7)", border: "1px solid var(--border-glass)",
                  borderRadius: 10, padding: "0.7rem 0.9rem", color: gameId ? "var(--text-primary)" : "var(--text-faint)",
                  fontSize: "0.9rem", marginBottom: "0.75rem",
                }}
              >
                <option value="">Select a title…</option>
                {games.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>

              {selectedGame && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(245,200,66,0.08)", borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Collect difference</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold)", fontWeight: 700, fontSize: "1.1rem" }}>
                    PKR {difference.toLocaleString()}
                  </span>
                </div>
              )}

              <button className="btn-primary" disabled={busy || !gameId} onClick={doUpgrade} style={{ width: "100%", justifyContent: "center" }}>
                {difference > 0 ? `Collect Cash & Upgrade (PKR ${difference.toLocaleString()})` : "Upgrade (no charge)"}
              </button>
            </div>
          )}

          {toast && (
            <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.85rem", color: "var(--teal)", lineHeight: 1.5 }}>{toast}</p>
          )}

          <button className="btn-ghost" onClick={reset} style={{ width: "100%", justifyContent: "center", marginTop: "1rem", fontSize: "0.85rem" }}>
            ⟲ Scan Another
          </button>
        </div>
      )}
    </div>
  );
}
