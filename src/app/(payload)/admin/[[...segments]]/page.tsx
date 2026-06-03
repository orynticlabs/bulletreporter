import { RootPage } from '@payloadcms/next/views'
import { importMap } from '../../importMap'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export default async function Page({ params, searchParams }: Args) {
  const mod = await import('@payload-config')
  const config = mod?.default ?? mod

  // @ts-ignore
  return RootPage({ config, params, searchParams, importMap })
}
