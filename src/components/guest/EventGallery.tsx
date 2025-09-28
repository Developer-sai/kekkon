'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { 
  Camera, 
  Download, 
  Share2, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Grid3X3,
  List,
  Heart,
  Eye
} from "lucide-react"
import { imageOperations, analyticsOperations } from '@/lib/supabase'
import type { Event, EventImage } from '@/lib/supabase'

interface EventGalleryProps {
  event: Event
  initialImages?: EventImage[]
}

type ViewMode = 'grid' | 'masonry'

export default function EventGallery({ event, initialImages = [] }: EventGalleryProps) {
  const [images, setImages] = useState<EventImage[]>(initialImages)
  const [isLoading, setIsLoading] = useState(!initialImages.length)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filter, setFilter] = useState<'all' | 'cover' | 'gallery'>('all')

  const loadImages = async () => {
    try {
      const eventImages = await imageOperations.getImagesForEvent(event.id)
      setImages(eventImages || [])
    } catch (err) {
      console.error('Failed to load images:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!initialImages.length) {
      loadImages()
    }
  }, [event.id, initialImages.length, loadImages])

  const filteredImages = images.filter(image => {
    if (filter === 'all') return true
    return image.type === filter
  })

  const handleImageClick = async (index: number) => {
    setSelectedImageIndex(index)
    
    // Track analytics for image view
    try {
      await analyticsOperations.trackEvent(
        event.id,
        'image_viewed',
        {
          image_id: filteredImages[index].id,
          image_type: filteredImages[index].type
        }
      )
    } catch (err) {
      console.error('Failed to track image view:', err)
    }
  }

  const handleDownload = async (image: EventImage) => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${event.title}-${image.id}.jpg`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Track download analytics
      await analyticsOperations.trackEvent(
        event.id,
        'image_downloaded',
        {
          image_id: image.id,
          image_type: image.type
        }
      )
    } catch (err) {
      console.error('Failed to download image:', err)
    }
  }

  const handleShare = async (image: EventImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${event.title} - Photo`,
          text: `Check out this photo from ${event.title}`,
          url: image.url
        })
      } catch (err) {
        console.error('Failed to share:', err)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(image.url)
        // You could show a toast notification here
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
      }
    }
  }

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return
    
    const newIndex = direction === 'prev' 
      ? (selectedImageIndex - 1 + filteredImages.length) % filteredImages.length
      : (selectedImageIndex + 1) % filteredImages.length
    
    setSelectedImageIndex(newIndex)
  }

  const getImageGridClass = () => {
    if (viewMode === 'masonry') {
      return "columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4"
    }
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading gallery...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (images.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No photos available yet.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-purple-600" />
              Event Gallery
              <Badge variant="secondary" className="ml-2">
                {images.length} {images.length === 1 ? 'photo' : 'photos'}
              </Badge>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {/* Filter Buttons */}
              <div className="flex rounded-lg border">
                <Button
                  variant={filter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="rounded-r-none"
                >
                  All
                </Button>
                <Button
                  variant={filter === 'cover' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('cover')}
                  className="rounded-none border-x"
                >
                  Cover
                </Button>
                <Button
                  variant={filter === 'gallery' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter('gallery')}
                  className="rounded-l-none"
                >
                  Gallery
                </Button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex rounded-lg border">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'masonry' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('masonry')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className={getImageGridClass()}>
            {filteredImages.map((image, index) => (
              <div
                key={image.id}
                className={`relative group cursor-pointer ${
                  viewMode === 'masonry' ? 'break-inside-avoid' : 'aspect-square'
                } rounded-lg overflow-hidden bg-gray-100`}
                onClick={() => handleImageClick(index)}
              >
                <Image
                  src={image.url}
                  alt={image.filename || `Gallery image ${index + 1}`}
                  fill={viewMode === 'grid'}
                  width={viewMode === 'masonry' ? 400 : undefined}
                  height={viewMode === 'masonry' ? 300 : undefined}
                  className={`${
                    viewMode === 'grid' ? 'object-cover' : 'w-full h-auto'
                  } group-hover:scale-105 transition-transform duration-300`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                
                {/* Action Buttons */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(image)
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleShare(image)
                    }}
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Image Type Badge */}
                {image.type === 'cover' && (
                  <Badge className="absolute bottom-2 left-2 bg-purple-600">
                    Cover Photo
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Modal */}
      {selectedImageIndex !== null && (
        <Dialog open={true} onOpenChange={() => setSelectedImageIndex(null)}>
          <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
            <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={() => setSelectedImageIndex(null)}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Navigation Buttons */}
              {filteredImages.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                    onClick={() => navigateImage('prev')}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                    onClick={() => navigateImage('next')}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              {/* Image */}
              <div className="relative w-full h-full flex items-center justify-center">
                <Image
                  src={filteredImages[selectedImageIndex].url}
                  alt={filteredImages[selectedImageIndex].filename || 'Gallery image'}
                  fill
                  className="object-contain"
                  sizes="90vw"
                />
              </div>

              {/* Image Info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <div className="flex items-center justify-between text-white">
                  <div>
                    <p className="text-sm opacity-80">
                      {selectedImageIndex + 1} of {filteredImages.length}
                    </p>
                    {filteredImages[selectedImageIndex].filename && (
                      <p className="text-lg">
                        {filteredImages[selectedImageIndex].filename}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(filteredImages[selectedImageIndex])}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleShare(filteredImages[selectedImageIndex])}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}