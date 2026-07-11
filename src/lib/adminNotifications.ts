import type { Payload } from 'payload'

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
    console.error('Admin notification could not be recorded', error)
    return null
  }
}

export async function getEffectivePermissions(payload: Payload, user: any) {
  const assignedRole = user?.role
  const role = typeof assignedRole === 'object'
    ? assignedRole
    : assignedRole
      ? await payload.findByID({ collection: 'roles', id: assignedRole, depth: 0, overrideAccess: true })
      : null

  if (!role) return [] as string[]
  if (role.slug === 'super-admin') return ['news.read', 'video-news.read', 'comments.read']

  const roles = await payload.find({
    collection: 'roles',
    where: { hierarchyOrder: { greater_than_equal: role.hierarchyOrder } },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  return [...new Set(roles.docs.flatMap((candidate: any) => candidate.permissions || []))]
}
