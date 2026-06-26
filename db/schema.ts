import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  pgEnum,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ── Enums ──────────────────────────────────────────────────────────────────

export const gameCategoryEnum = pgEnum("game_category", [
  "flagship",
  "festival",
  "legacy",
]);

export const institutionTypeEnum = pgEnum("institution_type", [
  "roots",
  "miuc",
  "external_college",
  "external_university",
]);

export const teamStatusEnum = pgEnum("team_status", [
  "draft",
  "pending_payment",
  "pending_review",
  "confirmed",
  "cancelled",
]);

export const memberRoleEnum = pgEnum("member_role", ["captain", "member"]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "coordinator",
  "bank_transfer",
  "jazzcash",
  "easypaisa",
  "safepay",
  "other",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending_review",
  "approved",
  "rejected",
]);

export const ticketTierEnum = pgEnum("ticket_tier", [
  "participant",
  "basic",
  "spectator",
]);

export const passTypeEnum = pgEnum("pass_type", ["day", "three_day"]);

export const dayEnum = pgEnum("day", ["Fri", "Sat", "Sun"]);

export const sponsorTierEnum = pgEnum("sponsor_tier", [
  "title",
  "platinum",
  "gold",
  "silver",
  "in_kind",
]);

export const organizationTypeEnum = pgEnum("organization_type", [
  "sponsor",
  "college",
  "university",
  "other",
]);

export const inquiryTypeEnum = pgEnum("inquiry_type", [
  "sponsorship",
  "team_interest",
  "partnership",
  "other",
]);

export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "new",
  "contacted",
  "closed",
]);

export const adminRoleEnum = pgEnum("admin_role", ["admin", "super_admin"]);

// ── Reference ──────────────────────────────────────────────────────────────

export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  format: text("format"),
  category: gameCategoryEnum("category").notNull(),
  isTeamEvent: boolean("is_team_event").notNull().default(false),
  minPlayers: integer("min_players").notNull().default(1),
  maxPlayers: integer("max_players").notNull().default(1),
  baseFeepkr: integer("base_fee_pkr").notNull().default(1000),
  participationFeePkr: integer("participation_fee_pkr").notNull().default(0),
  externalSurchargePkr: integer("external_surcharge_pkr").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

// ── People ─────────────────────────────────────────────────────────────────

export const participants = pgTable(
  "participants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    institutionName: text("institution_name").notNull(),
    institutionType: institutionTypeEnum("institution_type").notNull(),
    studentIdOrCnic: text("student_id_or_cnic"),
    dateOfBirth: text("date_of_birth"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("participants_email_idx").on(t.email)]
);

export const admins = pgTable("admins", {
  id: uuid("id").primaryKey(), // = auth.users.id
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: adminRoleEnum("role").notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Registrations ──────────────────────────────────────────────────────────

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  gameId: uuid("game_id")
    .notNull()
    .references(() => games.id),
  teamName: text("team_name").notNull(),
  captainParticipantId: uuid("captain_participant_id")
    .notNull()
    .references(() => participants.id),
  institutionName: text("institution_name").notNull(),
  institutionType: institutionTypeEnum("institution_type").notNull(),
  status: teamStatusEnum("status").notNull().default("draft"),
  totalPricePkr: integer("total_price_pkr").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => participants.id),
    role: memberRoleEnum("role").notNull().default("member"),
    confirmationToken: text("confirmation_token"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("team_members_unique_idx").on(t.teamId, t.participantId)]
);

export const spectatorTickets = pgTable("spectator_tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  participantId: uuid("participant_id")
    .notNull()
    .references(() => participants.id),
  passType: passTypeEnum("pass_type").notNull(),
  day: dayEnum("day"),
  tier: institutionTypeEnum("tier").notNull(),
  pricePkr: integer("price_pkr").notNull(),
  status: teamStatusEnum("status").notNull().default("pending_payment"),
  qrToken: text("qr_token"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const institutionInquiries = pgTable("institution_inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  organizationName: text("organization_name").notNull(),
  organizationType: organizationTypeEnum("organization_type").notNull(),
  inquiryType: inquiryTypeEnum("inquiry_type").notNull(),
  message: text("message"),
  status: inquiryStatusEnum("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sponsors = pgTable("sponsors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  tier: sponsorTierEnum("tier").notNull(),
  websiteUrl: text("website_url"),
  displayOrder: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Money ──────────────────────────────────────────────────────────────────

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  amountPkr: integer("amount_pkr").notNull(),
  teamId: uuid("team_id").references(() => teams.id),
  // Set for Citizen-pass (observer) payments that have no team, so a basic
  // ticket can be issued to this participant on approval.
  participantId: uuid("participant_id").references(() => participants.id),
  spectatorTicketId: uuid("spectator_ticket_id").references(
    () => spectatorTickets.id
  ),
  method: paymentMethodEnum("method").notNull(),
  screenshotUrl: text("screenshot_url"),
  transactionRef: text("transaction_ref"),
  coordinatorName: text("coordinator_name"),
  campus: text("campus"),
  status: paymentStatusEnum("status").notNull().default("pending_review"),
  reviewedBy: uuid("reviewed_by").references(() => admins.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Output ─────────────────────────────────────────────────────────────────

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketNumber: text("ticket_number").notNull().unique(), // e.g. COL-2026-VAL-0042
  tier: ticketTierEnum("tier").notNull(),
  participantId: uuid("participant_id")
    .notNull()
    .references(() => participants.id),
  teamId: uuid("team_id").references(() => teams.id),
  spectatorTicketId: uuid("spectator_ticket_id").references(
    () => spectatorTickets.id
  ),
  qrToken: text("qr_token").notNull().unique(),
  pdfUrl: text("pdf_url"),
  emailedAt: timestamp("emailed_at", { withTimezone: true }),
  whatsappSentAt: timestamp("whatsapp_sent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const ticketScans = pgTable("ticket_scans", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id),
  zone: text("zone").notNull(), // "gate" | "valorant" | "pubg" | etc.
  day: dayEnum("day").notNull(),
  scannedAt: timestamp("scanned_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  scannedBy: uuid("scanned_by").references(() => admins.id),
});
