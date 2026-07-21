# Bullet Reporter

Bullet Reporter is a production-oriented news publishing platform built with Next.js and Payload CMS. It provides a public news website, a secured editorial admin dashboard, media management through Cloudinary, PostgreSQL persistence, email-based account and password workflows, reCAPTCHA-protected public actions, SEO metadata, sitemap and robots support, and optimized public API endpoints for news, categories, advertisements, video news, and engagement features.

## Table of Contents

- [Overview](#overview)
- [Core Capabilities](#core-capabilities)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Runtime Requirements](#runtime-requirements)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Available Scripts](#available-scripts)
- [Application Routes](#application-routes)
- [Admin Dashboard](#admin-dashboard)
- [Authentication and Email](#authentication-and-email)
- [Media Storage](#media-storage)
- [Security Controls](#security-controls)
- [Caching and Performance](#caching-and-performance)
- [Deployment](#deployment)
- [Operations Checklist](#operations-checklist)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

The application is organized as a Next.js App Router project with Payload CMS mounted under the admin and API routes. Public users consume editorial content through optimized pages and public API endpoints. Editors and administrators manage content through the Payload dashboard.

Primary use cases include:

- Publishing news articles, breaking news, categories, advertisements, and video news.
- Managing editorial users through the Payload admin dashboard.
- Uploading and serving media assets through Cloudinary.
- Protecting public write actions with Google reCAPTCHA v3.
- Sending account invite and password reset emails through SMTP.
- Serving SEO-ready routes, robots metadata, sitemap metadata, and AI crawler guidance files.

## Core Capabilities

| Area | Capabilities |
| --- | --- |
| Public website | Home page, category pages, news listing, article detail pages, video news, breaking news, about, contact, terms, and privacy pages. |
| CMS | Payload-powered admin dashboard for editorial operations and content management. |
| Content | News, categories, video news, advertisements, comments, reactions, and public engagement counters. |
| Auth | Payload user auth, admin session handling, forgot-password flow, reset-password flow, and account invite emails. |
| Security | reCAPTCHA v3 checks, secure headers, explicit admin logout, sanitized logging, and environment-driven secrets. |
| Media | Cloudinary-backed media uploads and optimized Next.js image delivery. |
| SEO | Dynamic pages, sitemap, robots, JSON-LD support, public cache state, and AI crawler guidance files. |
| Integrations | Neon/Postgres-compatible database, Cloudinary, SMTP/Nodemailer, YouTube Shorts, OpenWeather, and social sharing metadata. |

## Technology Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 App Router |
| UI | React 19, Tailwind CSS, Radix UI, Lucide React |
| CMS | Payload CMS 3 |
| Database | PostgreSQL via `@payloadcms/db-postgres` |
| Media | Cloudinary via `cloudinary` and Payload Cloudinary plugin |
| Email | Nodemailer SMTP adapter |
| Security | Google reCAPTCHA v3, Payload auth, Next.js security headers |
| Data fetching | Native fetch, Axios, TanStack Query |
| Rich text | Payload Lexical editor and React Quill integrations |
| Build tooling | TypeScript, ESLint, PostCSS, Sharp |

## Repository Structure

```text
.
|-- payload.config.ts                     # Payload CMS configuration, collections, auth, email, media, and hooks
|-- next.config.js                        # Next.js performance, image, header, redirect, and Payload integration config
|-- package.json                          # Scripts and package dependencies
|-- .env.example                          # Environment variable template
|-- public/                               # Static assets and crawler guidance files
|-- scripts/                              # Maintenance scripts
`-- src/
    |-- app/
    |   |-- (app)/                        # Public website routes and public API routes
    |   `-- (payload)/                    # Payload admin and Payload API route handlers
    |-- components/                       # Shared UI and application components
    |-- config/                           # Application-level configuration
    |-- contexts/                         # React context providers
    |-- hooks/                            # Shared React hooks
    |-- i18n/                             # Translation resources
    |-- lib/                              # Server utilities, logging, Payload direct access, reCAPTCHA helpers
    |-- services/                         # External service integrations
    `-- utils/                            # Public API clients, cache helpers, sharing, dates, and performance helpers
```

## Runtime Requirements

- Node.js 20 or newer is recommended.
- npm 10 or newer is recommended.
- A PostgreSQL database connection string.
- Cloudinary account credentials for production media storage.
- SMTP credentials for password reset and account invite emails.
- Google reCAPTCHA v3 keys for protected public actions.

## Environment Configuration

Create a local environment file from the example:

```bash
cp .env.example .env.local
```

Do not commit `.env.local` or production secrets.

### Public Site Variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical public site URL. Used for generated links, metadata, and email URLs. |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Recommended | Public Cloudinary cloud name for frontend media rendering. |
| `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID` | Optional | Public YouTube channel ID used by frontend integrations. |
| `NEXT_PUBLIC_FACEBOOK_PAGE_URL` | Optional | Facebook page URL used by sharing or footer UI. |
| `NEXT_PUBLIC_OPENWEATHER_API_KEY` | Optional | Public weather API key if weather widgets are enabled. |

### Database and Payload

| Variable | Required | Description |
| --- | --- | --- |
| `PAYLOAD_SECRET` | Yes | Long random secret used by Payload for auth and encryption. |
| `DATABASE_URL` | Yes | PostgreSQL connection string. Neon pooled URLs are supported. |
| `PAYLOAD_DB_PUSH` | No | Keep disabled. Database schema changes are managed through Prisma migrations. |
| `CRON_SECRET` | Recommended | Secret used to protect cron endpoints. |

### Prisma Database Workflow

Database structure is tracked in `prisma/migrations`. Deployment runs `prisma migrate deploy` before `next build`, so a new database URL is initialized automatically and an existing database is skipped or updated idempotently.

Useful commands:

```bash
npm run prisma:status
npm run prisma:migrate
npm run prisma:pull
npm run prisma:generate
```

Use `prisma:pull` only when intentionally baselining an already populated database into `prisma/schema.prisma`.

### reCAPTCHA

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Recommended | Browser site key for Google reCAPTCHA v3. |
| `RECAPTCHA_SECRET_KEY` | Recommended | Server secret key for token verification. |
| `RECAPTCHA_MIN_SCORE` | Optional | Minimum accepted score. Defaults are handled in code. |

### Cloudinary

| Variable | Required | Description |
| --- | --- | --- |
| `PAYLOAD_REQUIRE_CLOUDINARY` | Recommended | Set to `true` in production to require Cloudinary media configuration. |
| `PAYLOAD_MAX_UPLOAD_MB` | Optional | Maximum upload size in MB. |
| `CLOUDINARY_CLOUD_NAME` | Production | Cloudinary cloud name. |
| `CLOUDINARY_API_KEY` | Production | Cloudinary API key. |
| `CLOUDINARY_API_SECRET` | Production | Cloudinary API secret. |
| `CLOUDINARY_FOLDER` | Optional | Folder prefix for uploaded assets. |

### Email and SMTP

| Variable | Required | Description |
| --- | --- | --- |
| `SMTP_HOST` | Yes for email | SMTP host, for example `smtp.gmail.com`. |
| `SMTP_PORT` | Yes for email | SMTP port, commonly `587` or `465`. |
| `SMTP_USER` | Yes for email | SMTP username. |
| `SMTP_PASS` | Yes for email | SMTP password or provider app password. |
| `EMAIL_FROM` | Recommended | Sender address. If its domain differs from `SMTP_USER`, the application resolves the sender to avoid provider rejection. |

### YouTube Shorts

| Variable | Required | Description |
| --- | --- | --- |
| `YOUTUBE_API_KEY` | Optional | YouTube Data API key. |
| `YOUTUBE_CHANNEL_ID` | Optional | Channel ID for video integrations. |
| `YOUTUBE_SHORTS_PLAYLIST_ID` | Optional | Playlist ID for Shorts. |
| `YOUTUBE_SHORTS_LIMIT` | Optional | Number of Shorts to fetch. |

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and fill the required values.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the public website:

   ```text
   http://localhost:3000
   ```

5. Open the Payload admin dashboard:

   ```text
   http://localhost:3000/admin
   ```

On first setup, Payload may prompt you to create the first admin user depending on the current database state.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Cleans the Next.js build output and starts the local development server. |
| `npm run build` | Cleans the Next.js build output and creates a production build. |
| `npm run start` | Starts the production Next.js server after a successful build. |
| `npm run lint` | Runs Next.js ESLint checks. |
| `npm run clean` | Removes the `.next` directory. |
| `npm run media:migrate-cloudinary` | Runs the Cloudinary media migration utility. |

## Application Routes

### Public Pages

| Route | Purpose |
| --- | --- |
| `/` | Home page. |
| `/news` | News listing page. |
| `/news/[slug]` | News detail page. |
| `/news/breaking` | Breaking news page. |
| `/category/[category]` | Category listing page. |
| `/video-news` | Video news listing page. |
| `/video-news/[slug]` | Video news detail page. |
| `/forgot-password` | Public forgot-password page. |
| `/reset-password/[token]` | Public reset-password page. |
| `/about` | About page. |
| `/contact` | Contact page. |
| `/terms` | Terms page. |
| `/privacy-policy` | Privacy policy page. |

### Public API Endpoints

| Endpoint | Purpose |
| --- | --- |
| `/api/public/news` | Public news feed data. |
| `/api/public/news/[slug]/view` | Record news article views. |
| `/api/public/news/[slug]/react` | Record news article reactions. |
| `/api/public/news/[slug]/comments` | Manage public article comments. |
| `/api/public/categories` | Public categories data. |
| `/api/public/video-news` | Public video news data. |
| `/api/public/video-news/[slug]/view` | Record video news views. |
| `/api/public/video-news/[slug]/react` | Record video news reactions. |
| `/api/public/video-news/[slug]/comments` | Manage public video comments. |
| `/api/public/advertisements` | Public advertisement data. |
| `/api/public/cache-state` | Cache state metadata for public clients. |
| `/api/public/youtube-shorts` | YouTube Shorts integration endpoint. |

### Auth API Endpoints

| Endpoint | Purpose |
| --- | --- |
| `/api/auth/forgot-password` | Public forgot-password request endpoint with reCAPTCHA validation. |
| `/api/auth/reset-password` | Public reset-password endpoint with reCAPTCHA validation. |
| `/api/users/*` | Payload user auth endpoints. |

## Admin Dashboard

The admin dashboard is served at `/admin` and is powered by Payload CMS.

Key admin behavior:

- Admin users authenticate through Payload auth.
- Admin sessions remain signed in during inactivity.
- Admin users are signed out only through the logout action or logout API.

## Authentication and Email

The application supports:

- Password reset emails for existing users.
- Account invite emails for newly created users.
- SMTP-based email transport through the Payload Nodemailer adapter.
- Email diagnostics that log only when email functionality is needed, instead of repeatedly logging configuration on every request.

Password reset links expire after 10 minutes.

If `EMAIL_FROM` uses a different domain than `SMTP_USER`, the application resolves the sender address to reduce the chance of SMTP provider rejection.

## Media Storage

Media is configured for Cloudinary-backed storage through the Payload Cloudinary plugin.

Production deployments should provide:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `PAYLOAD_REQUIRE_CLOUDINARY=true`

Next.js image optimization is configured for Cloudinary, YouTube thumbnails, and remote image sources.

## Security Controls

Security-relevant behavior includes:

- Payload CMS authentication for admin users.
- Persistent admin sessions with explicit logout.
- reCAPTCHA v3 verification for public forgot-password, reset-password, comments, reactions, and view actions where configured.
- Security headers through `next.config.js`, including:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- No secrets are expected to be committed to the repository.
- Logs avoid exposing sensitive SMTP passwords, tokens, or database credentials.

## Caching and Performance

Performance controls include:

- Next.js compression.
- React strict mode.
- Production console removal through the Next.js compiler.
- Long-lived caching for static assets.
- Optimized caching for Next.js images.
- Short stale-while-revalidate caching for public news and category pages.
- AVIF and WebP image formats.
- Package import optimization for selected client libraries.

## Deployment

The application is designed for Node-compatible Next.js hosting.

Recommended deployment steps:

1. Provision a PostgreSQL database.
2. Configure required environment variables in the hosting provider.
3. Configure Cloudinary for media uploads.
4. Configure SMTP credentials for email.
5. Configure Google reCAPTCHA v3 keys.
6. Run a production build:

   ```bash
   npm run build
   ```

7. Start the production server:

   ```bash
   npm run start
   ```

For Vercel-style deployments, ensure all environment variables are available in the correct environment scopes: development, preview, and production.

## Operations Checklist

Before going live:

- Confirm `NEXT_PUBLIC_SITE_URL` points to the production domain.
- Confirm `PAYLOAD_SECRET` is strong and unique.
- Confirm `DATABASE_URL` points to the production database.
- Confirm `PAYLOAD_DB_PUSH` is disabled and Prisma migrations are ready.
- Confirm Cloudinary uploads work from the admin dashboard.
- Confirm forgot-password email sends successfully.
- Confirm reset-password links open the public reset page.
- Confirm reCAPTCHA accepts legitimate users and blocks invalid tokens.
- Confirm `/admin` remains signed in while inactive and logs out through the logout action.
- Confirm sitemap and robots metadata are reachable.
- Confirm public pages render correctly on mobile and desktop.

## Troubleshooting

### `POST /api/users/forgot-password` returns 403

The Payload admin forgot-password endpoint should not be blocked by the public reCAPTCHA wrapper. Public forgot-password requests should go through `/api/auth/forgot-password`, while Payload admin requests use Payload's own `/api/users/forgot-password` endpoint.

### Password reset email is not received

Check:

- SMTP host, port, user, and app password.
- Whether the SMTP provider allows the configured sender.
- Spam or promotions folders.
- Whether the reset request reached `/api/auth/forgot-password` or Payload admin forgot-password.

### Email logs appear repeatedly

Email diagnostics are intended to appear only when email functionality is used and only once per diagnostic reason. Repeated config logs on unrelated requests usually indicate logging was added at module initialization instead of inside the email action path.

### Images do not render

Check:

- Cloudinary credentials.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
- Whether the image URL host is allowed by `next.config.js`.

### Database connection fails

Check:

- `DATABASE_URL` formatting.
- SSL requirements for the database provider.
- Network access from the hosting environment.
- Whether the database user has the required permissions.

## Contributing

Recommended workflow:

1. Create a feature branch.
2. Keep changes scoped to the requested feature or fix.
3. Run checks before handoff:

   ```bash
   npm run lint
   npm run build
   ```

4. Document any required environment variable changes in `.env.example`.
5. Avoid committing generated files, local secrets, or environment-specific build output.

## License

This project is private. All rights are reserved unless a separate license file is added.
