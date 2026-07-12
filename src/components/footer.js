'use client'

import { useQuery } from '@tanstack/react-query'
import {
  fetchPayloadCategories,
  fetchPayloadSettings,
  getCategoryDisplayName,
  getCategoryRouteKey,
} from '@/utils/payloadCategories'
import { useLanguage } from '@/contexts/LanguageContext'

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || ''
const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || ''
const CONTACT_PHONE_LABEL = process.env.NEXT_PUBLIC_CONTACT_PHONE_LABEL || CONTACT_PHONE
const CONTACT_LOCATION = process.env.NEXT_PUBLIC_CONTACT_LOCATION || ''
const DEVELOPER_NAME = process.env.NEXT_PUBLIC_DEVELOPER_NAME || ''
const DEVELOPER_URL = process.env.NEXT_PUBLIC_DEVELOPER_URL || ''
const FACEBOOK_URL = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_URL || ''
const INSTAGRAM_URL = process.env.NEXT_PUBLIC_INSTAGRAM_URL || ''
const YOUTUBE_URL = process.env.NEXT_PUBLIC_YOUTUBE_URL || ''
const FOOTER_CATEGORY_LIMIT = 9

const DeveloperCredit = () => (
  DEVELOPER_URL ? (
    <a href={DEVELOPER_URL} target="_blank" rel="noopener noreferrer" className="text-[#e84118] hover:underline">{DEVELOPER_NAME}</a>
  ) : (
    <span>{DEVELOPER_NAME}</span>
  )
)

const CONTENT = {
  hi: {
    tagline: 'मध्य प्रदेश और छत्तीसगढ़ की राजनीति, मनोरंजन, बॉलीवुड, व्यापार और खेल जगत की सभी नवीनतम खबरों का अग्रणी हिंदी समाचार।',
    col1: 'श्रेणियां',
    col2: 'त्वरित लिंक',
    col3: 'संपर्क जानकारी',
    newsDesk: 'समाचार डेस्क',
    phone: 'फोन',
    address: 'पता',
    quickLinks: [
      { name: 'हमारे बारे में', href: '/about' },
      { name: 'संपर्क करें', href: '/contact' },
      { name: 'प्राइवेसी पॉलिसी', href: '/privacy-policy' },
      { name: 'टर्म्स ऑफ यूज़', href: '/terms' },
    ],
    copyright: (
      <>© 2026 बुलेट रिपोर्टर। Developed by{' '}
        <DeveloperCredit />
      </>
    ),
    mainCatName: 'मुख्य समाचार',
  },
  en: {
    tagline: 'Leading Hindi news portal covering politics, entertainment, Bollywood, business, and sports from Madhya Pradesh and Chhattisgarh.',
    col1: 'Categories',
    col2: 'Quick Links',
    col3: 'Contact Info',
    newsDesk: 'News Desk',
    phone: 'Phone',
    address: 'Address',
    quickLinks: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Terms of Use', href: '/terms' },
    ],
    copyright: (
      <>© 2026 Bullet Reporter. Developed by{' '}
        <DeveloperCredit />
      </>
    ),
    mainCatName: 'Top News',
  },
};

const socialLinks = [
  {
    name: 'Facebook',
    href: FACEBOOK_URL,
    icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
  },
  {
    name: 'Instagram',
    href: INSTAGRAM_URL,
    icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.441s.645 1.441 1.441 1.441c.795 0 1.439-.645 1.439-1.441s-.644-1.441-1.439-1.441z" />,
  },
  {
    name: 'YouTube',
    href: YOUTUBE_URL,
    icon: <path d="M23.498 6.186a2.997 2.997 0 0 0-2.108-2.108C19.625 3.5 12 3.5 12 3.5s-7.625 0-9.39.578A2.997 2.997 0 0 0 .502 6.186C0 7.94 0 12 0 12s0 4.06.502 5.814a2.997 2.997 0 0 0 2.108 2.108C4.375 20.5 12 20.5 12 20.5s7.625 0 9.39-.578a2.997 2.997 0 0 0 2.108-2.108C24 16.06 24 12 24 12s0-4.06-.502-5.814zM9.75 15.75V8.25l6.5 3.75-6.5 3.75z" />,
  },
];

function ColTitle({ children }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold text-white tracking-widest uppercase mb-5 pb-3 border-b border-[#e84118]">
      <span className="inline-block w-[3px] h-[14px] bg-[#e84118] rounded-sm" />
      {children}
    </h3>
  );
}

