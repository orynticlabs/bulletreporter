import Layout from '@/components/Layout'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Privacy Policy',
  description: 'Read the Bullet Reporter privacy policy covering data use, security, cookies, contact details, and website protection.',
  path: '/privacy-policy',
  keywords: ['Bullet Reporter privacy policy', 'data security', 'OrynticLabs', 'privacy'],
})

const sections = [
  {
    title: 'Information We Collect',
    body: 'We may collect basic information such as contact details submitted through forms, comments, communication requests, browser information, device details, and analytics data used to improve the website.',
  },
  {
    title: 'How Information Is Used',
    body: 'Information is used to operate the website, publish and manage content, respond to reader messages, improve performance, protect systems, and understand what readers find useful.',
  },
  {
    title: 'Data Security',
    body: 'The Bullet Reporter website is technically managed by OrynticLabs Pvt Ltd, and data-security support for the platform is provided by OrynticLabs. Reasonable technical measures are used to protect website data and reduce unauthorized access risks.',
  },
  {
    title: 'Cookies And Analytics',
    body: 'The website may use cookies, cache, logs, and analytics tools to improve speed, remember useful preferences, measure traffic, and detect technical problems.',
  },
  {
    title: 'Content And Copyright',
    body: 'All Bullet Reporter content and copyright belong to Bullet Reporter and its team unless otherwise stated. User submissions must not violate another person’s rights or include unlawful material.',
  },
  {
    title: 'External Services',
    body: 'We may use trusted third-party services for hosting, media delivery, analytics, email, security, and other website operations. These services process information according to their own policies and applicable law.',
  },
  {
    title: 'Policy Updates',
    body: 'This policy may be updated as the website, technology, or legal requirements change. The latest version will be available on this page.',
  },
]

export default function PrivacyPolicyPage() {
  return (
    <Layout>
      <main className="bg-white">
        <section className="border-b border-red-100 bg-red-50/60">
          <div className="container mx-auto px-4 py-10">
            <p className="text-sm font-bold uppercase tracking-wide text-red-600">Privacy</p>
            <h1 className="mt-2 text-3xl font-black text-gray-950 md:text-5xl">Privacy Policy</h1>
            <p className="mt-4 max-w-3xl leading-7 text-gray-700">
              This policy explains how Bullet Reporter handles website information, reader interactions, and platform
              security in a clear and responsible way.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10">
          <div className="max-w-4xl space-y-7">
            {sections.map((section) => (
              <article key={section.title} className="border-b border-gray-100 pb-6 last:border-b-0">
                <h2 className="text-xl font-black text-gray-950">{section.title}</h2>
                <p className="mt-2 leading-7 text-gray-700">{section.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  )
}
