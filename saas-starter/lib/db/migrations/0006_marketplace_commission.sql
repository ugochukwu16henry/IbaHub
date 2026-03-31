ALTER TABLE "service_requests"
ADD COLUMN IF NOT EXISTS "payment_status" varchar(20) DEFAULT 'unpaid' NOT NULL;
--> statement-breakpoint
ALTER TABLE "service_requests"
ADD COLUMN IF NOT EXISTS "gross_amount_kobo" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "service_requests"
ADD COLUMN IF NOT EXISTS "platform_fee_kobo" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "service_requests"
ADD COLUMN IF NOT EXISTS "provider_earnings_kobo" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "service_requests"
ADD COLUMN IF NOT EXISTS "paid_at" timestamp;
