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

  const textLines = [`Hello ${displayName},`, '', intro, '', `${ctaLabel}: ${ctaUrl}`]

  if (secondaryLabel && secondaryUrl) {
    textLines.push('', `${secondaryLabel}: ${secondaryUrl}`)
  }

  textLines.push('', expiresText, closingText)

  return {
    html,
    text: textLines.join('\n'),
  }
}

export const buildAccountInviteEmail = ({
  name,
  email,
  loginUrl,
  resetUrl,
}: {
  name?: string
  email?: string
  loginUrl: string
  resetUrl: string
}) => {
  const displayName = name || email || 'there'
  const subject = 'Set up your Bullet Reporter password'

  return {
    subject,
    ...buildAuthEmailTemplate({
      audience: 'Set up your account password',
      displayName,
      intro:
        'Your Bullet Reporter account has been created. For security, please set your own password using the link below.',
      ctaLabel: 'Set password',
      ctaUrl: resetUrl,
      secondaryLabel: 'Open admin dashboard',
      secondaryUrl: loginUrl,
      expiresText: 'This password setup link expires in 24 hours.',
      closingText: 'If you did not expect this email, please ignore it and contact an administrator.',
    }),
  }
}

export const buildPasswordResetEmail = ({
  name,
  email,
  resetUrl,
}: {
  name?: string
  email?: string
  resetUrl: string
}) => {
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

export const buildPasswordChangedEmail = ({
  name,
  email,
  loginUrl,
}: {
  name?: string
  email?: string
  loginUrl: string
}) => {
  const displayName = name || email || 'there'
  const subject = 'Your Bullet Reporter password was changed'

  return {
    subject,
    ...buildAuthEmailTemplate({
      audience: 'Password changed successfully',
      displayName,
      intro:
        'Your Bullet Reporter password was changed successfully. If this was you, no further action is needed.',
      ctaLabel: 'Open admin dashboard',
      ctaUrl: loginUrl,
      expiresText: 'This is a security notification for your account.',
      closingText:
        'If you did not change your password, contact an administrator immediately.',
    }),
  }
}
