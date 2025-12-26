'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useField, useFormFields, FieldLabel } from '@payloadcms/ui'

interface Media {
  id: string
  filename?: string
  url?: string
  thumbnailURL?: string
  alt?: string
}

interface Product {
  id: string
  images?: (string | Media)[]
}

export const VariationImagesField: React.FC<{
  path: string
  field: {
    name: string
    label?: string
    required?: boolean
  }
}> = ({ path, field }) => {
  const { value, setValue } = useField<string[]>({ path })
  const [productImages, setProductImages] = useState<Media[]>([])
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [productId, setProductId] = useState<string | null>(null)

  // Watch the product field
  const productField = useFormFields(([fields]) => fields.product)

  useEffect(() => {
    const prodValue = productField?.value
    if (prodValue) {
      const id = typeof prodValue === 'object' && prodValue !== null 
        ? (prodValue as { id?: string }).id 
        : prodValue
      if (typeof id === 'string') {
        setProductId(id)
      }
    } else {
      setProductId(null)
    }
  }, [productField])

  // Fetch product images when product changes
  useEffect(() => {
    if (!productId) {
      setProductImages([])
      setLoading(false)
      return
    }

    const fetchProductImages = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/products/${productId}?depth=1`)
        const product: Product = await res.json()

        if (product.images && Array.isArray(product.images)) {
          const images: Media[] = product.images
            .map((img) => {
              if (typeof img === 'object' && img !== null) {
                return img as Media
              }
              return null
            })
            .filter((img): img is Media => img !== null)
          
          setProductImages(images)
        } else {
          setProductImages([])
        }
      } catch (error) {
        console.error('Error fetching product images:', error)
        setProductImages([])
      }
      setLoading(false)
    }

    fetchProductImages()
  }, [productId])

  // Initialize selected images from current value
  useEffect(() => {
    if (value && Array.isArray(value)) {
      setSelectedImages(new Set(value))
    }
  }, [])

  // Toggle image selection
  const toggleImage = useCallback((imageId: string) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(imageId)) {
        newSet.delete(imageId)
      } else {
        newSet.add(imageId)
      }
      // Update field value
      setValue(Array.from(newSet))
      return newSet
    })
  }, [setValue])

  if (!productId) {
    return (
      <div className="field-type">
        <FieldLabel label={field.label || 'Images'} required={field.required} />
        <p style={{ color: 'var(--theme-elevation-500)', marginTop: '0.5rem' }}>
          Please select a product first to see available images.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="field-type">
        <FieldLabel label={field.label || 'Images'} required={field.required} />
        <p style={{ color: 'var(--theme-elevation-500)', marginTop: '0.5rem' }}>
          Loading product images...
        </p>
      </div>
    )
  }

  if (productImages.length === 0) {
    return (
      <div className="field-type">
        <FieldLabel label={field.label || 'Images'} required={field.required} />
        <p style={{ color: 'var(--theme-elevation-500)', marginTop: '0.5rem' }}>
          No images found for this product. Add images to the product first.
        </p>
      </div>
    )
  }

  return (
    <div className="field-type">
      <FieldLabel label={field.label || 'Images'} required={field.required} />
      <p
        style={{
          color: 'var(--theme-elevation-500)',
          marginTop: '0.25rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
        }}
      >
        Click to select images for this variation from the product gallery.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {productImages.map((image) => {
          const isSelected = selectedImages.has(image.id)
          const imageUrl = image.thumbnailURL || image.url

          return (
            <div
              key={image.id}
              onClick={() => toggleImage(image.id)}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: '8px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: isSelected 
                  ? '3px solid var(--theme-success-500)' 
                  : '2px solid var(--theme-elevation-150)',
                opacity: isSelected ? 1 : 0.7,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1'
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = isSelected ? '1' : '0.7'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={image.alt || image.filename || 'Product image'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'var(--theme-elevation-100)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--theme-elevation-500)',
                  }}
                >
                  No preview
                </div>
              )}
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: 'var(--theme-success-500)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  ✓
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selectedImages.size > 0 && (
        <p
          style={{
            marginTop: '0.75rem',
            fontSize: '0.875rem',
            color: 'var(--theme-success-500)',
          }}
        >
          {selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} selected
        </p>
      )}
    </div>
  )
}
