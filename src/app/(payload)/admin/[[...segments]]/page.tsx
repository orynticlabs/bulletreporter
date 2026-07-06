import { generatePageMetadata, RootPage } from '@payloadcms/next/views'
import type { SanitizedConfig } from 'payload'
import { importMap } from '../../importMap'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

const configPromise = import('@payload-config').then(
  ({ default: config }) => config,
) as Promise<SanitizedConfig>

export const generateMetadata = (args: Args) =>
  generatePageMetadata({ ...args, config: configPromise })

export default function Page({ params, searchParams }: Args) {
  return RootPage({ config: configPromise, params, searchParams, importMap })
}
