const GAMES = [
  {
    name: "Valorant",
    format: "5v5 Squad",
    category: "flagship",
    fee: "PKR 2,500",
    emoji: "🎯",
  },
  {
    name: "PUBG Mobile",
    format: "4-man Squad",
    category: "flagship",
    fee: "PKR 2,000",
    emoji: "🔫",
  },
  {
    name: "Free Fire MAX",
    format: "4-man Squad",
    category: "flagship",
    fee: "PKR 1,500",
    emoji: "🔥",
  },
  {
    name: "Tekken 8",
    format: "1v1",
    category: "flagship",
    fee: "PKR 1,200",
    emoji: "🥊",
  },
  {
    name: "EA FC 26",
    format: "1v1",
    category: "flagship",
    fee: "PKR 1,200",
    emoji: "⚽",
  },
  {
    name: "Chess",
    format: "1v1",
    category: "legacy",
    fee: "Included",
    emoji: "♟️",
  },
  {
    name: "Ludo Star",
    format: "Casual",
    category: "legacy",
    fee: "Included",
    emoji: "🎲",
  },
  {
    name: "Carrom",
    format: "Casual",
    category: "legacy",
    fee: "Included",
    emoji: "🎳",
  },
  {
    name: "Forza",
    format: "Racing",
    category: "festival",
    fee: "PKR 1,000",
    emoji: "🏎️",
  },
];

export default function GameGrid() {
  return (
    <section style={{ padding: "5rem 1.5rem" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <p className="eyebrow" style={{ textAlign: "center", marginBottom: "0.75rem" }}>
          9 Titles · 3 Days
        </p>
        <h2
          className="display"
          style={{
            textAlign: "center",
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            color: "var(--text-primary)",
            marginBottom: "3rem",
          }}
        >
          Choose Your Arena
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1rem",
          }}
        >
          {GAMES.map((g) => (
            <div
              key={g.name}
              className={g.category === "flagship" ? "glass glass--gold" : "glass"}
              style={{ padding: "1.5rem", position: "relative", overflow: "hidden" }}
            >
              {g.category === "flagship" && (
                <span
                  style={{
                    position: "absolute",
                    top: "0.75rem",
                    right: "0.75rem",
                    fontSize: "0.6rem",
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "var(--gold)",
                    background: "rgba(245,200,66,0.12)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "999px",
                  }}
                >
                  Flagship
                </span>
              )}
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{g.emoji}</div>
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.4rem",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: "var(--text-primary)",
                  marginBottom: "0.25rem",
                }}
              >
                {g.name}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.75rem" }}>
                {g.format}
              </p>
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  color: g.fee === "Included" ? "var(--teal)" : "var(--gold)",
                  fontSize: "0.875rem",
                }}
              >
                {g.fee}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
