'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Heart, User, Mail, Phone, MessageSquare, CheckCircle, AlertCircle } from "lucide-react"
import { rsvpOperations, analyticsOperations } from '@/lib/supabase'
import type { Event } from '@/lib/supabase'

interface RSVPFormProps {
  event: Event
}

interface RSVPFormData {
  guest_name: string
  guest_email: string
  guest_phone: string
  response_status: 'attending' | 'not_attending' | 'maybe'
  guest_count: number
  dietary_restrictions: string
  special_requests: string
  plus_one_name: string
}

export default function RSVPForm({ event }: RSVPFormProps) {
  const [formData, setFormData] = useState<RSVPFormData>({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    response_status: 'attending',
    guest_count: 1,
    dietary_restrictions: '',
    special_requests: '',
    plus_one_name: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [includesPlusOne, setIncludesPlusOne] = useState(false)

  const handleInputChange = (field: keyof RSVPFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.guest_name || !formData.guest_email) {
        throw new Error('Name and email are required')
      }

      // Submit RSVP
      await rsvpOperations.createRSVP({
        event_id: event.id,
        card_id: event.card_id,
        guest_name: formData.guest_name,
        guest_email: formData.guest_email,
        guest_phone: formData.guest_phone || undefined,
        attendance_status: formData.response_status,
        number_of_guests: formData.guest_count,
        dietary_requirements: formData.dietary_restrictions || undefined,
        special_requests: formData.special_requests || undefined
      })

      // Track analytics
      await analyticsOperations.trackEvent(
        event.id,
        'rsvp_submitted',
        {
          response_status: formData.response_status,
          guest_count: formData.guest_count
        }
      )

      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit RSVP')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">RSVP Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Thank you for your response. We&apos;ve received your RSVP for {event.title}.
          </p>
          {formData.response_status === 'attending' && (
            <p className="text-green-600 font-medium">
              We&apos;re excited to see you at the event! 🎉
            </p>
          )}
          {formData.response_status === 'not_attending' && (
            <p className="text-gray-600">
              We&apos;re sorry you can&apos;t make it. You&apos;ll be missed! 💙
            </p>
          )}
          {formData.response_status === 'maybe' && (
            <p className="text-yellow-600">
              We hope you can join us! Let us know if your plans change. 🤞
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Heart className="h-6 w-6 text-red-500" />
          RSVP for {event.title}
        </CardTitle>
        <p className="text-gray-600">
          Please let us know if you&apos;ll be joining us for this special event.
        </p>
      </CardHeader>
      
      <CardContent className="p-6">
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Response Status */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Will you be attending?</Label>
            <RadioGroup
              value={formData.response_status}
              onValueChange={(value) => handleInputChange('response_status', value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="attending" id="attending" />
                <Label htmlFor="attending" className="text-green-700 font-medium">
                  Yes, I&apos;ll be there! 🎉
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="not_attending" id="not_attending" />
                <Label htmlFor="not_attending" className="text-red-700 font-medium">
                  Sorry, I can&apos;t make it 😔
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="maybe" id="maybe" />
                <Label htmlFor="maybe" className="text-yellow-700 font-medium">
                  Maybe, I&apos;m not sure yet 🤔</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Guest Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guest_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name *
              </Label>
              <Input
                id="guest_name"
                value={formData.guest_name}
                onChange={(e) => handleInputChange('guest_name', e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest_email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address *
              </Label>
              <Input
                id="guest_email"
                type="email"
                value={formData.guest_email}
                onChange={(e) => handleInputChange('guest_email', e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest_phone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number (Optional)
            </Label>
            <Input
              id="guest_phone"
              type="tel"
              value={formData.guest_phone}
              onChange={(e) => handleInputChange('guest_phone', e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>

          {/* Guest Count */}
          {formData.response_status === 'attending' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="guest_count">Number of Guests</Label>
                <Input
                  id="guest_count"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.guest_count}
                  onChange={(e) => handleInputChange('guest_count', parseInt(e.target.value) || 1)}
                />
              </div>

              {/* Plus One */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="plus_one"
                    checked={includesPlusOne}
                    onCheckedChange={(checked) => setIncludesPlusOne(checked === true)}
                  />
                  <Label htmlFor="plus_one">I&apos;m bringing a plus one</Label>
                </div>
                
                {includesPlusOne && (
                  <Input
                    placeholder="Plus one&apos;s name"
                    value={formData.plus_one_name}
                    onChange={(e) => handleInputChange('plus_one_name', e.target.value)}
                  />
                )}
              </div>

              {/* Dietary Restrictions */}
              <div className="space-y-2">
                <Label htmlFor="dietary_restrictions">Dietary Restrictions</Label>
                <Input
                  id="dietary_restrictions"
                  value={formData.dietary_restrictions}
                  onChange={(e) => handleInputChange('dietary_restrictions', e.target.value)}
                  placeholder="Any dietary restrictions or allergies?"
                />
              </div>

              {/* Special Requests */}
              <div className="space-y-2">
                <Label htmlFor="special_requests" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Special Requests or Messages
                </Label>
                <Textarea
                  id="special_requests"
                  value={formData.special_requests}
                  onChange={(e) => handleInputChange('special_requests', e.target.value)}
                  placeholder="Any special requests or messages for the hosts?"
                  rows={3}
                />
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}