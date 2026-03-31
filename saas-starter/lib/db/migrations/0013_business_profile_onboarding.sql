ALTER TABLE "teams"
ADD COLUMN "business_phone" varchar(30);

ALTER TABLE "teams"
ADD COLUMN "business_address" text;

ALTER TABLE "teams"
ADD COLUMN "business_category" varchar(80);

ALTER TABLE "teams"
ADD COLUMN "business_profile_completed" boolean DEFAULT false NOT NULL;
