import crypto from 'crypto'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { payloadCloudinaryPlugin } from '@jhb.software/payload-cloudinary-plugin'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { revalidatePath } from 'next/cache'
import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const loadEnvFile = (filePath: string) => {
  if (!fs.existsSync(filePath)) return

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue

    const index = trimmed.indexOf('=')
    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

loadEnvFile(path.resolve(dirname, '.env'))
loadEnvFile(path.resolve(dirname, '.env.local'))

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.PAYLOAD_DATABASE_URL
// ── Email (Nodemailer) ──────────────────────────────────────────────────────
const smtpHost = process.env.SMTP_HOST
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const configuredEmailFrom = process.env.EMAIL_FROM || 'noreply@bulletreporter.in'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bullet-reporter.vercel.app'

const getEmailDomain = (value?: string) => value?.split('@').pop()?.toLowerCase() || ''

const smtpUserDomain = getEmailDomain(smtpUser)
const configuredEmailFromDomain = getEmailDomain(configuredEmailFrom)
const emailFromAddress =
  smtpUserDomain && configuredEmailFromDomain && smtpUserDomain !== configuredEmailFromDomain
    ? smtpUser || configuredEmailFrom
    : configuredEmailFrom || smtpUser || 'noreply@bulletreporter.in'

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const buildAuthEmailTemplate = ({
  audience,
  displayName,
  intro,
  ctaLabel,
  ctaUrl,
  secondaryLabel,
  secondaryUrl,
  expiresText,
  closingText,
}: {
  audience: string
  displayName: string
  intro: string
  ctaLabel: string
  ctaUrl: string
  secondaryLabel?: string
  secondaryUrl?: string
  expiresText: string
  closingText: string
}) => {
  const safeName = escapeHtml(displayName)
  const safeIntro = escapeHtml(intro)
  const safeCtaLabel = escapeHtml(ctaLabel)
  const safeCtaUrl = escapeHtml(ctaUrl)
  const safeSecondaryLabel = secondaryLabel ? escapeHtml(secondaryLabel) : ''
  const safeSecondaryUrl = secondaryUrl ? escapeHtml(secondaryUrl) : ''
  const safeExpiresText = escapeHtml(expiresText)
  const safeClosingText = escapeHtml(closingText)
  const safeAudience = escapeHtml(audience)

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${safeAudience}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;border-bottom:1px solid #e5e7eb;background:#ffffff;">
              <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#6b7280;font-weight:700;">Bullet Reporter</div>
              <h1 style="margin:10px 0 0;font-size:26px;line-height:1.3;color:#111827;">${safeAudience}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#111827;">Hello ${safeName},</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:#374151;">${safeIntro}</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.75;color:#374151;">Use the button below to continue.</p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
                <tr>
                  <td style="background:#111827;border-radius:10px;">
                    <a href="${safeCtaUrl}" style="display:inline-block;padding:14px 22px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;">${safeCtaLabel}</a>
                  </td>
                </tr>
              </table>
              ${secondaryLabel && secondaryUrl ? `
              <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#6b7280;">Alternative link:</p>
              <p style="margin:0 0 22px;font-size:13px;line-height:1.7;word-break:break-all;">
                <a href="${safeSecondaryUrl}" style="color:#111827;text-decoration:underline;">${safeSecondaryLabel}</a>
              </p>
              ` : ''}
              <div style="border-top:1px solid #e5e7eb;padding-top:18px;margin-top:6px;">
                <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#6b7280;">${safeExpiresText}</p>
                <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">${safeClosingText}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 28px;border-top:1px solid #e5e7eb;background:#fafafa;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">Bullet Reporter</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const textLines = [
    `Hello ${displayName},`,
    '',
    intro,
    '',
    `${ctaLabel}: ${ctaUrl}`,
  ]

  if (secondaryLabel && secondaryUrl) {
    textLines.push('', `${secondaryLabel}: ${secondaryUrl}`)
  }

  textLines.push('', expiresText, closingText)

  return {
    html,
    text: textLines.join('\n'),
  }
}

const buildAccountInviteEmail = ({ name, email, loginUrl, resetUrl }: { name?: string; email?: string; loginUrl: string; resetUrl: string }) => {
  const displayName = name || email || 'there'
  const subject = 'Your Bullet Reporter account is ready'

  return {
    subject,
    ...buildAuthEmailTemplate({
      audience: 'Your account has been created',
      displayName,
      intro: 'Your Bullet Reporter account has been created. You can access the dashboard and set your password using the links below.',
      ctaLabel: 'Access your account',
      ctaUrl: loginUrl,
      secondaryLabel: 'Set your password',
      secondaryUrl: resetUrl,
      expiresText: 'The password setup link expires in 10 minutes.',
      closingText: 'If you did not expect this email, please ignore it and contact an administrator.',
    }),
  }
}

const buildPasswordResetEmail = ({ name, email, resetUrl }: { name?: string; email?: string; resetUrl: string }) => {
  const displayName = name || email || 'there'
  const subject = 'Reset your Bullet Reporter password'

  return {
    subject,
    ...buildAuthEmailTemplate({
      audience: 'Reset your password',
      displayName,
      intro: 'We received a request to reset your Bullet Reporter password. Use the link below to continue.',
      ctaLabel: 'Reset password',
      ctaUrl: resetUrl,
      expiresText: 'This password reset link expires in 10 minutes.',
      closingText: 'If you did not request this email, you can safely ignore it.',
    }),
  }
}

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET
const hasCloudinaryCredentials = Boolean(cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret)
const requireCloudinaryStorage = process.env.PAYLOAD_REQUIRE_CLOUDINARY !== 'false'
const missingCloudinaryKeys = [
  ['CLOUDINARY_CLOUD_NAME', cloudinaryCloudName],
  ['CLOUDINARY_API_KEY', cloudinaryApiKey],
  ['CLOUDINARY_API_SECRET', cloudinaryApiSecret],
]
  .filter(([, value]) => !value)
  .map(([key]) => key)

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for Payload CMS. Add your Neon Postgres connection string to .env.local.')
}

