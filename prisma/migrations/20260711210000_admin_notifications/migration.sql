CREATE TYPE "enum_admin_notifications_type" AS ENUM ('like', 'dislike', 'comment');
CREATE TYPE "enum_admin_notifications_required_permission" AS ENUM ('news.read', 'video-news.read', 'comments.read');
CREATE TYPE "enum_admin_notifications_content_type" AS ENUM ('news', 'video-news');

CREATE TABLE "admin_notifications" (
  "id" SERIAL NOT NULL,
  "type" "enum_admin_notifications_type" NOT NULL,
  "required_permission" "enum_admin_notifications_required_permission" NOT NULL,
  "content_type" "enum_admin_notifications_content_type" NOT NULL,
  "content_id" INTEGER NOT NULL,
  "content_title" VARCHAR NOT NULL,
  "content_slug" VARCHAR NOT NULL,
  "message" VARCHAR NOT NULL,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_notification_reads" (
  "id" SERIAL NOT NULL,
  "receipt_key" VARCHAR NOT NULL,
  "notification_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "read_at" TIMESTAMPTZ(3) NOT NULL,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_notification_reads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_notifications_created_at_idx" ON "admin_notifications"("created_at");
CREATE INDEX "admin_notifications_required_permission_idx" ON "admin_notifications"("required_permission");
CREATE INDEX "admin_notifications_updated_at_idx" ON "admin_notifications"("updated_at");
CREATE UNIQUE INDEX "admin_notification_reads_receipt_key_idx" ON "admin_notification_reads"("receipt_key");
CREATE INDEX "admin_notification_reads_created_at_idx" ON "admin_notification_reads"("created_at");
CREATE INDEX "admin_notification_reads_notification_idx" ON "admin_notification_reads"("notification_id");
CREATE INDEX "admin_notification_reads_updated_at_idx" ON "admin_notification_reads"("updated_at");
CREATE INDEX "admin_notification_reads_user_idx" ON "admin_notification_reads"("user_id");

ALTER TABLE "admin_notification_reads" ADD CONSTRAINT "admin_notification_reads_notification_fk" FOREIGN KEY ("notification_id") REFERENCES "admin_notifications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "admin_notification_reads" ADD CONSTRAINT "admin_notification_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
