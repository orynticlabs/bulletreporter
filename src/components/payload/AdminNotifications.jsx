'use client'

import { Bell, CheckCheck, MessageSquare, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

const styles = {
  root: { position: 'relative' },
  button: { alignItems: 'center', background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer', display: 'flex', height: 40, justifyContent: 'center', position: 'relative', width: 40 },
  badge: { alignItems: 'center', background: '#dc2626', borderRadius: 999, color: '#fff', display: 'flex', fontSize: 10, fontWeight: 700, height: 18, justifyContent: 'center', minWidth: 18, padding: '0 4px', position: 'absolute', right: 0, top: 0 },
  panel: { background: 'var(--theme-elevation-0)', border: '1px solid var(--theme-elevation-150)', borderRadius: 8, boxShadow: '0 12px 32px rgba(0,0,0,.18)', color: 'var(--theme-text)', maxHeight: 'min(70vh, 620px)', overflow: 'hidden', position: 'absolute', right: 0, top: 46, width: 'min(420px, calc(100vw - 24px))', zIndex: 1000 },
  header: { alignItems: 'center', borderBottom: '1px solid var(--theme-elevation-150)', display: 'flex', justifyContent: 'space-between', padding: 14 },
  tabs: { display: 'flex', gap: 6, padding: '10px 14px' },
  tab: { background: 'var(--theme-elevation-100)', border: 0, borderRadius: 999, color: 'inherit', cursor: 'pointer', padding: '6px 10px' },
  list: { maxHeight: 'calc(min(70vh, 620px) - 110px)', overflowX: 'hidden', overflowY: 'auto' },
  item: { alignItems: 'flex-start', borderTop: '1px solid var(--theme-elevation-100)', display: 'flex', gap: 8, maxWidth: '100%', minWidth: 0, padding: 14, width: '100%' },
  itemButton: { alignItems: 'flex-start', background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer', display: 'flex', flex: 1, gap: 10, minWidth: 0, padding: 0, textAlign: 'left' },
  message: { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' },
  markRead: { background: 'transparent', border: 0, color: 'var(--theme-success-500)', cursor: 'pointer', flexShrink: 0, fontSize: 11, padding: '2px 0' },
}

function icon(type) {
  if (type === 'comment') return <MessageSquare size={18} />
  if (type === 'dislike') return <ThumbsDown size={18} />
  return <ThumbsUp size={18} />
}

export function AdminNotifications() {
  const [data, setData] = useState({ docs: [], unreadCount: 0 })
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const rootRef = useRef(null)

  const load = async () => {
    const response = await fetch('/api/admin-notifications', { credentials: 'include', cache: 'no-store' })
    if (response.ok) setData(await response.json())
  }

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 30000)
    const close = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => { window.clearInterval(timer); document.removeEventListener('mousedown', close) }
  }, [])

  const visible = useMemo(() => data.docs.filter((doc) => filter === 'all' || (filter === 'read' ? doc.read : !doc.read)), [data.docs, filter])

  const markRead = async (ids) => {
    if (!ids.length) return
    const idSet = new Set(ids.map(Number))

    // Update the UI immediately instead of waiting for the database round trip.
    setData((current) => {
      const newlyRead = current.docs.filter((doc) => idSet.has(Number(doc.id)) && !doc.read).length
      return {
        docs: current.docs.map((doc) => idSet.has(Number(doc.id)) ? { ...doc, read: true } : doc),
        unreadCount: Math.max(0, current.unreadCount - newlyRead),
      }
    })

    try {
      const response = await fetch('/api/admin-notifications', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids }),
        keepalive: true,
      })
      if (!response.ok) throw new Error('Unable to mark notification as read')
    } catch {
      // Restore the authoritative state only when background persistence fails.
      await load()
    }
  }

  const openNotification = async (notification) => {
    if (!notification.read) void markRead([notification.id])
    window.location.href = notification.type === 'comment'
      ? '/admin/collections/comments'
      : `/admin/collections/${notification.contentType}/${notification.contentId}`
  }

  return <div ref={rootRef} style={styles.root}>
    <button aria-label={`Notifications, ${data.unreadCount} unread`} onClick={() => setOpen((value) => !value)} style={styles.button} type="button">
      <Bell size={22} />
      {data.unreadCount > 0 && <span style={styles.badge}>{data.unreadCount > 99 ? '99+' : data.unreadCount}</span>}
    </button>
    {open && <section aria-label="Notifications" style={styles.panel}>
      <div style={styles.header}>
        <strong>Notifications</strong>
        <button disabled={!data.unreadCount} onClick={() => markRead(data.docs.filter((doc) => !doc.read).map((doc) => doc.id))} style={styles.button} title="Mark all as read" type="button"><CheckCheck size={19} /></button>
      </div>
      <div style={styles.tabs}>
        {['all', 'unread', 'read'].map((value) => <button key={value} onClick={() => setFilter(value)} style={{ ...styles.tab, fontWeight: filter === value ? 700 : 400 }} type="button">{value[0].toUpperCase() + value.slice(1)}</button>)}
      </div>
      <div style={styles.list}>
        {!visible.length && <p style={{ padding: 18, textAlign: 'center' }}>No {filter === 'all' ? '' : `${filter} `}notifications.</p>}
        {visible.map((notification) => <div key={notification.id} style={{ ...styles.item, background: notification.read ? 'transparent' : 'var(--theme-elevation-50)' }}>
          <button onClick={() => openNotification(notification)} style={styles.itemButton} type="button">
            <span style={{ flexShrink: 0 }}>{icon(notification.type)}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span title={notification.message} style={{ ...styles.message, fontWeight: notification.read ? 400 : 700 }}>{notification.message}</span>
              <small style={{ color: 'var(--theme-elevation-500)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{new Date(notification.createdAt).toLocaleString()}</small>
            </span>
          </button>
          {!notification.read && <button aria-label="Mark notification as read" onClick={() => markRead([notification.id])} style={styles.markRead} title="Mark as read" type="button">Mark as read</button>}
        </div>)}
      </div>
    </section>}
  </div>
}
