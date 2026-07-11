BEGIN;

-- Database-backed roles and hierarchy. Lower numbers have higher authority.
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "slug" VARCHAR NOT NULL,
    "hierarchy_order" INTEGER NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "base_role_id" INTEGER,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "roles_super_admin_order_check" CHECK (
      ("slug" = 'super-admin' AND "hierarchy_order" = 1)
      OR ("slug" <> 'super-admin' AND "hierarchy_order" <> 1)
    )
);

CREATE TABLE "roles_permissions" (
    "_order" INTEGER NOT NULL,
    "_parent_id" INTEGER NOT NULL,
    "id" VARCHAR NOT NULL,
    "value" VARCHAR NOT NULL,
    CONSTRAINT "roles_permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "roles_baseline_permissions" (
    "_order" INTEGER NOT NULL,
    "_parent_id" INTEGER NOT NULL,
    "id" VARCHAR NOT NULL,
    "value" VARCHAR NOT NULL,
    CONSTRAINT "roles_baseline_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_name_idx" ON "roles"("name");
CREATE UNIQUE INDEX "roles_slug_idx" ON "roles"("slug");
CREATE UNIQUE INDEX "roles_hierarchy_order_idx" ON "roles"("hierarchy_order");
CREATE INDEX "roles_base_role_idx" ON "roles"("base_role_id");
CREATE INDEX "roles_created_at_idx" ON "roles"("created_at");
CREATE INDEX "roles_updated_at_idx" ON "roles"("updated_at");
CREATE INDEX "roles_permissions_order_idx" ON "roles_permissions"("_order");
CREATE INDEX "roles_permissions_parent_id_idx" ON "roles_permissions"("_parent_id");
CREATE INDEX "roles_baseline_permissions_order_idx" ON "roles_baseline_permissions"("_order");
CREATE INDEX "roles_baseline_permissions_parent_id_idx" ON "roles_baseline_permissions"("_parent_id");

ALTER TABLE "roles"
  ADD CONSTRAINT "roles_base_role_id_roles_id_fk"
  FOREIGN KEY ("base_role_id") REFERENCES "roles"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;

ALTER TABLE "roles_permissions"
  ADD CONSTRAINT "roles_permissions_parent_id_fk"
  FOREIGN KEY ("_parent_id") REFERENCES "roles"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "roles_baseline_permissions"
  ADD CONSTRAINT "roles_baseline_permissions_parent_id_fk"
  FOREIGN KEY ("_parent_id") REFERENCES "roles"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- Seed the five immutable predefined role identities and hierarchy positions.
INSERT INTO "roles" ("name", "slug", "hierarchy_order", "is_system") VALUES
  ('Super Admin', 'super-admin', 1, true),
  ('Admin', 'admin', 2, true),
  ('Chief Editor', 'chief-editor', 3, true),
  ('Author', 'author', 4, true),
  ('Viewer', 'viewer', 5, true);

-- Build the exact predefined permission matrix. Higher roles also inherit all
-- permissions of lower roles at runtime, based on hierarchy_order.
WITH resources(resource) AS (
  VALUES ('users'), ('roles'), ('media'), ('categories'), ('news'),
         ('video-news'), ('comments'), ('advertisements'), ('settings')
),
actions(action) AS (
  VALUES ('read'), ('create'), ('update'), ('delete')
),
matrix AS (
  SELECT
    r.id AS role_id,
    r.slug,
    resources.resource || '.' || actions.action AS permission
  FROM "roles" r
  CROSS JOIN resources
  CROSS JOIN actions
  WHERE
    r.slug = 'super-admin'
    OR (r.slug = 'admin' AND resources.resource <> 'settings')
    OR (
      r.slug = 'chief-editor'
      AND resources.resource IN ('media', 'categories', 'news', 'video-news', 'comments', 'advertisements')
    )
    OR (
      r.slug = 'author'
      AND (
        (resources.resource IN ('media', 'categories', 'news', 'video-news', 'advertisements')
          AND actions.action IN ('read', 'create', 'update'))
        OR (resources.resource = 'comments' AND actions.action = 'read')
      )
    )
    OR (
      r.slug = 'viewer'
      AND resources.resource IN ('media', 'categories', 'news', 'video-news', 'comments', 'advertisements')
      AND actions.action = 'read'
    )
),
ordered AS (
  SELECT
    role_id,
    permission,
    row_number() OVER (PARTITION BY role_id ORDER BY permission)::INTEGER AS permission_order,
    slug || ':' || permission AS permission_id
  FROM matrix
)
INSERT INTO "roles_permissions" ("_order", "_parent_id", "id", "value")
SELECT permission_order, role_id, permission_id, permission
FROM ordered;

WITH resources(resource) AS (
  VALUES ('users'), ('roles'), ('media'), ('categories'), ('news'),
         ('video-news'), ('comments'), ('advertisements'), ('settings')
),
actions(action) AS (
  VALUES ('read'), ('create'), ('update'), ('delete')
),
matrix AS (
  SELECT
    r.id AS role_id,
    r.slug,
    resources.resource || '.' || actions.action AS permission
  FROM "roles" r
  CROSS JOIN resources
  CROSS JOIN actions
  WHERE
    r.slug = 'super-admin'
    OR (r.slug = 'admin' AND resources.resource <> 'settings')
    OR (
      r.slug = 'chief-editor'
      AND resources.resource IN ('media', 'categories', 'news', 'video-news', 'comments', 'advertisements')
    )
    OR (
      r.slug = 'author'
      AND (
        (resources.resource IN ('media', 'categories', 'news', 'video-news', 'advertisements')
          AND actions.action IN ('read', 'create', 'update'))
        OR (resources.resource = 'comments' AND actions.action = 'read')
      )
    )
    OR (
      r.slug = 'viewer'
      AND resources.resource IN ('media', 'categories', 'news', 'video-news', 'comments', 'advertisements')
      AND actions.action = 'read'
    )
),
ordered AS (
  SELECT
    role_id,
    permission,
    row_number() OVER (PARTITION BY role_id ORDER BY permission)::INTEGER AS permission_order,
    slug || ':baseline:' || permission AS permission_id
  FROM matrix
)
INSERT INTO "roles_baseline_permissions" ("_order", "_parent_id", "id", "value")
SELECT permission_order, role_id, permission_id, permission
FROM ordered;

-- Convert users without losing existing role assignments. The new column is
-- nullable until every legacy enum value has been mapped.
ALTER TABLE "users" ADD COLUMN "role_id" INTEGER;

UPDATE "users" u
SET "role_id" = r.id
FROM "roles" r
WHERE r.slug = CASE u."role"::text
  WHEN 'admin' THEN 'admin'
  WHEN 'chief_editor' THEN 'chief-editor'
  WHEN 'editor' THEN 'chief-editor'
  WHEN 'author' THEN 'author'
  WHEN 'viewer' THEN 'viewer'
END;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "users" WHERE "role_id" IS NULL) THEN
    RAISE EXCEPTION 'RBAC migration stopped: one or more users could not be mapped to a role';
  END IF;
