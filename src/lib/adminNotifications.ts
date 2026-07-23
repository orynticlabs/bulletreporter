import type { Payload } from 'payload'
import { logDeploymentEvent, toLoggableError } from './deploymentLogger'

type EffectiveRole = {
  slug?: string | null
  hierarchyOrder?: number | null
}

const toEffectiveRole = (value: unknown): EffectiveRole | null => {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  return {
    slug: typeof record.slug === 'string' ? record.slug : null,
    hierarchyOrder: typeof record.hierarchyOrder === 'number' ? record.hierarchyOrder : null,
  }
}

export type AdminNotificationInput = {
  type: 'like' | 'dislike' | 'comment'
  requiredPermission: 'news.read' | 'video-news.read' | 'comments.read'
  contentType: 'news' | 'video-news'
  contentId: number
  contentTitle: string
  contentSlug: string
  message: string
}

export async function createAdminNotification(payload: Payload, data: AdminNotificationInput) {
  try {
    return await payload.create({ collection: 'admin-notifications', data, depth: 0, overrideAccess: true })
  } catch (error) {
    logDeploymentEvent('error', 'admin-notifications', 'Admin notification could not be recorded', {
      contentId: data.contentId,
      contentSlug: data.contentSlug,
      contentType: data.contentType,
      notificationType: data.type,
      requiredPermission: data.requiredPermission,
      error: toLoggableError(error),
    })
    return null
  }
}

export async function getEffectivePermissions(payload: Payload, user: unknown) {
  const userRecord = user && typeof user === 'object' ? user as Record<string, unknown> : null
  const assignedRole = userRecord?.role
  let role: EffectiveRole | null = null

  if (assignedRole && typeof assignedRole === 'object') {
    role = toEffectiveRole(assignedRole)
  } else if (typeof assignedRole === 'number' || typeof assignedRole === 'string') {
    const storedRole = await payload.findByID({ collection: 'roles', id: assignedRole, depth: 0, overrideAccess: true })
    role = toEffectiveRole(storedRole)
  }

  if (!role) return [] as string[]
  if (role.slug === 'super-admin') return ['news.read', 'video-news.read', 'comments.read']
  if (typeof role.hierarchyOrder !== 'number') return [] as string[]

  const roles = await payload.find({
    collection: 'roles',
    where: { hierarchyOrder: { greater_than_equal: role.hierarchyOrder } },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  return [...new Set(roles.docs.flatMap((candidate) => candidate.permissions || []))]
}
