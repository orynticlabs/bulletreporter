'use client'

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

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
      { name: 'विज्ञापन दें', href: '/advertise' },
      { name: 'करियर', href: '/career' },
      { name: 'प्राइवेसी पॉलिसी', href: '/privacy-policy' },
      { name: 'टर्म्स ऑफ यूज़', href: '/terms' },
    ],
    bottomLinks: [
      { name: 'हमारे बारे में', href: '/about' },
      { name: 'संपर्क', href: '/contact' },
      { name: 'T&C', href: '/terms' },
    ],
    copyright: (
      <>© 2026 बुलेट रिपोर्टर। Built by{' '}
        <a href="https://orynticlabs.com/" target="_blank" rel="noopener noreferrer" className="text-[#e84118] hover:underline">OrynticLabs</a>
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
      { name: 'Advertise', href: '/advertise' },
      { name: 'Career', href: '/career' },
      { name: 'Privacy Policy', href: '/privacy-policy' },
      { name: 'Terms of Use', href: '/terms' },
    ],
    bottomLinks: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact', href: '/contact' },
      { name: 'T&C', href: '/terms' },
    ],
    copyright: (
      <>© 2026 Bullet Reporter. Built by{' '}
        <a href="https://orynticlabs.com/" target="_blank" rel="noopener noreferrer" className="text-[#e84118] hover:underline">OrynticLabs</a>
      </>
    ),
    mainCatName: 'Top News',
  },
};

const socialLinks = [
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    icon: <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />,
  },
  {
    name: 'Twitter',
    href: 'https://twitter.com',
    icon: <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />,
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.441s.645 1.441 1.441 1.441c.795 0 1.439-.645 1.439-1.441s-.644-1.441-1.439-1.441z" />,
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com',
    icon: <path d="M23.498 6.186a2.997 2.997 0 0 0-2.108-2.108C19.625 3.5 12 3.5 12 3.5s-7.625 0-9.39.578A2.997 2.997 0 0 0 .502 6.186C0 7.94 0 12 0 12s0 4.06.502 5.814a2.997 2.997 0 0 0 2.108 2.108C4.375 20.5 12 20.5 12 20.5s7.625 0 9.39-.578a2.997 2.997 0 0 0 2.108-2.108C24 16.06 24 12 24 12s0-4.06-.502-5.814zM9.75 15.75V8.25l6.5 3.75-6.5 3.75z" />,
  },
  {
    name: 'WhatsApp',
    href: 'https://whatsapp.com',
    icon: <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />,
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
  const [lang, setLang] = useState('hi');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const t = CONTENT[lang];

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await axios.get(`${apiUrl}/categories`);
        return response.data;
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  })

      // Normalize categories responses that wrap results in docs.
  const categoriesArray = Array.isArray(categories)
    ? categories
    : (categories && (Array.isArray(categories.docs) ? categories.docs : []))

  const categoryLinks = [
    { name: t.mainCatName, href: '/' },
    ...categoriesArray.slice(0, 9).map(cat => ({
      name: lang === 'hi' ? cat.name : (cat.nameEn || cat.name),
      href: `/category/${encodeURIComponent(cat.name)}`,
    })),
  ];

  return (
    <footer className="bg-[#0a0a0a] text-[#e5e5e5] border-t-2 border-[#e84118] font-[Mukta,sans-serif]">
      {/* Main grid */}
      <div className="container mx-auto px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[260px_1fr_1fr_1fr] gap-8 lg:gap-10">

          {/* Brand column */}
          <div>
            <div className="mb-4">
              <img
                src="/logo.png"
                alt="Bullet Reporter"
                className="h-14 w-auto object-contain"
              />
            </div>
            <p className="text-[#888] text-sm leading-7 mb-5">{t.tagline}</p>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map(link => (
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
            <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
              {categoryLinks.map(cat => (
                <li key={cat.name}>
                  <a
                    href={cat.href}
                    className="text-[#aaa] hover:text-[#e84118] text-sm leading-8 flex items-center gap-1.5 transition-colors duration-150"
                  >
                    <span className="text-[#e84118] text-base opacity-70">›</span>
                    {cat.name}
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
                    href={link.href}
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
                  <span className="text-[#ccc] text-sm">bulletreporter1@gmail.com</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[#e84118] mt-0.5 flex-shrink-0 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <span className="block text-[11px] text-[#666] uppercase tracking-wider mb-0.5">{t.phone}</span>
                  <span className="text-[#ccc] text-sm">+91 9425470033</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-4 h-4 text-[#e84118] mt-0.5 flex-shrink-0 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <span className="block text-[11px] text-[#666] uppercase tracking-wider mb-0.5">{t.address}</span>
                  <span className="text-[#ccc] text-sm">Rewa, Madhya Pradesh</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mx-6 lg:mx-8" style={{ background: 'linear-gradient(to right, transparent, #2a2a2a 20%, #2a2a2a 80%, transparent)' }} />

      {/* Bottom bar */}
      <div className="container mx-auto px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[#666] text-xs">{t.copyright}</p>

        {/* Language Toggle */}
        <div className="flex rounded overflow-hidden border border-[#2a2a2a]" role="group" aria-label="Language toggle">
          <button
            onClick={() => setLang('hi')}
            className={`px-3 py-1 text-xs font-semibold transition-all duration-150 ${lang === 'hi' ? 'bg-[#e84118] text-white' : 'bg-[#141414] text-[#666] hover:text-[#ccc] hover:bg-[#1e1e1e]'}`}
          >
            हिं
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1 text-xs font-semibold transition-all duration-150 ${lang === 'en' ? 'bg-[#e84118] text-white' : 'bg-[#141414] text-[#666] hover:text-[#ccc] hover:bg-[#1e1e1e]'}`}
          >
            EN
          </button>
        </div>

        <div className="flex gap-5">
          {t.bottomLinks.map(link => (
            <a key={link.name} href={link.href} className="text-[#666] hover:text-[#e84118] text-xs transition-colors duration-150">
              {link.name}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
