BEGIN;

CREATE TABLE IF NOT EXISTS "director_messages" (
  "id" SERIAL NOT NULL,
  "name" VARCHAR NOT NULL,
  "image_id" INTEGER,
  "quote" VARCHAR NOT NULL,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "director_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "director_messages_created_at_idx" ON "director_messages"("created_at");
CREATE INDEX IF NOT EXISTS "director_messages_image_idx" ON "director_messages"("image_id");
CREATE INDEX IF NOT EXISTS "director_messages_updated_at_idx" ON "director_messages"("updated_at");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'director_messages_image_id_media_id_fk') THEN
    ALTER TABLE "director_messages"
      ADD CONSTRAINT "director_messages_image_id_media_id_fk"
      FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

ALTER TABLE "payload_locked_documents_rels"
  ADD COLUMN IF NOT EXISTS "director_messages_id" INTEGER;

CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_director_messages_id_idx"
  ON "payload_locked_documents_rels"("director_messages_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_director_messages_fk') THEN
    ALTER TABLE "payload_locked_documents_rels"
      ADD CONSTRAINT "payload_locked_documents_rels_director_messages_fk"
      FOREIGN KEY ("director_messages_id") REFERENCES "director_messages"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
  END IF;
END $$;

-- Super Admin and Admin can fully manage the card. Every other predefined
-- role can view it in the admin dashboard but cannot create, update, or delete.
WITH role_permissions("slug", "permission") AS (
  VALUES
    ('super-admin', 'director-message.read'),
    ('super-admin', 'director-message.create'),
    ('super-admin', 'director-message.update'),
    ('super-admin', 'director-message.delete'),
    ('admin', 'director-message.read'),
    ('admin', 'director-message.create'),
    ('admin', 'director-message.update'),
    ('admin', 'director-message.delete'),
    ('chief-editor', 'director-message.read'),
    ('author', 'director-message.read'),
    ('viewer', 'director-message.read')
), missing_permissions AS (
  SELECT
    r."id" AS role_id,
    r."slug",
    role_permissions."permission"
  FROM "roles" r
  JOIN role_permissions ON role_permissions."slug" = r."slug"
  WHERE NOT EXISTS (
    SELECT 1 FROM "roles_permissions" existing
    WHERE existing."parent_id" = r."id"
      AND existing."value" = role_permissions."permission"
  )
), ordered_permissions AS (
  SELECT
    role_id,
    slug,
    permission,
    COALESCE((SELECT MAX(existing."order") FROM "roles_permissions" existing WHERE existing."parent_id" = missing_permissions.role_id), 0)
      + ROW_NUMBER() OVER (PARTITION BY role_id ORDER BY permission) AS permission_order
  FROM missing_permissions
)
INSERT INTO "roles_permissions" ("order", "parent_id", "id", "value")
SELECT permission_order, role_id, slug || ':' || permission, permission
FROM ordered_permissions;

WITH role_permissions("slug", "permission") AS (
  VALUES
    ('super-admin', 'director-message.read'),
    ('super-admin', 'director-message.create'),
    ('super-admin', 'director-message.update'),
    ('super-admin', 'director-message.delete'),
    ('admin', 'director-message.read'),
    ('admin', 'director-message.create'),
    ('admin', 'director-message.update'),
    ('admin', 'director-message.delete'),
    ('chief-editor', 'director-message.read'),
    ('author', 'director-message.read'),
    ('viewer', 'director-message.read')
), missing_permissions AS (
  SELECT
    r."id" AS role_id,
    r."slug",
    role_permissions."permission"
  FROM "roles" r
  JOIN role_permissions ON role_permissions."slug" = r."slug"
  WHERE NOT EXISTS (
    SELECT 1 FROM "roles_baseline_permissions" existing
    WHERE existing."parent_id" = r."id"
      AND existing."value" = role_permissions."permission"
  )
), ordered_permissions AS (
  SELECT
    role_id,
    slug,
    permission,
    COALESCE((SELECT MAX(existing."order") FROM "roles_baseline_permissions" existing WHERE existing."parent_id" = missing_permissions.role_id), 0)
      + ROW_NUMBER() OVER (PARTITION BY role_id ORDER BY permission) AS permission_order
  FROM missing_permissions
)
INSERT INTO "roles_baseline_permissions" ("order", "parent_id", "id", "value")
SELECT permission_order, role_id, slug || ':' || permission, permission
FROM ordered_permissions;

COMMIT;
