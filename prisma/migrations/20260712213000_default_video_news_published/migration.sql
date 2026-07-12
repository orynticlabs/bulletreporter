-- New Video News records should be published by default, matching News.
ALTER TABLE "video_news"
  ALTER COLUMN "status" SET DEFAULT 'published';
