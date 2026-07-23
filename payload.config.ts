import crypto from 'crypto'
import { buildConfig, APIError } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { payloadCloudinaryPlugin } from '@jhb.software/payload-cloudinary-plugin'
import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { revalidatePath } from 'next/cache'
import { v2 as cloudinary } from 'cloudinary'
import { build as buildPrettyLogger } from 'pino-pretty'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { logEmailDiagnosticsForSend } from './src/lib/emailDiagnostics'
import { buildAccountInviteEmail, buildPasswordResetEmail } from './src/lib/authEmailTemplates'
import { queueNewsletterItem } from './src/lib/newsletter'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const newsContentEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    BlocksFeature({
      blocks: [
        {
          slug: 'videoNews',
          labels: {
            singular: 'Video News',
            plural: 'Video News',
          },
          fields: [
            {
              name: 'video',
              type: 'relationship',
              relationTo: 'video-news',
              required: true,
              admin: {
                appearance: 'drawer',
                description: 'Select a video that has already been added in Video News.',
              },
            },
          ],
        },
      ],
    }),
  ],
})

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
const payloadSecret = process.env.PAYLOAD_SECRET
// ── Email (Nodemailer) ──────────────────────────────────────────────────────
const smtpHost = process.env.SMTP_HOST
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10)
const smtpUser = process.env.SMTP_USER
const smtpPass = process.env.SMTP_PASS
const configuredEmailFrom = process.env.EMAIL_FROM

const getEmailAddress = (value?: string) => {
  const match = value?.match(/<([^>]+)>/)
  return (match?.[1] || value || '').trim()
}

const getEmailDomain = (value?: string) => getEmailAddress(value).split('@').pop()?.toLowerCase() || ''

const normalizeUrl = (value?: string) => {
  const trimmed = value?.trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

const normalizeCorsOrigin = (value?: string) => {
  const trimmed = value?.trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(trimmed)) return `http://${trimmed}`
  return `https://${trimmed}`
}

const getOriginAliases = (origin: string) => {
  try {
    const url = new URL(origin)
    if (url.hostname.startsWith('www.')) {
      url.hostname = url.hostname.slice(4)
      return [url.toString().replace(/\/+$/, '')]
    }

    if (!url.hostname.includes('localhost') && url.hostname.split('.').length === 2) {
      url.hostname = `www.${url.hostname}`
      return [url.toString().replace(/\/+$/, '')]
    }
  } catch (_) {
    return []
  }

  return []
}

const configuredCorsOrigins = [
  ...(process.env.CORS_ALLOWED_ORIGINS || '').split(','),
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.RENDER_EXTERNAL_URL,
]
  .map(normalizeCorsOrigin)
  .filter(Boolean)

const allowedCorsOrigins = Array.from(
  new Set([...configuredCorsOrigins, ...configuredCorsOrigins.flatMap(getOriginAliases)]),
)

const payloadLoggerDestination = buildPrettyLogger({
  colorize: Boolean(process.stdout.isTTY),
  colorizeObjects: false,
  errorLikeObjectKeys: ['err', 'error'],
  errorProps: 'type,name,message,stack,code,cause',
  ignore: 'hostname',
  levelFirst: true,
  messageFormat: '[{name}] {msg}',
  singleLine: false,
  sync: true,
  translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
})

const getAppUrl = (req?: any) => {
  const configuredUrl = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL || '')
  if (configuredUrl) return configuredUrl

  const host = req?.headers?.get?.('x-forwarded-host') || req?.headers?.get?.('host')
  if (!host) return ''

  const proto = req?.headers?.get?.('x-forwarded-proto') || 'https'
  return `${proto}://${host}`.replace(/\/+$/, '')
}

const smtpUserDomain = getEmailDomain(smtpUser)
const configuredEmailFromDomain = getEmailDomain(configuredEmailFrom)
const emailFromAddress =
  smtpUserDomain && configuredEmailFromDomain && smtpUserDomain !== configuredEmailFromDomain
    ? smtpUser || configuredEmailFrom
    : configuredEmailFrom || smtpUser
const resolvedEmailFromAddress = getEmailAddress(emailFromAddress)
const PASSWORD_SETUP_EXPIRATION_MS = 24 * 60 * 60 * 1000
const USER_CREATE_ALLOWED_FIELDS = ['email', 'name', 'role', 'bio', 'avatar']
const USER_CREATE_PASSWORD_FIELDS = ['password', 'confirmPassword', 'confirm-password', 'newPassword']

const createPasswordSetupToken = () => crypto.randomBytes(32).toString('hex')

const getPasswordSetupExpiration = () =>
  new Date(Date.now() + PASSWORD_SETUP_EXPIRATION_MS).toISOString()

const stripSubmittedCreatePasswordFields = (data: Record<string, any>) => {
  const sanitizedData = { ...data }

  for (const field of USER_CREATE_PASSWORD_FIELDS) {
    delete sanitizedData[field]
  }

  return sanitizedData
}

const sanitizeUserCreateData = (data: Record<string, any>) => {
  const sanitizedData: Record<string, any> = {}

  for (const field of USER_CREATE_ALLOWED_FIELDS) {
    if (data[field] !== undefined) {
      sanitizedData[field] = data[field]
    }
  }

  return stripSubmittedCreatePasswordFields(sanitizedData)
}

const hasSubmittedPasswordField = (data?: Record<string, any>) =>
  Boolean(data && USER_CREATE_PASSWORD_FIELDS.some((field) => field in data))

const preventDirectUserPasswordUpdate = ({
  data,
  operation,
}: {
  data?: Record<string, any>
  operation: string
}) => {
  if (operation === 'update' && hasSubmittedPasswordField(data)) {
    throw new APIError('Passwords can only be set from the password setup or reset link.', 403, null, true)
  }

  return data
}

const sendPasswordSetupEmail = async ({
  email,
  name,
  req,
  token,
}: {
  email: string
  name?: string
  req: any
  token: string
}) => {
  const loginUrl = `${getAppUrl(req)}/admin`
  const resetUrl = `${getAppUrl(req)}/reset-password/${token}`
  const message = buildAccountInviteEmail({
    name,
    email,
    loginUrl,
    resetUrl,
  })

  logEmailDiagnosticsForSend('account-password-setup')
  await req.payload.sendEmail({
    from: `"Bullet Reporter" <${resolvedEmailFromAddress}>`,
    html: message.html,
    subject: message.subject,
    text: message.text,
    to: email,
  })
}

const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY
const cloudinaryApiSecret = process.env.CLOUDINARY_API_SECRET
const cloudinaryFolder = process.env.CLOUDINARY_FOLDER
const cloudinaryVideoFolder = process.env.CLOUDINARY_VIDEO_FOLDER || `${cloudinaryFolder || 'bullet_reporter'}/videos`
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

