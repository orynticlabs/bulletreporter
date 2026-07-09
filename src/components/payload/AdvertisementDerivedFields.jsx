'use client'

import React, { useEffect } from 'react'
import { useField } from '@payloadcms/ui'

const derivedByPosition = {
  top_banner: {
    bannerType: { value: 'large_ad_banner', label: 'Large Advertisement Banner' },
    size: { value: 'large', label: 'Large Banner Size (1300 x 160 px)' },
  },
  bottom_banner: {
    bannerType: { value: 'large_ad_banner', label: 'Large Advertisement Banner' },
    size: { value: 'large', label: 'Large Banner Size (1300 x 160 px)' },
  },
  sidebar: {
    bannerType: { value: 'square_banner', label: 'Square Banner' },
    size: { value: 'square', label: 'Square Banner Size (350 x 220 px)' },
  },
}

const styles = {
  field: { marginBottom: 24 },
  label: {
    color: 'var(--theme-text)',
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
  },
  required: { color: 'var(--theme-error-500)' },
  value: {
    alignItems: 'center',
    background: 'var(--theme-elevation-100)',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 4,
    color: 'var(--theme-elevation-700)',
    display: 'flex',
    minHeight: 48,
    padding: '0 16px',
  },
  description: {
    color: 'var(--theme-elevation-600)',
    fontSize: 13,
    lineHeight: 1.4,
    marginTop: 8,
  },
}

function DerivedField({ label, path, fieldKey, description }) {
  const { value: position } = useField({ path: 'position' })
  const { setValue } = useField({ path })
  const derived = derivedByPosition[position]?.[fieldKey]

  useEffect(() => {
    setValue(derived?.value || undefined)
  }, [derived?.value, setValue])

  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label} <span style={styles.required}>*</span>
      </label>
      <div style={styles.value}>
        {derived?.label || 'Select Legacy Position first'}
      </div>
      <div style={styles.description}>{description}</div>
    </div>
  )
}

export const AdvertisementBannerTypeField = () => (
  <DerivedField
    label="Banner Type"
    path="bannerType"
    fieldKey="bannerType"
    description="Auto-set from Legacy Position: Top/Footer use Large Advertisement Banner; Sidebar uses Square Banner."
  />
)

export const AdvertisementBannerSizeField = () => (
  <DerivedField
    label="Banner Size"
    path="size"
    fieldKey="size"
    description="Auto-set from Legacy Position: Top/Footer = 1300 x 160 px; Sidebar = 350 x 220 px."
  />
)
