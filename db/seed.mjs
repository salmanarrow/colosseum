// Idempotent seed for the `games` table.
// Run with: npm run db:seed
// Reads DATABASE_URL from .env.local. Safe to run repeatedly (upserts by slug).

import { readFileSync } from "fs";
import postgres from "postgres";

function loadDatabaseUrl() {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const line = env.split("\n").find((l) => l.startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL not found in .env.local");
  return line.slice("DATABASE_URL=".length).trim();
}

// slug, name, format, category, isTeamEvent, minPlayers, maxPlayers,
// baseFee (Citizen, 1000), participationFee (internal upsell), externalSurcharge (added on top for external)
// Internal Gladiator total = base + participation; External total = base + participation + externalSurcharge.
const GAMES = [
  ["valorant",      "Valorant",      "5v5",          "flagship", true,  5, 6, 1000, 500, 500],
  ["pubg-mobile",   "PUBG Mobile",   "4-man Squad",  "flagship", true,  4, 4, 1000, 200, 300],
  ["free-fire-max", "Free Fire MAX", "Squad",        "flagship", true,  4, 4, 1000, 200, 300],
  ["tekken-8",      "Tekken 8",      "1v1",          "flagship", false, 1, 1, 1000, 500, 500],
  ["ea-fc-26",      "EA FC 26",      "1v1",          "flagship", false, 1, 1, 1000, 0,   500],
  ["forza",         "Forza",         "Racing",       "festival", false, 1, 1, 1000, 0,   0],
  ["chess",         "Chess",         "1v1",          "legacy",   false, 1, 1, 1000, 0,   0],
  ["ludo-star",     "Ludo Star",     "Casual",       "legacy",   false, 1, 4, 1000, 0,   0],
  ["carrom",        "Carrom",        "Casual",       "legacy",   false, 1, 4, 1000, 0,   0],
];

const sql = postgres(loadDatabaseUrl(), { prepare: false });

try {
  for (const [slug, name, format, category, isTeam, minP, maxP, base, part, surcharge] of GAMES) {
    await sql`
      insert into games
        (slug, name, format, category, is_team_event, min_players, max_players,
         base_fee_pkr, participation_fee_pkr, external_surcharge_pkr, active)
      values
        (${slug}, ${name}, ${format}, ${category}, ${isTeam}, ${minP}, ${maxP},
         ${base}, ${part}, ${surcharge}, true)
      on conflict (slug) do update set
        name = excluded.name,
        format = excluded.format,
        category = excluded.category,
        is_team_event = excluded.is_team_event,
        min_players = excluded.min_players,
        max_players = excluded.max_players,
        base_fee_pkr = excluded.base_fee_pkr,
        participation_fee_pkr = excluded.participation_fee_pkr,
        external_surcharge_pkr = excluded.external_surcharge_pkr,
        active = true
    `;
  }
  const rows = await sql`select slug, name, category from games order by category, slug`;
  console.log(`Seeded ${rows.length} games:`);
  for (const r of rows) console.log(`  [${r.category}] ${r.slug} — ${r.name}`);
} catch (e) {
  console.error("Seed failed:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
