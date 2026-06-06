import { RootLayout } from '@payloadcms/next/layouts'
import React from 'react'
import type { SanitizedConfig } from 'payload'
import { importMap } from './importMap'
import { payloadServerFunction } from './serverFunctions'
import AdminAutoLogout from '@/components/payload/AdminAutoLogout'

import '@payloadcms/next/css'

const configPromise = import('@payload-config').then(
  ({ default: config }) => config,
) as Promise<SanitizedConfig>

export default function PayloadRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={configPromise} importMap={importMap} serverFunction={payloadServerFunction}>
      <AdminAutoLogout />
      {children}
    </RootLayout>
  )
}
