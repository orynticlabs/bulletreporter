import { buildMetadata } from '@/lib/seo'
import CategoryNewsClient from './CategoryNewsClient'

export async function generateMetadata({ params }) {
  const { category: rawCategory } = await params
  const category = decodeURIComponent(rawCategory || '')

  return buildMetadata({
    title: `${category} News - Bullet Reporter`,
    description: `Read the latest ${category} news, updates, analysis, and reports on Bullet Reporter.`,
    path: `/category/${encodeURIComponent(category)}`,
    keywords: [category, `${category} news`, `${category} हिंदी समाचार`],
  })
}

export default function CategoryNewsPage() {
  return <CategoryNewsClient />
}
