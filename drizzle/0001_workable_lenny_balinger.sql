CREATE TYPE "public"."security_challenge_decision" AS ENUM('CONFIRM', 'DENY');--> statement-breakpoint
CREATE TYPE "public"."security_challenge_resolution" AS ENUM('ALLOW', 'BLOCK', 'REVIEW');--> statement-breakpoint
CREATE TYPE "public"."security_challenge_status" AS ENUM('PENDING', 'VERIFIED', 'DENIED', 'REVIEW_REQUIRED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "security_challenge_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"idempotency_key" varchar(100) NOT NULL,
	"decision" "security_challenge_decision" NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"accuracy_meters" double precision NOT NULL,
	"timezone_name" varchar(100) NOT NULL,
	"utc_offset_minutes" smallint NOT NULL,
	"device_timestamp" timestamp with time zone NOT NULL,
	"location_match" boolean NOT NULL,
	"timezone_match" boolean NOT NULL,
	"clock_match" boolean NOT NULL,
	"clock_skew_seconds" integer NOT NULL,
	"distance_km" double precision NOT NULL,
	"resolution" "security_challenge_resolution" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" uuid NOT NULL,
	"transaction_id" varchar(9) NOT NULL,
	"client_id" varchar(6) NOT NULL,
	"status" "security_challenge_status" DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "security_challenge_responses" ADD CONSTRAINT "security_challenge_responses_challenge_id_security_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."security_challenges"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_challenges" ADD CONSTRAINT "security_challenges_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_challenges" ADD CONSTRAINT "security_challenges_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_challenges" ADD CONSTRAINT "security_challenges_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "security_challenge_responses_challenge_uidx" ON "security_challenge_responses" USING btree ("challenge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "security_challenge_responses_idempotency_uidx" ON "security_challenge_responses" USING btree ("challenge_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "security_challenges_decision_id_uidx" ON "security_challenges" USING btree ("decision_id");--> statement-breakpoint
CREATE INDEX "security_challenges_client_status_created_idx" ON "security_challenges" USING btree ("client_id","status","created_at");