'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  MessageSquare, 
  User, 
  Mail, 
  Send, 
  Heart, 
  CheckCircle, 
  AlertCircle,
  Clock
} from "lucide-react"
import { guestbookOperations, analyticsOperations } from '@/lib/supabase'
import type { Event, GuestbookEntry } from '@/lib/supabase'

interface GuestbookFormProps {
  event: Event
}

interface GuestbookFormData {
  guest_name: string
  guest_email: string
  message: string
}

export default function GuestbookForm({ event }: GuestbookFormProps) {
  const [formData, setFormData] = useState<GuestbookFormData>({
    guest_name: '',
    guest_email: '',
    message: ''
  })
  
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const loadGuestbookEntries = async () => {
    try {
      const guestbookEntries = await guestbookOperations.getEntriesByEvent(event.id)
      setEntries(guestbookEntries || [])
    } catch (err) {
      console.error('Failed to load guestbook entries:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadGuestbookEntries()
  }, [event.id])

  const handleInputChange = (field: keyof GuestbookFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate required fields
      if (!formData.guest_name || !formData.message) {
        throw new Error('Name and message are required')
      }

      if (formData.message.length < 10) {
        throw new Error('Message must be at least 10 characters long')
      }

      // Submit guestbook entry
      const newEntry = await guestbookOperations.createEntry({
        event_id: event.id,
        card_id: event.card_id,
        guest_name: formData.guest_name,
        guest_email: formData.guest_email || undefined,
        message: formData.message,
        is_approved: false
      })

      // Track analytics
      await analyticsOperations.trackEvent(
        event.id,
        'guestbook_entry_submitted',
        {
          message_length: formData.message.length,
          has_name: !!formData.guest_name,
          timestamp: new Date().toISOString()
        }
      )

      // Add new entry to the list
      if (newEntry) {
        setEntries(prev => [newEntry, ...prev])
      }

      // Reset form and show success
      setFormData({
        guest_name: '',
        guest_email: '',
        message: ''
      })
      setSuccess(true)
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit message')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Guestbook Form */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <MessageSquare className="h-6 w-6 text-blue-500" />
            Leave a Message
          </CardTitle>
          <p className="text-gray-600">
            Share your thoughts, wishes, or memories for {event.title}
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

          {success && (
            <Alert className="mb-6 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Your message has been added to the guestbook! Thank you for sharing.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guest_name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Your Name *
                </Label>
                <Input
                  id="guest_name"
                  value={formData.guest_name}
                  onChange={(e) => handleInputChange('guest_name', e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email (Optional)
                </Label>
                <Input
                  id="guest_email"
                  type="email"
                  value={formData.guest_email}
                  onChange={(e) => handleInputChange('guest_email', e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Your Message *
              </Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Share your thoughts, wishes, or memories..."
                rows={4}
                required
                minLength={10}
              />
              <p className="text-sm text-gray-500">
                {formData.message.length}/500 characters (minimum 10)
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || formData.message.length < 10}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Posting Message...' : 'Post Message'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Guestbook Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Messages from Guests
            <Badge variant="secondary" className="ml-2">
              {entries.length} {entries.length === 1 ? 'message' : 'messages'}
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading messages...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No messages yet. Be the first to leave a message!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {entries.map((entry) => (
                <div key={entry.id} className="border-l-4 border-purple-500 pl-4 py-3 bg-purple-50 rounded-r-lg">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-purple-100 text-purple-700">
                        {getInitials(entry.guest_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{entry.guest_name}</h4>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(entry.created_at)}
                        </div>
                        {entry.is_approved && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {entry.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}