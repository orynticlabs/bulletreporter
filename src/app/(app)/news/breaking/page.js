import { buildMetadata } from '@/lib/seo'
import BreakingNewsClient from './BreakingNewsClient'

export const metadata = buildMetadata({
  title: 'Breaking News - Bullet Reporter',
  description:
    'Follow fast breaking news updates from Bullet Reporter with important Hindi and English coverage from India and beyond.',
  path: '/news/breaking',
  keywords: ['breaking news', 'live news', 'ब्रेकिंग न्यूज़'],
})

export default function BreakingNewsPage() {
  return <BreakingNewsClient />
}
