CREATE TYPE "public"."admin_role" AS ENUM('admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."day" AS ENUM('Fri', 'Sat', 'Sun');--> statement-breakpoint
CREATE TYPE "public"."game_category" AS ENUM('flagship', 'festival', 'legacy');--> statement-breakpoint
CREATE TYPE "public"."inquiry_status" AS ENUM('new', 'contacted', 'closed');--> statement-breakpoint
CREATE TYPE "public"."inquiry_type" AS ENUM('sponsorship', 'team_interest', 'partnership', 'other');--> statement-breakpoint
CREATE TYPE "public"."institution_type" AS ENUM('roots', 'miuc', 'external_college', 'external_university');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('captain', 'member');--> statement-breakpoint
CREATE TYPE "public"."organization_type" AS ENUM('sponsor', 'college', 'university', 'other');--> statement-breakpoint
CREATE TYPE "public"."pass_type" AS ENUM('day', 'three_day');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('coordinator', 'bank_transfer', 'jazzcash', 'easypaisa', 'safepay', 'other');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending_review', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."sponsor_tier" AS ENUM('title', 'platinum', 'gold', 'silver', 'in_kind');--> statement-breakpoint
CREATE TYPE "public"."team_status" AS ENUM('draft', 'pending_payment', 'pending_review', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."ticket_tier" AS ENUM('participant', 'basic', 'spectator');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"role" "admin_role" DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"format" text,
	"category" "game_category" NOT NULL,
	"is_team_event" boolean DEFAULT false NOT NULL,
	"min_players" integer DEFAULT 1 NOT NULL,
	"max_players" integer DEFAULT 1 NOT NULL,
	"base_fee_pkr" integer DEFAULT 1000 NOT NULL,
	"participation_fee_pkr" integer DEFAULT 0 NOT NULL,
	"external_surcharge_pkr" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "games_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "institution_inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"organization_name" text NOT NULL,
	"organization_type" "organization_type" NOT NULL,
	"inquiry_type" "inquiry_type" NOT NULL,
	"message" text,
	"status" "inquiry_status" DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"institution_name" text NOT NULL,
	"institution_type" "institution_type" NOT NULL,
	"student_id_or_cnic" text,
	"date_of_birth" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"amount_pkr" integer NOT NULL,
	"team_id" uuid,
	"spectator_ticket_id" uuid,
	"method" "payment_method" NOT NULL,
	"screenshot_url" text,
	"transaction_ref" text,
	"coordinator_name" text,
	"campus" text,
	"status" "payment_status" DEFAULT 'pending_review' NOT NULL,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spectator_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"pass_type" "pass_type" NOT NULL,
	"day" "day",
	"tier" "institution_type" NOT NULL,
	"price_pkr" integer NOT NULL,
	"status" "team_status" DEFAULT 'pending_payment' NOT NULL,
	"qr_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"tier" "sponsor_tier" NOT NULL,
	"website_url" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"role" "member_role" DEFAULT 'member' NOT NULL,
	"confirmation_token" text,
	"confirmed_at" timestamp with time zone,
	"invited_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_id" uuid NOT NULL,
	"team_name" text NOT NULL,
	"captain_participant_id" uuid NOT NULL,
	"institution_name" text NOT NULL,
	"institution_type" "institution_type" NOT NULL,
	"status" "team_status" DEFAULT 'draft' NOT NULL,
	"total_price_pkr" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"zone" text NOT NULL,
	"day" "day" NOT NULL,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"scanned_by" uuid
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_number" text NOT NULL,
	"tier" "ticket_tier" NOT NULL,
	"participant_id" uuid NOT NULL,
	"team_id" uuid,
	"spectator_ticket_id" uuid,
	"qr_token" text NOT NULL,
	"pdf_url" text,
	"emailed_at" timestamp with time zone,
	"whatsapp_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_ticket_number_unique" UNIQUE("ticket_number"),
	CONSTRAINT "tickets_qr_token_unique" UNIQUE("qr_token")
);
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_spectator_ticket_id_spectator_tickets_id_fk" FOREIGN KEY ("spectator_ticket_id") REFERENCES "public"."spectator_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_reviewed_by_admins_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spectator_tickets" ADD CONSTRAINT "spectator_tickets_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_captain_participant_id_participants_id_fk" FOREIGN KEY ("captain_participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_scans" ADD CONSTRAINT "ticket_scans_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_scans" ADD CONSTRAINT "ticket_scans_scanned_by_admins_id_fk" FOREIGN KEY ("scanned_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_spectator_ticket_id_spectator_tickets_id_fk" FOREIGN KEY ("spectator_ticket_id") REFERENCES "public"."spectator_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "participants_email_idx" ON "participants" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_unique_idx" ON "team_members" USING btree ("team_id","participant_id");