if (hasCloudinaryCredentials) {
  cloudinary.config({
    cloud_name: cloudinaryCloudName,
    api_key: cloudinaryApiKey,
    api_secret: cloudinaryApiSecret,
  })
}

const randomSlug = (length = 12) => {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let value = ''

  for (let i = 0; i < length; i += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return value
}

const ensureNewsSlug = ({ data, operation }: { data?: Record<string, any>, operation?: string }) => {
  if (!data) return data || {}

  const shouldGenerate = operation === 'create' || !data.slug

  if (shouldGenerate) {
    data.slug = randomSlug()
  }

  return data
}

const ensureNewsPublishedAt = ({ data, operation }: { data?: Record<string, any>, operation?: string }) => {
  if (!data) return data || {}

  if (operation === 'create' && !data.publishedAt) {
    data.publishedAt = new Date().toISOString()
  }

  return data
}

const extractYouTubeVideoId = (value?: string) => {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const directId = raw.match(/^[a-zA-Z0-9_-]{11}$/)
  if (directId) return raw

  try {
    const url = new URL(raw)
    if (url.hostname.includes('youtu.be')) return url.pathname.split('/').filter(Boolean)[0] || ''
    if (url.searchParams.get('v')) return url.searchParams.get('v') || ''

    const parts = url.pathname.split('/').filter(Boolean)
    const markerIndex = parts.findIndex((part) => ['embed', 'shorts', 'live'].includes(part))
    if (markerIndex >= 0 && parts[markerIndex + 1]) return parts[markerIndex + 1]
  } catch (_) {
    // The field also accepts a raw YouTube ID, handled above.
  }

  return ''
}

const ensureVideoNewsFields = ({ data, operation }: { data?: Record<string, any>, operation?: string }) => {
  const next = ensureNewsPublishedAt({ data, operation })
  ensureNewsSlug({ data: next, operation })

  if (next.youtubeVideo) {
    next.youtubeVideoId = extractYouTubeVideoId(next.youtubeVideo)
  }

  if (!next.youtubeVideoId) {
    throw new Error('Please enter a valid YouTube video URL or 11-character YouTube video ID.')
  }

  return next
}

// ── Role-Based Access Control helpers ────────────────────────────────────────
//
// Role hierarchy (highest → lowest privilege):
//   admin   – full access to every collection, field, and operation
//   chief_editor – manage editorial content, latest news, and About page content
//   editor  – create / edit / publish all news; manage categories, comments, ads
//   author  – create news; edit/delete only their own draft articles
//   viewer  – read-only access inside the admin panel (no mutations)
//
// Public (unauthenticated) visitors can read published news and approved comments
// through the frontend API, but cannot touch the admin panel at all.

type User = { id: string | number; role?: string } | null | undefined

const isAdmin  = (user: User): boolean => user?.role === 'admin'
const isChiefEditor = (user: User): boolean => user?.role === 'chief_editor'
const isEditor = (user: User): boolean => user?.role === 'editor'
const isAuthor = (user: User): boolean => user?.role === 'author'
const isViewer = (user: User): boolean => user?.role === 'viewer'

/** Admin, Chief Editor, or Editor */
const isAdminOrEditor = (user: User): boolean => isAdmin(user) || isChiefEditor(user) || isEditor(user)

/** Admin or Chief Editor */
const isAdminOrChiefEditor = (user: User): boolean => isAdmin(user) || isChiefEditor(user)

/** Admin, Chief Editor, Editor, or Author (any staff role) */
const isStaff = (user: User): boolean => isAdmin(user) || isChiefEditor(user) || isEditor(user) || isAuthor(user)

/** Any authenticated user (including viewer) */
const isAuthenticated = (user: User): boolean => Boolean(user)

// ─────────────────────────────────────────────────────────────────────────────

const ensureCloudinaryUploadConfigured = ({ data, req }: { data?: Record<string, any>, req?: any }) => {
  if (requireCloudinaryStorage && req?.file && !hasCloudinaryCredentials) {
    throw new Error(
      `Cloudinary credentials are required for media uploads. Missing: ${missingCloudinaryKeys.join(', ')}. Save them in ${path.resolve(dirname, '.env.local')} and restart the dev server.`,
    )
  }

  return data
}

const deleteCloudinaryAsset = async ({ doc }: { doc?: Record<string, any> }) => {
  const publicId = doc?.cloudinaryPublicId

  if (!publicId || !hasCloudinaryCredentials) return

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: doc?.mimeType?.startsWith('video/') ? 'video' : 'image',
    })
  } catch (_) {
    // Non-fatal: Payload should still remove the media record.
  }
}

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024

