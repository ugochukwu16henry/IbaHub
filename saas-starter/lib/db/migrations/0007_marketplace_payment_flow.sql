ALTER TABLE "service_requests"
ADD COLUMN IF NOT EXISTS "paystack_reference" varchar(120);
--> statement-breakpoint
ALTER TABLE "service_requests"
ADD COLUMN IF NOT EXISTS "provider_completed_at" timestamp;
--> statement-breakpoint
ALTER TABLE "service_requests"
ADD COLUMN IF NOT EXISTS "customer_confirmed_at" timestamp;
--> statement-breakpoint
ALTER TABLE "service_requests"
ADD COLUMN IF NOT EXISTS "payout_status" varchar(30) DEFAULT 'not_ready' NOT NULL;