if (!payloadSecret) {
  throw new Error('PAYLOAD_SECRET is required for Payload CMS. Add a long random secret to .env.local.')
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

const getVideoUploadPublicId = (filename?: string) => {
  const cleanFilename = String(filename || '').replace(/\.[^/.]+$/, '')
  if (!cleanFilename) return ''
  return `${cloudinaryVideoFolder.replace(/\/$/, '')}/${cleanFilename}`
}

const getVideoUploadUrl = (publicId: string) => {
  if (!publicId || !cloudinaryCloudName) return ''
  return `https://res.cloudinary.com/${cloudinaryCloudName}/video/upload/${publicId.replace(/\s+/g, '%20')}`
}

const preserveClientVideoUploadMetadata = ({ data, req }: { data?: Record<string, any>; req?: any }) => {
  if (!data) return data || {}
  const context = req?.file?.clientUploadContext
  if (context?.publicId) {
    data.cloudinaryPublicId = context.publicId
    data.url = context.secureUrl || getVideoUploadUrl(context.publicId)
  }
  return data
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

const getRelationshipValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) =>
      item && typeof item === 'object' && 'id' in item
        ? (item as { id: string | number }).id
        : item && typeof item === 'object' && 'value' in item
          ? (item as { value: string | number }).value
          : item,
    )
  }

  if (value && typeof value === 'object' && 'id' in value) {
    return (value as { id: string | number }).id
  }

  if (value && typeof value === 'object' && 'value' in value) {
    return (value as { value: string | number }).value
  }

  return value
}

const ensureLoggedInUserByline = ({
  data,
  operation,
  originalDoc,
  req,
}: {
  data?: Record<string, any>
  operation?: string
  originalDoc?: Record<string, any>
  req?: any
}) => {
  if (!data) return data || {}

  const userId = req?.user?.id

  if (operation === 'create' && userId) {
    data.author = userId
    data.editor = userId
  } else if (operation === 'update') {
    data.author = getRelationshipValue(originalDoc?.author) || userId
    data.editor = getRelationshipValue(originalDoc?.editor) || userId
  }

  return data
}

const ensureRequiredNewsRelationships = ({
  data,
  operation,
  originalDoc,
}: {
  data?: Record<string, any>
  operation?: string
  originalDoc?: Record<string, any>
}) => {
  if (!data) return data || {}

  if (operation === 'update' && !('category' in data) && originalDoc?.category) {
    data.category = getRelationshipValue(originalDoc.category)
  }

  return data
}

