ALTER TABLE "rider_profiles" ADD COLUMN IF NOT EXISTS "photo_url" text;
--> statement-breakpoint
ALTER TABLE "rider_profiles" ADD COLUMN IF NOT EXISTS "avg_rating" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "rider_profiles" ADD COLUMN IF NOT EXISTS "rating_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rider_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"rider_profile_id" integer NOT NULL,
	"lat" integer NOT NULL,
	"lng" integer NOT NULL,
	"heading" integer,
	"is_online" boolean DEFAULT false NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rider_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_user_id" integer NOT NULL,
	"rider_profile_id" integer,
	"pickup_label" varchar(160) NOT NULL,
	"dropoff_label" varchar(160) NOT NULL,
	"pickup_lat" integer NOT NULL,
	"pickup_lng" integer NOT NULL,
	"dropoff_lat" integer NOT NULL,
	"dropoff_lng" integer NOT NULL,
	"quoted_fare_kobo" integer NOT NULL,
	"gross_amount_kobo" integer NOT NULL,
	"platform_fee_kobo" integer NOT NULL,
	"rider_net_kobo" integer NOT NULL,
	"paystack_reference" varchar(120),
	"payment_status" varchar(20) DEFAULT 'unpaid' NOT NULL,
	"booking_status" varchar(30) DEFAULT 'requested' NOT NULL,
	"paid_at" timestamp,
	"rider_accepted_at" timestamp,
	"rider_started_at" timestamp,
	"rider_completed_at" timestamp,
	"customer_confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rider_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"customer_user_id" integer NOT NULL,
	"rider_profile_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payout_ledger" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"rider_profile_id" integer NOT NULL,
	"amount_net_kobo" integer NOT NULL,
	"status" varchar(30) DEFAULT 'ready_for_payout' NOT NULL,
	"transfer_reference" varchar(120),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rider_locations" ADD CONSTRAINT "rider_locations_rider_profile_id_rider_profiles_id_fk" FOREIGN KEY ("rider_profile_id") REFERENCES "public"."rider_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rider_bookings" ADD CONSTRAINT "rider_bookings_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rider_bookings" ADD CONSTRAINT "rider_bookings_rider_profile_id_rider_profiles_id_fk" FOREIGN KEY ("rider_profile_id") REFERENCES "public"."rider_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rider_reviews" ADD CONSTRAINT "rider_reviews_booking_id_rider_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."rider_bookings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rider_reviews" ADD CONSTRAINT "rider_reviews_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rider_reviews" ADD CONSTRAINT "rider_reviews_rider_profile_id_rider_profiles_id_fk" FOREIGN KEY ("rider_profile_id") REFERENCES "public"."rider_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout_ledger" ADD CONSTRAINT "payout_ledger_booking_id_rider_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."rider_bookings"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payout_ledger" ADD CONSTRAINT "payout_ledger_rider_profile_id_rider_profiles_id_fk" FOREIGN KEY ("rider_profile_id") REFERENCES "public"."rider_profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rider_locations_rider_profile_unique" ON "rider_locations" ("rider_profile_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "rider_reviews_booking_unique" ON "rider_reviews" ("booking_id");
