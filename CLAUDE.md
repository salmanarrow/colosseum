# CLAUDE.md — ROOTS × MIUC: The Colosseum

> Project handoff for Claude Code. This file is the single source of truth for the website build. Read it first in any new session. When facts in this file conflict with attached PDFs/decks, this file wins until the committee updates it.

---

## What we're building

A registration and ticketing website for **ROOTS × MIUC: The Colosseum** — a 3-day nationwide collegiate e-sports championship hosted in Islamabad–Rawalpindi.

- **Hosts:** ROOTS International Schools & Colleges + Metropolitan International United College (MIUC)
- **Executive sponsor:** Mr. Walid Mushtaq
- **Domain:** `thecolosseum.pk`
- **Venue:** ROOTS H-8 Flagship Campus, Islamabad
- **Scope:** 9 game titles (5 flagship competitive + 4 festival/legacy), 500+ players expected, 3,000–5,000 footfall

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
7. **Roots/MIUC attendance pass** — mandatory free registration for host students
8. **Sponsors** — sponsor logos/names grouped by tier (Title / Platinum / Gold / Silver / In-kind). Data-driven from the `sponsors` table so admins add sponsors as they onboard, no deploy needed. Until a logo is supplied, render the name as a styled text card. The homepage sponsor wall reads from this same table.
9. **Admin** — login, dashboard, payment review queue, registration tables, sponsor management, scanner page for gate entry

### Vision statement (committee-drafted)

> "Establish the twin cities' first championship built for both colleges and universities — a gladiatorial arena that becomes Pakistan's flagship campus e-sports property and an annual tradition."

---

## Pricing matrix (from Master Event Plan §7)

Three-layer model. Flat PKR 1,000 base for **everyone**, plus per-title participation fee, plus external arena surcharge for non-ROOTS/MIUC teams.

**What the base fee covers:** the PKR 1,000 base is the entry/participation fee *and* includes queue access to the legacy games (Chess, Ludo Star, Carrom) and board-game zone. In other words, paying the base alone lets a participant enter the event and play the legacy/casual titles. Prices increase from there: each flagship competitive title (Valorant, PUBG, Free Fire, Tekken, FC 26) stacks a participation fee on top of the base.

| Title | Base | Participation | Total (internal) | Total (external) |
|---|---|---|---|---|
| Valorant (5v5, per team) | 1,000 | +1,500 | 2,500 | 3,500 |
| PUBG Mobile (squad) | 1,000 | +1,000 | 2,000 | 2,800 |
| Free Fire MAX (squad) | 1,000 | +500 | 1,500 | 2,100 |
| Tekken 8 / EA FC 26 (player) | 1,000 | +200 | 1,200 | 1,400 |
| Forza / Ludo / Chess (player) | 1,000 | — | 1,000 | 1,100 |
| ROOTS / MIUC spectator | **FREE (mandatory)** | — | — | — |

Wire this into the `games` table so admins can edit prices without a deploy.

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

attendance_passes                          -- Roots/MIUC free mandatory
  id, participant_id (UNIQUE)
  qr_token, created_at

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
  id, ticket_number             -- e.g. COL-2026-VAL-0042
  team_id | spectator_ticket_id | attendance_pass_id   (exactly one)
  qr_token, pdf_url
  emailed_at, whatsapp_sent_at, scanned_at
  created_at
```

### Schema design principles
- **`participants` deduplicates by email.** One person can be in multiple teams across games, hold an attendance pass, and have a spectator ticket — all FK back to one participant row.
- **Pricing is data, not code.** `games` table fields drive the checkout total.
- **Attendance passes have no `payments` row** — they're free by design.
- **Polymorphic via nullable FKs + CHECK constraint** (not a `type` column) so Postgres can still enforce referential integrity.

---

## Registration flows (4 distinct journeys)

1. **Team / squad registration** — per-game, captain-driven, email-confirmation for members. Roster sizes per title:
   - Valorant: 5 players + 1 sub
   - PUBG Mobile / Free Fire: 4 players (squad)
   - Tekken 8 / EA FC 26 / Fortnite: 1 player (still uses team flow with team-of-1 for schema uniformity)
   - Forza / Ludo / Chess: 1 player
2. **Roots/MIUC attendance pass** — free, mandatory. Captures name, institution, student ID. Generates QR.
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