const bannerSizeLabels: Record<string, string> = {
  large: 'Large - 1280 x 320 px',
  medium: 'Medium - 1024 x 256 px',
  small: 'Small - 640 x 180 px',
  square: 'Square / Sidebar - 512 x 512 px',
}

const bannerTypeLabels: Record<string, string> = {
  header_banner: 'Header Banner',
  footer_banner: 'Footer Banner',
  sidebar_banner: 'Sidebar Banner',
  large_ad_banner: 'Large Advertisement Banner',
  middle_banner: 'Middle Content Banner',
}

const bannerTypeAllowedSizes: Record<string, string[]> = {
  header_banner: ['large'],
  footer_banner: ['large', 'medium'],
  sidebar_banner: ['square', 'small'],
  large_ad_banner: ['large'],
  middle_banner: ['medium'],
}

const bannerTypeDefaultSize: Record<string, string> = {
  header_banner: 'large',
  footer_banner: 'large',
  sidebar_banner: 'square',
  large_ad_banner: 'large',
  middle_banner: 'medium',
}

const legacyAdDefaults: Record<string, { bannerType: string; size: string }> = {
  top_banner: { bannerType: 'header_banner', size: 'large' },
  middle_banner: { bannerType: 'middle_banner', size: 'medium' },
  bottom_banner: { bannerType: 'footer_banner', size: 'large' },
  sidebar: { bannerType: 'sidebar_banner', size: 'square' },
  bottom_sidebar: { bannerType: 'sidebar_banner', size: 'square' },
}

const ensureAdvertisementTypeAndSize = ({ data }: { data?: Record<string, any> }) => {
  if (!data) return data || {}

  const defaults = data.position ? legacyAdDefaults[data.position] : null

  if (!data.bannerType) {
    data.bannerType = defaults?.bannerType || 'large_ad_banner'
  }

  if (!data.size) {
    data.size = defaults?.size || bannerTypeDefaultSize[data.bannerType] || 'large'
  }

  const allowedSizes = bannerTypeAllowedSizes[data.bannerType] || Object.keys(bannerSizeLabels)

  if (!allowedSizes.includes(data.size)) {
    const bannerLabel = bannerTypeLabels[data.bannerType] || 'This banner type'
    const sizeList = allowedSizes.map((size) => bannerSizeLabels[size] || size).join(', ')

    throw new Error(`${bannerLabel} supports only: ${sizeList}. Please select the correct Banner Size.`)
  }

  return data
}

const normalizeForCompare = (value: any): string => {
  if (value && typeof value === 'object' && 'id' in value) {
    return String(value.id)
  }

  return JSON.stringify(value ?? null)
}

const hasPublicFieldChanged = ({
  doc,
  previousDoc,
  fields,
}: {
  doc?: Record<string, any>
  previousDoc?: Record<string, any>
  fields: string[]
}) => {
  if (!previousDoc) return true

  return fields.some((field) => normalizeForCompare(doc?.[field]) !== normalizeForCompare(previousDoc?.[field]))
}

const touchPublicCache = async ({
  scopes,
}: {
  req?: any
  scopes: Array<'news' | 'videoNews' | 'categories' | 'advertisements' | 'comments'>
}) => {
  revalidatePath('/', 'layout')

  if (scopes.includes('news') || scopes.includes('categories') || scopes.includes('comments')) {
    revalidatePath('/news')
    revalidatePath('/news/breaking')
  }

  if (scopes.includes('videoNews') || scopes.includes('categories') || scopes.includes('comments')) {
    revalidatePath('/video-news')
  }
}

const NEWS_PUBLIC_FIELDS = [
  'title',
  'slug',
  'excerpt',
  'content',
  'featuredImage',
  'category',
  'author',
  'editor',
  'tags',
  'isBreaking',
  'isFeatured',
  'status',
  'publishedAt',
  'deleteAt',
  'seo',
]