export default function Footer() {
  const { lang } = useLanguage()
  const t = CONTENT[lang]
  const getLangPath = (p) => lang === 'en' ? `/en${p}` : p

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchPayloadCategories,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  })

  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: fetchPayloadSettings,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
  })

  const categoriesArray = Array.isArray(categories) ? categories : []

  const categoryLinks = [
    { name: t.mainCatName, href: getLangPath('/') },
    ...categoriesArray.slice(0, FOOTER_CATEGORY_LIMIT).map(cat => ({
      name: getCategoryDisplayName(cat, lang),
      href: getLangPath(`/category/${encodeURIComponent(getCategoryRouteKey(cat))}`),
      key: cat.id || getCategoryRouteKey(cat),
    })),
  ];

  return (
    <footer className="bg-[#0a0a0a] text-[#e5e5e5] border-t-2 border-[#e84118] font-[Mukta,sans-serif]">
      {/* Main grid */}
      <div className="container mx-auto px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">

          {/* Brand column */}
          <div>
            <div className="mb-4">
              <a href={getLangPath('/')} aria-label="Bullet Reporter — Home">
                <img
                  src="/logo.png"
                  alt="Bullet Reporter"
                  className="h-14 w-auto object-contain"
                />
              </a>
            </div>
            <p className="mb-5 text-sm leading-7 text-[#888] sm:text-justify">
              {settings?.tagline || t.tagline}
            </p>
            <div className="flex flex-wrap gap-2">
              {socialLinks.filter(link => link.href).map(link => (
                <a
                  key={link.name}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.name}
                  className="w-9 h-9 rounded-full border border-[#2a2a2a] bg-[#141414] flex items-center justify-center text-[#aaa] hover:border-[#e84118] hover:text-[#e84118] hover:bg-[rgba(232,65,24,0.08)] transition-all duration-200 hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">{link.icon}</svg>
                </a>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <ColTitle>{t.col1}</ColTitle>
            <ul className="grid grid-cols-1 gap-x-3 gap-y-1 min-[420px]:grid-cols-2">
              {categoryLinks.map(cat => (
                <li key={cat.key || cat.href}>
                  <a
                    href={cat.href}
                    className="flex min-w-0 items-center gap-1.5 text-sm leading-8 text-[#aaa] transition-colors duration-150 hover:text-[#e84118]"
                  >
                    <span className="text-[#e84118] text-base opacity-70">›</span>
                    <span className="truncate">{cat.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <ColTitle>{t.col2}</ColTitle>
            <ul className="flex flex-col gap-1">
              {t.quickLinks.map(link => (
                <li key={link.name}>
                  <a
                    href={getLangPath(link.href)}
                    className="text-[#aaa] hover:text-[#e84118] text-sm leading-8 flex items-center gap-1.5 transition-colors duration-150"
                  >
                    <span className="text-[#e84118] text-base opacity-70">›</span>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <ColTitle>{t.col3}</ColTitle>
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <span className="mt-1 w-2 h-2 rounded-full bg-[#2ecc71] flex-shrink-0 animate-pulse" />
                <div>
                  <span className="block text-[11px] text-[#666] uppercase tracking-wider mb-0.5">{t.newsDesk}</span>
                  {CONTACT_EMAIL ? (
                    <a href={`mailto:${CONTACT_EMAIL}`} className="break-all text-sm text-[#ccc] hover:text-white transition-colors">{CONTACT_EMAIL}</a>
                  ) : (
                    <span className="text-sm text-[#ccc]">Email is not configured.</span>
                  )}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[#e84118] mt-0.5 flex-shrink-0 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <span className="block text-[11px] text-[#666] uppercase tracking-wider mb-0.5">{t.phone}</span>
                  {CONTACT_PHONE ? (
                    <a href={`tel:${CONTACT_PHONE}`} className="text-[#ccc] text-sm hover:text-white transition-colors">{CONTACT_PHONE_LABEL}</a>
                  ) : (
                    <span className="text-[#ccc] text-sm">Phone is not configured.</span>
                  )}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[#e84118] mt-0.5 flex-shrink-0 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <span className="block text-[11px] text-[#666] uppercase tracking-wider mb-0.5">{t.address}</span>
                  <span className="text-[#ccc] text-sm">{CONTACT_LOCATION || 'Location is not configured.'}</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mx-6 lg:mx-8" style={{ background: 'linear-gradient(to right, transparent, #2a2a2a 20%, #2a2a2a 80%, transparent)' }} />

      {/* Bottom bar */}
      <div className="container mx-auto flex flex-row flex-nowrap items-center justify-between gap-2 overflow-x-auto px-3 py-4 text-left sm:gap-4 lg:px-8">
        <p className="shrink-0 whitespace-nowrap text-[9px] leading-4 text-[#666] min-[420px]:text-[10px] sm:text-xs">{t.copyright}</p>

        <span className="shrink-0 whitespace-nowrap text-right text-[9px] text-[#666] min-[420px]:text-[10px] sm:mr-24 sm:text-xs lg:mr-28">Version V2.0.4</span>
      </div>
    </footer>
  );
}
