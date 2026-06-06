import config from '@payload-config'
import { getPayload } from 'payload'
import Layout from '@/components/Layout'
import { buildMetadata } from '@/lib/seo'
import { lexicalToHtml } from '@/utils/payloadArticles'

export const metadata = buildMetadata({
  title: 'About Us',
  description: 'Learn about Bullet Reporter, a Hindi-first news platform for Madhya Pradesh, Chhattisgarh, India, and important public updates.',
  path: '/about',
  keywords: ['About Bullet Reporter', 'Hindi news portal', 'Madhya Pradesh news', 'Chhattisgarh news'],
})

const defaults = {
  eyebrow: 'About Bullet Reporter',
  headline: 'साफ, तेज और जिम्मेदार खबरें',
  summary:
    'Bullet Reporter is a Hindi-first digital news platform focused on timely reporting, public-interest updates, and useful local coverage for readers across Madhya Pradesh, Chhattisgarh, and India.',
  mission:
    'We publish news with a focus on clarity, public relevance, and reader trust. Our newsroom covers politics, local developments, social issues, entertainment, business, sports, and breaking updates in a format that is easy to read on mobile and desktop.',
  technologyManagement:
    'The Bullet Reporter website is developed and technically managed by OrynticLabs Pvt Ltd. Data security, platform maintenance, and technical support for the website are also provided by OrynticLabs.',
  ownership:
    'All published content, brand material, and editorial assets belong to Bullet Reporter and its team unless otherwise stated. Reuse requires written permission.',
}

const getImageUrl = (media) => {
  if (!media || typeof media !== 'object') return ''
  if (media.url) return media.url
  if (media.cloudinaryPublicId) {
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME
    if (cloud) return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto/${media.cloudinaryPublicId}`
  }
  return ''
}

async function getAboutPageData() {
  try {
    const payload = await getPayload({ config })
    const settings = await payload.findGlobal({
      slug: 'settings',
      depth: 1,
      overrideAccess: true,
    })
    return settings?.aboutPage || {}
  } catch {
    return {}
  }
}

function PersonCard({ person }) {
  if (!person?.name && !person?.bio && !person?.photo) return null

  const photoUrl = getImageUrl(person.photo)

  return (
    <article className="border border-gray-100 bg-gray-50 p-5">
      {photoUrl && (
        <img
          src={photoUrl}
          alt={person.name || person.designation || 'Editorial team'}
          className="mb-4 aspect-square w-28 rounded-full border-4 border-white object-cover shadow"
          loading="lazy"
        />
      )}
      <p className="text-xs font-black uppercase tracking-wide text-red-600">{person.designation || 'Editor'}</p>
      {person.name && <h3 className="mt-1 text-xl font-black text-gray-950">{person.name}</h3>}
      {person.bio && <p className="mt-3 text-sm leading-7 text-gray-700">{person.bio}</p>}
      {person.email && (
        <a className="mt-3 inline-block text-sm font-semibold text-red-600 hover:underline" href={`mailto:${person.email}`}>
          {person.email}
        </a>
      )}
    </article>
  )
}

export default async function AboutPage() {
  const data = await getAboutPageData()
  const heroPhoto = getImageUrl(data.photo)
  const descriptionHtml = lexicalToHtml(data.description)

  return (
    <Layout>
      <main className="bg-white">
        <section className="border-b border-red-100 bg-red-50/60">
          <div className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-red-600">{data.eyebrow || defaults.eyebrow}</p>
              <h1 className="mt-2 text-3xl font-black text-gray-950 md:text-5xl">{data.headline || defaults.headline}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-gray-700 md:text-lg">
                {data.summary || defaults.summary}
              </p>
            </div>
            {heroPhoto && (
              <img
                src={heroPhoto}
                alt={data.headline || 'Bullet Reporter'}
                className="aspect-[16/10] w-full border-4 border-white object-cover shadow-lg"
                loading="eager"
              />
            )}
          </div>
        </section>

        <section className="container mx-auto grid gap-8 px-4 py-10 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6 text-gray-700">
            {descriptionHtml ? (
              <div
                className="prose max-w-none prose-headings:text-gray-950 prose-a:text-red-600"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            ) : (
              <>
                <h2 className="text-2xl font-black text-gray-950">Our Purpose</h2>
                <p className="leading-7">{data.mission || defaults.mission}</p>
              </>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <PersonCard person={data.chiefEditor} />
              <PersonCard person={data.editor} />
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-2xl font-black text-gray-950">Technology And Management</h2>
              <p className="mt-3 leading-7">{data.technologyManagement || defaults.technologyManagement}</p>
            </div>
          </div>

          <aside className="border-l-4 border-red-600 bg-gray-50 p-6">
            <h2 className="text-xl font-black text-gray-950">Editorial Ownership</h2>
            <p className="mt-3 text-sm leading-7 text-gray-700">{data.ownership || defaults.ownership}</p>
          </aside>
        </section>
      </main>
    </Layout>
  )
}
