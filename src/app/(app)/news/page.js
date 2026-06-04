import { buildMetadata } from '@/lib/seo'
import NewsListClient from './NewsListClient'

export const metadata = buildMetadata({
  title: 'Latest News - Bullet Reporter',
  description:
    'Read the latest Hindi and English news on Bullet Reporter, including breaking updates, politics, sports, entertainment, technology, and local stories.',
  path: '/news',
  keywords: ['latest news', 'Hindi news today', 'India news'],
})

export default function NewsPage() {
  return <NewsListClient />
}
