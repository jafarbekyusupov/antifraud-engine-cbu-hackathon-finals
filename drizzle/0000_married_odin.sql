CREATE TYPE "public"."alert_status" AS ENUM('OPEN', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."card_type" AS ENUM('UZCARD', 'HUMO', 'VISA', 'MASTERCARD');--> statement-breakpoint
CREATE TYPE "public"."case_event_type" AS ENUM('CASE_OPENED', 'STATUS_CHANGED', 'NOTE_ADDED');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('OPEN', 'INVESTIGATING', 'CONFIRMED', 'FALSE_POSITIVE', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."client_segment" AS ENUM('STANDARD', 'YOUNG', 'PREMIUM');--> statement-breakpoint
CREATE TYPE "public"."decision_action" AS ENUM('APPROVE', 'STEP_UP', 'BLOCK');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('M', 'F');--> statement-breakpoint
CREATE TYPE "public"."merchant_risk_level" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."replay_job_status" AS ENUM('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."transaction_channel" AS ENUM('ATM', 'ECOM', 'P2P', 'POS');--> statement-breakpoint
CREATE TYPE "public"."transaction_response" AS ENUM('OK', 'DECLINED');--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" uuid NOT NULL,
	"transaction_id" varchar(9) NOT NULL,
	"client_id" varchar(6) NOT NULL,
	"risk_score" smallint NOT NULL,
	"status" "alert_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" varchar(7) PRIMARY KEY NOT NULL,
	"client_id" varchar(6) NOT NULL,
	"type" "card_type" NOT NULL,
	"currency" varchar(3) NOT NULL,
	"opened_at" date NOT NULL,
	"daily_limit" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "case_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"case_id" uuid NOT NULL,
	"event_type" "case_event_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" uuid NOT NULL,
	"status" "case_status" DEFAULT 'OPEN' NOT NULL,
	"note" text,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_baselines" (
	"client_id" varchar(6) PRIMARY KEY NOT NULL,
	"sample_count" integer DEFAULT 0 NOT NULL,
	"amount_mean" double precision DEFAULT 0 NOT NULL,
	"amount_m2" double precision DEFAULT 0 NOT NULL,
	"amount_median" double precision,
	"amount_q1" double precision,
	"amount_q3" double precision,
	"frequent_cities" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"frequent_mccs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" varchar(6) PRIMARY KEY NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"gender" "gender" NOT NULL,
	"birth_year" integer NOT NULL,
	"region" varchar(50) NOT NULL,
	"home_city" varchar(50) NOT NULL,
	"opened_at" date NOT NULL,
	"monthly_income" bigint NOT NULL,
	"segment" "client_segment" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" varchar(9) NOT NULL,
	"risk_score" smallint NOT NULL,
	"action" "decision_action" NOT NULL,
	"signals" jsonb NOT NULL,
	"rule_version" varchar(30) NOT NULL,
	"processing_time_us" integer NOT NULL,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "decisions_risk_score_check" CHECK ("decisions"."risk_score" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" varchar(6) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"mcc" varchar(4) NOT NULL,
	"category" varchar(50) NOT NULL,
	"city" varchar(50) NOT NULL,
	"risk_level" "merchant_risk_level" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "replay_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "replay_job_status" DEFAULT 'PENDING' NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"processed_rows" integer DEFAULT 0 NOT NULL,
	"alerts_created" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar(9) PRIMARY KEY NOT NULL,
	"card_id" varchar(7) NOT NULL,
	"client_id" varchar(6) NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"amount" bigint NOT NULL,
	"currency" varchar(3) NOT NULL,
	"merchant_id" varchar(6) NOT NULL,
	"mcc" varchar(4) NOT NULL,
	"city" varchar(50) NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"channel" "transaction_channel" NOT NULL,
	"response" "transaction_response" NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_decision_id_decisions_id_fk" FOREIGN KEY ("decision_id") REFERENCES "public"."decisions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_events" ADD CONSTRAINT "case_events_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "public"."alerts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_baselines" ADD CONSTRAINT "client_baselines_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decisions" ADD CONSTRAINT "decisions_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alerts_decision_id_uidx" ON "alerts" USING btree ("decision_id");--> statement-breakpoint
CREATE INDEX "alerts_status_created_at_idx" ON "alerts" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "alerts_client_created_at_idx" ON "alerts" USING btree ("client_id","created_at");--> statement-breakpoint
CREATE INDEX "alerts_risk_score_idx" ON "alerts" USING btree ("risk_score");--> statement-breakpoint
CREATE INDEX "cards_client_id_idx" ON "cards" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "case_events_case_created_at_idx" ON "case_events" USING btree ("case_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cases_alert_id_uidx" ON "cases" USING btree ("alert_id");--> statement-breakpoint
CREATE INDEX "cases_status_updated_at_idx" ON "cases" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "clients_segment_idx" ON "clients" USING btree ("segment");--> statement-breakpoint
CREATE UNIQUE INDEX "decisions_transaction_rule_version_uidx" ON "decisions" USING btree ("transaction_id","rule_version");--> statement-breakpoint
CREATE INDEX "decisions_decided_at_idx" ON "decisions" USING btree ("decided_at");--> statement-breakpoint
CREATE INDEX "merchants_mcc_idx" ON "merchants" USING btree ("mcc");--> statement-breakpoint
CREATE INDEX "transactions_client_occurred_at_idx" ON "transactions" USING btree ("client_id","occurred_at");--> statement-breakpoint
CREATE INDEX "transactions_card_occurred_at_idx" ON "transactions" USING btree ("card_id","occurred_at");--> statement-breakpoint
CREATE INDEX "transactions_merchant_occurred_at_idx" ON "transactions" USING btree ("merchant_id","occurred_at");--> statement-breakpoint
CREATE INDEX "transactions_occurred_at_idx" ON "transactions" USING btree ("occurred_at");--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_decision_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
	RAISE EXCEPTION 'decisions are append-only; % is not permitted', TG_OP;
END;
$$;--> statement-breakpoint
CREATE TRIGGER decisions_append_only
BEFORE UPDATE OR DELETE ON "decisions"
FOR EACH ROW EXECUTE FUNCTION prevent_decision_mutation();
