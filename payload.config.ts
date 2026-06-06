import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { payloadCloudinaryPlugin } from '@jhb.software/payload-cloudinary-plugin'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
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
const smtpHost     = process.env.SMTP_HOST
const smtpPort     = parseInt(process.env.SMTP_PORT || '587', 10)
const smtpUser     = process.env.SMTP_USER
const smtpPass     = process.env.SMTP_PASS
const emailFrom    = process.env.EMAIL_FROM || smtpUser || 'noreply@bulletreporter.in'
const siteUrl      = process.env.NEXT_PUBLIC_SITE_URL || 'https://bullet-reporter.vercel.app'

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

const ensureCloudinaryUploadConfigured = ({ data, req }: { data?: Record<string, any>, req?: any }) => {
  if (requireCloudinaryStorage && req?.file && !hasCloudinaryCredentials) {
    throw new Error(
      `Cloudinary credentials are required for media uploads. Missing: ${missingCloudinaryKeys.join(', ')}. Save them in ${path.resolve(dirname, '.env.local')} and restart the dev server.`,
    )
  }

  return data
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

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'change-this-payload-secret-for-production',
  sharp,

  email: nodemailerAdapter({
    defaultFromAddress: emailFrom,
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
          generateEmailHTML: ({ token, user }: { token?: string; user?: any }) => {
            const resetUrl = `${siteUrl}/reset-password/${token}`
            return `
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>पासवर्ड रीसेट करें – Bullet Reporter</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#dc2626;padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-.5px;">
              &#128308; Bullet Reporter
            </h1>
            <p style="margin:6px 0 0;color:#fca5a5;font-size:13px;">सब के साथ निष्पक्ष बात</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h2 style="margin:0 0 12px;color:#111827;font-size:20px;">पासवर्ड रीसेट अनुरोध</h2>
            <p style="margin:0 0 8px;color:#374151;font-size:15px;line-height:1.6;">
              नमस्ते <strong>${user?.email ?? ''}</strong>,
            </p>
            <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.6;">
              आपने अपने Bullet Reporter खाते के पासवर्ड रीसेट का अनुरोध किया है।
              नीचे दिए गए बटन पर क्लिक करें और अपना नया पासवर्ड सेट करें।
            </p>

            <!-- CTA -->
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
              <tr>
                <td style="background:#dc2626;border-radius:8px;">
                  <a href="${resetUrl}"
                     style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;">
                    पासवर्ड रीसेट करें
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 6px;color:#6b7280;font-size:13px;">या इस लिंक को ब्राउज़र में खोलें:</p>
            <p style="margin:0 0 28px;word-break:break-all;">
              <a href="${resetUrl}" style="color:#dc2626;font-size:13px;">${resetUrl}</a>
            </p>

            <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px;" />
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
              यह लिंक <strong>1 घंटे</strong> में समाप्त हो जाएगा।<br />
              यदि आपने यह अनुरोध नहीं किया, तो इस ईमेल को अनदेखा करें।
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              &copy; ${new Date().getFullYear()} Bullet Reporter &middot; सर्वाधिकार सुरक्षित
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
          },
          generateEmailSubject: () => 'पासवर्ड रीसेट करें – Bullet Reporter',
        },
      },
      access: {
        read: () => true,
        create: () => false,
        update: ({ req }) => Boolean(req.user),
        delete: ({ req }) => req.user?.role === 'admin',
      },
      admin: {
        useAsTitle: 'name',
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'role',
          type: 'select',
          options: [
            { label: 'Admin', value: 'admin' },
            { label: 'Editor', value: 'editor' },
            { label: 'Author', value: 'author' },
          ],
          defaultValue: 'author',
          required: true,
        },
        { name: 'bio', type: 'textarea' },
        { name: 'avatar', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      slug: 'media',
      access: {
        read: () => true,
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
      },
      upload: {
        mimeTypes: ['image/*', 'video/*'],
        imageSizes: [
          { name: 'hero', width: 1280, height: 720, position: 'centre' },
        ],
      },
      admin: {
        useAsTitle: 'alt',
      },
      fields: [
        { name: 'alt', type: 'text', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    {
      slug: 'categories',
      access: {
        read: () => true,
      },
      admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'slug', 'order'],
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
        read: ({ req }) => req.user ? true : { status: { equals: 'published' } },
      },
      hooks: {
        beforeValidate: [ensureNewsSlug, ensureNewsPublishedAt],
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
          name: 'titleEnglish',
          type: 'text',
          label: 'Title (English)',
          admin: {
            description: 'Optional English title shown when the user switches the website to English.',
          },
        },
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
        },
        {
          name: 'isFeatured',
          type: 'checkbox',
          label: 'Featured Article',
          defaultValue: false,
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
      slug: 'comments',
      access: {
        create: () => true,
        read: ({ req }) => req.user ? true : { status: { equals: 'approved' } },
      },
      admin: {
        useAsTitle: 'authorName',
        defaultColumns: ['authorName', 'article', 'status', 'createdAt'],
      },
      fields: [
        { name: 'authorName', type: 'text', required: true },
        { name: 'authorEmail', type: 'email' },
        { name: 'content', type: 'textarea', required: true },
        {
          name: 'article',
          type: 'relationship',
          relationTo: 'news',
          required: true,
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
        read: ({ req }) => req.user ? true : { isActive: { equals: true } },
      },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'bannerType', 'size', 'isActive', 'startsAt', 'endsAt'],
      },
      hooks: {
        beforeValidate: [ensureAdvertisementTypeAndSize],
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
