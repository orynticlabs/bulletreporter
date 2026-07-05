import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { v2 as cloudinary } from 'cloudinary'
import jitiFactory from 'jiti'
import { getPayload } from 'payload'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const projectRoot = path.resolve(dirname, '..')

const loadEnvFile = (filePath) => {
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

loadEnvFile(path.join(projectRoot, '.env'))
loadEnvFile(path.join(projectRoot, '.env.local'))

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const apiKey = process.env.CLOUDINARY_API_KEY
const apiSecret = process.env.CLOUDINARY_API_SECRET
const folder = process.env.CLOUDINARY_FOLDER

const missing = [
  ['CLOUDINARY_CLOUD_NAME', cloudName],
  ['CLOUDINARY_API_KEY', apiKey],
  ['CLOUDINARY_API_SECRET', apiSecret],
].filter(([, value]) => !value)

if (missing.length) {
  console.error(
    `Missing Cloudinary config: ${missing.map(([key]) => key).join(', ')}. Add them to .env.local before running this migration.`,
  )
  process.exit(1)
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
})

process.env.PAYLOAD_REQUIRE_CLOUDINARY = process.env.PAYLOAD_REQUIRE_CLOUDINARY || 'true'
process.env.PAYLOAD_DB_PUSH = process.env.PAYLOAD_DB_PUSH || 'true'

const jiti = jitiFactory(import.meta.url)
const configModule = jiti(path.join(projectRoot, 'payload.config.ts'))
const config = configModule.default || configModule
const payload = await getPayload({ config })

const isCloudinaryUrl = (url = '') => /res\.cloudinary\.com|cloudinary\.com/.test(String(url))
const localMediaDirs = [path.join(projectRoot, 'media'), path.join(projectRoot, 'public', 'media')]

const publicIdFromFilename = (mediaFilename = '') =>
  path
    .parse(mediaFilename)
    .name.replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || `media-${Date.now()}`

const filenameFromUrl = (url = '') => {
  try {
    const parsed = new URL(url, 'http://local.invalid')
    return decodeURIComponent(path.basename(parsed.pathname))
  } catch {
    return ''
  }
}

const findLocalFile = (doc) => {
  const filenames = [
    doc.filename,
    filenameFromUrl(doc.url),
    filenameFromUrl(doc.thumbnailURL),
  ].filter(Boolean)

  for (const mediaFilename of filenames) {
    for (const mediaDir of localMediaDirs) {
      const candidate = path.join(mediaDir, mediaFilename)
      if (fs.existsSync(candidate)) return candidate
    }
  }

  return null
}

const findAllMedia = async () => {
  const docs = []
  let page = 1
  let totalPages = 1

  do {
    const result = await payload.find({
      collection: 'media',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      page,
    })

    docs.push(...result.docs)
    totalPages = result.totalPages || 1
    page += 1
  } while (page <= totalPages)

  return docs
}

let uploaded = 0
let skipped = 0
let missingFiles = 0
const docs = await findAllMedia()

for (const doc of docs) {
  if (doc.cloudinaryPublicId && isCloudinaryUrl(doc.url)) {
    skipped += 1
    continue
  }

  const localFile = findLocalFile(doc)
  if (!localFile) {
    missingFiles += 1
    console.warn(`Missing local file for media id ${doc.id} (${doc.filename || doc.url || 'unknown'})`)
    continue
  }

  const result = await cloudinary.uploader.upload(localFile, {
    folder,
    overwrite: true,
    public_id: publicIdFromFilename(doc.filename || path.basename(localFile)),
    resource_type: 'auto',
  })

  await payload.update({
    collection: 'media',
    id: doc.id,
    overrideAccess: true,
    data: {
      alt: doc.alt || doc.filename || path.basename(localFile),
      caption: doc.caption,
      cloudinaryPublicId: result.public_id,
      filename: doc.filename || path.basename(localFile),
      filesize: doc.filesize,
      height: doc.height,
      mimeType: doc.mimeType,
      url: result.secure_url,
      width: doc.width,
    },
  })

  uploaded += 1
  console.log(`Uploaded media id ${doc.id}: ${result.secure_url}`)
}

console.log(
  `Cloudinary migration complete. Uploaded: ${uploaded}. Already Cloudinary: ${skipped}. Missing local files: ${missingFiles}.`,
)

if (typeof payload.destroy === 'function') {
  await payload.destroy()
}
