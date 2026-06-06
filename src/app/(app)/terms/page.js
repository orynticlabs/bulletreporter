import Layout from '@/components/Layout'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Terms And Conditions',
  description: 'Read the Bullet Reporter terms for website use, content rights, copyright, technical management, and responsible access.',
  path: '/terms',
  keywords: ['Bullet Reporter terms', 'terms and conditions', 'copyright policy', 'OrynticLabs'],
})

const sections = [
  {
    title: 'Use Of The Website',
    body: 'Bullet Reporter provides news, updates, articles, images, and related digital services for public information. By using this website, you agree to access the content lawfully and respectfully.',
  },
  {
    title: 'Content Ownership',
    body: 'All original content, reports, text, images, graphics, branding, and published material are owned by Bullet Reporter and its team unless a source or third-party owner is clearly mentioned.',
  },
  {
    title: 'No Unauthorized Copying',
    body: 'You may not copy, republish, scrape, sell, modify, or redistribute Bullet Reporter content without written permission. Short references may be used only with proper credit and a link to the original page.',
  },
  {
    title: 'Technical Management',
    body: 'The Bullet Reporter website is developed and technically managed by OrynticLabs Pvt Ltd. Platform maintenance, technical improvements, and data-security support are provided by OrynticLabs.',
  },
  {
    title: 'Accuracy And Updates',
    body: 'We work to keep information accurate and current. News can develop quickly, so articles may be corrected, updated, expanded, or removed when required.',
  },
  {
    title: 'User Conduct',
    body: 'Users must not misuse the website, attempt unauthorized access, interfere with services, post unlawful material, or use the platform in a way that harms readers, staff, or systems.',
  },
  {
    title: 'External Links',
    body: 'Some pages may link to external websites or services. Bullet Reporter is not responsible for the content, policies, or practices of external websites.',
  },
  {
    title: 'Changes To These Terms',
    body: 'These terms may be updated from time to time to reflect editorial, legal, security, or technical requirements. Continued use of the website means you accept the updated terms.',
  },
]

export default function TermsPage() {
  return (
    <Layout>
      <main className="bg-white">
        <section className="border-b border-red-100 bg-gray-50">
          <div className="container mx-auto px-4 py-10">
            <p className="text-sm font-bold uppercase tracking-wide text-red-600">Legal</p>
            <h1 className="mt-2 text-3xl font-black text-gray-950 md:text-5xl">Terms And Conditions</h1>
            <p className="mt-4 max-w-3xl leading-7 text-gray-700">
              These terms explain how Bullet Reporter content and services may be used. They are written for readers,
              contributors, partners, and anyone accessing the website.
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
