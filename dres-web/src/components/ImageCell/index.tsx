'use client'

import React, { useEffect, useState } from 'react'

interface Media {
  id: string
  url?: string
  thumbnailURL?: string
  filename?: string
}

export const ImageCell: React.FC<{
  cellData: (string | Media)[] | null | undefined
  rowData?: { id?: string }
  collectionSlug?: string
}> = ({ cellData, rowData, collectionSlug }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!cellData || !Array.isArray(cellData) || cellData.length === 0) {
      setImageUrl(null)
      return
    }

    const firstImage = cellData[0]

    // If already populated with URL
    if (typeof firstImage === 'object' && firstImage !== null) {
      const url = firstImage.thumbnailURL || firstImage.url
      if (url) {
        setImageUrl(url)
        return
      }
    }

    // If we only have an ID, fetch the media
    const imageId = typeof firstImage === 'object' ? firstImage.id : firstImage
    if (imageId && typeof imageId === 'string') {
      setLoading(true)
      fetch(`/api/media/${imageId}?depth=0`)
        .then((res) => res.json())
        .then((media) => {
          if (media?.thumbnailURL || media?.url) {
            setImageUrl(media.thumbnailURL || media.url)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [cellData])

  const imageCount = cellData?.length || 0

  if (!cellData || !Array.isArray(cellData) || cellData.length === 0) {
    return (
      <div
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: 'var(--theme-elevation-100)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--theme-elevation-400)',
          fontSize: '10px',
        }}
      >
        —
      </div>
    )
  }

  if (loading || !imageUrl) {
    return (
      <div
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: 'var(--theme-elevation-150)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--theme-elevation-500)',
          fontSize: '11px',
          fontWeight: 500,
        }}
      >
        {imageCount}
      </div>
    )
  }

  return (
    <div
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '4px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <img
        src={imageUrl}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      {imageCount > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'white',
            fontSize: '9px',
            padding: '1px 4px',
            borderRadius: '2px',
          }}
        >
          +{imageCount - 1}
        </div>
      )}
    </div>
  )
}
