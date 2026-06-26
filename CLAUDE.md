# CLAUDE.md — ROOTS × MIUC: The Colosseum

> Project handoff for Claude Code. This file is the single source of truth for the website build. Read it first in any new session. When facts in this file conflict with attached PDFs/decks, this file wins until the committee updates it.

---

## What we're building

A registration and ticketing website for **ROOTS × MIUC: The Colosseum** — a 3-day nationwide collegiate e-sports championship hosted in Islamabad–Rawalpindi.

- **Host & organizer:** Metropolitan International United College (MIUC) — MIUC conceives, organizes, and runs the event. Branding/emphasis leads with MIUC.
- **Venue partner:** ROOTS International Schools & Colleges is the school subsidary of MIUC, the MIUC Flagship Campus H-8 is the venue. (frame MIUC and ROOTS as holding the event but maintain a strong emphasis on MIUC putting in the work.)
- **CEO, Roots International Schools and Metropolitan International United College:** Mr. Walid Mushtaq
- **Domain:** `thecolosseumpk.vercel.app`
- **Venue:** MIUC Flagship Campus H8, Islamabad
- **Scope:** 9 game titles (5 flagship competitive + 4 festival/legacy), 500+ players expected, 1,000–2,000 footfall
- **Three physical zones:** ⚔️ E-sports Arena (5 prized titles) · 🎮 Casual Arena (festival titles) · 🏛️ Legacy Lounge (Chess, Ludo, Carrom). Every paid ticket grants access to all three; only Participant tickets may *compete* in the E-sports Arena.

---

## Tech stack (locked)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Server Actions for form handling |
| Styling | Tailwind CSS + shadcn/ui + Framer Motion | Glassmorphism via `backdrop-blur` |
| Database | Supabase (Postgres + Auth + Storage) | Single vendor for DB/admin auth/file storage |
| ORM | Drizzle | Faster cold starts than Prisma on Vercel |
| Email | Resend | Sends ticket PDF on payment approval |
| WhatsApp | `wa.me` deep links (v1) | Native WhatsApp Business API later |
| QR codes | `qrcode` package | Encodes signed token tied to registration |
| PDF tickets | `@react-pdf/renderer` | Same mental model as building a page |
| Hosting | Vercel | GitHub → Vercel |
| Payments | **Manual verification v1** | Bank transfer + screenshot upload, admin approves. SafePay/JazzCash/EasyPaisa integration slot kept open for v2. |

---

## Design system

The palette comes from **MIUC's institutional brand (teal + purple)** plus gold for the Colosseum trophy/arena motif. Not arbitrary — it's deliberately on-brand.

```
Background:   #0A1628 / #0E1A2B  (deep navy-near-black)
Teal:         #00C2A8             (primary CTA, accents)
Gold:         #F5C842             (highlights, ticket trim, trophy energy)
Purple:       #7B5BFF             (decorative blobs, hover states)
Card surface: rgba(20, 35, 50, 0.6) with backdrop-blur
```

**Aesthetic:** Glassmorphism cards. Dark dominant. Generous letterspacing on display text. Floating decorative blobs (purple, teal, dark-red) behind hero sections. Subtle gold thin borders on featured/champion elements. Gladiatorial-meets-modern — think arena textures and cracked-stone wordmarks, not literal columns and togas.

**Type:** Bold sans-serif display (consider Inter, Space Grotesk, or Geist for body; a wider/heavier display face like Bebas Neue or Anton for hero headlines).

---

## Pages

1. **Homepage** — hero with countdown, 9-title grid, "Register your squad" + "Get tickets" CTAs, sponsor wall, Start.gg bracket embed slot (event-time)
2. **About** — event story, format, festival vs flagship explanation, host institutions
3. **Vision (Mr. Walid Mushtaq)** — full page: photo, bio, vision statement, quote-style framing. Vision statement copy already drafted (see below)
4. **Register as a player/squad** — game selection → team builder → captain details → invite teammates → payment
5. **Register as an institution/sponsor** — contact form for sponsors and rival-campus e-sports societies
6. **Buy spectator tickets** — day pass or 3-day pass (TBD if paid externals are in v1)
7. ~~Roots/MIUC attendance pass~~ **REMOVED — no free pass.** Everyone pays at least the base fee, including ROOTS H-8 flagship-campus students. There is no free/mandatory attendance pass. The paid **Basic ("Citizen") ticket** replaces it (all-zone access, no prized-game competition).
8. **Sponsors** — sponsor logos/names grouped by tier (Title / Platinum / Gold / Silver / In-kind). Data-driven from the `sponsors` table so admins add sponsors as they onboard, no deploy needed. Until a logo is supplied, render the name as a styled text card. The homepage sponsor wall reads from this same table.
9. **Admin** — login, dashboard, payment review queue, registration tables, sponsor management, scanner page for gate entry

