import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const databaseUrl = process.env.PAYLOAD_DATABASE_URL || 'file:./payload.db'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || 'change-this-payload-secret-for-production',
  sharp,

  admin: {
    user: 'users',
    importMap: {
      baseDir: dirname,
      importMapFile: path.resolve(dirname, 'src/app/(payload)/admin/importMap.js'),
    },
  },

  db: sqliteAdapter({
    client: {
      url: databaseUrl,
    },
  }),

  editor: lexicalEditor(),

  collections: [
    {
      slug: 'users',
      auth: true,
      admin: {
        useAsTitle: 'name',
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        {
          name: 'role',
          type: 'select',
          options: [
            { label: 'Admin', value: 'admin' },
            { label: 'Editor', value: 'editor' },
            { label: 'Author', value: 'author' },
          ],
          defaultValue: 'author',
          required: true,
        },
        { name: 'bio', type: 'textarea' },
        { name: 'avatar', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      slug: 'media',
      upload: {
        staticDir: path.resolve(dirname, 'public/media'),
        mimeTypes: ['image/*', 'video/*'],
        imageSizes: [
          { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
          { name: 'card', width: 768, height: 432, position: 'centre' },
          { name: 'hero', width: 1280, height: 720, position: 'centre' },
        ],
      },
      admin: {
        useAsTitle: 'alt',
      },
      fields: [
        { name: 'alt', type: 'text', required: true },
        { name: 'caption', type: 'text' },
      ],
    },
    {
      slug: 'categories',
      admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'slug', 'order'],
      },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'slug', type: 'text', required: true, unique: true },
        { name: 'nameHindi', type: 'text', label: 'Name (Hindi)' },
        { name: 'description', type: 'textarea' },
        { name: 'color', type: 'text', label: 'Color (hex)', defaultValue: '#dc2626' },
        { name: 'order', type: 'number', defaultValue: 0 },
      ],
    },
    {
      slug: 'news',
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'category', 'status', 'publishedAt'],
      },
      versions: {
        drafts: true,
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'titleHindi', type: 'text', label: 'Title (Hindi)' },
        { name: 'slug', type: 'text', required: true, unique: true },
        { name: 'excerpt', type: 'textarea', label: 'Excerpt / Summary' },
        {
          name: 'content',
          type: 'richText',
          required: true,
        },
        {
          name: 'featuredImage',
          type: 'upload',
          relationTo: 'media',
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
        },
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'users',
          required: true,
        },
        {
          name: 'tags',
          type: 'array',
          fields: [{ name: 'tag', type: 'text' }],
        },
        {
          name: 'isBreaking',
          type: 'checkbox',
          label: 'Breaking News',
          defaultValue: false,
        },
        {
          name: 'isFeatured',
          type: 'checkbox',
          label: 'Featured Article',
          defaultValue: false,
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
          defaultValue: 'draft',
          required: true,
        },
        {
          name: 'publishedAt',
          type: 'date',
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
        {
          name: 'views',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true },
        },
        {
          name: 'seo',
          type: 'group',
          label: 'SEO',
          fields: [
            { name: 'metaTitle', type: 'text' },
            { name: 'metaDescription', type: 'textarea' },
            { name: 'keywords', type: 'text' },
          ],
        },
      ],
    },
    {
      slug: 'comments',
      admin: {
        useAsTitle: 'authorName',
        defaultColumns: ['authorName', 'article', 'status', 'createdAt'],
      },
      fields: [
        { name: 'authorName', type: 'text', required: true },
        { name: 'authorEmail', type: 'email' },
        { name: 'content', type: 'textarea', required: true },
        {
          name: 'article',
          type: 'relationship',
          relationTo: 'news',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
          ],
          defaultValue: 'pending',
        },
      ],
    },
    {
      slug: 'advertisements',
      admin: {
        useAsTitle: 'title',
        defaultColumns: ['title', 'position', 'isActive', 'startsAt', 'endsAt'],
      },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
        { name: 'link', type: 'text' },
        {
          name: 'position',
          type: 'select',
          options: [
            { label: 'Top Banner', value: 'top_banner' },
            { label: 'Middle Banner', value: 'middle_banner' },
            { label: 'Bottom Banner', value: 'bottom_banner' },
            { label: 'Sidebar', value: 'sidebar' },
            { label: 'Bottom Sidebar', value: 'bottom_sidebar' },
          ],
          required: true,
        },
        { name: 'isActive', type: 'checkbox', defaultValue: true },
        { name: 'startsAt', type: 'date' },
        { name: 'endsAt', type: 'date' },
      ],
    },
  ],

  globals: [
    {
      slug: 'settings',
      label: 'Site Settings',
      fields: [
        { name: 'siteName', type: 'text', defaultValue: 'Bullet Reporter' },
        { name: 'tagline', type: 'text' },
        { name: 'logo', type: 'upload', relationTo: 'media' },
        { name: 'favicon', type: 'upload', relationTo: 'media' },
        {
          name: 'socialLinks',
          type: 'group',
          fields: [
            { name: 'facebook', type: 'text' },
            { name: 'twitter', type: 'text' },
            { name: 'instagram', type: 'text' },
            { name: 'youtube', type: 'text' },
          ],
        },
        { name: 'footerText', type: 'textarea' },
        { name: 'breakingNewsTicker', type: 'checkbox', defaultValue: true },
      ],
    },
  ],

  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },
})
