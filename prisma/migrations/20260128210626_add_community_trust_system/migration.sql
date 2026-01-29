-- CreateEnum
CREATE TYPE "GraphBuildStatus" AS ENUM ('running', 'completed', 'failed');

-- CreateTable
CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "pubkey" TEXT NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_seeders" (
    "id" TEXT NOT NULL,
    "pubkey" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "label" TEXT,
    "added_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_seeders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_graph" (
    "id" TEXT NOT NULL,
    "pubkey" TEXT NOT NULL,
    "depth" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "source_seeder" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_graph_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follows_cache" (
    "id" TEXT NOT NULL,
    "pubkey" TEXT NOT NULL,
    "follows_pubkey" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "graph_build_logs" (
    "id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "status" "GraphBuildStatus" NOT NULL,
    "seeders_count" INTEGER,
    "nodes_count" INTEGER,
    "error_message" TEXT,

    CONSTRAINT "graph_build_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_pubkey_key" ON "admin_users"("pubkey");

-- CreateIndex
CREATE UNIQUE INDEX "community_seeders_pubkey_key" ON "community_seeders"("pubkey");

-- CreateIndex
CREATE UNIQUE INDEX "community_graph_pubkey_key" ON "community_graph"("pubkey");

-- CreateIndex
CREATE INDEX "community_graph_score_idx" ON "community_graph"("score" DESC);

-- CreateIndex
CREATE INDEX "follows_cache_pubkey_idx" ON "follows_cache"("pubkey");

-- CreateIndex
CREATE UNIQUE INDEX "follows_cache_pubkey_follows_pubkey_key" ON "follows_cache"("pubkey", "follows_pubkey");

-- AddForeignKey
ALTER TABLE "community_graph" ADD CONSTRAINT "community_graph_source_seeder_fkey" FOREIGN KEY ("source_seeder") REFERENCES "community_seeders"("pubkey") ON DELETE CASCADE ON UPDATE CASCADE;
