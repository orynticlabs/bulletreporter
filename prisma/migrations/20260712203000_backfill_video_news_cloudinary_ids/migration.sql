-- Repair uploaded Video News records created before client-upload metadata was
-- persisted. Cloudinary public IDs are deterministic from folder + filename.
UPDATE "video_news"
SET "cloudinary_public_id" = 'bullet_reporter/videos/' || regexp_replace("filename", '\.[^./]+$', '')
WHERE "filename" IS NOT NULL
  AND ("cloudinary_public_id" IS NULL OR "cloudinary_public_id" = '');
