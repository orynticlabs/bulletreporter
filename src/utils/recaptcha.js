const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

let recaptchaScriptPromise = null

function loadRecaptchaScript() {
  if (!SITE_KEY || typeof window === 'undefined') return Promise.resolve(false)
  if (window.grecaptcha?.execute) return Promise.resolve(true)
  if (recaptchaScriptPromise) return recaptchaScriptPromise

  recaptchaScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-recaptcha="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true })
      existing.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`
    script.async = true
    script.defer = true
    script.dataset.recaptcha = 'true'
    script.onload = () => resolve(true)
    script.onerror = reject
    document.head.appendChild(script)
  })

  return recaptchaScriptPromise
}

export async function getRecaptchaToken(action) {
  if (!SITE_KEY || typeof window === 'undefined') return ''

  await loadRecaptchaScript()

  return new Promise((resolve, reject) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(SITE_KEY, { action }).then(resolve).catch(reject)
    })
  })
}
