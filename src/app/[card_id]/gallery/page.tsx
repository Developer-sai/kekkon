import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { eventOperations, imageOperations, analyticsOperations } from '@/lib/supabase'
import EventGallery from '@/components/guest/EventGallery'

interface GalleryPageProps {
  params: {
    card_id: string
  }
}

export default async function GalleryPage({ params }: GalleryPageProps) {
  const { card_id } = params

  // Fetch event data
  const event = await eventOperations.getEventByCardId(card_id)
  if (!event) {
    notFound()
  }

  // Fetch event images
  const images = await imageOperations.getImagesForEvent(event.id)

  // Track page view
  try {
    await analyticsOperations.trackEvent(
      event.id,
      'gallery_page_viewed',
      {
        card_id: params.card_id,
        timestamp: new Date().toISOString()
      }
    )
  } catch (error) {
    console.error('Failed to track page view:', error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo.png" alt="Kekkon Logo" width={24} height={24} className="h-6 w-6" />
              <span className="text-xl font-bold text-gray-900">Kekkon</span>
            </Link>
            
            <Link href={`/${card_id}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Event
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {event.title} Gallery
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Browse through the beautiful moments captured at this special event.
          </p>
        </div>

        {/* Event Gallery */}
        <EventGallery event={event} initialImages={images || []} />
      </div>
    </div>
  )
}