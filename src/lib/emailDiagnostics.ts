import { logDeploymentEventOnce } from './deploymentLogger'

const getEmailAddress = (value?: string) => {
  const match = value?.match(/<([^>]+)>/)
  return (match?.[1] || value || '').trim()
}

const getEmailDomain = (value?: string) => getEmailAddress(value).split('@').pop()?.toLowerCase() || ''

export const logEmailDiagnosticsForSend = (reason: string) => {
  const smtpHost = process.env.SMTP_HOST
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const emailFrom = process.env.EMAIL_FROM
  const smtpUserDomain = getEmailDomain(smtpUser)
  const emailFromDomain = getEmailDomain(emailFrom)
  const resolvedFromDomain = getEmailDomain(emailFrom || smtpUser)
  const missing = [
    !smtpHost ? 'SMTP_HOST' : null,
    !smtpUser ? 'SMTP_USER' : null,
    !smtpPass ? 'SMTP_PASS' : null,
    !getEmailAddress(emailFrom || smtpUser) ? 'EMAIL_FROM or SMTP_USER' : null,
  ].filter(Boolean)

  if (missing.length) {
    logDeploymentEventOnce(`email-missing-env:${reason}`, 'warn', 'payload.email', 'Email settings incomplete before sending mail', {
      reason,
      missing,
    })
    return
  }

  if (smtpUserDomain && emailFromDomain && smtpUserDomain !== emailFromDomain) {
    logDeploymentEventOnce(`email-domain-mismatch:${reason}`, 'warn', 'payload.email', 'Email sender domain differs from SMTP account; using SMTP account as sender', {
      reason,
      smtpUserDomain,
      emailFromDomain,
      resolvedFromDomain,
    })
  }
}
