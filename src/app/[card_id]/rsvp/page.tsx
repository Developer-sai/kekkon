import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { eventOperations, analyticsOperations } from '@/lib/supabase'
import RSVPForm from '@/components/guest/RSVPForm'

interface RSVPPageProps {
  params: {
    card_id: string
  }
}

export default async function RSVPPage({ params }: RSVPPageProps) {
  const { card_id } = params

  // Fetch event data
  const event = await eventOperations.getEventByCardId(card_id)
  if (!event) {
    notFound()
  }

  // Track page view
  try {
    await analyticsOperations.trackEvent(
      event.id,
      'rsvp_page_viewed',
      {
        card_id: params.card_id,
        timestamp: new Date().toISOString()
      }
    )
  } catch (err) {
    console.error('Failed to track RSVP page view:', err)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Event Summary */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            RSVP for {event.title}
          </h1>
          
          <div className="flex flex-wrap justify-center gap-6 text-gray-600 mb-6">
            {event.event_date && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Date:</span>
                <span>{formatDate(event.event_date)}</span>
              </div>
            )}
            
            {event.event_time && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Time:</span>
                <span>{formatTime(event.event_time)}</span>
              </div>
            )}
            
            {event.venue && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Venue:</span>
                <span>{event.venue}</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="text-gray-700 text-lg max-w-2xl mx-auto">
              {event.description}
            </p>
          )}
        </div>

        {/* RSVP Form */}
        <RSVPForm event={event} />

        {/* Additional Information */}
        {event.instructions && (
          <div className="mt-8 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Important Information</h3>
              <p className="text-blue-800">{event.instructions}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}