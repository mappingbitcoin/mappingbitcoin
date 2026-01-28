-- AlterTable
ALTER TABLE "claims" ADD COLUMN     "check_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "domain_to_verify" TEXT,
ADD COLUMN     "last_check_at" TIMESTAMP(3),
ADD COLUMN     "next_check_at" TIMESTAMP(3),
ADD COLUMN     "txt_record_value" TEXT;
