-- Migration: Change venue ID from CUID to OSM ID
-- This migration updates existing data to use OSM IDs as the primary key

-- Step 1: Drop foreign key constraints
ALTER TABLE "claims" DROP CONSTRAINT IF EXISTS "claims_venue_id_fkey";
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_venue_id_fkey";

-- Step 2: Update claims.venue_id to use osm_id instead of cuid
UPDATE "claims" c
SET venue_id = v.osm_id
FROM "venues" v
WHERE c.venue_id = v.id;

-- Step 3: Update reviews.venue_id to use osm_id instead of cuid
UPDATE "reviews" r
SET venue_id = v.osm_id
FROM "venues" v
WHERE r.venue_id = v.id;

-- Step 4: Drop the old primary key and index on venues
ALTER TABLE "venues" DROP CONSTRAINT "venues_pkey";
DROP INDEX IF EXISTS "venues_osm_id_idx";

-- Step 5: Drop the old id column
ALTER TABLE "venues" DROP COLUMN "id";

-- Step 6: Rename osm_id to id and make it the primary key
ALTER TABLE "venues" RENAME COLUMN "osm_id" TO "id";
ALTER TABLE "venues" ADD PRIMARY KEY ("id");

-- Step 7: Re-add foreign key constraints
ALTER TABLE "claims" ADD CONSTRAINT "claims_venue_id_fkey"
    FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_venue_id_fkey"
    FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;
