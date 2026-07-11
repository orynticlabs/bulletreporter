BEGIN;

-- Payload select-hasMany fields use order and parent_id (without underscores).
-- Rename in place so all seeded permission and baseline records are preserved.
ALTER TABLE "roles_permissions" RENAME COLUMN "_order" TO "order";
ALTER TABLE "roles_permissions" RENAME COLUMN "_parent_id" TO "parent_id";

ALTER TABLE "roles_baseline_permissions" RENAME COLUMN "_order" TO "order";
ALTER TABLE "roles_baseline_permissions" RENAME COLUMN "_parent_id" TO "parent_id";

COMMIT;
