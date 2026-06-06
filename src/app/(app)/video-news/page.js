import VideoNewsListClient from './VideoNewsListClient'

export const metadata = {
  title: 'Video News - Bullet Reporter',
  description: 'Latest YouTube video news from Bullet Reporter.',
}

export default function VideoNewsPage() {
  return <VideoNewsListClient />
}
