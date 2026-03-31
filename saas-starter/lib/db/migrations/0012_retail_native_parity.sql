CREATE TABLE "retail_warehouses" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL,
  "name" varchar(120) NOT NULL,
  "address" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "retail_categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL,
  "name" varchar(120) NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "retail_brands" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL,
  "name" varchar(120) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "retail_units" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL,
  "name" varchar(60) NOT NULL,
  "abbreviation" varchar(20),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "retail_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL,
  "name" varchar(160) NOT NULL,
  "description" text,
  "sku" varchar(80) NOT NULL,
  "barcode" varchar(80),
  "category_id" integer,
  "brand_id" integer,
  "unit_id" integer,
  "warehouse_id" integer,
  "quantity" integer DEFAULT 0 NOT NULL,
  "reorder_point" integer DEFAULT 0 NOT NULL,
  "purchase_price_kobo" integer DEFAULT 0 NOT NULL,
  "selling_price_kobo" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "retail_orders" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL,
  "order_number" varchar(64) NOT NULL,
  "status" varchar(24) DEFAULT 'pending' NOT NULL,
  "customer_name" varchar(120),
  "customer_email" varchar(255),
  "subtotal_kobo" integer DEFAULT 0 NOT NULL,
  "discount_kobo" integer DEFAULT 0 NOT NULL,
  "tax_kobo" integer DEFAULT 0 NOT NULL,
  "total_kobo" integer DEFAULT 0 NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "retail_order_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL,
  "order_id" integer NOT NULL,
  "item_id" integer NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price_kobo" integer NOT NULL,
  "line_total_kobo" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "retail_pos_transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL,
  "order_id" integer,
  "idempotency_key" varchar(120) NOT NULL,
  "status" varchar(24) DEFAULT 'completed' NOT NULL,
  "amount_kobo" integer NOT NULL,
  "payment_method" varchar(40) DEFAULT 'cash' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "retail_inventory_adjustments" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer NOT NULL,
  "item_id" integer NOT NULL,
  "delta" integer NOT NULL,
  "reason" varchar(120) DEFAULT 'manual_adjustment' NOT NULL,
  "reference_type" varchar(40),
  "reference_id" varchar(80),
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "retail_items_team_sku_unique" ON "retail_items" ("team_id","sku");
CREATE UNIQUE INDEX "retail_pos_team_idempotency_unique" ON "retail_pos_transactions" ("team_id","idempotency_key");

ALTER TABLE "retail_warehouses" ADD CONSTRAINT "retail_warehouses_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_categories" ADD CONSTRAINT "retail_categories_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_brands" ADD CONSTRAINT "retail_brands_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_units" ADD CONSTRAINT "retail_units_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_items" ADD CONSTRAINT "retail_items_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_items" ADD CONSTRAINT "retail_items_category_id_retail_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."retail_categories"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_items" ADD CONSTRAINT "retail_items_brand_id_retail_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."retail_brands"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_items" ADD CONSTRAINT "retail_items_unit_id_retail_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."retail_units"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_items" ADD CONSTRAINT "retail_items_warehouse_id_retail_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."retail_warehouses"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_orders" ADD CONSTRAINT "retail_orders_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_order_items" ADD CONSTRAINT "retail_order_items_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_order_items" ADD CONSTRAINT "retail_order_items_order_id_retail_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."retail_orders"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_order_items" ADD CONSTRAINT "retail_order_items_item_id_retail_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."retail_items"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_pos_transactions" ADD CONSTRAINT "retail_pos_transactions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_pos_transactions" ADD CONSTRAINT "retail_pos_transactions_order_id_retail_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."retail_orders"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_inventory_adjustments" ADD CONSTRAINT "retail_inventory_adjustments_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "retail_inventory_adjustments" ADD CONSTRAINT "retail_inventory_adjustments_item_id_retail_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."retail_items"("id") ON DELETE no action ON UPDATE no action;
