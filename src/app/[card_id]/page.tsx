import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ExternalLink, 
  Heart,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Globe,
  Phone,
  Mail,
  MessageSquare,
  Camera,
  Users
} from "lucide-react"
import { eventOperations, imageOperations, subEventOperations, analyticsOperations } from '@/lib/supabase'

interface EventPageProps {
  params: {
    card_id: string
  }
}

// Icon mapping for social links
const getSocialIcon = (name: string) => {
  const lowerName = name.toLowerCase()
  if (lowerName.includes('instagram')) return Instagram
  if (lowerName.includes('youtube')) return Youtube
  if (lowerName.includes('facebook')) return Facebook
  if (lowerName.includes('twitter')) return Twitter
  if (lowerName.includes('phone')) return Phone
  if (lowerName.includes('email') || lowerName.includes('mail')) return Mail
  return Globe
}

export default async function EventPage({ params }: EventPageProps) {
  const { card_id } = await params

  // Fetch event data
  const event = await eventOperations.getEventByCardId(card_id)
  if (!event) {
    notFound()
  }

  // Track page view
  try {
    await analyticsOperations.trackEvent(
      event.id,
      'page_viewed',
      {
        card_id: card_id,
        timestamp: new Date().toISOString()
      }
    )
  } catch (err) {
    console.error('Failed to track page view:', err)
  }

  // Fetch event images
  const images = await imageOperations.getImagesForEvent(event.id)
  const coverImage = images?.find(img => img.type === 'cover')
  const galleryImages = images?.filter(img => img.type === 'gallery') || []

  // Fetch sub-events
  const subEvents = await subEventOperations.getSubEventsByEventId(event.id)

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
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.png" alt="Kekkon Logo" width={24} height={24} className="h-6 w-6" />
            <span className="text-xl font-bold text-gray-900">Kekkon</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Cover Image */}
        {coverImage && (
          <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8 shadow-2xl">
            <Image
              src={coverImage.url}
              alt={event.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <h1 className="text-3xl md:text-5xl font-bold mb-2">{event.title}</h1>
              {event.event_date && (
                <p className="text-lg md:text-xl opacity-90">
                  {formatDate(event.event_date)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Event Details */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Event Info */}
            <Card>
              <CardContent className="p-6">
                {!coverImage && (
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {event.title}
                  </h1>
                )}
                
                {event.description && (
                  <p className="text-gray-700 text-lg leading-relaxed mb-6">
                    {event.description}
                  </p>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {event.event_date && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Date</p>
                        <p className="text-gray-600">{formatDate(event.event_date)}</p>
                      </div>
                    </div>
                  )}

                  {event.event_time && (
                    <div className="flex items-center space-x-3">
                      <Clock className="h-5 w-5 text-purple-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Time</p>
                        <p className="text-gray-600">{formatTime(event.event_time)}</p>
                      </div>
                    </div>
                  )}

                  {event.venue && (
                    <div className="flex items-center space-x-3 md:col-span-2">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Venue</p>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-600">{event.venue}</p>
                          {event.maps_link && (
                            <Link href={event.maps_link} target="_blank">
                              <Button variant="outline" size="sm">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Map
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            {event.instructions && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions</h2>
                  <p className="text-gray-700 leading-relaxed">{event.instructions}</p>
                </CardContent>
              </Card>
            )}

            {/* Custom QR Scanner */}
            {event.custom_qr_url && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {event.custom_qr_title || 'Additional Information'}
                  </h2>
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      Scan the QR code or click the button below to access additional information.
                    </p>
                    <Link href={event.custom_qr_url} target="_blank">
                      <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        {event.custom_qr_title || 'Visit Link'}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sub-Events */}
            {subEvents && subEvents.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Event Schedule</h2>
                  <div className="space-y-4">
                    {subEvents.map((subEvent, index) => (
                      <div key={subEvent.id} className="border-l-4 border-purple-500 pl-4 py-3 bg-purple-50 rounded-r-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{subEvent.title}</h3>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            {index + 1}
                          </span>
                        </div>
                        
                        {subEvent.description && (
                          <p className="text-gray-700 text-sm mb-3">{subEvent.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          {subEvent.event_date && (
                            <div className="flex items-center text-gray-600">
                              <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                              {formatDate(subEvent.event_date)}
                            </div>
                          )}
                          
                          {subEvent.event_time && (
                            <div className="flex items-center text-gray-600">
                              <Clock className="h-4 w-4 mr-2 text-purple-600" />
                              {formatTime(subEvent.event_time)}
                            </div>
                          )}
                          
                          {subEvent.venue && (
                            <div className="flex items-center text-gray-600 md:col-span-2">
                              <MapPin className="h-4 w-4 mr-2 text-purple-600" />
                              <span className="flex-1">{subEvent.venue}</span>
                              {subEvent.maps_link && (
                                <Link href={subEvent.maps_link} target="_blank">
                                  <Button variant="outline" size="sm" className="ml-2">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Map
                                  </Button>
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {subEvent.instructions && (
                          <div className="mt-3 p-2 bg-white rounded border-l-2 border-purple-300">
                            <p className="text-xs text-gray-600 font-medium mb-1">Instructions:</p>
                            <p className="text-sm text-gray-700">{subEvent.instructions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gallery Preview */}
            {galleryImages.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Gallery</h2>
                    <Link href={`/${card_id}/gallery`}>
                      <Button variant="outline" size="sm">
                        <Camera className="h-4 w-4 mr-2" />
                        View All
                      </Button>
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {galleryImages.slice(0, 6).map((image, index) => (
                      <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={image.url}
                          alt={`Gallery image ${index + 1}`}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    ))}
                  </div>
                  {galleryImages.length > 6 && (
                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-600">
                        +{galleryImages.length - 6} more photos
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {event.maps_link && (
                    <Link href={`/${card_id}/venue`}>
                      <Button variant="outline" className="w-full justify-start">
                        <MapPin className="h-4 w-4 mr-2" />
                        Get Directions
                      </Button>
                    </Link>
                  )}
                  
                  <Link href={`/${card_id}/rsvp`}>
                    <Button className="w-full justify-start bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                      <Users className="h-4 w-4 mr-2" />
                      RSVP Now
                    </Button>
                  </Link>

                  <Link href={`/${card_id}/guestbook`}>
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Leave a Message
                    </Button>
                  </Link>

                  {galleryImages.length > 0 && (
                    <Link href={`/${card_id}/gallery`}>
                      <Button variant="outline" className="w-full justify-start">
                        <Camera className="h-4 w-4 mr-2" />
                        View Gallery
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            {event.social_links && event.social_links.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Connect With Us</h3>
                  <div className="space-y-3">
                    {event.social_links.map((link, index) => {
                      const IconComponent = getSocialIcon(link.name)
                      return (
                        <Link key={index} href={link.url} target="_blank">
                          <Button variant="outline" className="w-full justify-start">
                            <IconComponent className="h-4 w-4 mr-2" />
                            {link.name}
                          </Button>
                        </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Event Details Summary */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-4">Event Details</h3>
                <div className="space-y-3 text-sm">
                  {event.event_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{formatDate(event.event_date)}</span>
                    </div>
                  )}
                  {event.event_time && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">{formatTime(event.event_time)}</span>
                    </div>
                  )}
                  {event.venue && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Venue:</span>
                      <span className="font-medium text-right">{event.venue}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* About Section */}
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
            <p className="text-gray-600 mb-6">
              This invitation was created with Kekkon - Smart Invitations. 
              Create beautiful, interactive invitations for your special events.
            </p>
            <Link href="/">
              <Button variant="outline">
                Create Your Own Invitation
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}