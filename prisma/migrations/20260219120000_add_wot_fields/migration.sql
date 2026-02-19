-- Add WoT fields to reviews table
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "wot_distance" INTEGER;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "wot_path_count" INTEGER;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "wot_computed_at" TIMESTAMP(3);

-- Add WoT fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wot_distance" INTEGER;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wot_computed_at" TIMESTAMP(3);
