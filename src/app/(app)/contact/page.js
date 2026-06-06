import Layout from '@/components/Layout'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Contact Us',
  description: 'Contact Bullet Reporter for newsroom, advertising, correction, and website-related communication.',
  path: '/contact',
  keywords: ['Contact Bullet Reporter', 'news desk', 'advertising', 'corrections'],
})

export default function ContactPage() {
  return (
    <Layout>
      <main className="bg-white">
        <section className="border-b border-red-100 bg-gray-50">
          <div className="container mx-auto px-4 py-10">
            <p className="text-sm font-bold uppercase tracking-wide text-red-600">Contact</p>
            <h1 className="mt-2 text-3xl font-black text-gray-950 md:text-5xl">Contact Bullet Reporter</h1>
            <p className="mt-4 max-w-3xl leading-7 text-gray-700">
              Reach out for news tips, corrections, advertising, partnerships, or technical questions related to the website.
            </p>
          </div>
        </section>

        <section className="container mx-auto grid gap-6 px-4 py-10 md:grid-cols-3">
          <div className="border border-gray-100 bg-gray-50 p-6">
            <h2 className="text-lg font-black text-gray-950">News Desk</h2>
            <a className="mt-3 block text-red-600 hover:underline" href="mailto:bulletreporter1@gmail.com">
              bulletreporter1@gmail.com
            </a>
          </div>
          <div className="border border-gray-100 bg-gray-50 p-6">
            <h2 className="text-lg font-black text-gray-950">Phone</h2>
            <a className="mt-3 block text-red-600 hover:underline" href="tel:+919425470033">
              +91 9425470033
            </a>
          </div>
          <div className="border border-gray-100 bg-gray-50 p-6">
            <h2 className="text-lg font-black text-gray-950">Location</h2>
            <p className="mt-3 text-gray-700">Rewa, Madhya Pradesh, India</p>
          </div>
        </section>
      </main>
    </Layout>
  )
}
