import config from '@payload-config'
import { getPayload } from 'payload'
import { getEffectivePermissions } from '@/lib/adminNotifications'

export const dynamic = 'force-dynamic'

const NOTIFICATION_PERMISSIONS = ['news.read', 'video-news.read', 'comments.read'] as const

const getNotificationPermissions = (permissions: string[]) =>
  permissions.filter((value) => NOTIFICATION_PERMISSIONS.includes(value as (typeof NOTIFICATION_PERMISSIONS)[number]))

async function authenticated(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })
  return { payload, user }
}

export async function GET(request: Request) {
  const { payload, user } = await authenticated(request)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const permissions = await getEffectivePermissions(payload, user)
  const allowed = getNotificationPermissions(permissions)
  if (!allowed.length) return Response.json({ docs: [], unreadCount: 0 })

  const notifications = await payload.find({
    collection: 'admin-notifications',
    where: { requiredPermission: { in: allowed } },
    sort: '-createdAt',
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })
  const reads = await payload.find({
    collection: 'admin-notification-reads',
    where: { user: { equals: user.id } },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  const readIds = new Set(reads.docs.map((receipt: any) => Number(receipt.notification)))
  const docs = notifications.docs.map((notification: any) => ({
    ...notification,
    read: readIds.has(Number(notification.id)),
  }))

  return Response.json({ docs, unreadCount: docs.filter((doc) => !doc.read).length })
}

export async function PATCH(request: Request) {
  const { payload, user } = await authenticated(request)
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { notificationIds } = await request.json()
  const ids = [...new Set((Array.isArray(notificationIds) ? notificationIds : []).map(Number).filter(Number.isInteger))]
  if (!ids.length) return Response.json({ updated: 0 })

  const permissions = await getEffectivePermissions(payload, user)
  const allowed = getNotificationPermissions(permissions)
  if (!allowed.length) return Response.json({ updated: 0 })

  const visible = await payload.find({
    collection: 'admin-notifications',
    where: { and: [{ id: { in: ids } }, { requiredPermission: { in: allowed } }] },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  let updated = 0
  for (const notification of visible.docs) {
    try {
      await payload.create({
        collection: 'admin-notification-reads',
        data: {
          receiptKey: `${user.id}:${notification.id}`,
          notification: notification.id,
          user: user.id,
          readAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })
      updated += 1
    } catch (error: any) {
      if (!String(error?.message || '').toLowerCase().includes('unique')) throw error
    }
  }
  return Response.json({ updated })
}
