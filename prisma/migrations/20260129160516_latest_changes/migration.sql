-- CreateEnum
CREATE TYPE "SpamStatus" AS ENUM ('pending', 'approved', 'flagged', 'blocked');

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "spam_reasons" TEXT[],
ADD COLUMN     "spam_score" DOUBLE PRECISION,
ADD COLUMN     "spam_status" "SpamStatus" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "reviews_spam_status_idx" ON "reviews"("spam_status");
