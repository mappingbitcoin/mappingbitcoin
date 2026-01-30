-- CreateEnum
CREATE TYPE "SocialNetwork" AS ENUM ('twitter', 'instagram', 'linkedin', 'facebook', 'tiktok', 'youtube', 'nostr');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('image', 'video', 'carousel', 'story', 'reel', 'text', 'infographic');

-- CreateEnum
CREATE TYPE "ContentTopic" AS ENUM ('announcements', 'education', 'community', 'product', 'news', 'events', 'tips', 'other');

-- CreateTable
CREATE TABLE "marketing_guidelines" (
    "id" TEXT NOT NULL,
    "voice_tone" TEXT,
    "do_list" TEXT[],
    "dont_list" TEXT[],
    "brand_values" TEXT[],
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_guidelines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_links" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_assets" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "social_networks" "SocialNetwork"[],
    "post_types" "PostType"[],
    "topic" "ContentTopic",
    "custom_tags" TEXT[],
    "alt_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hashtag_sets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hashtags" TEXT[],
    "social_networks" "SocialNetwork"[],
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hashtag_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "example_posts" (
    "id" TEXT NOT NULL,
    "social_network" "SocialNetwork" NOT NULL,
    "content" TEXT NOT NULL,
    "hashtags" TEXT[],
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "example_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_stats" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "source" TEXT,
    "category" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketing_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketing_links_category_idx" ON "marketing_links"("category");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_assets_storage_key_key" ON "marketing_assets"("storage_key");

-- CreateIndex
CREATE INDEX "marketing_assets_topic_idx" ON "marketing_assets"("topic");

-- CreateIndex
CREATE UNIQUE INDEX "hashtag_sets_name_key" ON "hashtag_sets"("name");

-- CreateIndex
CREATE INDEX "example_posts_social_network_idx" ON "example_posts"("social_network");

-- CreateIndex
CREATE INDEX "marketing_stats_category_idx" ON "marketing_stats"("category");
