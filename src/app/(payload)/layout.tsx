import { RootLayout } from '@payloadcms/next/layouts'
import React from 'react'
import { importMap } from './importMap'
import { payloadServerFunction } from './serverFunctions'

// Payload admin stylesheet — must be imported here so Next.js includes it in the client bundle
// Global variables + resets (defines --theme-*, --color-* CSS custom properties)
import '@payloadcms/ui/scss/app.scss'
// Pre-compiled component class styles (.btn, .login, .nav, etc.)
import '@payloadcms/ui/styles.css'

export default async function PayloadRootLayout({ children }: { children: React.ReactNode }) {
  const mod = await import('@payload-config')
  const config = mod?.default ?? mod

  return (
    <RootLayout config={config} importMap={importMap} serverFunction={payloadServerFunction}>
      {children}
    </RootLayout>
  )
}
