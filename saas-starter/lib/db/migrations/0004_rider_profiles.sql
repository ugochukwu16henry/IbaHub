CREATE TABLE IF NOT EXISTS "rider_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"phone" varchar(30),
	"vehicle_type" varchar(40),
	"service_zone" varchar(100),
	"verification_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"availability_status" varchar(20) DEFAULT 'offline' NOT NULL,
	"kyc_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rider_profiles" ADD CONSTRAINT "rider_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rider_profiles_user_unique" ON "rider_profiles" ("user_id");
