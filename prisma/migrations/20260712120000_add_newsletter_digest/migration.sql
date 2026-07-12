CREATE TYPE "enum_newsletter_deliveries_status" AS ENUM ('sending', 'sent', 'failed');

CREATE TABLE "newsletter_subscribers" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR NOT NULL,
    "email" VARCHAR NOT NULL,
    "unsubscribe_token" VARCHAR NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
    "subscribed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_digest_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers"("email");
CREATE UNIQUE INDEX "newsletter_subscribers_unsubscribe_token_idx" ON "newsletter_subscribers"("unsubscribe_token");
CREATE INDEX "newsletter_subscribers_active_digest_idx" ON "newsletter_subscribers"("is_active", "last_digest_at");

CREATE TABLE "newsletter_digest_items" (
    "id" SERIAL PRIMARY KEY,
    "item_key" VARCHAR NOT NULL,
    "content_type" VARCHAR NOT NULL,
    "content_id" INTEGER NOT NULL,
    "title" VARCHAR NOT NULL,
    "excerpt" VARCHAR NOT NULL DEFAULT '',
    "slug" VARCHAR NOT NULL,
    "published_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "newsletter_digest_items_content_type_check" CHECK ("content_type" IN ('news', 'video-news'))
);

CREATE UNIQUE INDEX "newsletter_digest_items_item_key_idx" ON "newsletter_digest_items"("item_key");
CREATE INDEX "newsletter_digest_items_published_at_idx" ON "newsletter_digest_items"("published_at" DESC);

CREATE TABLE "newsletter_deliveries" (
    "id" SERIAL PRIMARY KEY,
    "delivery_key" VARCHAR NOT NULL,
    "slot_key" VARCHAR NOT NULL,
    "subscriber_id" INTEGER NOT NULL,
    "status" "enum_newsletter_deliveries_status" NOT NULL DEFAULT 'sending',
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "last_error" VARCHAR,
    "sent_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "newsletter_deliveries_subscriber_fk" FOREIGN KEY ("subscriber_id") REFERENCES "newsletter_subscribers"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "newsletter_deliveries_delivery_key_idx" ON "newsletter_deliveries"("delivery_key");
CREATE INDEX "newsletter_deliveries_subscriber_idx" ON "newsletter_deliveries"("subscriber_id");
CREATE INDEX "newsletter_deliveries_slot_status_idx" ON "newsletter_deliveries"("slot_key", "status");
