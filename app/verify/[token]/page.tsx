import { db } from "@/db";
import { tickets, participants, teams, games } from "@/db/schema";
import { eq } from "drizzle-orm";
import Nav from "@/components/Nav";

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const result = await db
    .select({
      ticketNumber:  tickets.ticketNumber,
      tier:          tickets.tier,
      qrToken:       tickets.qrToken,
      createdAt:     tickets.createdAt,
      participantName:  participants.fullName,
      participantEmail: participants.email,
      institution:   participants.institutionName,
      teamName:      teams.teamName,
      gameName:      games.name,
    })
    .from(tickets)
    .leftJoin(participants, eq(tickets.participantId, participants.id))
    .leftJoin(teams,        eq(tickets.teamId,        teams.id))
    .leftJoin(games,        eq(teams.gameId,          games.id))
    .where(eq(tickets.qrToken, token))
    .limit(1);

  const ticket = result[0];

  const isValid  = !!ticket;
  const tierLabel = ticket?.tier === "participant" ? "Gladiator Pass ⚔️" : "Citizen Pass 🏛️";

  return (
    <>
      <Nav />
      <main style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        padding: "6rem 1.5rem", position: "relative", overflow: "hidden",
      }}>
        <div className={`blob ${isValid ? "blob--teal" : "blob--red"}`} style={{ width: 400, height: 400, top: "-80px", right: "-80px" }} />
        <div className="blob blob--purple" style={{ width: 300, height: 300, bottom: "-60px", left: "-60px" }} />

        <div
          className={`glass ${isValid ? "glass--teal" : "glass--red"}`}
          style={{ padding: "2.5rem", maxWidth: "480px", width: "100%", textAlign: "center", position: "relative", zIndex: 1 }}
        >
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>
            {isValid ? "✅" : "❌"}
          </div>

          <p className="eyebrow" style={{ color: isValid ? "var(--teal)" : "var(--red-arena)", marginBottom: "0.5rem" }}>
            {isValid ? "Valid Ticket" : "Invalid Ticket"}
          </p>

          <h1 className="display" style={{ fontSize: "2.5rem", marginBottom: "1.5rem" }}>
            {isValid ? tierLabel : "Not Found"}
          </h1>

          {isValid ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", textAlign: "left" }}>
              {[
                ["Name",        ticket.participantName],
                ["Institution", ticket.institution],
                ["Ticket No.",  ticket.ticketNumber],
                ...(ticket.gameName ? [["Game", ticket.gameName]] : []),
                ...(ticket.teamName ? [["Team", ticket.teamName]] : []),
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-faint)" }}>{label}</span>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-primary)", textAlign: "right" }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: "0.5rem", background: "rgba(0,194,168,0.08)", borderRadius: "8px", padding: "0.75rem 1rem" }}>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  ✓ Admit to all zones.
                  {ticket.tier === "participant" && " Eligible to compete at game station."}
                </p>
              </div>
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
              This QR code does not match any ticket in our system.
              If you believe this is an error, please contact the registration desk.
            </p>
          )}
        </div>
      </main>
    </>
  );
}
