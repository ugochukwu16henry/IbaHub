ALTER TABLE "teams" ADD COLUMN "shop_slug" varchar(120);
ALTER TABLE "teams" ADD COLUMN "is_storefront_public" boolean DEFAULT false NOT NULL;
ALTER TABLE "teams" ADD COLUMN "inventory_addon_active" boolean DEFAULT false NOT NULL;

CREATE TABLE "retail_purchase_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL,
  "buyer_user_id" integer NOT NULL,
  "item_id" integer NOT NULL,
  "quantity" integer NOT NULL,
  "agreed_unit_price_kobo" integer NOT NULL,
  "total_amount_kobo" integer NOT NULL,
  "payment_terms" varchar(40) DEFAULT 'agreed_with_owner' NOT NULL,
  "needs_delivery" boolean DEFAULT false NOT NULL,
  "delivery_from" varchar(16) DEFAULT 'shop' NOT NULL,
  "delivery_address" text,
  "notes" text,
  "status" varchar(24) DEFAULT 'requested' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "retail_purchase_requests" ADD CONSTRAINT "retail_purchase_requests_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_purchase_requests" ADD CONSTRAINT "retail_purchase_requests_buyer_user_id_users_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_purchase_requests" ADD CONSTRAINT "retail_purchase_requests_item_id_retail_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."retail_items"("id") ON DELETE no action ON UPDATE no action;
