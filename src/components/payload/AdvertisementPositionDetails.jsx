'use client'

import React from 'react'
import { useField } from '@payloadcms/ui'

const detailsByPosition = {
  top_banner: {
    title: 'Top / Header',
    bannerType: 'Large Advertisement Banner',
    size: 'Large Banner Size (1300 x 160 px)',
    limit: 'Only one active top/header advertisement can exist at a time.',
  },
  bottom_banner: {
    title: 'Bottom / Footer',
    bannerType: 'Large Advertisement Banner',
    size: 'Large Banner Size (1300 x 160 px)',
    limit: 'Only one active bottom/footer advertisement can exist at a time.',
  },
  sidebar: {
    title: 'Sidebar',
    bannerType: 'Square Banner',
    size: 'Square Banner Size (350 x 220 px)',
    limit: 'Up to three active sidebar advertisements can exist at a time.',
  },
}

const styles = {
  shell: {
    background: 'var(--theme-elevation-50)',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 4,
    marginBottom: 20,
    padding: 16,
  },
  label: {
    color: 'var(--theme-elevation-600)',
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  value: {
    color: 'var(--theme-text)',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
  },
  muted: {
    color: 'var(--theme-elevation-600)',
    fontSize: 13,
    lineHeight: 1.4,
    margin: 0,
  },
}

export const AdvertisementPositionDetails = () => {
  const { value } = useField({ path: 'position' })
  const details = detailsByPosition[value]

  if (!details) {
    return (
      <div style={styles.shell}>
        <p style={styles.muted}>Select a Legacy Position to see the required banner type and size.</p>
      </div>
    )
  }

  return (
    <div style={styles.shell}>
      <div style={styles.label}>Selected Position</div>
      <div style={styles.value}>{details.title}</div>
      <div style={styles.label}>Banner Type</div>
      <div style={styles.value}>{details.bannerType}</div>
      <div style={styles.label}>Banner Size</div>
      <div style={styles.value}>{details.size}</div>
      <p style={styles.muted}>{details.limit}</p>
    </div>
  )
}

export default AdvertisementPositionDetails
