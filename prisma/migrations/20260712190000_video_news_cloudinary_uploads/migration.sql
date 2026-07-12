-- Video News can now be backed by an uploaded Cloudinary video as an
-- alternative to a YouTube link. These are Payload's standard upload fields.
ALTER TABLE "video_news"
  ADD COLUMN "url" VARCHAR,
  ADD COLUMN "thumbnail_u_r_l" VARCHAR,
  ADD COLUMN "filename" VARCHAR,
  ADD COLUMN "mime_type" VARCHAR,
  ADD COLUMN "filesize" DECIMAL,
  ADD COLUMN "width" DECIMAL,
  ADD COLUMN "height" DECIMAL,
  ADD COLUMN "focal_x" DECIMAL,
  ADD COLUMN "focal_y" DECIMAL,
  ADD COLUMN "cloudinary_public_id" VARCHAR;

CREATE UNIQUE INDEX "video_news_filename_idx" ON "video_news"("filename");
