-- CreateTable
CREATE TABLE "subscription_lists" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "unsubscribe_token" TEXT NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscribers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriber_lists" (
    "id" TEXT NOT NULL,
    "subscriber_id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "subscribed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribed_at" TIMESTAMP(3),

    CONSTRAINT "subscriber_lists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_lists_slug_key" ON "subscription_lists"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_email_key" ON "subscribers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "subscribers_unsubscribe_token_key" ON "subscribers"("unsubscribe_token");

-- CreateIndex
CREATE INDEX "subscribers_email_idx" ON "subscribers"("email");

-- CreateIndex
CREATE INDEX "subscribers_unsubscribe_token_idx" ON "subscribers"("unsubscribe_token");

-- CreateIndex
CREATE INDEX "subscriber_lists_subscriber_id_idx" ON "subscriber_lists"("subscriber_id");

-- CreateIndex
CREATE INDEX "subscriber_lists_list_id_idx" ON "subscriber_lists"("list_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriber_lists_subscriber_id_list_id_key" ON "subscriber_lists"("subscriber_id", "list_id");

-- AddForeignKey
ALTER TABLE "subscriber_lists" ADD CONSTRAINT "subscriber_lists_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "subscribers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriber_lists" ADD CONSTRAINT "subscriber_lists_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "subscription_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