END $$;

ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL;
CREATE INDEX "users_role_idx" ON "users"("role_id");
ALTER TABLE "users"
  ADD CONSTRAINT "users_role_id_roles_id_fk"
  FOREIGN KEY ("role_id") REFERENCES "roles"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

ALTER TABLE "users" DROP COLUMN "role";
DROP TYPE "enum_users_role";

-- Allow Payload to lock Role documents in the admin editor.
ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "roles_id" INTEGER;
CREATE INDEX "payload_locked_documents_rels_roles_id_idx"
  ON "payload_locked_documents_rels"("roles_id");
ALTER TABLE "payload_locked_documents_rels"
  ADD CONSTRAINT "payload_locked_documents_rels_roles_fk"
  FOREIGN KEY ("roles_id") REFERENCES "roles"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- Serialize Super Admin assignments so concurrent requests cannot exceed 3.
CREATE OR REPLACE FUNCTION enforce_super_admin_user_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_is_super_admin BOOLEAN;
  current_super_admin_count INTEGER;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM "roles"
    WHERE "id" = NEW."role_id" AND "slug" = 'super-admin'
  ) INTO target_is_super_admin;

  IF NOT target_is_super_admin THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('bulletreporter:super-admin-user-limit'));

  SELECT count(*)
  INTO current_super_admin_count
  FROM "users" u
  JOIN "roles" r ON r."id" = u."role_id"
  WHERE r."slug" = 'super-admin'
    AND (TG_OP = 'INSERT' OR u."id" <> NEW."id");

  IF current_super_admin_count >= 3 THEN
    RAISE EXCEPTION 'A maximum of 3 Super Admin users is allowed.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "users_super_admin_limit_trigger"
BEFORE INSERT OR UPDATE OF "role_id" ON "users"
FOR EACH ROW
EXECUTE FUNCTION enforce_super_admin_user_limit();

COMMIT;
