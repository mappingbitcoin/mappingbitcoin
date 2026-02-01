-- AlterTable
ALTER TABLE "users" ADD COLUMN     "banned_at" TIMESTAMP(3),
ADD COLUMN     "banned_by" TEXT,
ADD COLUMN     "banned_reason" TEXT,
ADD COLUMN     "display_name" TEXT;

-- CreateIndex
CREATE INDEX "users_banned_at_idx" ON "users"("banned_at");
