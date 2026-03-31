ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "oauth_provider" varchar(50);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "oauth_sub" varchar(255);
CREATE UNIQUE INDEX IF NOT EXISTS "users_oauth_provider_sub_unique" ON "users" ("oauth_provider", "oauth_sub") WHERE "oauth_provider" IS NOT NULL AND "oauth_sub" IS NOT NULL;
