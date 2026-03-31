CREATE TABLE IF NOT EXISTS "webhook_inbox" (
	"id" serial PRIMARY KEY NOT NULL,
	"idempotency_key" text NOT NULL,
	"source" varchar(32) NOT NULL,
	"team_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhook_inbox" ADD CONSTRAINT "webhook_inbox_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_inbox_key_source" ON "webhook_inbox" ("idempotency_key", "source");