const VIDEO_NEWS_PUBLIC_FIELDS = [
  'title',
  'slug',
  'language',
  'category',
  'description',
  'content',
  'youtubeVideo',
  'youtubeVideoId',
  'thumbnail',
  'author',
  'editor',
  'tags',
  'status',
  'publishedAt',
  'seo',
]

const COMMENT_PUBLIC_FIELDS = [
  'authorName',
  'content',
  'article',
  'videoArticle',
  'status',
]

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'change-this-payload-secret-for-production',
  sharp,

  email: nodemailerAdapter({
    defaultFromAddress: emailFromAddress,
    defaultFromName: 'Bullet Reporter',
    transportOptions: {
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    },
  }),

  admin: {
    user: 'users',
    importMap: {
      baseDir: dirname,
      importMapFile: path.resolve(dirname, 'src/app/(payload)/admin/importMap.js'),
    },
  },

  db: postgresAdapter({
    push: process.env.PAYLOAD_DB_PUSH === 'true',
    pool: {
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('sslmode=') ? undefined : { rejectUnauthorized: false },
    },
  }),

  editor: lexicalEditor(),

  collections: [
    {
      slug: 'users',
      auth: {
        forgotPassword: {
          expiration: 10 * 60 * 1000,
          generateEmailHTML: ({ token, user }: { token?: string; user?: any }) => {
            const resetUrl = `${siteUrl}/reset-password/${token}`
            return buildPasswordResetEmail({
              name: user?.name,
              email: user?.email,
              resetUrl,
            }).html
          },
          generateEmailSubject: () => 'Reset your Bullet Reporter password',
        },
      },
      hooks: {
        beforeChange: [
          ({ data, operation, req }: { data?: Record<string, any>; operation: string; req: any }) => {
            if (operation !== 'create' || !data?.email) {
              return data
            }

            const resetPasswordToken = crypto.randomBytes(20).toString('hex')

            req.__newUserResetToken = resetPasswordToken

            return {
              ...data,
              resetPasswordToken,
              resetPasswordExpiration: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            }
          },
        ],
        afterChange: [
          async ({ doc, operation, req }: { doc: any; operation: string; req: any }) => {
            if (operation !== 'create' || !doc?.email) {
              return doc
            }

            const loginUrl = `${siteUrl}/admin`
            const resetUrl = `${siteUrl}/reset-password/${req.__newUserResetToken}`
            const message = buildAccountInviteEmail({
              name: doc.name,
              email: doc.email,
              loginUrl,
              resetUrl,
            })

            await req.payload.sendEmail({
              from: `"Bullet Reporter" <${emailFromAddress}>`,
              html: message.html,
              subject: message.subject,
              text: message.text,
              to: doc.email,
            })

            return doc
          },
        ],
      },
      access: {
        // Admins see all users; others see only their own profile
        read: ({ req }) => {
          if (isAdmin(req.user)) return true
          if (isAuthenticated(req.user)) return { id: { equals: req.user!.id } }
          return false
        },
        // New user accounts are created only by admins (registration is disabled)
        create: ({ req }) => isAdmin(req.user),
        // Admins update anyone; everyone else can update only themselves
        update: ({ req }) => {
          if (isAdmin(req.user)) return true
          if (isAuthenticated(req.user)) return { id: { equals: req.user!.id } }
          return false
        },
        // Only admins can delete users
        delete: ({ req }) => isAdmin(req.user),
      },
      admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'email', 'role'],
        // Only admins see the Users list in the sidebar
        hidden: ({ user }: { user: any }) => !isAdmin(user),
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'role',
          type: 'select',
          options: [
            { label: 'Admin',        value: 'admin' },
            { label: 'Chief Editor', value: 'chief_editor' },
            { label: 'Editor',       value: 'editor' },
            { label: 'Author',       value: 'author' },
            { label: 'Viewer',       value: 'viewer' },
          ],
          defaultValue: 'author',
          required: true,
          // Only admins can change someone's role
          access: {
            update: ({ req }) => isAdmin(req.user),
          },
        },
        { name: 'bio', type: 'textarea' },
        { name: 'avatar', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      slug: 'media',
      access: {
        // Media files are always public (images appear on the frontend)
        read: () => true,
        // Admin, Editor, and Author can upload media
        create: ({ req }) => isStaff(req.user),
        // Admin and Editor can edit any media; Authors can edit only media they uploaded
        update: ({ req }) => {
          if (isAdminOrEditor(req.user)) return true
          if (isAuthor(req.user)) return { uploadedBy: { equals: req.user!.id } }
          return false
        },
        // Only Admin and Editor can delete media
        delete: ({ req }) => isAdminOrEditor(req.user),
      },
      hooks: {
        beforeOperation: [
          ({ req, operation }: { req: any; operation: string }) => {
            if (operation === 'create' && req?.file) {
              if (req.file.size > MAX_UPLOAD_BYTES) {
                throw new Error(`फ़ाइल का आकार 2 MB से अधिक नहीं होना चाहिए। (File size must not exceed 2 MB.)`)
              }
            }
          },
        ],
        beforeChange: [ensureCloudinaryUploadConfigured],
        afterDelete: [deleteCloudinaryAsset],
      },
      upload: {
        mimeTypes: ['image/*', 'video/*'],
        imageSizes: [
          { name: 'hero', width: 1280, height: 720, position: 'centre' },
        ],
      },
      admin: {
        useAsTitle: 'alt',
        // Authors and above can see the Media library; Viewers cannot upload
        hidden: ({ user }: { user: any }) => !isStaff(user),
      },
      fields: [
        { name: 'alt', type: 'text', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    {
      slug: 'categories',
      access: {
        // Categories are public — used in nav and article filters
        read: () => true,
        // Admin and Editor can manage categories
        create: ({ req }) => isAdminOrEditor(req.user),
        update: ({ req }) => isAdminOrEditor(req.user),
        // Only Admin can delete categories (prevents breaking existing articles)
        delete: ({ req }) => isAdmin(req.user),
      },
      admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'slug', 'order'],
        // Admin and Editor manage categories; Authors and Viewers only see them as read-only
        hidden: ({ user }: { user: any }) => !isAdminOrEditor(user),
      },
      hooks: {
        afterChange: [
          async ({ req }: { req: any }) => {
            await touchPublicCache({ req, scopes: ['categories'] })
          },
        ],
        afterDelete: [
          async ({ req }: { req: any }) => {
            await touchPublicCache({ req, scopes: ['categories', 'news', 'videoNews'] })
          },
        ],
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true, unique: true },
        { name: 'nameHindi', type: 'text', label: 'Name (Hindi)' },
        { name: 'description', type: 'textarea' },
        { name: 'color', type: 'text', label: 'Color (hex)', defaultValue: '#dc2626' },
        { name: 'order', type: 'number', defaultValue: 0 },
      ],
    },
    {
      slug: 'news',
      access: {
        // Public: only published articles; logged-in staff: all (including drafts)
        read: ({ req }) => {
          if (isStaff(req.user) || isViewer(req.user)) return true
          return { status: { equals: 'published' } }
        },
        // Admin, Editor, and Author can create news
        create: ({ req }) => isStaff(req.user),
        // Admin and Editor can edit any article;
        // Author can edit only articles they authored (and only while draft)
        update: ({ req }) => {
          if (isAdminOrEditor(req.user)) return true
          if (isAuthor(req.user)) return { author: { equals: req.user!.id } }
          return false
        },
        // Admin and Editor can delete; Authors cannot
        delete: ({ req }) => isAdminOrEditor(req.user),
      },
      hooks: {
        beforeValidate: [ensureNewsSlug, ensureNewsPublishedAt],
        afterChange: [
          async ({ doc, previousDoc, req }: { doc: any; previousDoc: any; req: any }) => {
            if (hasPublicFieldChanged({ doc, previousDoc, fields: NEWS_PUBLIC_FIELDS })) {
              await touchPublicCache({ req, scopes: ['news'] })
              if (doc?.slug) {
                revalidatePath(`/news/${doc.slug}`)
                revalidatePath(`/article/${doc.slug}`)
              }
            }
          },
        ],
        afterDelete: [
          async ({ doc, req }: { doc: any; req: any }) => {
            // Delete the featured image from media (Cloudinary plugin removes it from Cloudinary)
            const imageId =
              doc?.featuredImage && typeof doc.featuredImage === 'object'
                ? doc.featuredImage.id
                : doc?.featuredImage

            if (imageId) {
              try {
                await req.payload.delete({ collection: 'media', id: imageId, req })
              } catch (_) {
                // Non-fatal: image may already be gone or unreachable
              }
            }

            await touchPublicCache({ req, scopes: ['news'] })
            if (doc?.slug) {
              revalidatePath(`/news/${doc.slug}`)
              revalidatePath(`/article/${doc.slug}`)
            }
          },
        ],
      },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'category', 'status', 'publishedAt', 'deleteAt'],
      },
      versions: {
        drafts: true,
      },
      fields: [
        { name: 'title', type: 'text', label: 'Title (Hindi)', required: true },
        {
          name: 'slug',
          type: 'text',
          unique: true,
          admin: {
            description: 'Auto-generated as random lowercase letters and numbers.',
            readOnly: true,
          },
        },
        {
          name: 'excerpt',
          type: 'textarea',
          label: 'Summary / Excerpt',
          required: true,
          admin: {
            description: 'Short summary shown on news cards, search results, and social previews.',
          },
        },
        {
          name: 'content',
          type: 'richText',
          label: 'Content Editor',
          required: true,
        },
        {
          name: 'featuredImage',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
        },
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
        {
          name: 'editor',
          type: 'relationship',
          relationTo: 'users',
          required: true,
          // Only Admin/Editor can assign who reviewed/edited a piece
          access: { update: ({ req }) => isAdminOrEditor(req.user) },
        },
        {
          name: 'tags',
          type: 'array',
          fields: [{ name: 'tag', type: 'text' }],
        },
        {
          name: 'isBreaking',
          type: 'checkbox',
          label: 'Breaking News',
          defaultValue: false,
          // Only Admin and Editor can mark as breaking
          access: { update: ({ req }) => isAdminOrEditor(req.user) },
        },
        {
          name: 'isFeatured',
          type: 'checkbox',
          label: 'Featured Article',
          defaultValue: false,
          // Only Admin and Editor can feature articles
          access: { update: ({ req }) => isAdminOrEditor(req.user) },
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
          defaultValue: 'draft',
          required: true,
          // Authors can create articles but cannot publish — only Admin/Editor can
          access: { update: ({ req }) => isAdminOrEditor(req.user) },
          admin: {
            description: 'Authors can save as Draft only. Editors and Admins can publish.',
          },
        },
        {
          name: 'publishedAt',
          type: 'date',
          defaultValue: () => new Date().toISOString(),
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
            description: 'Automatically set to the exact date and time when the news item is created.',
            readOnly: true,
          },
        },
        {
          name: 'deleteAt',
          type: 'date',
          label: 'Auto-Delete At',
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
            description: 'Optional. Set a future date & time to automatically delete this article (and its image from Cloudinary) when the scheduled cron runs.',
            position: 'sidebar',
          },
        },
        {
          name: 'views',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
        {
          name: 'likes',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
        {
          name: 'dislikes',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
        {
          name: 'seo',
          type: 'group',
          label: 'SEO',
          fields: [
            { name: 'metaTitle', type: 'text' },
            { name: 'metaDescription', type: 'textarea' },
            { name: 'keywords', type: 'text' },
          ],
        },
      ],
    },
    {
      slug: 'video-news',
      labels: {
        singular: 'Video News',
        plural: 'Video News',
      },
      access: {
        read: ({ req }) => {
          if (isStaff(req.user) || isViewer(req.user)) return true
          return { status: { equals: 'published' } }
        },
        create: ({ req }) => isStaff(req.user),
        update: ({ req }) => {
          if (isAdminOrEditor(req.user)) return true
          if (isAuthor(req.user)) return { author: { equals: req.user!.id } }
          return false
        },
        delete: ({ req }) => isAdminOrEditor(req.user),
      },
      hooks: {
        beforeValidate: [ensureVideoNewsFields],
        afterChange: [
          async ({ doc, previousDoc, req }: { doc: any; previousDoc: any; req: any }) => {
            if (hasPublicFieldChanged({ doc, previousDoc, fields: VIDEO_NEWS_PUBLIC_FIELDS })) {
              await touchPublicCache({ req, scopes: ['videoNews'] })
              if (doc?.slug) {
                revalidatePath(`/video-news/${doc.slug}`)
              }
            }
          },
        ],
        afterDelete: [
          async ({ doc, req }: { doc: any; req: any }) => {
            const thumbnailId =
              doc?.thumbnail && typeof doc.thumbnail === 'object'
                ? doc.thumbnail.id
                : doc?.thumbnail

            if (thumbnailId) {
              try {
                await req.payload.delete({ collection: 'media', id: thumbnailId, req })
              } catch (_) {
                // Non-fatal: thumbnail may already be removed or shared.
              }
            }

            await touchPublicCache({ req, scopes: ['videoNews'] })
            if (doc?.slug) {
              revalidatePath(`/video-news/${doc.slug}`)
            }
          },
        ],
      },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'category', 'language', 'status', 'publishedAt'],
        description: 'Create YouTube-based video news stories for the frontend video section.',
      },
      versions: {
        drafts: true,
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'slug',
          type: 'text',
          unique: true,
          admin: {
            description: 'Auto-generated as random lowercase letters and numbers.',
            readOnly: true,
          },
        },
        {
          name: 'language',
          type: 'select',
          options: [
            { label: 'Hindi', value: 'hi' },
            { label: 'English', value: 'en' },
          ],
          defaultValue: 'hi',
          required: true,
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          admin: {
            description: 'Short description shown on cards and social previews.',
          },
        },
        {
          name: 'content',
          type: 'richText',
          label: 'Content / Description Editor',
          required: true,
        },
        {
          name: 'youtubeVideo',
          type: 'text',
          label: 'YouTube Video URL or ID',
          required: true,
          admin: {
            description: 'Paste a YouTube watch URL, Shorts URL, embed URL, live URL, youtu.be link, or the 11-character video ID.',
          },
        },
        {
          name: 'youtubeVideoId',
          type: 'text',
          label: 'YouTube Video ID',
          admin: {
            readOnly: true,
            description: 'Auto-filled from the YouTube URL/ID above.',
          },
        },
        {
          name: 'thumbnail',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Optional custom thumbnail. If empty, the frontend uses the YouTube thumbnail automatically.',
          },
        },
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
        {
          name: 'editor',
          type: 'relationship',
          relationTo: 'users',
          required: true,
          access: { update: ({ req }) => isAdminOrEditor(req.user) },
        },
        {
          name: 'tags',
          type: 'array',
          fields: [{ name: 'tag', type: 'text' }],
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
          defaultValue: 'draft',
          required: true,
          access: { update: ({ req }) => isAdminOrEditor(req.user) },
          admin: {
            description: 'Authors can save as Draft only. Editors and Admins can publish.',
          },
        },
        {
          name: 'publishedAt',
          type: 'date',
          defaultValue: () => new Date().toISOString(),
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
            description: 'Automatically set to the exact date and time when the video news item is created.',
            readOnly: true,
          },
        },
        {
          name: 'views',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
        {
          name: 'likes',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
        {
          name: 'dislikes',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
        {
          name: 'seo',
          type: 'group',
          label: 'SEO',
          fields: [
            { name: 'metaTitle', type: 'text' },
            { name: 'metaDescription', type: 'textarea' },
            { name: 'keywords', type: 'text' },
          ],
        },
      ],
    },
    {
      slug: 'comments',
      access: {
        // Anyone on the frontend can post a comment (goes to pending review)
        create: () => true,
        // Admin and Editor see all comments; public sees only approved ones
        read: ({ req }) => {
          if (isAdminOrEditor(req.user) || isViewer(req.user)) return true
          if (isAuthor(req.user)) return true          // authors can read all for context
          return { status: { equals: 'approved' } }
        },
        // Only Admin and Editor can update comments (approve / reject / edit)
        update: ({ req }) => isAdminOrEditor(req.user),
        // Only Admin and Editor can delete comments
        delete: ({ req }) => isAdminOrEditor(req.user),
      },
      admin: {
        useAsTitle: 'authorName',
        defaultColumns: ['authorName', 'article', 'status', 'createdAt'],
        // Authors cannot moderate comments; only Admin and Editor see the comment queue
        hidden: ({ user }: { user: any }) => !isAdminOrEditor(user),
      },
      hooks: {
        afterChange: [
          async ({ doc, previousDoc, req }: { doc: any; previousDoc: any; req: any }) => {
            if (hasPublicFieldChanged({ doc, previousDoc, fields: COMMENT_PUBLIC_FIELDS })) {
              await touchPublicCache({ req, scopes: ['comments'] })
            }
          },
        ],
        afterDelete: [
          async ({ req }: { req: any }) => {
            await touchPublicCache({ req, scopes: ['comments'] })
          },
        ],
      },
      fields: [
        { name: 'authorName', type: 'text', required: true },
        { name: 'authorEmail', type: 'email' },
        { name: 'content', type: 'textarea', required: true },
        {
          name: 'article',
          type: 'relationship',
          relationTo: 'news',
          required: false,
          admin: { description: 'Link to a news article (leave blank for video news comments).' },
        },
        {
          name: 'videoArticle',
          type: 'relationship',
          relationTo: 'video-news',
          required: false,
          admin: { description: 'Link to a video news item (leave blank for regular news comments).' },
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
          ],
          defaultValue: 'pending',
        },
      ],
    },
    {
      slug: 'advertisements',
      access: {
        // Public sees only active ads; staff sees all
        read: ({ req }) => {
          if (isAuthenticated(req.user)) return true
          return { isActive: { equals: true } }
        },
        // Only Admin and Editor can manage advertisements
        create: ({ req }) => isAdminOrEditor(req.user),
        update: ({ req }) => isAdminOrEditor(req.user),
        // Only Admin can delete advertisements
        delete: ({ req }) => isAdmin(req.user),
      },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'bannerType', 'size', 'isActive', 'startsAt', 'endsAt'],
        // Only Admin and Editor manage advertisements
        hidden: ({ user }: { user: any }) => !isAdminOrEditor(user),
      },
      hooks: {
        beforeValidate: [ensureAdvertisementTypeAndSize],
        afterChange: [
          async ({ req }: { req: any }) => {
            await touchPublicCache({ req, scopes: ['advertisements'] })
          },
        ],
        afterDelete: [
          async ({ req }: { req: any }) => {
            await touchPublicCache({ req, scopes: ['advertisements'] })
          },
        ],
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            description: 'Upload banner artwork here. Maximum file size: 2 MB. Use the recommended dimensions from Banner Size. Media uploads are stored in Cloudinary.',
          },
        },
        { name: 'link', type: 'text', label: 'Click URL' },
        {
          name: 'bannerType',
          label: 'Banner Type',
          type: 'select',
          options: [
            { label: 'Header Banner - top wide slot', value: 'header_banner' },
            { label: 'Footer Banner - bottom wide slot', value: 'footer_banner' },
            { label: 'Sidebar Banner - right column slot', value: 'sidebar_banner' },
            { label: 'Large Advertisement Banner - full width slot', value: 'large_ad_banner' },
            { label: 'Middle Content Banner - between content rows', value: 'middle_banner' },
          ],
          required: true,
          defaultValue: 'large_ad_banner',
          admin: {
            description: 'Choose where this banner should be displayed on the website.',
          },
        },
        {
          name: 'size',
          label: 'Banner Size',
          type: 'select',
          options: [
            { label: bannerSizeLabels.large, value: 'large' },
            { label: bannerSizeLabels.medium, value: 'medium' },
            { label: bannerSizeLabels.small, value: 'small' },
            { label: bannerSizeLabels.square, value: 'square' },
          ],
          required: true,
          defaultValue: 'large',
          admin: {
            description: 'Allowed sizes: Header/Large Ad = Large, Middle = Medium, Sidebar = Square or Small, Footer = Large or Medium.',
          },
        },
        {
          name: 'position',
          label: 'Legacy Position',
          type: 'select',
          options: [
            { label: 'Top / Header Banner', value: 'top_banner' },
            { label: 'Middle Content Banner', value: 'middle_banner' },
            { label: 'Bottom / Footer Banner', value: 'bottom_banner' },
            { label: 'Sidebar', value: 'sidebar' },
            { label: 'Bottom Sidebar', value: 'bottom_sidebar' },
          ],
          admin: {
            description: 'Optional compatibility field for existing frontend placements. New banners should use Banner Type + Banner Size.',
          },
        },
        { name: 'isActive', type: 'checkbox', defaultValue: true },
        { name: 'startsAt', type: 'date' },
        { name: 'endsAt', type: 'date' },
      ],
    },
  ],

  globals: [
    {
      slug: 'settings',
      label: 'Site Settings',
      access: {
        read: () => true,
        update: ({ req }) => isAdminOrChiefEditor(req.user),
      },
      fields: [
        { name: 'siteName', type: 'text', defaultValue: 'Bullet Reporter' },
        { name: 'tagline', type: 'text' },
        { name: 'logo', type: 'upload', relationTo: 'media' },
        { name: 'favicon', type: 'upload', relationTo: 'media' },
        {
          name: 'socialLinks',
          type: 'group',
          fields: [
            { name: 'facebook', type: 'text' },
            { name: 'twitter', type: 'text' },
            { name: 'instagram', type: 'text' },
            { name: 'youtube', type: 'text' },
          ],
        },
        { name: 'footerText', type: 'textarea' },
        { name: 'breakingNewsTicker', type: 'checkbox', defaultValue: true },
        {
          name: 'aboutPage',
          type: 'group',
          label: 'About Us Page',
          admin: {
            description: 'Editable by Admin and Chief Editor. Controls the public About Us page.',
          },
          fields: [
            { name: 'eyebrow', type: 'text', defaultValue: 'About Bullet Reporter' },
            { name: 'headline', type: 'text', defaultValue: 'साफ, तेज और जिम्मेदार खबरें' },
            {
              name: 'summary',
              type: 'textarea',
              defaultValue: 'Bullet Reporter is a Hindi-first digital news platform focused on timely reporting, public-interest updates, and useful local coverage.',
            },
            { name: 'photo', type: 'upload', relationTo: 'media', label: 'Main Photo' },
            { name: 'description', type: 'richText', label: 'Description / Content' },
            { name: 'mission', type: 'textarea', label: 'Mission / Purpose' },
            { name: 'technologyManagement', type: 'textarea', label: 'Technology Management' },
            { name: 'ownership', type: 'textarea', label: 'Editorial Ownership' },
            {
              name: 'chiefEditor',
              type: 'group',
              label: 'Chief Editor Details',
              fields: [
                { name: 'name', type: 'text' },
                { name: 'designation', type: 'text', defaultValue: 'Chief Editor' },
                { name: 'photo', type: 'upload', relationTo: 'media' },
                { name: 'bio', type: 'textarea' },
                { name: 'email', type: 'email' },
              ],
            },
            {
              name: 'editor',
              type: 'group',
              label: 'Editor Details',
              fields: [
                { name: 'name', type: 'text' },
                { name: 'designation', type: 'text', defaultValue: 'Editor' },
                { name: 'photo', type: 'upload', relationTo: 'media' },
                { name: 'bio', type: 'textarea' },
                { name: 'email', type: 'email' },
              ],
            },
          ],
        },
      ],
    },
  ],

  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },

  plugins: [
    payloadCloudinaryPlugin({
      enabled: hasCloudinaryCredentials,
      collections: {
        media: true,
      },
      cloudName: cloudinaryCloudName || '',
      credentials: {
        apiKey: cloudinaryApiKey || '',
        apiSecret: cloudinaryApiSecret || '',
      },
      folder: process.env.CLOUDINARY_FOLDER || 'bullet_reporter',
      clientUploads: false,
      useFilename: true,
    }),
  ],
})
