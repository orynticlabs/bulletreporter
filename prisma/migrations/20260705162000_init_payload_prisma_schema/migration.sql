-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "enum__news_v_version_status" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "enum__video_news_v_version_language" AS ENUM ('hi', 'en');

-- CreateEnum
CREATE TYPE "enum__video_news_v_version_status" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "enum_advertisements_position" AS ENUM ('top_banner', 'middle_banner', 'bottom_banner', 'sidebar', 'bottom_sidebar');

-- CreateEnum
CREATE TYPE "enum_comments_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "enum_news_status" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "enum_users_role" AS ENUM ('admin', 'chief_editor', 'editor', 'author', 'viewer');

-- CreateEnum
CREATE TYPE "enum_video_news_language" AS ENUM ('hi', 'en');

-- CreateEnum
CREATE TYPE "enum_video_news_status" AS ENUM ('draft', 'published');

-- CreateTable
CREATE TABLE "_news_v" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "version_title" VARCHAR,
    "version_slug" VARCHAR,
    "version_excerpt" VARCHAR,
    "version_content" JSONB,
    "version_featured_image_id" INTEGER,
    "version_category_id" INTEGER,
    "version_author_id" INTEGER,
    "version_is_breaking" BOOLEAN DEFAULT false,
    "version_is_featured" BOOLEAN DEFAULT false,
    "version_status" "enum__news_v_version_status" DEFAULT 'draft',
    "version_published_at" TIMESTAMPTZ(3),
    "version_views" DECIMAL DEFAULT 0,
    "version_seo_meta_title" VARCHAR,
    "version_seo_meta_description" VARCHAR,
    "version_seo_keywords" VARCHAR,
    "version_updated_at" TIMESTAMPTZ(3),
    "version_created_at" TIMESTAMPTZ(3),
    "version__status" "enum__news_v_version_status" DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latest" BOOLEAN,
    "version_excerpt_hindi" VARCHAR,
    "version_editor_id" INTEGER,
    "version_title_english" VARCHAR,
    "version_delete_at" TIMESTAMPTZ(6),
    "version_likes" INTEGER NOT NULL DEFAULT 0,
    "version_dislikes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "_news_v_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_news_v_version_tags" (
    "_order" INTEGER NOT NULL,
    "_parent_id" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "tag" VARCHAR,
    "_uuid" VARCHAR,

    CONSTRAINT "_news_v_version_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_video_news_v" (
    "id" SERIAL NOT NULL,
    "parent_id" INTEGER,
    "version_title" VARCHAR,
    "version_slug" VARCHAR,
    "version_language" "enum__video_news_v_version_language" DEFAULT 'hi',
    "version_category_id" INTEGER,
    "version_description" VARCHAR,
    "version_content" JSONB,
    "version_youtube_video" VARCHAR,
    "version_youtube_video_id" VARCHAR,
    "version_thumbnail_id" INTEGER,
    "version_author_id" INTEGER,
    "version_editor_id" INTEGER,
    "version_status" "enum__video_news_v_version_status" DEFAULT 'draft',
    "version_published_at" TIMESTAMPTZ(6),
    "version_views" DECIMAL DEFAULT 0,
    "version_seo_meta_title" VARCHAR,
    "version_seo_meta_description" VARCHAR,
    "version_seo_keywords" VARCHAR,
    "version_updated_at" TIMESTAMPTZ(6),
    "version_created_at" TIMESTAMPTZ(6),
    "version__status" "enum__video_news_v_version_status" DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latest" BOOLEAN,
    "version_likes" INTEGER NOT NULL DEFAULT 0,
    "version_dislikes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "_video_news_v_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_video_news_v_version_tags" (
    "_order" INTEGER NOT NULL,
    "_parent_id" INTEGER NOT NULL,
    "id" SERIAL NOT NULL,
    "tag" VARCHAR,
    "_uuid" VARCHAR,

    CONSTRAINT "_video_news_v_version_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertisements" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR NOT NULL,
    "image_id" INTEGER,
    "link" VARCHAR,
    "position" "enum_advertisements_position" NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "starts_at" TIMESTAMPTZ(3),
    "ends_at" TIMESTAMPTZ(3),
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "banner_type" VARCHAR NOT NULL DEFAULT 'large_ad_banner',
    "size" VARCHAR NOT NULL DEFAULT 'large',

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "slug" VARCHAR NOT NULL,
    "name_hindi" VARCHAR,
    "description" VARCHAR,
    "color" VARCHAR DEFAULT '#dc2626',
    "order" DECIMAL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "author_name" VARCHAR NOT NULL,
    "author_email" VARCHAR,
    "content" VARCHAR NOT NULL,
    "article_id" INTEGER,
    "status" "enum_comments_status" DEFAULT 'pending',
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "video_article_id" INTEGER,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" SERIAL NOT NULL,
    "alt" VARCHAR NOT NULL,
    "caption" VARCHAR,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" VARCHAR,
    "thumbnail_u_r_l" VARCHAR,
    "filename" VARCHAR,
    "mime_type" VARCHAR,
    "filesize" DECIMAL,
    "width" DECIMAL,
    "height" DECIMAL,
    "focal_x" DECIMAL,
    "focal_y" DECIMAL,
    "sizes_thumbnail_url" VARCHAR,
    "sizes_thumbnail_width" DECIMAL,
    "sizes_thumbnail_height" DECIMAL,
    "sizes_thumbnail_mime_type" VARCHAR,
    "sizes_thumbnail_filesize" DECIMAL,
    "sizes_thumbnail_filename" VARCHAR,
    "sizes_card_url" VARCHAR,
    "sizes_card_width" DECIMAL,
    "sizes_card_height" DECIMAL,
    "sizes_card_mime_type" VARCHAR,
    "sizes_card_filesize" DECIMAL,
    "sizes_card_filename" VARCHAR,
    "sizes_hero_url" VARCHAR,
    "sizes_hero_width" DECIMAL,
    "sizes_hero_height" DECIMAL,
    "sizes_hero_mime_type" VARCHAR,
    "sizes_hero_filesize" DECIMAL,
    "sizes_hero_filename" VARCHAR,
    "cloudinary_public_id" VARCHAR,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR,
    "slug" VARCHAR,
    "excerpt" VARCHAR,
    "content" JSONB,
    "featured_image_id" INTEGER,
    "category_id" INTEGER,
    "author_id" INTEGER,
    "is_breaking" BOOLEAN DEFAULT false,
    "is_featured" BOOLEAN DEFAULT false,
    "status" "enum_news_status" DEFAULT 'draft',
    "published_at" TIMESTAMPTZ(3),
    "views" DECIMAL DEFAULT 0,
    "seo_meta_title" VARCHAR,
    "seo_meta_description" VARCHAR,
    "seo_keywords" VARCHAR,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "_status" "enum_news_status" DEFAULT 'draft',
    "excerpt_hindi" VARCHAR,
    "editor_id" INTEGER,
    "title_english" VARCHAR,
    "delete_at" TIMESTAMPTZ(6),
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dislikes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_tags" (
    "_order" INTEGER NOT NULL,
    "_parent_id" INTEGER NOT NULL,
    "id" VARCHAR NOT NULL,
    "tag" VARCHAR,

    CONSTRAINT "news_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payload_kv" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "payload_kv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payload_locked_documents" (
    "id" SERIAL NOT NULL,
    "global_slug" VARCHAR,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payload_locked_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payload_locked_documents_rels" (
    "id" SERIAL NOT NULL,
    "order" INTEGER,
    "parent_id" INTEGER NOT NULL,
    "path" VARCHAR NOT NULL,
    "users_id" INTEGER,
    "media_id" INTEGER,
    "categories_id" INTEGER,
    "news_id" INTEGER,
    "comments_id" INTEGER,
    "advertisements_id" INTEGER,
    "video_news_id" INTEGER,

    CONSTRAINT "payload_locked_documents_rels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payload_migrations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR,
    "batch" DECIMAL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payload_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payload_preferences" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR,
    "value" JSONB,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payload_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payload_preferences_rels" (
    "id" SERIAL NOT NULL,
    "order" INTEGER,
    "parent_id" INTEGER NOT NULL,
    "path" VARCHAR NOT NULL,
    "users_id" INTEGER,

    CONSTRAINT "payload_preferences_rels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "site_name" VARCHAR DEFAULT 'Bullet Reporter',
    "tagline" VARCHAR,
    "logo_id" INTEGER,
    "favicon_id" INTEGER,
    "social_links_facebook" VARCHAR,
    "social_links_twitter" VARCHAR,
    "social_links_instagram" VARCHAR,
    "social_links_youtube" VARCHAR,
    "footer_text" VARCHAR,
    "breaking_news_ticker" BOOLEAN DEFAULT true,
    "updated_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3),
    "about_page_eyebrow" VARCHAR DEFAULT 'About Bullet Reporter',
    "about_page_headline" VARCHAR DEFAULT 'साफ, तेज और जिम्मेदार खबरें',
    "about_page_summary" VARCHAR,
    "about_page_photo_id" INTEGER,
    "about_page_description" JSONB,
    "about_page_mission" VARCHAR,
    "about_page_technology_management" VARCHAR,
    "about_page_ownership" VARCHAR,
    "about_page_chief_editor_name" VARCHAR,
    "about_page_chief_editor_designation" VARCHAR DEFAULT 'Chief Editor',
    "about_page_chief_editor_photo_id" INTEGER,
    "about_page_chief_editor_bio" VARCHAR,
    "about_page_chief_editor_email" VARCHAR,
    "about_page_editor_name" VARCHAR,
    "about_page_editor_designation" VARCHAR DEFAULT 'Editor',
    "about_page_editor_photo_id" INTEGER,
    "about_page_editor_bio" VARCHAR,
    "about_page_editor_email" VARCHAR,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR NOT NULL,
    "role" "enum_users_role" NOT NULL DEFAULT 'author',
    "bio" VARCHAR,
    "avatar_id" INTEGER,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" VARCHAR NOT NULL,
    "reset_password_token" VARCHAR,
    "reset_password_expiration" TIMESTAMPTZ(3),
    "salt" VARCHAR,
    "hash" VARCHAR,
    "login_attempts" DECIMAL DEFAULT 0,
    "lock_until" TIMESTAMPTZ(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users_sessions" (
    "_order" INTEGER NOT NULL,
    "_parent_id" INTEGER NOT NULL,
    "id" VARCHAR NOT NULL,
    "created_at" TIMESTAMPTZ(3),
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_news" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR,
    "slug" VARCHAR,
    "language" "enum_video_news_language" DEFAULT 'hi',
    "category_id" INTEGER,
    "description" VARCHAR,
    "content" JSONB,
    "youtube_video" VARCHAR,
    "youtube_video_id" VARCHAR,
    "thumbnail_id" INTEGER,
    "author_id" INTEGER,
    "editor_id" INTEGER,
    "status" "enum_video_news_status" DEFAULT 'draft',
    "published_at" TIMESTAMPTZ(6),
    "views" DECIMAL DEFAULT 0,
    "seo_meta_title" VARCHAR,
    "seo_meta_description" VARCHAR,
    "seo_keywords" VARCHAR,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "_status" "enum_video_news_status" DEFAULT 'draft',
    "likes" INTEGER NOT NULL DEFAULT 0,
    "dislikes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "video_news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_news_tags" (
    "_order" INTEGER NOT NULL,
    "_parent_id" INTEGER NOT NULL,
    "id" VARCHAR NOT NULL,
    "tag" VARCHAR,

    CONSTRAINT "video_news_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "_news_v_created_at_idx" ON "_news_v"("created_at");

-- CreateIndex
CREATE INDEX "_news_v_latest_idx" ON "_news_v"("latest");

-- CreateIndex
CREATE INDEX "_news_v_parent_idx" ON "_news_v"("parent_id");

-- CreateIndex
CREATE INDEX "_news_v_updated_at_idx" ON "_news_v"("updated_at");

-- CreateIndex
CREATE INDEX "_news_v_version_version__status_idx" ON "_news_v"("version__status");

-- CreateIndex
CREATE INDEX "_news_v_version_version_author_idx" ON "_news_v"("version_author_id");

-- CreateIndex
CREATE INDEX "_news_v_version_version_category_idx" ON "_news_v"("version_category_id");

-- CreateIndex
CREATE INDEX "_news_v_version_version_created_at_idx" ON "_news_v"("version_created_at");

-- CreateIndex
CREATE INDEX "_news_v_version_version_editor_idx" ON "_news_v"("version_editor_id");

-- CreateIndex
CREATE INDEX "_news_v_version_version_featured_image_idx" ON "_news_v"("version_featured_image_id");

-- CreateIndex
CREATE INDEX "_news_v_version_version_slug_idx" ON "_news_v"("version_slug");

-- CreateIndex
CREATE INDEX "_news_v_version_version_updated_at_idx" ON "_news_v"("version_updated_at");

-- CreateIndex
CREATE INDEX "_news_v_version_tags_order_idx" ON "_news_v_version_tags"("_order");

-- CreateIndex
CREATE INDEX "_news_v_version_tags_parent_id_idx" ON "_news_v_version_tags"("_parent_id");

-- CreateIndex
CREATE INDEX "_video_news_v_created_at_idx" ON "_video_news_v"("created_at");

-- CreateIndex
CREATE INDEX "_video_news_v_latest_idx" ON "_video_news_v"("latest");

-- CreateIndex
CREATE INDEX "_video_news_v_parent_idx" ON "_video_news_v"("parent_id");

-- CreateIndex
CREATE INDEX "_video_news_v_updated_at_idx" ON "_video_news_v"("updated_at");

-- CreateIndex
CREATE INDEX "_video_news_v_version_version__status_idx" ON "_video_news_v"("version__status");

-- CreateIndex
CREATE INDEX "_video_news_v_version_version_author_idx" ON "_video_news_v"("version_author_id");

-- CreateIndex
CREATE INDEX "_video_news_v_version_version_category_idx" ON "_video_news_v"("version_category_id");

-- CreateIndex
CREATE INDEX "_video_news_v_version_version_created_at_idx" ON "_video_news_v"("version_created_at");

-- CreateIndex
CREATE INDEX "_video_news_v_version_version_editor_idx" ON "_video_news_v"("version_editor_id");

-- CreateIndex
CREATE INDEX "_video_news_v_version_version_slug_idx" ON "_video_news_v"("version_slug");

-- CreateIndex
CREATE INDEX "_video_news_v_version_version_thumbnail_idx" ON "_video_news_v"("version_thumbnail_id");

-- CreateIndex
CREATE INDEX "_video_news_v_version_version_updated_at_idx" ON "_video_news_v"("version_updated_at");

-- CreateIndex
CREATE INDEX "_video_news_v_version_tags_order_idx" ON "_video_news_v_version_tags"("_order");

-- CreateIndex
CREATE INDEX "_video_news_v_version_tags_parent_id_idx" ON "_video_news_v_version_tags"("_parent_id");

-- CreateIndex
CREATE INDEX "advertisements_created_at_idx" ON "advertisements"("created_at");

-- CreateIndex
CREATE INDEX "advertisements_image_idx" ON "advertisements"("image_id");

-- CreateIndex
CREATE INDEX "advertisements_updated_at_idx" ON "advertisements"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_idx" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_created_at_idx" ON "categories"("created_at");

-- CreateIndex
CREATE INDEX "categories_updated_at_idx" ON "categories"("updated_at");

-- CreateIndex
CREATE INDEX "comments_article_idx" ON "comments"("article_id");

-- CreateIndex
CREATE INDEX "comments_created_at_idx" ON "comments"("created_at");

-- CreateIndex
CREATE INDEX "comments_updated_at_idx" ON "comments"("updated_at");

-- CreateIndex
CREATE INDEX "comments_video_article_idx" ON "comments"("video_article_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_filename_idx" ON "media"("filename");

-- CreateIndex
CREATE INDEX "media_created_at_idx" ON "media"("created_at");

-- CreateIndex
CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media"("sizes_card_filename");

-- CreateIndex
CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "media"("sizes_hero_filename");

-- CreateIndex
CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media"("sizes_thumbnail_filename");

-- CreateIndex
CREATE INDEX "media_updated_at_idx" ON "media"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "news_slug_idx" ON "news"("slug");

-- CreateIndex
CREATE INDEX "news_status_idx" ON "news"("status");

-- CreateIndex
CREATE INDEX "news_author_idx" ON "news"("author_id");

-- CreateIndex
CREATE INDEX "news_category_idx" ON "news"("category_id");

-- CreateIndex
CREATE INDEX "news_created_at_idx" ON "news"("created_at");

-- CreateIndex
CREATE INDEX "news_editor_idx" ON "news"("editor_id");

-- CreateIndex
CREATE INDEX "news_featured_image_idx" ON "news"("featured_image_id");

-- CreateIndex
CREATE INDEX "news_updated_at_idx" ON "news"("updated_at");

-- CreateIndex
CREATE INDEX "news_tags_order_idx" ON "news_tags"("_order");

-- CreateIndex
CREATE INDEX "news_tags_parent_id_idx" ON "news_tags"("_parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv"("key");

-- CreateIndex
CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents"("created_at");

-- CreateIndex
CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents"("global_slug");

-- CreateIndex
CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents"("updated_at");

-- CreateIndex
CREATE INDEX "payload_locked_documents_rels_advertisements_id_idx" ON "payload_locked_documents_rels"("advertisements_id");

-- CreateIndex
CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels"("categories_id");

-- CreateIndex
CREATE INDEX "payload_locked_documents_rels_comments_id_idx" ON "payload_locked_documents_rels"("comments_id");

-- CreateIndex
CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels"("media_id");

-- CreateIndex
CREATE INDEX "payload_locked_documents_rels_news_id_idx" ON "payload_locked_documents_rels"("news_id");

-- CreateIndex
CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels"("order");

-- CreateIndex
CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels"("parent_id");

-- CreateIndex
CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels"("path");

-- CreateIndex
CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels"("users_id");

-- CreateIndex
CREATE INDEX "payload_locked_documents_rels_video_news_id_idx" ON "payload_locked_documents_rels"("video_news_id");

-- CreateIndex
CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations"("created_at");

-- CreateIndex
CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations"("updated_at");

-- CreateIndex
CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences"("created_at");

-- CreateIndex
CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences"("key");

-- CreateIndex
CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences"("updated_at");

-- CreateIndex
CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels"("order");

-- CreateIndex
CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels"("parent_id");

-- CreateIndex
CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels"("path");

-- CreateIndex
CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels"("users_id");

-- CreateIndex
CREATE INDEX "settings_favicon_idx" ON "settings"("favicon_id");

-- CreateIndex
CREATE INDEX "settings_logo_idx" ON "settings"("logo_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_avatar_idx" ON "users"("avatar_id");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "users_updated_at_idx" ON "users"("updated_at");

-- CreateIndex
CREATE INDEX "users_sessions_order_idx" ON "users_sessions"("_order");

-- CreateIndex
CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions"("_parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_news_slug_idx" ON "video_news"("slug");

-- CreateIndex
CREATE INDEX "video_news_status_idx" ON "video_news"("status");

-- CreateIndex
CREATE INDEX "video_news_author_idx" ON "video_news"("author_id");

-- CreateIndex
CREATE INDEX "video_news_category_idx" ON "video_news"("category_id");

-- CreateIndex
CREATE INDEX "video_news_created_at_idx" ON "video_news"("created_at");

-- CreateIndex
CREATE INDEX "video_news_editor_idx" ON "video_news"("editor_id");

-- CreateIndex
CREATE INDEX "video_news_thumbnail_idx" ON "video_news"("thumbnail_id");

-- CreateIndex
CREATE INDEX "video_news_updated_at_idx" ON "video_news"("updated_at");

-- CreateIndex
CREATE INDEX "video_news_tags_order_idx" ON "video_news_tags"("_order");

-- CreateIndex
CREATE INDEX "video_news_tags_parent_id_idx" ON "video_news_tags"("_parent_id");

-- AddForeignKey
ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_parent_id_news_id_fk" FOREIGN KEY ("parent_id") REFERENCES "news"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_editor_id_users_id_fk" FOREIGN KEY ("version_editor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_news_v" ADD CONSTRAINT "_news_v_version_featured_image_id_media_id_fk" FOREIGN KEY ("version_featured_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_news_v_version_tags" ADD CONSTRAINT "_news_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "_news_v"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_video_news_v" ADD CONSTRAINT "_video_news_v_parent_id_video_news_id_fk" FOREIGN KEY ("parent_id") REFERENCES "video_news"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_video_news_v" ADD CONSTRAINT "_video_news_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_video_news_v" ADD CONSTRAINT "_video_news_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_video_news_v" ADD CONSTRAINT "_video_news_v_version_editor_id_users_id_fk" FOREIGN KEY ("version_editor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_video_news_v" ADD CONSTRAINT "_video_news_v_version_thumbnail_id_media_id_fk" FOREIGN KEY ("version_thumbnail_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_video_news_v_version_tags" ADD CONSTRAINT "_video_news_v_version_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "_video_news_v"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_article_id_news_id_fk" FOREIGN KEY ("article_id") REFERENCES "news"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_video_article_id_video_news_id_fk" FOREIGN KEY ("video_article_id") REFERENCES "video_news"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_editor_id_users_id_fk" FOREIGN KEY ("editor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_featured_image_id_media_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "news_tags" ADD CONSTRAINT "news_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_advertisements_fk" FOREIGN KEY ("advertisements_id") REFERENCES "advertisements"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_comments_fk" FOREIGN KEY ("comments_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "media"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_news_fk" FOREIGN KEY ("news_id") REFERENCES "news"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload_locked_documents"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_video_news_fk" FOREIGN KEY ("video_news_id") REFERENCES "video_news"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload_preferences"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "video_news" ADD CONSTRAINT "video_news_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "video_news" ADD CONSTRAINT "video_news_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "video_news" ADD CONSTRAINT "video_news_editor_id_users_id_fk" FOREIGN KEY ("editor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "video_news" ADD CONSTRAINT "video_news_thumbnail_id_media_id_fk" FOREIGN KEY ("thumbnail_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "video_news_tags" ADD CONSTRAINT "video_news_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "video_news"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
