CREATE TABLE IF NOT EXISTS "generated_documents" (
  "id" serial PRIMARY KEY NOT NULL,
  "team_id" integer,
  "user_id" integer,
  "source_kind" varchar(80) NOT NULL,
  "source_id" integer,
  "document_type" varchar(40) NOT NULL,
  "title" varchar(180) NOT NULL,
  "reference" varchar(140) NOT NULL,
  "mime_type" varchar(80) NOT NULL DEFAULT 'application/pdf',
  "content_base64" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

DO $$ BEGIN
 ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "generated_documents_source_idx" ON "generated_documents" USING btree ("source_kind","source_id");
CREATE INDEX IF NOT EXISTS "generated_documents_team_idx" ON "generated_documents" USING btree ("team_id");
CREATE INDEX IF NOT EXISTS "generated_documents_user_idx" ON "generated_documents" USING btree ("user_id");
