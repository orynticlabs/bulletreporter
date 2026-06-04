import { NotFoundPage } from '@payloadcms/next/views'
import type { SanitizedConfig } from 'payload'
import { importMap } from '../../importMap'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

const configPromise = import('@payload-config').then(
  ({ default: config }) => config,
) as Promise<SanitizedConfig>

export default function NotFound({ params, searchParams }: Args) {
  return NotFoundPage({ config: configPromise, params, searchParams, importMap })
}
