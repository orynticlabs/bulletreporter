BEGIN;

ALTER TABLE "director_messages" RENAME TO "director_details";
ALTER TABLE "director_details" RENAME COLUMN "quote" TO "about";

ALTER INDEX "director_messages_created_at_idx" RENAME TO "director_details_created_at_idx";
ALTER INDEX "director_messages_image_idx" RENAME TO "director_details_image_idx";
ALTER INDEX "director_messages_updated_at_idx" RENAME TO "director_details_updated_at_idx";

ALTER TABLE "director_details"
  RENAME CONSTRAINT "director_messages_pkey" TO "director_details_pkey";
ALTER TABLE "director_details"
  RENAME CONSTRAINT "director_messages_image_id_media_id_fk" TO "director_details_image_id_media_id_fk";

ALTER TABLE "payload_locked_documents_rels"
  RENAME COLUMN "director_messages_id" TO "director_details_id";
ALTER INDEX "payload_locked_documents_rels_director_messages_id_idx"
  RENAME TO "payload_locked_documents_rels_director_details_id_idx";
ALTER TABLE "payload_locked_documents_rels"
  RENAME CONSTRAINT "payload_locked_documents_rels_director_messages_fk"
  TO "payload_locked_documents_rels_director_details_fk";

UPDATE "roles_permissions"
SET
  "id" = REPLACE("id", 'director-message.', 'director-details.'),
  "value" = REPLACE("value", 'director-message.', 'director-details.')
WHERE "value" LIKE 'director-message.%';

UPDATE "roles_baseline_permissions"
SET
  "id" = REPLACE("id", 'director-message.', 'director-details.'),
  "value" = REPLACE("value", 'director-message.', 'director-details.')
WHERE "value" LIKE 'director-message.%';

COMMIT;
