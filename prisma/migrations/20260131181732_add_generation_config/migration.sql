-- CreateTable
CREATE TABLE "generation_config" (
    "id" TEXT NOT NULL,
    "posts_per_platform" JSONB NOT NULL DEFAULT '{}',
    "content_mix_weights" JSONB NOT NULL DEFAULT '{}',
    "generate_images" BOOLEAN NOT NULL DEFAULT false,
    "ai_model" TEXT NOT NULL DEFAULT 'sonnet',
    "posts_per_day" JSONB NOT NULL DEFAULT '{}',
    "active_hours_start" TEXT NOT NULL DEFAULT '12:00',
    "active_hours_end" TEXT NOT NULL DEFAULT '22:00',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "active_days" TEXT[] DEFAULT ARRAY['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']::TEXT[],
    "webhook_url" TEXT,
    "webhook_secret" TEXT,
    "last_triggered_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_config_pkey" PRIMARY KEY ("id")
);
