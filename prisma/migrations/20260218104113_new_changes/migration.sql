-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "image_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "thumbnail_keys" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "thumbnail_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];
