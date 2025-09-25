'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, ArrowLeft } from "lucide-react"
import Link from 'next/link'

interface VenuePageProps {
  params: {
    card_id: string
  }
}

export default function VenuePage({ params }: VenuePageProps) {
  const { card_id } = params
  const router = useRouter()

  useEffect(() => {
    // In a real implementation, you would fetch the event data and redirect to the maps link
    // For now, we'll show a loading state and redirect after a short delay
    const redirectToMaps = async () => {
      try {
        // Fetch event data to get the maps link
        const response = await fetch(`/api/events/${card_id}`)
        if (response.ok) {
          const event = await response.json()
          if (event.maps_link) {
            window.location.href = event.maps_link
          } else {
            // Fallback to event page if no maps link
            router.push(`/${card_id}`)
          }
        } else {
          router.push(`/${card_id}`)
        }
      } catch (error) {
        console.error('Error fetching event:', error)
        router.push(`/${card_id}`)
      }
    }

    // Add a small delay for better UX
    const timer = setTimeout(redirectToMaps, 1500)
    return () => clearTimeout(timer)
  }, [card_id, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <MapPin className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Getting Directions</h1>
              <p className="text-gray-600">
                Redirecting you to the venue location...
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span>Opening Google Maps...</span>
              </div>

              <div className="pt-4 border-t">
                <Link href={`/${card_id}`}>
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Event
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}