-- Payload drafts/versions are no longer enabled for the news collection.
-- Keep the editorial `status` column as the single publication source of truth.
ALTER TABLE "news"
  DROP COLUMN IF EXISTS "_status";

-- Match the database default to the news collection configuration.
ALTER TABLE "news"
  ALTER COLUMN "status" SET DEFAULT 'published'::"enum_news_status";
