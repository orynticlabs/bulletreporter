import { NotFoundPage } from '@payloadcms/next/views'
import { importMap } from '../../importMap'

export const dynamic = 'force-dynamic'

export default async function NotFound() {
  const mod = await import('@payload-config')
  const config = mod?.default ?? mod

  // @ts-ignore
  return NotFoundPage({ config, importMap })
}