### Vision statement (committee-drafted)

> "Establish the twin cities' first championship built for both colleges and universities — a gladiatorial arena that becomes Pakistan's flagship campus e-sports property and an annual tradition."

---

## Pricing matrix (committee update — June 2026)

Citizen base is **PKR 1,000 flat for everyone**. The Gladiator Pass is a modest per-title upsell over that base, with a higher rate for external squads (other universities/schools/colleges).

### Two ticket tiers (gladiatorial naming)

- **Citizen Pass** (Basic) — PKR 1,000 flat (internal *and* external). All-zone access: spectate the E-sports Arena, play in the Casual Arena and Legacy Lounge. **Cannot compete** in the 5 prized titles. Replaces the old free attendance pass.
- **Gladiator Pass** (Participant) — Citizen base + per-title competition upsell. Everything in Citizen, **plus the right to compete** in one prized title, bracket seeding, match check-in, and prize eligibility.

**Citizen → Gladiator upgrade at the venue.** A Citizen Pass holder can upgrade to a Gladiator Pass on-site by paying only the **difference** (Gladiator price − 1,000). Staff scan the Citizen QR, pick the title, collect the difference (cash), and the ticket flips to `participant` for that game. The **same QR is kept** (upgraded in place — no reprint), and the cash is recorded as an approved `other`-method payment. See "Venue upgrade flow" below.

**Tickets are per-player, not per-team.** Every roster member gets their own Gladiator Pass + QR, so each player scans individually at the game-station check-in. Team registration still happens captain-first, but issuance is per-member.

**Internal vs external rate.** Internal = MIUC (all campuses) + ROOTS/RIS (all campuses). External = other universities, schools, or colleges.

| Title | Citizen (all) | Gladiator — internal (MIUC/RIS) | Gladiator — external |
|---|---|---|---|
| Valorant (5v5, per player) | 1,000 | **1,500** | **2,000** |
| PUBG Mobile (4-player squad) | 1,000 | **1,200** | **1,500** |
| Free Fire MAX (squad) | 1,000 | **1,200** | **1,500** |
| Tekken 8 (1v1) | 1,000 | **1,500** | **2,000** |
| EA FC 26 (1v1) | 1,000 | **1,000** | **1,500** |
| Forza / Chess / Ludo / Carrom (festival/legacy) | 1,000 | 1,000 | 1,000 |
| **Citizen Pass** (all-zone, no compete) | **1,000** | — | — |

Stored in the `games` table as `base_fee_pkr` (1,000), `participation_fee_pkr` (internal upsell), and `external_surcharge_pkr` (added on top of the internal total for external squads), so admins can edit prices without a deploy. Festival/legacy titles are flat 1,000 for everyone (no upsell, no surcharge).

