-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('pending', 'verified', 'rejected', 'expired');

-- CreateEnum
CREATE TYPE "ClaimMethod" AS ENUM ('phone', 'email', 'domain', 'google', 'physical', 'manual');

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "osm_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "pubkey" TEXT NOT NULL,
    "name" TEXT,
    "picture" TEXT,
    "nip05" TEXT,
    "profile_updated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "claims" (
    "id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "claimer_pubkey" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'pending',
    "method" "ClaimMethod" NOT NULL,
    "verification_code" TEXT,
    "verification_attempts" INTEGER NOT NULL DEFAULT 0,
    "verified_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "author_pubkey" TEXT NOT NULL,
    "rating" INTEGER,
    "content" TEXT,
    "event_created_at" TIMESTAMP(3) NOT NULL,
    "indexed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_replies" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "author_pubkey" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_owner_reply" BOOLEAN NOT NULL DEFAULT false,
    "event_created_at" TIMESTAMP(3) NOT NULL,
    "indexed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venues_osm_id_key" ON "venues"("osm_id");

-- CreateIndex
CREATE INDEX "venues_osm_id_idx" ON "venues"("osm_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_pubkey_key" ON "users"("pubkey");

-- CreateIndex
CREATE INDEX "users_pubkey_idx" ON "users"("pubkey");

-- CreateIndex
CREATE INDEX "claims_venue_id_idx" ON "claims"("venue_id");

-- CreateIndex
CREATE INDEX "claims_claimer_pubkey_idx" ON "claims"("claimer_pubkey");

-- CreateIndex
CREATE INDEX "claims_status_idx" ON "claims"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_event_id_key" ON "reviews"("event_id");

-- CreateIndex
CREATE INDEX "reviews_venue_id_idx" ON "reviews"("venue_id");

-- CreateIndex
CREATE INDEX "reviews_author_pubkey_idx" ON "reviews"("author_pubkey");

-- CreateIndex
CREATE INDEX "reviews_event_created_at_idx" ON "reviews"("event_created_at");

-- CreateIndex
CREATE UNIQUE INDEX "review_replies_event_id_key" ON "review_replies"("event_id");

-- CreateIndex
CREATE INDEX "review_replies_review_id_idx" ON "review_replies"("review_id");

-- CreateIndex
CREATE INDEX "review_replies_author_pubkey_idx" ON "review_replies"("author_pubkey");

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "claims" ADD CONSTRAINT "claims_claimer_pubkey_fkey" FOREIGN KEY ("claimer_pubkey") REFERENCES "users"("pubkey") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_pubkey_fkey" FOREIGN KEY ("author_pubkey") REFERENCES "users"("pubkey") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_author_pubkey_fkey" FOREIGN KEY ("author_pubkey") REFERENCES "users"("pubkey") ON DELETE CASCADE ON UPDATE CASCADE;