const ensureNewsFields = ({
  data,
  operation,
  originalDoc,
  req,
}: {
  data?: Record<string, any>
  operation?: string
  originalDoc?: Record<string, any>
  req?: any
}) => {
  const next = ensureNewsPublishedAt({ data, operation })
  ensureNewsSlug({ data: next, operation })
  ensureLoggedInUserByline({ data: next, operation, originalDoc, req })
  ensureRequiredNewsRelationships({ data: next, operation, originalDoc })

  return next
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

const ensureVideoNewsFields = ({
  data,
  operation,
  originalDoc,
  req,
}: {
  data?: Record<string, any>
  operation?: string
  originalDoc?: Record<string, any>
  req?: any
}) => {
  const next = ensureNewsFields({ data, operation, originalDoc, req })

  const youtubeVideo = 'youtubeVideo' in next
    ? String(next.youtubeVideo || '').trim()
    : String(originalDoc?.youtubeVideo || '').trim()
  const hasIncomingFile = Boolean(req?.file)
  const storedFilename = next.filename || originalDoc?.filename
  const storedPublicId = next.cloudinaryPublicId || originalDoc?.cloudinaryPublicId
  const hasStoredUpload = Boolean(storedPublicId || storedFilename)
  const hasUploadedVideo = hasIncomingFile || hasStoredUpload

  if (youtubeVideo && hasUploadedVideo) {
    throw new APIError('Choose only one video source: a video link or an uploaded video, not both.', 400, null, true)
  }

  if (!youtubeVideo && !hasUploadedVideo) {
    throw new APIError('Provide either a valid YouTube video link or upload a video file.', 400, null, true)
  }

  if (youtubeVideo) {
    next.youtubeVideo = youtubeVideo
    next.youtubeVideoId = extractYouTubeVideoId(youtubeVideo)
    if (!next.youtubeVideoId) {
      throw new APIError('Please enter a valid YouTube video URL or 11-character YouTube video ID.', 400, null, true)
    }
  } else {
    next.youtubeVideo = null
    next.youtubeVideoId = null
    if (!next.cloudinaryPublicId && !hasIncomingFile && storedFilename) {
      next.cloudinaryPublicId = getVideoUploadPublicId(storedFilename)
      next.url = getVideoUploadUrl(next.cloudinaryPublicId)
    }
  }

  return next
}

// ── Role-Based Access Control helpers ────────────────────────────────────────
//
// Effective permissions are database-driven and cumulative by hierarchy order.
// Lower order numbers have higher authority; Super Admin is permanently order 1.
//
// Public (unauthenticated) visitors can read published news and approved comments
// through the frontend API, but cannot touch the admin panel at all.

type RBACAction = 'read' | 'create' | 'update' | 'delete'
type RBACResource = 'users' | 'roles' | 'media' | 'categories' | 'news' | 'video-news' | 'comments' | 'advertisements' | 'director-details' | 'settings'
const permission = (resource: RBACResource, action: RBACAction) => `${resource}.${action}`

const getDatabaseRole = async (req: any) => {
  if (!req?.user?.id) return null
  const user = await req.payload.findByID({ collection: 'users', id: req.user.id, depth: 2, overrideAccess: true, req })
  return user?.role && typeof user.role === 'object' ? user.role : null
}

const hasPermission = async (req: any, resource: RBACResource, action: RBACAction) => {
  const role = await getDatabaseRole(req)
  if (!role) return false
  if (role.slug === 'super-admin') return true
  if (resource === 'roles' && role.slug !== 'admin') return false

  const lowerRoles = await req.payload.find({
    collection: 'roles',
    where: { hierarchyOrder: { greater_than_equal: role.hierarchyOrder } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
    req,
  })
  return lowerRoles.docs.some((candidate: any) =>
    candidate.permissions?.includes(permission(resource, action)),
  )
}

const hasAnyPermission = (user: any, resource: RBACResource) =>
  Boolean(user?.role && typeof user.role === 'object' &&
    (['read', 'create', 'update', 'delete'] as RBACAction[]).some((action) =>
      user.role.permissions?.includes(permission(resource, action)),
    ))

const getRequestRole = async (req: any) => {
  const assignedRole = req?.user?.role
  if (!assignedRole) return null
  if (typeof assignedRole === 'object') return assignedRole
  return req.payload.findByID({
    collection: 'roles',
    id: assignedRole,
    depth: 0,
    overrideAccess: true,
    req,
  })
}

const enforceRoleDepth = async ({ args, operation, overrideAccess, req }: any) => {
  const depthOperations = ['read', 'find', 'findByID', 'findVersions', 'findVersionByID']
  if (!depthOperations.includes(operation) || overrideAccess) return args

  const role = await getRequestRole(req)
  const maximumDepth = role && ['super-admin', 'admin'].includes(role.slug) ? 10 : 1
  const requestedDepth = Number(args?.depth)

  return {
    ...args,
    depth: Number.isFinite(requestedDepth)
      ? Math.min(Math.max(0, Math.trunc(requestedDepth)), maximumDepth)
      : maximumDepth,
  }
}

const RBAC_RESOURCES: RBACResource[] = ['users', 'roles', 'media', 'categories', 'news', 'video-news', 'comments', 'advertisements', 'director-details', 'settings']
const PERMISSION_OPTIONS = RBAC_RESOURCES.flatMap((resource) =>
  (['read', 'create', 'update', 'delete'] as RBACAction[]).map((action) => ({
    label: `${resource} - ${action}`,
    value: permission(resource, action),
  })),
)

const preserveRoleBaseline = async ({ data, originalDoc, req }: any) => {
  const baseId = data?.baseRole || originalDoc?.baseRole
  let baseline: string[] = originalDoc?.baselinePermissions || []
  if (baseId) {
    const base = await req.payload.findByID({ collection: 'roles', id: typeof baseId === 'object' ? baseId.id : baseId, overrideAccess: true, req })
    baseline = base.baselinePermissions || base.permissions || []
  }
  data.baselinePermissions = baseline
  data.permissions = [...new Set([...baseline, ...(data.permissions || originalDoc?.permissions || [])])]
  const roleSlug = originalDoc?.slug || data?.slug
  if (!['super-admin', 'admin'].includes(roleSlug)) {
    data.baselinePermissions = data.baselinePermissions.filter((value: string) => !value.startsWith('roles.'))
    data.permissions = data.permissions.filter((value: string) => !value.startsWith('roles.'))
  }
  if (originalDoc?.isSystem) {
    data.slug = originalDoc.slug
    data.isSystem = true
  }
  return data
}

const enforceHierarchyOrder = async ({ data, originalDoc, req }: any) => {
  const slug = originalDoc?.slug || data?.slug
  const hierarchyOrder = data?.hierarchyOrder ?? originalDoc?.hierarchyOrder

  if (!Number.isInteger(hierarchyOrder) || hierarchyOrder < 1) {
    throw new APIError('Hierarchy order must be a positive whole number.', 400)
  }
  if (slug === 'super-admin' && hierarchyOrder !== 1) {
    throw new APIError('Super Admin must always remain at hierarchy order 1.', 400)
  }
  if (slug !== 'super-admin' && hierarchyOrder === 1) {
    throw new APIError('Hierarchy order 1 is permanently reserved for Super Admin.', 400)
  }

  const duplicate = await req.payload.find({
    collection: 'roles',
    where: {
      and: [
        { hierarchyOrder: { equals: hierarchyOrder } },
        ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
      ],
    },
    limit: 1,
    overrideAccess: true,
    req,
  })
  if (duplicate.totalDocs > 0) {
    throw new APIError(`Hierarchy order ${hierarchyOrder} is already assigned to another role.`, 400)
  }
  return data
}

const enforceSuperAdminLimit = async ({ data, originalDoc, operation, req }: any) => {
  const roleId = data?.role || originalDoc?.role
  if (!roleId) return data
  const role = await req.payload.findByID({ collection: 'roles', id: typeof roleId === 'object' ? roleId.id : roleId, overrideAccess: true, req })
  if (role?.slug !== 'super-admin') return data
  const existing = await req.payload.count({
    collection: 'users',
    where: { role: { equals: role.id }, ...(operation === 'update' && originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {}) },
    overrideAccess: true,
    req,
  })
  if (existing.totalDocs >= 3) throw new APIError('A maximum of 3 Super Admin users is allowed.', 400)
  return data
}

const canManageDirectorMessage = async (req: any) => {
  const role = await getDatabaseRole(req)
  return Boolean(role && ['super-admin', 'admin'].includes(role.slug))
}

const enforceSingleDirectorMessage = async ({ operation, req }: any) => {
  if (operation !== 'create') return

  const existing = await req.payload.count({
    collection: 'director-details',
    overrideAccess: true,
    req,
  })

  if (existing.totalDocs > 0) {
    throw new APIError('Only one Director Details record can be created. Delete the existing record before creating another.', 400)
  }
}

const DIRECTOR_IMAGE_WIDTH = 600
const DIRECTOR_IMAGE_HEIGHT = 600

const validateDirectorImage = async ({
  data,
  originalDoc,
  req,
}: {
  data?: Record<string, any>
  originalDoc?: Record<string, any>
  req: any
}) => {
  if (!data) return data || {}

  const imageID = getRelationshipID(data.image ?? originalDoc?.image)
  if (!imageID) return data

  const image = await req.payload.findByID({
    collection: 'media',
    id: imageID,
    depth: 0,
    overrideAccess: true,
    req,
  })

  const width = Number(image?.width)
  const height = Number(image?.height)

  if (width !== DIRECTOR_IMAGE_WIDTH || height !== DIRECTOR_IMAGE_HEIGHT) {
    throw new APIError(
      `Director image must be exactly ${DIRECTOR_IMAGE_WIDTH} x ${DIRECTOR_IMAGE_HEIGHT} px to remain sharp. Selected image is ${width || 'unknown'} x ${height || 'unknown'} px.`,
      400,
      null,
      true,
    )
  }

  return data
}

// ─────────────────────────────────────────────────────────────────────────────

const ensureCloudinaryUploadConfigured = ({ data, req }: { data?: Record<string, any>, req?: any }) => {
  if (requireCloudinaryStorage && req?.file && !hasCloudinaryCredentials) {
    throw new APIError(
      `Cloudinary credentials are required for media uploads. Missing: ${missingCloudinaryKeys.join(', ')}.`,
      400,
      null,
      true,
    )
  }

  return data
}

const preventDeletingCategoryInUse = async ({ id, req }: { id: string | number; req: any }) => {
  const categoryId = String(id)
  const collectionsToCheck = [
    { label: 'news article', pluralLabel: 'news articles', slug: 'news' },
    { label: 'video news story', pluralLabel: 'video news stories', slug: 'video-news' },
  ]

  for (const collection of collectionsToCheck) {
    const result = await req.payload.find({
      collection: collection.slug,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      select: {
        id: true,
      },
      where: {
        category: {
          contains: categoryId,
        },
      },
    })

    const usageCount = Array.isArray(result?.docs) ? result.docs.length : 0

    if (usageCount > 0) {
      throw new APIError(
        `This category cannot be deleted because it is used by one or more ${collection.pluralLabel}. Remove this category from all ${collection.pluralLabel} first.`,
        400,
        null,
        true,
      )
    }
  }
}

const preventDeletingMediaInUse = async ({ id, req }: { id: string | number; req: any }) => {
  const mediaId = String(id)
  const references = [
    { collection: 'news', field: 'featuredImage', message: 'one or more news articles' },
    { collection: 'director-details', field: 'image', message: 'Director Details' },
  ]

  for (const reference of references) {
    const result = await req.payload.find({
      collection: reference.collection,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      select: { id: true },
      where: {
        [reference.field]: {
          equals: mediaId,
        },
      },
    })

    if (Array.isArray(result?.docs) && result.docs.length > 0) {
      throw new APIError(
        `This media file cannot be deleted because it is currently used by ${reference.message}. Remove or replace the image there first, then delete this media file.`,
        400,
        null,
        true,
      )
    }
  }
}

const configuredMaxUploadMb = Number(process.env.PAYLOAD_MAX_UPLOAD_MB)

if (!Number.isFinite(configuredMaxUploadMb) || configuredMaxUploadMb <= 0) {
  throw new Error('PAYLOAD_MAX_UPLOAD_MB must be set to a positive number.')
}

const MAX_UPLOAD_MB = configuredMaxUploadMb
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
const configuredMaxVideoUploadMb = Number(process.env.PAYLOAD_MAX_VIDEO_UPLOAD_MB || 100)
if (!Number.isFinite(configuredMaxVideoUploadMb) || configuredMaxVideoUploadMb <= 0) {
  throw new Error('PAYLOAD_MAX_VIDEO_UPLOAD_MB must be a positive number.')
}
const MAX_VIDEO_UPLOAD_MB = configuredMaxVideoUploadMb
const MAX_VIDEO_UPLOAD_BYTES = MAX_VIDEO_UPLOAD_MB * 1024 * 1024

const CATEGORY_HINDI_TRANSLATIONS: Record<string, string> = {
  agriculture: 'कृषि',
  automobile: 'ऑटोमोबाइल',
  auto: 'ऑटोमोबाइल',
  bollywood: 'बॉलीवुड',
  breaking: 'ब्रेकिंग',
  business: 'व्यापार',
  career: 'करियर',
  careers: 'करियर',
  chattisgarh: 'छत्तीसगढ़',
  chhattisgarh: 'छत्तीसगढ़',
  cg: 'छत्तीसगढ़',
  city: 'शहर',
  crime: 'क्राइम',
  cricket: 'क्रिकेट',
  education: 'शिक्षा',
  election: 'चुनाव',
  elections: 'चुनाव',
  entertainment: 'मनोरंजन',
  fashion: 'फैशन',
  health: 'स्वास्थ्य',
  india: 'भारत',
  international: 'अंतरराष्ट्रीय',
  job: 'नौकरी',
  jobs: 'नौकरी',
  latest: 'ताजा खबरें',
  lifestyle: 'लाइफस्टाइल',
  local: 'स्थानीय',
  madhya_pradesh: 'मध्य प्रदेश',
  mp: 'मध्य प्रदेश',
  national: 'राष्ट्रीय',
  other: 'अन्य',
  others: 'अन्य',
  politics: 'राजनीति',
  religion: 'धर्म',
  rewa: 'रीवा',
  science: 'विज्ञान',
  sports: 'खेल',
  state: 'राज्य',
  technology: 'तकनीक',
  tech: 'तकनीक',
  top_news: 'मुख्य समाचार',
  travel: 'यात्रा',
  trending: 'ट्रेंडिंग',
  uttar_pradesh: 'उत्तर प्रदेश',
  up: 'उत्तर प्रदेश',
  video: 'वीडियो',
  video_news: 'वीडियो न्यूज़',
  viral: 'वायरल',
  weather: 'मौसम',
  world: 'विश्व',
}

const normalizeCategoryKeyForTranslation = (value?: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

const makeCategorySlug = (value?: string) =>
  normalizeCategoryKeyForTranslation(value)
    .replace(/_/g, '-')
    .replace(/^-+|-+$/g, '')

const getHindiCategoryName = (value?: string) => {
  const key = normalizeCategoryKeyForTranslation(value)
  if (!key) return ''

  const compactKey = key
    .replace(/_?(news|samachar|category|updates)$/g, '')
    .replace(/^(news|samachar|category|updates)_?/g, '')

  return CATEGORY_HINDI_TRANSLATIONS[key] || CATEGORY_HINDI_TRANSLATIONS[compactKey] || ''
}

const ensureCategoryFields = ({ data }: { data?: Record<string, any> }) => {
  if (!data) return data || {}

  if (data.name && !data.slug) {
    data.slug = makeCategorySlug(data.name)
  }

  if (data.name && !data.nameHindi) {
    data.nameHindi = getHindiCategoryName(data.name) || data.name
  }

  return data
}

const advertisementPositionConfig: Record<string, {
  bannerType: string
  bannerTypeLabel: string
  size: string
  sizeLabel: string
  width: number
  height: number
  maxActive: number
}> = {
  top_banner: {
    bannerType: 'large_ad_banner',
    bannerTypeLabel: 'Large Advertisement Banner',
    size: 'large',
    sizeLabel: 'Large Banner Size (1300 x 160 px)',
    width: 1300,
    height: 160,
    maxActive: 1,
  },
  bottom_banner: {
    bannerType: 'large_ad_banner',
    bannerTypeLabel: 'Large Advertisement Banner',
    size: 'large',
    sizeLabel: 'Large Banner Size (1300 x 160 px)',
    width: 1300,
    height: 160,
    maxActive: 1,
  },
  sidebar: {
    bannerType: 'square_banner',
    bannerTypeLabel: 'Square Banner',
    size: 'square',
    sizeLabel: 'Square Banner Size (350 x 220 px)',
    width: 350,
    height: 220,
    maxActive: 3,
  },
}

const getAdvertisementPositionConfig = (position?: string) => (
  position ? advertisementPositionConfig[position] : null
)

const ensureAdvertisementFields = ({ data }: { data?: Record<string, any> }) => {
  if (!data) return data || {}

  const config = getAdvertisementPositionConfig(data.position)
  if (config) {
    data.bannerType = config.bannerType
    data.size = config.size
  }

  if (data.link) {
    const link = String(data.link).trim()
    data.link = /^(https?:)?\/\//i.test(link) ? link : `https://${link.replace(/^\/+/, '')}`
  }

  if (data.startsAt && data.endsAt) {
    const startsAt = new Date(data.startsAt).getTime()
    const endsAt = new Date(data.endsAt).getTime()

    if (Number.isFinite(startsAt) && Number.isFinite(endsAt) && endsAt <= startsAt) {
      throw new APIError('End At must be later than Start At.', 400, null, true)
    }
  }

  return data
}

const getRelationshipID = (value: any) => {
  if (!value) return null
  if (typeof value === 'object' && 'id' in value) return value.id
  return value
}

const validateAdvertisementImage = async ({
  data,
  originalDoc,
  req,
}: {
  data?: Record<string, any>
  originalDoc?: Record<string, any>
  req: any
}) => {
  if (!data) return data || {}

  const position = data.position || originalDoc?.position
  const config = getAdvertisementPositionConfig(position)
  const imageID = getRelationshipID(data.image ?? originalDoc?.image)

  if (!config || !imageID) return data

  const image = await req.payload.findByID({
    collection: 'media',
    id: imageID,
    depth: 0,
    overrideAccess: true,
  })

  if (!image?.cloudinaryPublicId) {
    throw new APIError('Advertisement image must be a Cloudinary-backed media item. Uploads to Media can be any image size, but ads can only select Cloudinary images with the required slot dimensions.', 400, null, true)
  }

  const width = Number(image.width)
  const height = Number(image.height)

  if (width !== config.width || height !== config.height) {
    throw new APIError(
      `${config.bannerTypeLabel} requires an image exactly ${config.width} x ${config.height} px. Selected image is ${width || 'unknown'} x ${height || 'unknown'} px.`,
      400,
      null,
      true,
    )
  }

  return data
}

const enforceAdvertisementLimits = async ({
  data,
  operation,
  originalDoc,
  req,
}: {
  data?: Record<string, any>
  operation?: string
  originalDoc?: Record<string, any>
  req: any
}) => {
  if (!data) return data || {}

  const position = data.position || originalDoc?.position
  const config = getAdvertisementPositionConfig(position)
  if (!position || !config || data.isActive === false) return data

  const result = await req.payload.find({
    collection: 'advertisements',
    depth: 0,
    limit: 10,
    overrideAccess: true,
    where: {
      and: [
        { position: { equals: position } },
        { isActive: { equals: true } },
      ],
    },
  })

  const currentId = originalDoc?.id ? String(originalDoc.id) : null
  const existing = (result.docs || []).filter((doc: any) => String(doc.id) !== currentId)

  if (position === 'sidebar') {
    if (existing.length >= config.maxActive) {
      throw new APIError('Sidebar supports a maximum of 3 active advertisements. Remove or deactivate one before adding another.', 400, null, true)
    }

    return data
  }

  if (operation === 'create' || operation === 'update') {
    for (const doc of existing) {
      await req.payload.delete({
        collection: 'advertisements',
        id: doc.id,
        overrideAccess: true,
      })
    }
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
  revalidatePath('/sitemap.xml')

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
  'url',
  'filename',
  'mimeType',
  'filesize',
  'cloudinaryPublicId',
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

const ADVERTISEMENT_PUBLIC_FIELDS = [
  'title',
  'image',
  'link',
  'position',
  'bannerType',
  'size',
  'isActive',
  'startsAt',
  'endsAt',
]

export default buildConfig({
  secret: payloadSecret,
  sharp,
  cors: allowedCorsOrigins,
  csrf: allowedCorsOrigins,
  logger: {
    destination: payloadLoggerDestination,
    options: {
      base: {
        environment: process.env.NODE_ENV || 'development',
        service: 'bullet-reporter',
      },
      level: process.env.LOG_LEVEL || 'info',
      name: 'payload',
      redact: {
        censor: '[REDACTED]',
        paths: [
          'password',
          '*.password',
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers.x-api-key',
          'token',
          '*.token',
        ],
      },
    },
  },

  email: nodemailerAdapter({
    defaultFromAddress: resolvedEmailFromAddress,
    defaultFromName: 'Bullet Reporter',
    skipVerify: true,
    transportOptions: {
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser && smtpPass ? { user: smtpUser, pass: smtpPass } : undefined,
    },
  }),

  admin: {
    user: 'users',
    autoRefresh: true,
    components: {
      actions: ['@/components/payload/AdminNotifications#AdminNotifications'],
    },
    meta: {
      titleSuffix: '- Bullet Reporter Admin',
      icons: {
        icon: [
          {
            url: '/favicon.png',
            type: 'image/png',
          },
        ],
        apple: [
          {
            url: '/favicon.png',
            type: 'image/png',
          },
        ],
      },
    },
    importMap: {
      baseDir: dirname,
      importMapFile: path.resolve(dirname, 'src/app/(payload)/admin/importMap.js'),
    },
  },

  db: postgresAdapter({
    push: false,
    pool: {
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('sslmode=') ? undefined : { rejectUnauthorized: false },
    },
  }),

  editor: lexicalEditor(),

  collections: [
    {
      slug: 'admin-notifications',
      lockDocuments: false,
      admin: { hidden: true },
      access: { create: () => false, read: () => false, update: () => false, delete: () => false },
      fields: [
        { name: 'type', type: 'select', required: true, options: ['like', 'dislike', 'comment'] },
        { name: 'requiredPermission', type: 'select', required: true, options: ['news.read', 'video-news.read', 'comments.read'] },
        { name: 'contentType', type: 'select', required: true, options: ['news', 'video-news'] },
        { name: 'contentId', type: 'number', required: true },
        { name: 'contentTitle', type: 'text', required: true },
        { name: 'contentSlug', type: 'text', required: true },
        { name: 'message', type: 'text', required: true },
      ],
    },
    {
      slug: 'admin-notification-reads',
      lockDocuments: false,
      admin: { hidden: true },
      access: { create: () => false, read: () => false, update: () => false, delete: () => false },
      fields: [
        { name: 'receiptKey', type: 'text', required: true, unique: true },
        { name: 'notification', type: 'relationship', relationTo: 'admin-notifications', required: true },
        { name: 'user', type: 'relationship', relationTo: 'users', required: true },
        { name: 'readAt', type: 'date', required: true },
      ],
    },
    {
      slug: 'roles',
      access: {
        read: ({ req }) => hasPermission(req, 'roles', 'read'),
        create: ({ req }) => hasPermission(req, 'roles', 'create'),
        update: ({ req }) => hasPermission(req, 'roles', 'update'),
        delete: async ({ req }) => (await hasPermission(req, 'roles', 'delete')) && { isSystem: { not_equals: true } },
      },
      admin: { useAsTitle: 'name', defaultColumns: ['name', 'hierarchyOrder', 'slug', 'isSystem'], hidden: ({ user }) => !hasAnyPermission(user, 'roles') },
      hooks: { beforeOperation: [enforceRoleDepth], beforeChange: [enforceHierarchyOrder, preserveRoleBaseline] },
      fields: [
        { name: 'name', type: 'text', required: true, unique: true },
        { name: 'slug', type: 'text', required: true, unique: true },
        { name: 'hierarchyOrder', type: 'number', required: true, unique: true, min: 1, admin: { description: 'Lower numbers have higher authority. Order 1 is permanently reserved for Super Admin.' } },
        { name: 'isSystem', type: 'checkbox', defaultValue: false, admin: { readOnly: true } },
        { name: 'baseRole', type: 'relationship', relationTo: 'roles', filterOptions: { isSystem: { equals: true } }, admin: { description: 'Custom roles inherit this predefined role and can only add permissions.' } },
        { name: 'permissions', type: 'select', hasMany: true, required: true, options: PERMISSION_OPTIONS },
        { name: 'baselinePermissions', type: 'select', hasMany: true, options: PERMISSION_OPTIONS, admin: { hidden: true, readOnly: true } },
      ],
    },
    {
      slug: 'users',
      auth: {
        // Keep admin sessions persistent; explicit logout still revokes the session.
        tokenExpiration: 10 * 365 * 24 * 60 * 60,
        forgotPassword: {
          expiration: 10 * 60 * 1000,
          generateEmailHTML: ({ req, token, user }: { req?: any; token?: string; user?: any }) => {
            logEmailDiagnosticsForSend('password-reset')
            const resetUrl = `${getAppUrl(req)}/reset-password/${token}`
            return buildPasswordResetEmail({
              name: user?.name,
              email: user?.email,
              resetUrl,
            }).html
          },
          generateEmailSubject: () => 'Reset your Bullet Reporter password',
        },
      },
      endpoints: [
        {
          path: '/resend-password-setup',
          method: 'post',
          handler: async (req) => {
            if (!(await hasPermission(req, 'users', 'update'))) {
              return Response.json({ error: 'Unauthorized' }, { status: 403 })
            }

            const body = await req.json().catch(() => ({}))
            const userId = body?.id

            if (!userId) {
              return Response.json({ error: 'User id is required' }, { status: 400 })
            }

            const user = await req.payload.findByID({
              collection: 'users',
              id: userId,
              overrideAccess: true,
              req,
            })

            if (!user?.email) {
              return Response.json({ error: 'User email is required' }, { status: 400 })
            }

            const resetPasswordToken = createPasswordSetupToken()

            await req.payload.update({
              collection: 'users',
              id: user.id,
              data: {
                resetPasswordToken,
                resetPasswordExpiration: getPasswordSetupExpiration(),
              },
              overrideAccess: true,
              req,
            })

            await sendPasswordSetupEmail({
              email: user.email,
              name: user.name,
              req,
              token: resetPasswordToken,
            })

            return Response.json({ ok: true })
          },
        },
      ],
      hooks: {
        beforeOperation: [enforceRoleDepth],
        beforeValidate: [
          enforceSuperAdminLimit,
          preventDirectUserPasswordUpdate,
          ({ data, operation, req }: { data?: Record<string, any>; operation: string; req: any }) => {
            if (operation !== 'create' || !data?.email) {
              return data
            }

            const resetPasswordToken = createPasswordSetupToken()
            const sanitizedData = sanitizeUserCreateData(data)

            req.__newUserResetToken = resetPasswordToken

            return {
              ...sanitizedData,
              password: crypto.randomBytes(32).toString('base64url'),
              resetPasswordToken,
              resetPasswordExpiration: getPasswordSetupExpiration(),
            }
          },
        ],
        afterChange: [
          async ({ doc, operation, req }: { doc: any; operation: string; req: any }) => {
            if (operation !== 'create' || !doc?.email) {
              return doc
            }

            await req.payload.db.updateOne({
              collection: 'users',
              id: doc.id,
              data: {
                hash: null,
                salt: null,
              },
              req,
            })

            await sendPasswordSetupEmail({
              email: doc.email,
              name: doc.name,
              req,
              token: req.__newUserResetToken,
            })

            return doc
          },
        ],
      },
      access: {
        // Admins see all users; others see only their own profile
        read: async ({ req }) => {
          if (await hasPermission(req, 'users', 'read')) return true
          if (req.user) return { id: { equals: req.user.id } }
          return false
        },
        // New user accounts are created only by admins (registration is disabled)
        create: ({ req }) => hasPermission(req, 'users', 'create'),
        // User records can only be changed by roles with users.update.
        update: async ({ req }) => {
          if (await hasPermission(req, 'users', 'update')) return true
          return false
        },
        // Only admins can delete users
        delete: ({ req }) => hasPermission(req, 'users', 'delete'),
      },
      admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'email', 'role'],
        // Only admins see the Users list in the sidebar
        hidden: ({ user }: { user: any }) => !hasAnyPermission(user, 'users'),
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'role',
          type: 'relationship',
          relationTo: 'roles',
          required: true,
          // Only admins can change someone's role
          access: {
            update: ({ req }) => hasPermission(req, 'users', 'update'),
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
        create: ({ req }) => hasPermission(req, 'media', 'create'),
        update: ({ req }) => hasPermission(req, 'media', 'update'),
        // Only Admin and Editor can delete media
        delete: ({ req }) => hasPermission(req, 'media', 'delete'),
      },
      hooks: {
        beforeOperation: [
          enforceRoleDepth,
          ({ req, operation }: { req: any; operation: string }) => {
            if (operation === 'create' && req?.file) {
              if (req.file.size > MAX_UPLOAD_BYTES) {
                throw new APIError(`File size must not exceed ${MAX_UPLOAD_MB} MB.`, 400, null, true)
              }
            }
          },
        ],
        beforeChange: [ensureCloudinaryUploadConfigured],
        beforeDelete: [preventDeletingMediaInUse],
      },
      upload: {
        mimeTypes: ['image/*', 'video/*'],
      },
      admin: {
        useAsTitle: 'alt',
        // Authors and above can see the Media library; Viewers cannot upload
        hidden: ({ user }: { user: any }) => !hasAnyPermission(user, 'media'),
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
        create: ({ req }) => hasPermission(req, 'categories', 'create'),
        update: ({ req }) => hasPermission(req, 'categories', 'update'),
        // Only Admin can delete categories (prevents breaking existing articles)
        delete: ({ req }) => hasPermission(req, 'categories', 'delete'),
      },
      admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'slug', 'order'],
        // Admin and Editor manage categories; Authors and Viewers only see them as read-only
        hidden: ({ user }: { user: any }) => !hasAnyPermission(user, 'categories'),
      },
      hooks: {
        beforeOperation: [enforceRoleDepth],
        beforeValidate: [ensureCategoryFields],
        beforeDelete: [preventDeletingCategoryInUse],
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
        {
          name: 'name',
          type: 'text',
          label: 'Name (English)',
          required: true,
          admin: {
            description: 'Enter the category name in English. This is used for English display and stable frontend URLs.',
          },
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
          admin: {
            description: 'Auto-generated from the English name if left empty.',
          },
        },
        {
          name: 'nameHindi',
          type: 'text',
          label: 'Name (Hindi)',
          admin: {
            description: 'Auto-filled for common categories when left empty. Edit this for custom Hindi wording.',
          },
        },
        { name: 'description', type: 'textarea' },
        { name: 'color', type: 'text', label: 'Color (hex)', defaultValue: '#dc2626' },
        { name: 'order', type: 'number', defaultValue: 0 },
      ],
    },
    {
      slug: 'news',
      access: {
        // Public: only published articles; logged-in staff: all articles.
        read: async ({ req }) => {
          if (await hasPermission(req, 'news', 'read')) return true
          return { status: { equals: 'published' } }
        },
        // Admin, Editor, and Author can create news
        create: ({ req }) => hasPermission(req, 'news', 'create'),
        // Admin and Editor can edit any article;
        // Author can edit only articles they authored (and only while draft)
        update: ({ req }) => hasPermission(req, 'news', 'update'),
        // Admin and Editor can delete; Authors cannot
        delete: ({ req }) => hasPermission(req, 'news', 'delete'),
      },
      hooks: {
        beforeOperation: [enforceRoleDepth],
        beforeValidate: [ensureNewsFields],
        afterChange: [
          async ({ doc, previousDoc, req }: { doc: any; previousDoc: any; req: any }) => {
            if (doc?.status === 'published' && previousDoc?.status !== 'published') {
              try {
                await queueNewsletterItem({
                  contentType: 'news',
                  contentId: doc.id,
                  title: doc.title,
                  excerpt: doc.excerpt,
                  slug: doc.slug,
                  publishedAt: doc.publishedAt,
                })
              } catch (error) {
                req.payload.logger.error({ err: error }, 'Unable to queue news for newsletter')
              }
            }
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
          editor: newsContentEditor,
          admin: {
            description: 'Use the Video News block to insert a video already created in Video News. Videos cannot be uploaded here.',
          },
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
          label: 'Categories',
          relationTo: 'categories',
          hasMany: true,
          required: true,
          admin: {
            components: {
              Field:
                '@/components/payload/CategoryCheckboxRelationshipField#CategoryCheckboxRelationshipField',
            },
            description: 'Select one or more categories for this news article.',
          },
        },
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'users',
          required: true,
          admin: {
            hidden: true,
          },
        },
        {
          name: 'editor',
          type: 'relationship',
          relationTo: 'users',
          required: true,
          admin: {
            hidden: true,
          },
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
          access: { update: ({ req }) => hasPermission(req, 'news', 'update') },
        },
        {
          name: 'isFeatured',
          type: 'checkbox',
          label: 'Featured Article',
          defaultValue: false,
          // Only Admin and Editor can feature articles
          access: { update: ({ req }) => hasPermission(req, 'news', 'update') },
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
          defaultValue: 'published',
          required: true,
          // Authors can create articles but cannot publish — only Admin/Editor can
          access: { update: ({ req }) => hasPermission(req, 'news', 'update') },
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
        read: async ({ req }) => {
          if (await hasPermission(req, 'video-news', 'read')) return true
          return { status: { equals: 'published' } }
        },
        create: ({ req }) => hasPermission(req, 'video-news', 'create'),
        update: ({ req }) => hasPermission(req, 'video-news', 'update'),
        delete: ({ req }) => hasPermission(req, 'video-news', 'delete'),
      },
      hooks: {
        beforeOperation: [
          enforceRoleDepth,
          ({ req, operation }: { req: any; operation: string }) => {
            if (operation === 'create' || operation === 'update') {
              if (req?.file && req.file.size > MAX_VIDEO_UPLOAD_BYTES) {
                throw new APIError(`Video file size must not exceed ${MAX_VIDEO_UPLOAD_MB} MB.`, 400, null, true)
              }
            }
          },
        ],
        beforeValidate: [ensureVideoNewsFields],
        beforeChange: [preserveClientVideoUploadMetadata],
        afterChange: [
          async ({ doc, previousDoc, req }: { doc: any; previousDoc: any; req: any }) => {
            // The Cloudinary adapter deletes the old asset after a successful
            // replacement. Repair legacy metadata so that cleanup also works
            // for uploads saved before public IDs were persisted.
            if (previousDoc?.filename && !previousDoc?.cloudinaryPublicId) {
              previousDoc.cloudinaryPublicId = getVideoUploadPublicId(previousDoc.filename)
            }
            if (doc?.status === 'published' && previousDoc?.status !== 'published') {
              try {
                await queueNewsletterItem({
                  contentType: 'video-news',
                  contentId: doc.id,
                  title: doc.title,
                  excerpt: doc.description,
                  slug: doc.slug,
                  publishedAt: doc.publishedAt,
                })
              } catch (error) {
                req.payload.logger.error({ err: error }, 'Unable to queue video news for newsletter')
              }
            }
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
        description: 'Create video news using either a YouTube link or one uploaded video. Do not provide both.',
      },
      upload: {
        filesRequiredOnCreate: false,
        mimeTypes: ['video/*'],
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
          label: 'Categories',
          relationTo: 'categories',
          hasMany: true,
          required: true,
          admin: {
            components: {
              Field:
                '@/components/payload/CategoryCheckboxRelationshipField#CategoryCheckboxRelationshipField',
            },
            description: 'Select one or more categories for this video news story.',
          },
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
          label: 'YouTube Video URL or ID (Option 1)',
          admin: {
            description: 'Paste a YouTube URL or ID, or leave this empty and upload one video using the upload area above. Only one source is allowed.',
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
          admin: {
            hidden: true,
          },
        },
        {
          name: 'editor',
          type: 'relationship',
          relationTo: 'users',
          required: true,
          admin: {
            hidden: true,
          },
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
          defaultValue: 'published',
          required: true,
          access: { update: ({ req }) => hasPermission(req, 'video-news', 'update') },
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
        // Public comments use the validated public endpoint with overrideAccess;
        // authenticated admin/API requests must have the database permission.
        create: ({ req }) => hasPermission(req, 'comments', 'create'),
        // Admin and Editor see all comments; public sees only approved ones
        read: async ({ req }) => {
          if (await hasPermission(req, 'comments', 'read')) return true
          return { status: { equals: 'approved' } }
        },
        // Only Admin and Editor can update comments (approve / reject / edit)
        update: ({ req }) => hasPermission(req, 'comments', 'update'),
        // Only Admin and Editor can delete comments
        delete: ({ req }) => hasPermission(req, 'comments', 'delete'),
      },
      admin: {
        useAsTitle: 'authorName',
        defaultColumns: ['authorName', 'article', 'status', 'createdAt'],
        // Authors cannot moderate comments; only Admin and Editor see the comment queue
        hidden: ({ user }: { user: any }) => !hasAnyPermission(user, 'comments'),
      },
      hooks: {
        beforeOperation: [enforceRoleDepth],
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
      slug: 'director-details',
      labels: {
        singular: 'Director Details',
        plural: 'Director Details',
      },
      access: {
        read: () => true,
        create: ({ req }) => canManageDirectorMessage(req),
        update: ({ req }) => canManageDirectorMessage(req),
        delete: ({ req }) => canManageDirectorMessage(req),
      },
      admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'updatedAt'],
        description: 'Manage the director details displayed above the weather card. Only one record can exist.',
        components: {
          beforeList: ['@/components/payload/DirectorDetailsAdminControls#DirectorDetailsAdminControls'],
        },
      },
      hooks: {
        beforeOperation: [enforceRoleDepth],
        beforeValidate: [enforceSingleDirectorMessage],
        beforeChange: [validateDirectorImage],
      },
      fields: [
        {
          name: 'name',
          label: 'Director Name',
          type: 'text',
          required: true,
          maxLength: 120,
        },
        {
          name: 'image',
          label: 'Director Image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            description: 'Required size: exactly 600 x 600 px. Other dimensions will be rejected to prevent a blurry portrait.',
          },
        },
        {
          name: 'about',
          label: 'About Director',
          type: 'textarea',
          required: true,
          maxLength: 5000,
          admin: {
            description: 'Add the director’s profile, background, or other relevant details.',
          },
        },
      ],
    },
    {
      slug: 'advertisements',
      labels: {
        singular: 'Advertisement',
        plural: 'Advertisements',
      },
      access: {
        read: async ({ req }) => {
          if (await hasPermission(req, 'advertisements', 'read')) return true

          const now = new Date().toISOString()
          return {
            and: [
              { isActive: { equals: true } },
              { startsAt: { less_than_equal: now } },
              { endsAt: { greater_than: now } },
            ],
          }
        },
        create: ({ req }) => hasPermission(req, 'advertisements', 'create'),
        update: ({ req }) => hasPermission(req, 'advertisements', 'update'),
        delete: ({ req }) => hasPermission(req, 'advertisements', 'delete'),
      },
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'position', 'bannerType', 'size', 'isActive', 'startsAt', 'endsAt'],
        hidden: ({ user }: { user: any }) => !hasAnyPermission(user, 'advertisements'),
        description: 'Manage one top/header ad, one bottom/footer ad, and up to three sidebar ads.',
      },
      hooks: {
        beforeOperation: [enforceRoleDepth],
        beforeValidate: [ensureAdvertisementFields],
        beforeChange: [validateAdvertisementImage, enforceAdvertisementLimits],
        afterChange: [
          async ({ doc, previousDoc, req }: { doc: any; previousDoc: any; req: any }) => {
            if (hasPublicFieldChanged({ doc, previousDoc, fields: ADVERTISEMENT_PUBLIC_FIELDS })) {
              await touchPublicCache({ req, scopes: ['advertisements'] })
            }
          },
        ],
        afterDelete: [
          async ({ req }: { req: any }) => {
            await touchPublicCache({ req, scopes: ['advertisements'] })
          },
        ],
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'position',
          label: 'Legacy Position',
          type: 'select',
          required: true,
          options: [
            { label: 'Top / Header', value: 'top_banner' },
            { label: 'Bottom / Footer', value: 'bottom_banner' },
            { label: 'Sidebar', value: 'sidebar' },
          ],
          admin: {
            description: 'Choose where this advertisement appears on the website.',
          },
        },
        {
          name: 'positionDetails',
          type: 'ui',
          admin: {
            components: {
              Field:
                '@/components/payload/AdvertisementPositionDetails#AdvertisementPositionDetails',
            },
          },
        },
        {
          name: 'bannerType',
          label: 'Banner Type',
          type: 'select',
          required: true,
          options: [
            { label: 'Large Advertisement Banner', value: 'large_ad_banner' },
            { label: 'Square Banner', value: 'square_banner' },
          ],
          admin: {
            readOnly: true,
            description: 'Auto-set from Legacy Position: Top/Footer use Large Advertisement Banner; Sidebar uses Square Banner.',
            components: {
              Field:
                '@/components/payload/AdvertisementDerivedFields#AdvertisementBannerTypeField',
            },
          },
        },
        {
          name: 'size',
          label: 'Banner Size',
          type: 'select',
          required: true,
          options: [
            { label: 'Large Banner Size (1300 x 160 px)', value: 'large' },
            { label: 'Square Banner Size (350 x 220 px)', value: 'square' },
          ],
          admin: {
            readOnly: true,
            description: 'Auto-set from Legacy Position: Top/Footer = 1300 x 160 px; Sidebar = 350 x 220 px.',
            components: {
              Field:
                '@/components/payload/AdvertisementDerivedFields#AdvertisementBannerSizeField',
            },
          },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            description: 'Select a Cloudinary media item with the exact ad-slot size. Media uploads can be any image size; this ad field only accepts Top/Footer = 1300 x 160 px or Sidebar = 350 x 220 px.',
          },
        },
        {
          name: 'isActive',
          type: 'checkbox',
          label: 'Is Active',
          defaultValue: true,
        },
        {
          name: 'link',
          type: 'text',
          label: 'Click URL',
          required: true,
          admin: {
            description: 'Opens in a new tab when a visitor clicks the advertisement.',
          },
        },
        {
          name: 'startsAt',
          type: 'date',
          label: 'Start At',
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
            description: 'Advertisement becomes visible at this date and time.',
          },
        },
        {
          name: 'endsAt',
          type: 'date',
          label: 'End At',
          required: true,
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
            description: 'Advertisement is hidden after this date and deleted by the cleanup cron.',
          },
        },
      ],
    },
  ],

  globals: [
    {
      slug: 'settings',
      label: 'Site Settings',
      access: {
        read: ({ req }) => hasPermission(req, 'settings', 'read'),
        update: ({ req }) => hasPermission(req, 'settings', 'update'),
      },
      hooks: { beforeOperation: [enforceRoleDepth] },
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
      folder: cloudinaryFolder,
      clientUploads: false,
      useFilename: true,
    }),
    payloadCloudinaryPlugin({
      enabled: hasCloudinaryCredentials,
      collections: {
        'video-news': true,
      },
      cloudName: cloudinaryCloudName || '',
      credentials: {
        apiKey: cloudinaryApiKey || '',
        apiSecret: cloudinaryApiSecret || '',
      },
      folder: cloudinaryVideoFolder,
      clientUploads: true,
      useFilename: true,
    }),
  ],
})
