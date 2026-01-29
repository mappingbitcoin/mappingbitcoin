/*
  Warnings:

  - You are about to drop the column `depth` on the `community_graph` table. All the data in the column will be lost.
  - You are about to drop the column `region` on the `community_graph` table. All the data in the column will be lost.
  - You are about to drop the column `source_seeder` on the `community_graph` table. All the data in the column will be lost.
  - Added the required column `min_depth` to the `community_graph` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "community_graph" DROP CONSTRAINT "community_graph_source_seeder_fkey";

-- AlterTable
ALTER TABLE "community_graph" DROP COLUMN "depth",
DROP COLUMN "region",
DROP COLUMN "source_seeder",
ADD COLUMN     "followed_by_depth_0" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "followed_by_depth_1" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "followed_by_depth_2" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_seeder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "min_depth" INTEGER NOT NULL,
ADD COLUMN     "total_trust_followers" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "community_graph_min_depth_idx" ON "community_graph"("min_depth");

-- CreateIndex
CREATE INDEX "community_graph_followed_by_depth_0_idx" ON "community_graph"("followed_by_depth_0" DESC);
