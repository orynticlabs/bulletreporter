const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const normalizeUrl = (value = '') => {
  const url = value.trim().replace(/\/+$/, '')
  if (!url) return 'http://localhost:3000'
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

export function buildNewsletterEmail({ subscriber, items }) {
  const siteUrl = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || '')
  const unsubscribeUrl = `${siteUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(subscriber.unsubscribe_token)}`
  const articleRows = items.map((item) => {
    const path = item.content_type === 'video-news' ? 'video-news' : 'news'
    const url = `${siteUrl}/${path}/${encodeURIComponent(item.slug)}`
    return `<tr><td style="padding:18px 0;border-bottom:1px solid #e5e7eb">
      <a href="${url}" style="color:#b91c1c;font-size:18px;font-weight:700;text-decoration:none">${escapeHtml(item.title)}</a>
      ${item.excerpt ? `<p style="color:#4b5563;line-height:1.55;margin:8px 0 0">${escapeHtml(item.excerpt)}</p>` : ''}
    </td></tr>`
  }).join('')

  const textItems = items.map((item) => {
    const path = item.content_type === 'video-news' ? 'video-news' : 'news'
    return `${item.title}\n${siteUrl}/${path}/${encodeURIComponent(item.slug)}`
  }).join('\n\n')

  return {
    subject: `${items.length} latest ${items.length === 1 ? 'story' : 'stories'} from Bullet Reporter`,
    html: `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border-radius:12px;padding:28px">
          <tr><td><h1 style="margin:0;color:#b91c1c">Bullet Reporter</h1><p style="color:#4b5563">Hello ${escapeHtml(subscriber.name)}, here are the latest stories since your previous update.</p></td></tr>
          ${articleRows}
          <tr><td align="center" style="padding-top:28px"><a href="${siteUrl}/news" style="background:#dc2626;color:#fff;padding:12px 22px;border-radius:7px;text-decoration:none;font-weight:700">View all latest news</a></td></tr>
          <tr><td align="center" style="padding-top:28px;color:#6b7280;font-size:12px">You subscribed while commenting on Bullet Reporter.<br><a href="${unsubscribeUrl}" style="display:inline-block;margin-top:12px;color:#6b7280;text-decoration:underline">Unsubscribe from newsletter</a></td></tr>
        </table>
      </td></tr></table>
    </body></html>`,
    text: `Hello ${subscriber.name},\n\n${textItems}\n\nView all news: ${siteUrl}/news\n\nUnsubscribe: ${unsubscribeUrl}`,
  }
}
