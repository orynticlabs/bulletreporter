import crypto from 'crypto'
import { Pool } from 'pg'

const globalForNewsletter = globalThis

const getDatabaseUrl = () =>
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.PAYLOAD_DATABASE_URL

const getPool = () => {
  if (globalForNewsletter.__newsletterPool) return globalForNewsletter.__newsletterPool

  const connectionString = getDatabaseUrl()
  if (!connectionString) throw new Error('A Postgres connection string is required for newsletters.')

  globalForNewsletter.__newsletterPool = new Pool({
    connectionString,
    max: Number(process.env.NEWSLETTER_DB_POOL_SIZE || 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  })

  return globalForNewsletter.__newsletterPool
}

export const normalizeNewsletterEmail = (email = '') => email.trim().toLowerCase()

export async function subscribeToNewsletter({ name, email }) {
  const normalizedEmail = normalizeNewsletterEmail(email)
  const normalizedName = String(name || '').trim()
  if (!normalizedEmail || !normalizedName) return

  const unsubscribeToken = crypto.randomBytes(32).toString('hex')

  await getPool().query(
    `INSERT INTO newsletter_subscribers
      (name, email, unsubscribe_token, is_active, subscribed_at, created_at, updated_at)
     VALUES ($1, $2, $3, TRUE, NOW(), NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       unsubscribe_token = EXCLUDED.unsubscribe_token,
       is_active = TRUE,
       subscribed_at = CASE
         WHEN newsletter_subscribers.is_active THEN newsletter_subscribers.subscribed_at
         ELSE NOW()
       END,
       updated_at = NOW()`,
    [normalizedName, normalizedEmail, unsubscribeToken],
  )
}

export async function queueNewsletterItem({ contentType, contentId, title, excerpt, slug, publishedAt }) {
  if (!contentId || !title || !slug) return
  const itemKey = `${contentType}:${contentId}`

  await getPool().query(
    `INSERT INTO newsletter_digest_items
      (item_key, content_type, content_id, title, excerpt, slug, published_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (item_key) DO NOTHING`,
    [itemKey, contentType, Number(contentId), String(title), String(excerpt || ''), String(slug), publishedAt || new Date()],
  )
}

export async function unsubscribeFromNewsletter(token) {
  if (!/^[a-f0-9]{64}$/i.test(String(token || ''))) return false
  const result = await getPool().query(
    'DELETE FROM newsletter_subscribers WHERE unsubscribe_token = $1 RETURNING id',
    [token],
  )
  return result.rowCount > 0
}

export async function getNewsletterCandidates(limit) {
  const result = await getPool().query(
    `SELECT id, name, email, unsubscribe_token, subscribed_at, last_digest_at
       FROM newsletter_subscribers s
      WHERE s.is_active = TRUE
        AND EXISTS (
          SELECT 1 FROM newsletter_digest_items i
           WHERE i.published_at > GREATEST(s.subscribed_at, COALESCE(s.last_digest_at, s.subscribed_at))
        )
      ORDER BY s.last_digest_at ASC NULLS FIRST, s.id ASC
      LIMIT $1`,
    [limit],
  )
  return result.rows
}

export async function getDigestItemsForSubscriber(subscriber, limit = 12) {
  const since = subscriber.last_digest_at || subscriber.subscribed_at
  const result = await getPool().query(
    `SELECT id, title, excerpt, slug, content_type, published_at
       FROM newsletter_digest_items
      WHERE published_at > $1
      ORDER BY published_at DESC, id DESC
      LIMIT $2`,
    [since, limit],
  )
  return result.rows
}

export async function claimNewsletterDelivery({ subscriberId, slotKey }) {
  const deliveryKey = `${slotKey}:${subscriberId}`
  const result = await getPool().query(
    `INSERT INTO newsletter_deliveries
      (delivery_key, slot_key, subscriber_id, status, attempts, created_at, updated_at)
     VALUES ($1, $2, $3, 'sending', 1, NOW(), NOW())
     ON CONFLICT (delivery_key) DO UPDATE SET
       status = 'sending',
       attempts = newsletter_deliveries.attempts + 1,
       last_error = NULL,
       updated_at = NOW()
     WHERE newsletter_deliveries.status = 'failed'
     RETURNING id`,
    [deliveryKey, slotKey, subscriberId],
  )
  return result.rows[0]?.id || null
}

export async function completeNewsletterDelivery({ deliveryId, subscriberId, deliveredThrough }) {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `UPDATE newsletter_deliveries
          SET status = 'sent', sent_at = NOW(), updated_at = NOW()
        WHERE id = $1`,
      [deliveryId],
    )
    await client.query(
      `UPDATE newsletter_subscribers
          SET last_digest_at = GREATEST(COALESCE(last_digest_at, subscribed_at), $2), updated_at = NOW()
        WHERE id = $1`,
      [subscriberId, deliveredThrough],
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function failNewsletterDelivery(deliveryId, error) {
  await getPool().query(
    `UPDATE newsletter_deliveries
        SET status = 'failed', last_error = $2, updated_at = NOW()
      WHERE id = $1`,
    [deliveryId, String(error instanceof Error ? error.message : error).slice(0, 1000)],
  )
}
