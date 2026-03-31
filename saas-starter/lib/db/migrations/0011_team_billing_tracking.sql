ALTER TABLE "teams"
ADD COLUMN "subscription_renews_at" timestamp;

ALTER TABLE "teams"
ADD COLUMN "last_paystack_payment_reference" varchar(120);
