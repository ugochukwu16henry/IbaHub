ALTER TABLE "rider_profiles"
ADD COLUMN IF NOT EXISTS "bank_code" varchar(12);
--> statement-breakpoint
ALTER TABLE "rider_profiles"
ADD COLUMN IF NOT EXISTS "account_number" varchar(20);
--> statement-breakpoint
ALTER TABLE "rider_profiles"
ADD COLUMN IF NOT EXISTS "account_name" varchar(120);
--> statement-breakpoint
ALTER TABLE "rider_profiles"
ADD COLUMN IF NOT EXISTS "paystack_recipient_code" varchar(80);
