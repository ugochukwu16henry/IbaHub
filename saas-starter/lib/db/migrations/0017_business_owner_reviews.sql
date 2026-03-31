CREATE TABLE "business_owner_reviews" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL,
  "purchase_request_id" integer NOT NULL,
  "buyer_user_id" integer NOT NULL,
  "rating" integer NOT NULL,
  "professionalism" integer NOT NULL,
  "honesty" integer NOT NULL,
  "quality" integer NOT NULL,
  "communication" integer NOT NULL,
  "timeliness" integer NOT NULL,
  "comment" text,
  "admin_status" varchar(20) DEFAULT 'pending' NOT NULL,
  "admin_decision_note" text,
  "approved_by_user_id" integer,
  "approved_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "business_owner_reviews_purchase_unique"
  ON "business_owner_reviews" ("purchase_request_id");

ALTER TABLE "business_owner_reviews" ADD CONSTRAINT "business_owner_reviews_team_id_teams_id_fk"
  FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "business_owner_reviews" ADD CONSTRAINT "business_owner_reviews_purchase_request_id_retail_purchase_requests_id_fk"
  FOREIGN KEY ("purchase_request_id") REFERENCES "public"."retail_purchase_requests"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "business_owner_reviews" ADD CONSTRAINT "business_owner_reviews_buyer_user_id_users_id_fk"
  FOREIGN KEY ("buyer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "business_owner_reviews" ADD CONSTRAINT "business_owner_reviews_approved_by_user_id_users_id_fk"
  FOREIGN KEY ("approved_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
