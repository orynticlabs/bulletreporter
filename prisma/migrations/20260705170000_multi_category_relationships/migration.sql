-- Convert news category fields from single-select relationship columns to
-- multi-select Payload relationship tables without dropping existing records.
--
-- Existing data is preserved:
-- - news.category_id and video_news.category_id stay in place as legacy data.
-- - Existing category_id values are copied into *_rels tables.
-- - Future Payload reads/writes use *_rels because the app config now has
--   category.hasMany = true.

CREATE TABLE IF NOT EXISTS "news_rels" (
  "id" SERIAL PRIMARY KEY,
  "order" INTEGER,
  "parent_id" INTEGER NOT NULL,
  "path" VARCHAR NOT NULL,
  "categories_id" INTEGER
);

CREATE TABLE IF NOT EXISTS "video_news_rels" (
  "id" SERIAL PRIMARY KEY,
  "order" INTEGER,
  "parent_id" INTEGER NOT NULL,
  "path" VARCHAR NOT NULL,
  "categories_id" INTEGER
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'news_rels_parent_fk') THEN
    ALTER TABLE "news_rels"
      ADD CONSTRAINT "news_rels_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "news"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'news_rels_categories_fk') THEN
    ALTER TABLE "news_rels"
      ADD CONSTRAINT "news_rels_categories_fk"
      FOREIGN KEY ("categories_id") REFERENCES "categories"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_news_rels_parent_fk') THEN
    ALTER TABLE "video_news_rels"
      ADD CONSTRAINT "video_news_rels_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "video_news"("id") ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_news_rels_categories_fk') THEN
    ALTER TABLE "video_news_rels"
      ADD CONSTRAINT "video_news_rels_categories_fk"
      FOREIGN KEY ("categories_id") REFERENCES "categories"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "news_rels_order_idx" ON "news_rels" ("order");
CREATE INDEX IF NOT EXISTS "news_rels_parent_idx" ON "news_rels" ("parent_id");
CREATE INDEX IF NOT EXISTS "news_rels_path_idx" ON "news_rels" ("path");
CREATE INDEX IF NOT EXISTS "news_rels_categories_id_idx" ON "news_rels" ("categories_id");

CREATE INDEX IF NOT EXISTS "video_news_rels_order_idx" ON "video_news_rels" ("order");
CREATE INDEX IF NOT EXISTS "video_news_rels_parent_idx" ON "video_news_rels" ("parent_id");
CREATE INDEX IF NOT EXISTS "video_news_rels_path_idx" ON "video_news_rels" ("path");
CREATE INDEX IF NOT EXISTS "video_news_rels_categories_id_idx" ON "video_news_rels" ("categories_id");

INSERT INTO "news_rels" ("order", "parent_id", "path", "categories_id")
SELECT 1, "id", 'category', "category_id"
FROM "news"
WHERE "category_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "news_rels"
    WHERE "news_rels"."parent_id" = "news"."id"
      AND "news_rels"."path" = 'category'
      AND "news_rels"."categories_id" = "news"."category_id"
  );

INSERT INTO "video_news_rels" ("order", "parent_id", "path", "categories_id")
SELECT 1, "id", 'category', "category_id"
FROM "video_news"
WHERE "category_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "video_news_rels"
    WHERE "video_news_rels"."parent_id" = "video_news"."id"
      AND "video_news_rels"."path" = 'category'
      AND "video_news_rels"."categories_id" = "video_news"."category_id"
  );
