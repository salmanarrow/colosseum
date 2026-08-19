// Seed for the ticket-product catalogue (`games` table).
// Run with: npm run db:seed   — idempotent, upserts by slug.
//
// Board-finalized pricing (Aug 2026). Flat prices; NO internal/external split.
//   PreLaunch  (5 Sept)  — Hackathon Pass 5,000/team (max 3) · Observer 2,500
//   Colosseum  (2–4 Oct) — Game Entry per title · Observer 3,999
//   Socials add-on = PKR 1,500 per person, unlocks CONCERT access for
//   gaming participants (Observer 3,999 already includes it).

import { readFileSync } from "fs";
import postgres from "postgres";

function databaseUrl() {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const line = env.split("\n").find((l) => l.startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL not found in .env.local");
  return line.slice("DATABASE_URL=".length).trim();
}

const SOCIALS = 1500;

// slug, name, format, event, category, isTeam, min, max, price, basis, socials, free, order
const PRODUCTS = [
  // ── PreLaunch — 5 September ──────────────────────────────────────────────
  ["hackathon-pass",     "Hackathon Pass",       "CTF + MVP · team of up to 3", "prelaunch", "hackathon", true,  1, 3, 5000, "per_team",   0,       false, 10],
  ["prelaunch-observer", "PreLaunch Observer",   "Auto Show + DJ Night",        "prelaunch", "pass",      false, 1, 1, 2500, "per_person", 0,       false, 20],

  // ── The Colosseum — 2–4 October · Game Entry ─────────────────────────────
  ["pubg-squad",       "PUBG Mobile — Squad",   "4-player squad", "colosseum", "flagship", true,  4, 4, 2500, "per_team",   SOCIALS, false, 30],
  ["pubg-solo",        "PUBG Mobile — Solo",    "Solo",           "colosseum", "flagship", false, 1, 1, 1000, "per_person", SOCIALS, false, 31],
  ["free-fire-squad",  "Free Fire — Squad",     "4-player squad", "colosseum", "flagship", true,  4, 4, 2000, "per_team",   SOCIALS, false, 32],
  ["free-fire-solo",   "Free Fire — Solo",      "Solo",           "colosseum", "flagship", false, 1, 1, 1000, "per_person", SOCIALS, false, 33],
  ["valorant",         "Valorant",              "5v5 squad",      "colosseum", "flagship", true,  5, 6, 2500, "per_team",   SOCIALS, false, 34],
  ["tekken",           "Tekken",                "1v1",            "colosseum", "flagship", false, 1, 1, 2000, "per_person", SOCIALS, false, 35],
  ["fifa",             "FIFA",                  "1v1",            "colosseum", "flagship", false, 1, 1, 2000, "per_person", SOCIALS, false, 36],
  ["cosplay",          "Cosplay",               "Costume contest","colosseum", "cosplay",  false, 1, 1, 1500, "per_person", SOCIALS, false, 37],

  // ── The Colosseum — Observer ─────────────────────────────────────────────
  ["colosseum-observer", "Colosseum Observer",  "Full 3-day access", "colosseum", "pass", false, 1, 1, 3999, "per_person", 0, false, 40],

  // ── Free side activities (any Colosseum ticket) ──────────────────────────
  ["forza",     "Forza",     "Racing", "colosseum", "legacy", false, 1, 1, 0, "per_person", 0, true, 50],
  ["chess",     "Chess",     "1v1",    "colosseum", "legacy", false, 1, 1, 0, "per_person", 0, true, 51],
  ["ludo-star", "Ludo Star", "Casual", "colosseum", "legacy", false, 1, 4, 0, "per_person", 0, true, 52],
  ["carrom",    "Carrom",    "Casual", "colosseum", "legacy", false, 1, 4, 0, "per_person", 0, true, 53],
];

const sql = postgres(databaseUrl(), { prepare: false });

try {
  // category enum needs the new product classes
  for (const v of ["hackathon", "pass", "cosplay"]) {
    await sql.unsafe(`ALTER TYPE game_category ADD VALUE IF NOT EXISTS '${v}'`);
  }

  const keep = PRODUCTS.map((p) => p[0]);
  for (const [slug, name, format, event, category, isTeam, min, max, price, basis, socials, free, order] of PRODUCTS) {
    await sql`
      insert into games
        (slug, name, format, event, category, is_team_event, min_players, max_players,
         price_pkr, price_basis, socials_addon_pkr, is_free_activity, display_order, active,
         base_fee_pkr, participation_fee_pkr, external_surcharge_pkr)
      values
        (${slug}, ${name}, ${format}, ${event}::event_phase, ${category}::game_category, ${isTeam}, ${min}, ${max},
         ${price}, ${basis}::price_basis, ${socials}, ${free}, ${order}, true, 0, 0, 0)
      on conflict (slug) do update set
        name = excluded.name, format = excluded.format, event = excluded.event,
        category = excluded.category, is_team_event = excluded.is_team_event,
        min_players = excluded.min_players, max_players = excluded.max_players,
        price_pkr = excluded.price_pkr, price_basis = excluded.price_basis,
        socials_addon_pkr = excluded.socials_addon_pkr,
        is_free_activity = excluded.is_free_activity,
        display_order = excluded.display_order, active = true
    `;
  }

  // retire anything not in the finalized catalogue (old fee-model rows)
  const retired = await sql`update games set active = false where slug <> all(${keep}) returning slug`;
  if (retired.length) console.log("retired:", retired.map((r) => r.slug).join(", "));

  const rows = await sql`
    select event, slug, price_pkr, price_basis, socials_addon_pkr, is_free_activity
    from games where active order by display_order`;
  console.log(`\nSeeded ${rows.length} active products:`);
  let cur = "";
  for (const r of rows) {
    if (r.event !== cur) { cur = r.event; console.log(`\n  [${cur.toUpperCase()}]`); }
    const price = r.is_free_activity ? "FREE" : `PKR ${r.price_pkr.toLocaleString()} ${r.price_basis === "per_team" ? "/team" : "/person"}`;
    const soc = r.socials_addon_pkr ? `  (+${r.socials_addon_pkr} socials/person)` : "";
    console.log(`    ${r.slug.padEnd(20)} ${price}${soc}`);
  }
} catch (e) {
  console.error("Seed failed:", e.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