> **Venue upgrade flow (built):** `/admin/scan` (behind admin login) → camera scans the Citizen QR → if `tier = basic`, show "Upgrade to Gladiator" → pick title → display difference (internal/external auto-detected from the participant's institution; e.g. Valorant internal = 1,500 − 1,000 = **500**, external = 2,000 − 1,000 = **1,000**) → "Collect Cash & Upgrade" → ticket `tier` flips to `participant`, a team-of-one is created for the title, the same QR now grants competition, and the difference is recorded as an approved payment. The same page also logs gate entries to `ticket_scans`.

### Roster sizes (confirmed)
- Valorant — 5v5 (+1 sub)
- PUBG Mobile — 4-player squads (Day 1; ~25 squads expected)
- Free Fire MAX — squad
- Tekken 8 — 1v1 (solo)
- EA Sports FC 26 — 1v1 (solo)

### Naming note
Committee wants **gladiatorial** ticket names. Working set: **Citizen Pass** (basic/all-zone) and **Gladiator Pass** (participant/compete). Alternatives floated: "Spectator's Seal" / "Champion's Seal". Lock before building the ticket PDF.

---

## Database schema

### Reference
```
games
  id, slug, name, format, category (flagship | festival | legacy)
  is_team_event (bool), min_players, max_players
  base_fee_pkr (default 1000), participation_fee_pkr, external_surcharge_pkr
  active
```

### People
```
participants                   -- canonical, dedup by email
  id, full_name, email (unique), phone
  institution_name, institution_type (roots | miuc | external_college | external_university)
  student_id_or_cnic (optional), date_of_birth (optional)
  created_at

admins                         -- Supabase Auth + profile row
  id (= auth.users.id), email, full_name
  role (admin | super_admin), created_at
```

### Registrations (all FK to participants)
```
teams
  id, game_id, team_name
  captain_participant_id
  institution_name, institution_type     -- snapshot at registration
  status (draft | pending_payment | pending_review | confirmed | cancelled)
  total_price_pkr                          -- computed at submit
  created_at

team_members
  id, team_id, participant_id
  role (captain | member)
  confirmation_token, confirmed_at, invited_at
  UNIQUE(team_id, participant_id)

-- attendance_passes  -- REMOVED: no free pass. Non-competitors buy a paid
--                       Citizen Pass instead (a `tickets` row, tier = basic,
--                       with its own payment). No standalone free-pass table.

spectator_tickets                          -- if confirmed in scope
  id, participant_id
  pass_type (day | three_day), day (Fri | Sat | Sun, nullable)
  tier (roots_miuc | external), price_pkr
  status, qr_token, created_at

institution_inquiries                      -- sponsor + rival-campus contact
  id, contact_name, email, phone, organization_name
  organization_type (sponsor | college | university | other)
  inquiry_type (sponsorship | team_interest | partnership | other)
  message, status (new | contacted | closed), created_at

sponsors                                   -- onboarded sponsors, shown on Sponsors page + homepage wall
  id, name, logo_url (nullable — name-only card until logo supplied)
  tier (title | platinum | gold | silver | in_kind)
  website_url (nullable)
  display_order (int), active (bool)
  created_at
```

### Money
```
payments
  id, amount_pkr
  team_id (nullable), spectator_ticket_id (nullable)
  CHECK: exactly one set
  method (coordinator | bank_transfer | jazzcash | easypaisa | safepay | other)
  screenshot_url, transaction_ref
  coordinator_name (nullable), campus (nullable)   -- when method = coordinator
  status (pending_review | approved | rejected)
  reviewed_by, reviewed_at, rejection_reason
  created_at
```

### Payment flow — coordinator-mediated (primary, per WhatsApp announcement)

The committee's announced flow is **not direct online payment**: students pay their **campus coordinator** in cash, and coordinators remit collected fees to **Ma'am Harum Saghir** (Nationwide Head, Higher Nationals Department). The site models this rather than fighting it:

- A participant/team registers online and selects their **campus** and **coordinator**. Their `payment` row is created with `method = coordinator`, `status = pending_review`.
- Payment happens offline (student → coordinator → nationwide head). The site does not collect card/wallet money in v1.
- An admin (or a coordinator with admin access) marks the payment **approved** once the money has reached the nationwide head, which triggers ticket generation + email/WhatsApp delivery.
- The optional `bank_transfer` + screenshot path remains available as a fallback for external teams who can't route through a coordinator.

**RESOLVED:** Only the central team approves everything — **no scoped coordinator logins**. There are exactly **two admin accounts** (the committee lead + their supervisor / "Sir"). The `admins` table stays simple: no `campus` field, no `coordinator` role. Coordinators remain an offline concept (a participant selects their campus/coordinator at registration; payment is settled offline; one of the two admins approves it in the dashboard).

### Output
```
tickets
  id, ticket_number             -- e.g. COL-2026-VAL-0042 (participant), COL-2026-GEN-1184 (citizen)
  tier (participant | basic | spectator)  -- drives gate/station logic + ticket color
  participant_id                -- per-PLAYER issuance (one ticket per roster member)
  team_id (nullable)            -- set for participant tickets; carries game_id for station eligibility
  spectator_ticket_id (nullable)
  qr_token, pdf_url
  emailed_at, whatsapp_sent_at
  -- scanning: use a `ticket_scans` log (ticket_id, zone, day, scanned_at, scanned_by)
  --           NOT a single scanned_at — 3-day re-entry needs multiple scans
  created_at
```

### Two scan contexts (gate logic)
- **Venue gate** — any valid ticket (basic/participant/spectator) admits to all three zones.
- **Game-station check-in** — only a Participant ticket whose `team.game_id` matches the station is eligible to compete. Basic tickets → "spectator only" at the station.

### Schema design principles
- **`participants` deduplicates by email.** One person can hold multiple participant tickets (different games) + a basic ticket — all FK back to one participant row.
- **Pricing is data, not code.** `games` table fields drive the checkout total.
- **No free tickets.** Every ticket (including basic/Citizen) has a `payments` row.
- **`tickets.tier`** distinguishes basic vs participant; station eligibility reads off the `team → game` link.

---

## Registration flows (4 distinct journeys)

1. **Gladiator Pass — team/squad registration** — per-game, captain-driven, email-confirmation for members. Issues **one ticket per player**. Roster sizes per title:
   - Valorant: 5 players + 1 sub
   - PUBG Mobile: 4 players (squad) · Free Fire MAX: squad
   - Tekken 8 / EA FC 26: 1 player (solo; still uses team flow with team-of-1 for schema uniformity)
   - Forza / Ludo / Chess: 1 player
2. **Citizen Pass — basic ticket (paid)** — all-zone access, no prized-game competition. Captures name, institution, student ID. Paid (base fee), generates QR. Replaces the old free attendance pass.
3. **Spectator ticket (paid)** — day or 3-day pass. Status pending until confirmed in scope.
4. **Institution / sponsor inquiry** — lead-capture form, drops into admin queue.

---

## Open decisions (still need committee answers)

- [ ] Roster confirmation: **block submission until teammates confirm via email**, or allow submission with pending confirmations?
- [ ] Captain dashboard: dedicated login to edit roster, or just an edit-link emailed to the captain?
- [ ] Paid spectator tickets: in v1, or removed entirely? (Master Plan and Marketing Plan disagree.)
- [ ] Early-bird discount window: dates + discount amount?
- [x] **Coordinator access:** RESOLVED — only the central team approves payments. No scoped coordinator logins. `admins` stays simple (no `campus` field, no `coordinator` role).
- [x] **Number of admin staff:** RESOLVED — exactly **two** accounts (committee lead + supervisor). Simple `admins` table is sufficient.

---

## Assets

- **MIUC logo:** teal background, purple lotus icon, white "MIUC" wordmark. Provided as `590420256_…n.jpg`.
- **ROOTS logo:** deep teal background, white tree icon, white "ROOTS International Schools & Colleges" wordmark. Provided as `616228034_…n.jpg`.
- **Walid Mushtaq photo:** professional portrait. Provided as `652538038_…n.jpg`.

Place these in `public/brand/` with sensible filenames (`miuc-logo.jpg`, `roots-logo.jpg`, `walid-mushtaq.jpg`).

---

## Reference docs (originals, paste into repo `/docs`)

- `Roots_Colosseum_Proposal_1.pptx` — original PPT (visual direction)
- `Roots_Colosseum_Official_Report.docx` — committee-approved official report
- `Colosseum_Master_Event_Plan.md` — master planning doc (single source of truth)
- `Marketing_Plan_and_Timeline.md` — 8-week campaign
- `Technical_Spec_Sheet.md` — AV/network/hardware spec

---

## Build order suggestion

1. Scaffold Next.js + Tailwind + shadcn, deploy to Vercel, point `thecolosseum.pk` at it
2. Implement design system tokens (colors, fonts, glassmorphism utilities) — see `globals.css` starter
3. Build static pages first: homepage, about, vision, sponsors
4. Set up Supabase, run schema migrations via Drizzle
5. Build the 4 registration flows
6. Wire payments table + coordinator/screenshot flow to Supabase Storage
7. Build admin: login, registrations tables, payment review queue, sponsor management
8. Wire ticket generation: PDF + QR + Resend email + wa.me link
9. Build the QR scanner page for gate entry
10. Pre-event: Start.gg bracket embed on homepage

---

## Operational details

- **KPIs:** 300+ team registrations, 10K combined followers pre-event, 5K+ concurrent viewers at finals
- **Bracket platform:** Start.gg (embed during event)
- **Communications:** Discord (rules, check-ins) + WhatsApp broadcast lists per institution
- **Marketing repository:** kept in original `Marketing_Plan_and_Timeline.md`
- **Gate fallback:** offline check-in sheet exported as CSV from admin, kept on a tablet in case the gate network drops

---

## Confidentiality

This is an internal committee planning document. The official report is marked "Confidential · For internal review · 2026". Don't paste contents into public issues or third-party AI tools beyond the build environment.
